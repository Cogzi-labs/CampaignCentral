import { Router, type Request, type Response } from "express";
import { campaignValidationSchema } from "@shared/schema";
import { storage } from "./storage";
import { API_CONFIG } from "./config";

export function createCampaignsRouter(checkAuth: (req: Request, res: Response, next: Function) => void) {
  const router = Router();

  router.use(checkAuth);

  router.get("/", async (req, res) => {
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

  router.post("/", async (req, res) => {
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

      // Fetch contacts for this campaign based on label (if any)
      const contacts = await storage.getContacts(
        user.accountId,
        campaign.contactLabel ? { label: campaign.contactLabel } : undefined
      );

      // Send WhatsApp template message to each contact
      for (const contact of contacts) {
        try {
          const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: contact.mobile,
            type: "template",
            template: {
              name: campaign.template,
              language: { code: "en_US" }
            }
          };

          const response = await fetch(API_CONFIG.waba.apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_CONFIG.waba.accessToken}`
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          await storage.logMessage({
            campaignId: campaign.id,
            contactId: contact.id,
            messageId: result?.messages?.[0]?.id || null,
            status: response.ok ? "sent" : "failed",
            error: response.ok ? null : JSON.stringify(result)
          });
        } catch (err) {
          await storage.logMessage({
            campaignId: campaign.id,
            contactId: contact.id,
            status: "failed",
            error: (err as Error).message
          });
        }
      }

      // Update analytics with sent count
      const existingAnalytics = await storage.getAnalytics(user.accountId, campaign.id);
      const currentSent = existingAnalytics[0]?.sent || 0;
      await storage.createOrUpdateAnalytics({
        campaignId: campaign.id,
        accountId: user.accountId,
        sent: currentSent + contacts.length
      });

      res.status(201).json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Error creating campaign", error: (error as Error).message });
    }
  });

  router.put("/:id", async (req, res) => {
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

  router.delete("/:id", async (req, res) => {
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
  router.post("/:id/launch", async (req, res) => {
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

      // Get campaign API URL from environment config
      const apiUrl = API_CONFIG.campaign.apiUrl;
      console.log(`Using campaign API URL: ${apiUrl}`);

      // Prepare request to campaign API
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

  return router;
}

