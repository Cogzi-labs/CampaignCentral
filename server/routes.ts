import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { contactValidationSchema, campaignValidationSchema } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";

// Set up file upload
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check authentication for API routes
  const checkAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthorized access attempt to", req.path, "Session ID:", req.sessionID);
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // User is authenticated, proceed
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
          // Process and validate each contact
          const contacts = records.map(record => ({
            name: record.name || "",
            mobile: record.mobile || "",
            location: record.location || "",
            label: record.label || "",
            accountId: user.accountId
          }));
          
          // Import contacts
          const result = await storage.importContacts(contacts, deduplicate);
          
          // Clean up temp file
          fs.unlinkSync(file.path);
          
          res.status(200).json({ 
            message: "Import completed",
            imported: result.imported,
            duplicates: result.duplicates,
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

  // TEMPLATES API (Mock)
  app.get("/api/templates", checkAuth, async (req, res) => {
    try {
      // Mock templates API response
      const templates = [
        { id: "welcome", name: "Welcome Template", description: "Welcome new subscribers" },
        { id: "promotional", name: "Promotional Template", description: "Announce special offers" },
        { id: "announcement", name: "Announcement Template", description: "Announce important news" },
        { id: "feedback", name: "Feedback Template", description: "Ask for customer feedback" },
        { id: "holiday", name: "Holiday Template", description: "Holiday greetings" }
      ];
      
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching templates", error: (error as Error).message });
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
