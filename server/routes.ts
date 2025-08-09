import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import crypto from 'crypto';
import { sendPasswordResetEmail, sendEmail } from "./email";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { createContactsRouter } from "./contacts";
import { createCampaignsRouter } from "./campaigns";
import { createSettingsRouter } from "./settings";
import { createTemplatesRouter } from "./templates";
import { createAnalyticsRouter } from "./analytics";


export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check authentication for API routes
  const checkAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      // Log the unauthorized attempt with session details
      console.log("Unauthorized access attempt to", req.path, "Session ID:", req.sessionID);
      
      // Check if we have a session but no user (possible session timeout or corruption)
      if (req.session && req.sessionID) {
        console.log("Session exists but user is not authenticated. Possible session timeout.");
      }
      
      // Return unauthorized status with clear message
      return res.status(401).json({ 
        message: "Unauthorized: You must be logged in to access this resource",
        code: "UNAUTHORIZED" 
      });
    }
    
    // User is authenticated, refresh the session expiration and proceed
    if (req.session) {
      req.session.touch(); // Update the session's "lastAccessed" time
    }
    
    // Log the authorized access
    console.log("Authorized access to", req.path, "User ID:", req.user?.id, "Session ID:", req.sessionID);
    next();
  };

  // CONTACTS API
  app.use("/api/contacts", createContactsRouter(checkAuth));

  // CAMPAIGNS API
  app.use("/api/campaigns", createCampaignsRouter(checkAuth));

  // SETTINGS API
  app.use("/api/settings", createSettingsRouter(checkAuth));

  // TEMPLATES API
  app.use("/api/templates", createTemplatesRouter(checkAuth));

  // ANALYTICS API
  app.use("/api/analytics", createAnalyticsRouter(checkAuth));

  // PASSWORD RESET API
  const scryptAsync = promisify(scrypt);
  
  // Hash password with scrypt and salt
  async function hashPassword(password: string) {
    const salt = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
  
  // Request a password reset link
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal whether the email exists
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      // Create a reset token
      const token = await storage.createResetToken(user.id);
      
      // Send reset email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailSent = await sendPasswordResetEmail(
        email,
        user.username,
        token,
        baseUrl
      );
      
      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
        
        // Check if AWS SES credentials are configured
        if (!process.env.SES_USERNAME || !process.env.SES_PASSWORD) {
          return res.status(500).json({ 
            message: "Email service not configured. Contact administrator.",
            code: "EMAIL_SERVICE_UNCONFIGURED"
          });
        }
        
        return res.status(500).json({ 
          message: "Failed to send password reset email. Please try again later.",
          code: "EMAIL_SEND_FAILED"
        });
      }
      
      res.status(200).json({ 
        message: "Password reset link sent to your email",
        success: true
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ 
        message: "Error processing password reset request", 
        error: (error as Error).message 
      });
    }
  });
  
  // Verify reset token and set new password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ 
          message: "Token and password are required",
          code: "MISSING_FIELDS" 
        });
      }
      
      // Verify token
      const user = await storage.verifyResetToken(token);
      if (!user) {
        return res.status(400).json({ 
          message: "Invalid or expired token", 
          code: "INVALID_TOKEN"
        });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user password and clear reset token
      const success = await storage.updatePassword(user.id, hashedPassword);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to update password", 
          code: "UPDATE_FAILED"
        });
      }
      
      res.status(200).json({ 
        message: "Password successfully reset. You can now log in with your new password.",
        success: true
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ 
        message: "Error processing password reset", 
        error: (error as Error).message 
      });
    }
  });
  
  // Test email endpoint (for debugging email issues)
  app.post("/api/test-email", async (req, res) => {
    try {
      console.log("Starting email test...");
      
      // Check if AWS SES credentials are configured
      if (!process.env.SES_USERNAME || !process.env.SES_PASSWORD) {
        console.error("Missing AWS SES credentials:", {
          username: !!process.env.SES_USERNAME,
          password: !!process.env.SES_PASSWORD
        });
        
        return res.status(500).json({ 
          message: "Email service not configured. AWS SES credentials are missing.",
          missing: {
            username: !process.env.SES_USERNAME,
            password: !process.env.SES_PASSWORD
          }
        });
      }
      
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      // Send test email
      console.log(`Attempting to send test email to ${email}`);
      
      try {
        const emailResult = await sendEmail({
          to: email,
          subject: "CampaignHub Test Email",
          text: "This is a test email from CampaignHub to verify email sending works correctly.",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333; text-align: center;">Email Test Successful</h2>
              <p>This is a test email from your CampaignHub application.</p>
              <p>If you can read this, email sending with AWS SES is working correctly!</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #888; font-size: 12px; text-align: center;">CampaignHub - Marketing Campaign Management</p>
            </div>
          `
        });
        
        console.log("Email test result:", emailResult);
        
        if (emailResult) {
          res.status(200).json({ 
            message: "Test email sent successfully",
            success: true
          });
        } else {
          res.status(500).json({ 
            message: "Failed to send test email. Check server logs for details.",
            success: false
          });
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        res.status(500).json({ 
          message: "Error sending test email",
          error: (emailError as Error).message
        });
      }
    } catch (error) {
      console.error("Test email endpoint error:", error);
      res.status(500).json({ 
        message: "Error in test email endpoint", 
        error: (error as Error).message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
