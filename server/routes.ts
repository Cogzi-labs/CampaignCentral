import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { contactValidationSchema, campaignValidationSchema } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import crypto from 'crypto';
import * as path from "path";
import { sendPasswordResetEmail, sendEmail } from "./email";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

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

      // Get campaign settings
      const settings = await storage.getSettings(user.accountId);
      if (!settings || !settings.partnerMobile || !settings.wabaId) {
        return res.status(400).json({ 
          message: "Campaign settings are incomplete. Please configure Partner Mobile and WABA ID in settings.",
          code: "SETTINGS_MISSING" 
        });
      }

      // Get contacts for this campaign's label
      let contacts;
      if (campaign.contactLabel) {
        contacts = await storage.getContacts(user.accountId, { label: campaign.contactLabel });
      } else {
        contacts = await storage.getContacts(user.accountId);
      }

      if (contacts.length === 0) {
        return res.status(400).json({ message: "No contacts found for this campaign" });
      }

      // Format contacts data for the API
      const contactsData = contacts.map(contact => [contact.mobile, contact.name]);

      // Get campaign API key from settings
      const apiKey = settings.campaignApiKey;
      if (!apiKey) {
        console.error("Campaign API key not found in settings");
        return res.status(500).json({ message: "Campaign API key not configured in settings. Please configure it in Settings > API Access." });
      }

      // Prepare request to campaign API
      const apiUrl = "https://8x83b7rn4f.execute-api.ap-south-1.amazonaws.com/qa/campaign";
      const requestData = {
        campaignName: campaign.name,
        campaignId: campaign.id.toString(),
        templateName: campaign.template,
        partnerMobile: settings.partnerMobile,
        data: contactsData,
        WABAID: settings.wabaId
      };

      console.log("Sending campaign to API:", JSON.stringify(requestData, null, 2));

      try {
        const apiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify(requestData)
        });

        const apiResult = await apiResponse.json();
        
        if (!apiResponse.ok) {
          console.error("Campaign API error:", apiResult);
          return res.status(apiResponse.status).json({ 
            message: "Campaign API error", 
            apiError: apiResult 
          });
        }

        // Update campaign status in database
        const success = await storage.launchCampaign(campaignId);
        
        if (success) {
          res.status(200).json({ 
            message: "Campaign launched successfully",
            apiResponse: apiResult
          });
        } else {
          res.status(500).json({ 
            message: "Campaign API call succeeded but failed to update local database",
            apiResponse: apiResult
          });
        }
      } catch (apiError) {
        console.error("Campaign API call failed:", apiError);
        return res.status(500).json({ 
          message: "Failed to connect to campaign API", 
          error: (apiError as Error).message 
        });
      }
    } catch (error) {
      console.error("Error launching campaign:", error);
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
  
  // Update campaign metrics
  app.post("/api/analytics/update-metrics", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { campaignId, metrics } = req.body;
      
      if (!campaignId || !metrics) {
        return res.status(400).json({ 
          message: "Campaign ID and metrics are required" 
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
      
      // Update analytics with provided metrics
      const analyticsData = {
        campaignId,
        accountId: user.accountId,
        ...metrics
      };
      
      const updatedAnalytics = await storage.createOrUpdateAnalytics(analyticsData);
      res.json(updatedAnalytics);
    } catch (error) {
      res.status(500).json({ message: "Error updating metrics", error: (error as Error).message });
    }
  });
  
  // Export analytics as CSV
  app.get("/api/analytics/export/csv", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      
      // Get campaigns and analytics data
      let campaigns = await storage.getCampaigns(user.accountId);
      const analytics = await storage.getAnalytics(user.accountId);
      
      // Filter by campaign ID if provided
      if (campaignId) {
        campaigns = campaigns.filter(c => c.id === campaignId);
      }
      
      // Create CSV data by joining campaigns with their analytics
      const csvData = campaigns.map(campaign => {
        const campaignAnalytics = analytics.find(a => a.campaignId === campaign.id) || {
          sent: 0,
          delivered: 0,
          read: 0,
          optout: 0,
          hold: 0,
          failed: 0
        };
        
        // Calculate rates
        const deliveryRate = campaignAnalytics.sent > 0 
          ? (campaignAnalytics.delivered / campaignAnalytics.sent * 100).toFixed(2) 
          : "0.00";
        const readRate = campaignAnalytics.delivered > 0 
          ? (campaignAnalytics.read / campaignAnalytics.delivered * 100).toFixed(2) 
          : "0.00";
        const optoutRate = campaignAnalytics.delivered > 0 
          ? (campaignAnalytics.optout / campaignAnalytics.delivered * 100).toFixed(2) 
          : "0.00";
        const holdRate = campaignAnalytics.sent > 0 
          ? (campaignAnalytics.hold / campaignAnalytics.sent * 100).toFixed(2) 
          : "0.00";
        const failedRate = campaignAnalytics.sent > 0 
          ? (campaignAnalytics.failed / campaignAnalytics.sent * 100).toFixed(2) 
          : "0.00";
        
        return {
          "Campaign Name": campaign.name,
          "Status": campaign.status,
          "Created At": new Date(campaign.createdAt).toLocaleDateString(),
          "Sent": campaignAnalytics.sent,
          "Delivered": campaignAnalytics.delivered,
          "Read": campaignAnalytics.read,
          "Opt-outs": campaignAnalytics.optout,
          "On Hold": campaignAnalytics.hold,
          "Failed": campaignAnalytics.failed,
          "Delivery Rate (%)": deliveryRate,
          "Read Rate (%)": readRate,
          "Opt-out Rate (%)": optoutRate,
          "Hold Rate (%)": holdRate,
          "Failed Rate (%)": failedRate
        };
      });
      
      // Generate CSV using csv-stringify
      const { stringify } = require('csv-stringify/sync');
      const csvOutput = stringify(csvData, { header: true });
      
      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=campaign_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      
      // Send CSV data
      res.send(csvOutput);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ message: "Error exporting analytics as CSV", error: (error as Error).message });
    }
  });
  
  // Export analytics as PDF
  app.get("/api/analytics/export/pdf", checkAuth, async (req, res) => {
    try {
      const user = req.user!;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      
      // Get campaigns and analytics data
      let campaigns = await storage.getCampaigns(user.accountId);
      const analytics = await storage.getAnalytics(user.accountId);
      
      // Filter by campaign ID if provided
      if (campaignId) {
        campaigns = campaigns.filter(c => c.id === campaignId);
      }
      
      // Create PDF document using PDFKit
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=campaign_analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add title and date
      doc.fontSize(20).text('Campaign Analytics Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Add campaigns table
      campaigns.forEach((campaign, index) => {
        const campaignAnalytics = analytics.find(a => a.campaignId === campaign.id) || {
          sent: 0,
          delivered: 0,
          read: 0,
          optout: 0,
          hold: 0,
          failed: 0
        };
        
        // Calculate rates
        const deliveryRate = campaignAnalytics.sent > 0 
          ? (campaignAnalytics.delivered / campaignAnalytics.sent * 100).toFixed(2) 
          : "0.00";
        const readRate = campaignAnalytics.delivered > 0 
          ? (campaignAnalytics.read / campaignAnalytics.delivered * 100).toFixed(2) 
          : "0.00";
        const optoutRate = campaignAnalytics.delivered > 0 
          ? (campaignAnalytics.optout / campaignAnalytics.delivered * 100).toFixed(2) 
          : "0.00";
        const holdRate = campaignAnalytics.sent > 0 
          ? (campaignAnalytics.hold / campaignAnalytics.sent * 100).toFixed(2) 
          : "0.00";
        const failedRate = campaignAnalytics.sent > 0 
          ? (campaignAnalytics.failed / campaignAnalytics.sent * 100).toFixed(2) 
          : "0.00";
        
        // Add campaign header
        doc.fontSize(16).fillColor('#0066cc').text(`Campaign: ${campaign.name}`);
        doc.fontSize(12).fillColor('#000000').text(`Status: ${campaign.status}`);
        doc.text(`Created: ${new Date(campaign.createdAt).toLocaleDateString()}`);
        doc.moveDown();
        
        // Add metrics table
        doc.fontSize(14).fillColor('#444444').text('Metrics');
        doc.moveDown(0.5);
        
        // Message metrics
        const metrics = [
          { label: 'Messages Sent', value: campaignAnalytics.sent },
          { label: 'Messages Delivered', value: campaignAnalytics.delivered },
          { label: 'Messages Read', value: campaignAnalytics.read },
          { label: 'Opt-outs', value: campaignAnalytics.optout },
          { label: 'Messages on Hold', value: campaignAnalytics.hold },
          { label: 'Messages Failed', value: campaignAnalytics.failed }
        ];
        
        metrics.forEach(metric => {
          doc.fontSize(12).text(`${metric.label}: ${metric.value}`, { continued: false });
        });
        
        doc.moveDown();
        
        // Performance rates
        doc.fontSize(14).fillColor('#444444').text('Performance Rates');
        doc.moveDown(0.5);
        
        const rates = [
          { label: 'Delivery Rate', value: `${deliveryRate}%` },
          { label: 'Read Rate', value: `${readRate}%` },
          { label: 'Opt-out Rate', value: `${optoutRate}%` },
          { label: 'Hold Rate', value: `${holdRate}%` },
          { label: 'Failed Rate', value: `${failedRate}%` }
        ];
        
        rates.forEach(rate => {
          doc.fontSize(12).text(`${rate.label}: ${rate.value}`, { continued: false });
        });
        
        // Add separator between campaigns
        if (index < campaigns.length - 1) {
          doc.moveDown(2);
          doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
          doc.moveDown(2);
        }
      });
      
      // If no campaigns, show message
      if (campaigns.length === 0) {
        doc.fontSize(14).fillColor('#444444').text('No campaign data available', { align: 'center' });
      }
      
      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      res.status(500).json({ message: "Error exporting analytics as PDF", error: (error as Error).message });
    }
  });

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
