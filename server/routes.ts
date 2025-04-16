import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { contactValidationSchema, campaignValidationSchema } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import * as path from "path";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up file upload
const upload = multer({ dest: 'uploads/' });

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
  app.get("/api/contacts", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const filters = {
        search: req.query.search as string | undefined,
        label: req.query.label as string | undefined,
        location: req.query.location as string | undefined,
        dateRange: req.query.dateRange as string | undefined
      };
      
      const contacts = await storage.getContacts(user.accountId, filters);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contacts", error: (error as Error).message });
    }
  });

  app.post("/api/contacts", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Validate contact data
      const validatedData = contactValidationSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid contact data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Check if mobile number already exists
      const existingContact = await storage.getContactByMobile(req.body.mobile, user.accountId);
      if (existingContact) {
        return res.status(400).json({ message: "Contact with this mobile number already exists" });
      }
      
      const contact = await storage.createContact({
        ...req.body,
        accountId: user.accountId
      });
      
      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ message: "Error creating contact", error: (error as Error).message });
    }
  });

  app.put("/api/contacts/:id", checkAuth, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const user = req.user!;
      
      // Validate contact data
      const validatedData = contactValidationSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid contact data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Check if contact exists and belongs to the user's account
      const contact = await storage.getContactById(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (contact.accountId !== user.accountId) {
        return res.status(403).json({ message: "Unauthorized access to this contact" });
      }
      
      // Update contact
      const updatedContact = await storage.updateContact(contactId, req.body);
      res.json(updatedContact);
    } catch (error) {
      res.status(500).json({ message: "Error updating contact", error: (error as Error).message });
    }
  });

  app.delete("/api/contacts/:id", checkAuth, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const user = req.user!;
      
      // Check if contact exists and belongs to the user's account
      const contact = await storage.getContactById(contactId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (contact.accountId !== user.accountId) {
        return res.status(403).json({ message: "Unauthorized access to this contact" });
      }
      
      // Delete contact
      await storage.deleteContact(contactId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting contact", error: (error as Error).message });
    }
  });
  
  app.post("/api/contacts/batch-delete", checkAuth, async (req, res) => {
    try {
      const { ids } = req.body;
      const user = req.user!;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No contact IDs provided for deletion" });
      }
      
      const results = { 
        success: 0, 
        notFound: 0, 
        unauthorized: 0, 
        error: 0 
      };
      
      // Process each contact
      for (const id of ids) {
        try {
          const contactId = parseInt(id);
          
          // Check if contact exists and belongs to the user's account
          const contact = await storage.getContactById(contactId);
          if (!contact) {
            results.notFound++;
            continue;
          }
          
          if (contact.accountId !== user.accountId) {
            results.unauthorized++;
            continue;
          }
          
          // Delete contact
          await storage.deleteContact(contactId);
          results.success++;
        } catch (err) {
          results.error++;
        }
      }
      
      res.status(200).json({ 
        message: "Batch delete operation completed", 
        results 
      });
    } catch (error) {
      res.status(500).json({ message: "Error performing batch delete", error: (error as Error).message });
    }
  });

  // CSV Import
  app.post("/api/contacts/import", checkAuth, upload.single('file'), async (req, res) => {
    try {
      const user = req.user!;
      const file = req.file;
      const deduplicate = req.body.deduplicate === 'true';
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Parse CSV file
      const parser = parse({
        columns: true,
        skip_empty_lines: true
      });
      
      const records: any[] = [];
      
      fs.createReadStream(file.path)
        .pipe(parser)
        .on('data', (data) => {
          records.push(data);
        })
        .on('end', async () => {
          // Process and validate each contact - filter out rows with empty name, mobile, or location
          const contacts = records
            .filter(record => {
              return (
                record.name && record.name.trim() !== "" && 
                record.mobile && record.mobile.trim() !== "" && 
                record.location && record.location.trim() !== ""
              );
            })
            .map(record => ({
              name: record.name.trim(),
              mobile: record.mobile.trim(),
              location: record.location.trim(),
              label: record.label ? record.label.trim() : "",
              accountId: user.accountId
            }));
          
          // Import contacts
          const result = await storage.importContacts(contacts, deduplicate);
          
          // Clean up temp file
          fs.unlinkSync(file.path);
          
          // Calculate skipped rows due to missing required fields
          const skippedDueToMissingFields = records.length - contacts.length;
          
          res.status(200).json({ 
            message: "Import completed",
            imported: result.imported,
            duplicates: result.duplicates,
            skipped: skippedDueToMissingFields,
            total: contacts.length
          });
        })
        .on('error', (err) => {
          // Clean up temp file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          throw err;
        });
    } catch (error) {
      // Clean up temp file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Error importing contacts", error: (error as Error).message });
    }
  });

  // CAMPAIGNS API
  app.get("/api/campaigns", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const filters = {
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        dateRange: req.query.dateRange as string | undefined
      };
      
      const campaigns = await storage.getCampaigns(user.accountId, filters);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaigns", error: (error as Error).message });
    }
  });

  app.post("/api/campaigns", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Validate campaign data
      const validatedData = campaignValidationSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid campaign data", 
          errors: validatedData.error.format() 
        });
      }
      
      const campaign = await storage.createCampaign({
        ...req.body,
        accountId: user.accountId
      });
      
      res.status(201).json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Error creating campaign", error: (error as Error).message });
    }
  });

  app.put("/api/campaigns/:id", checkAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const user = req.user!;
      
      // Validate campaign data
      const validatedData = campaignValidationSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid campaign data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Check if campaign exists and belongs to the user's account
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.accountId !== user.accountId) {
        return res.status(403).json({ message: "Unauthorized access to this campaign" });
      }
      
      // Update campaign
      const updatedCampaign = await storage.updateCampaign(campaignId, req.body);
      res.json(updatedCampaign);
    } catch (error) {
      res.status(500).json({ message: "Error updating campaign", error: (error as Error).message });
    }
  });

  app.delete("/api/campaigns/:id", checkAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const user = req.user!;
      
      // Check if campaign exists and belongs to the user's account
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.accountId !== user.accountId) {
        return res.status(403).json({ message: "Unauthorized access to this campaign" });
      }
      
      // Delete campaign
      await storage.deleteCampaign(campaignId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting campaign", error: (error as Error).message });
    }
  });

  // Launch campaign
  app.post("/api/campaigns/:id/launch", checkAuth, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const user = req.user!;
      
      // Check if campaign exists and belongs to the user's account
      const campaign = await storage.getCampaignById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.accountId !== user.accountId) {
        return res.status(403).json({ message: "Unauthorized access to this campaign" });
      }
      
      // Check if campaign is already active
      if (campaign.status === "active") {
        return res.status(400).json({ message: "Campaign is already active" });
      }
      
      // Launch campaign
      const success = await storage.launchCampaign(campaignId);
      
      if (success) {
        res.status(200).json({ message: "Campaign launched successfully" });
      } else {
        res.status(500).json({ message: "Failed to launch campaign" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error launching campaign", error: (error as Error).message });
    }
  });

  // SETTINGS API
  app.get("/api/settings", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const settings = await storage.getSettings(user.accountId);
      res.json(settings || { accountId: user.accountId });
    } catch (error) {
      res.status(500).json({ message: "Error fetching settings", error: (error as Error).message });
    }
  });

  app.put("/api/settings", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const settingsData = {
        ...req.body,
        accountId: user.accountId
      };
      
      const settings = await storage.updateSettings(user.accountId, settingsData);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Error updating settings", error: (error as Error).message });
    }
  });

  // Templates API - Facebook Graph API
  app.get("/api/templates", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Get settings for the user's account
      const settings = await storage.getSettings(user.accountId);
      
      if (!settings || !settings.wabaApiUrl || !settings.facebookAccessToken) {
        return res.status(400).json({ 
          message: "Facebook API settings not configured", 
          code: "SETTINGS_MISSING" 
        });
      }
      
      // Facebook Graph API call using account-specific settings
      const response = await fetch(
        `${settings.wabaApiUrl}`,
        {
          headers: {
            'Authorization': `Bearer ${settings.facebookAccessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Facebook API returned ${response.status}: ${await response.text()}`);
      }
      
      const fbData = await response.json();
      
      // Transform response to match our expected format
      const templates = fbData.data.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.category || 'Marketing template'
      }));
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching Facebook templates:", error);
      res.status(500).json({ 
        message: "Error fetching Facebook templates", 
        error: (error as Error).message 
      });
    }
  });
  
  // Sample CSV Template for Contacts Import
  app.get("/api/templates/contact-csv", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'sample_contacts_template.csv');
      const csvContent = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_contacts_template.csv');
      res.status(200).send(csvContent);
    } catch (error) {
      console.error("Error serving CSV template:", error);
      res.status(500).json({ message: "Error fetching CSV template", error: (error as Error).message });
    }
  });

  // ANALYTICS API
  app.get("/api/analytics", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      
      const analytics = await storage.getAnalytics(user.accountId, campaignId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
