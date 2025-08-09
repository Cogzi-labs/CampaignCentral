import { Router, type Request, type Response } from "express";
import fs from "fs";
import * as path from "path";
import { storage } from "./storage";

export function createTemplatesRouter(checkAuth: (req: Request, res: Response, next: Function) => void) {
  const router = Router();

  router.get("/", checkAuth, async (req, res) => {
    try {
      const user = req.user!;

      // Get settings for the user's account
      const settings = await storage.getSettings(user.accountId);

      if (!settings || !settings.wabaApiUrl || !settings.facebookAccessToken) {
        return res.status(400).json({
          message: "Facebook API settings not configured",
          code: "SETTINGS_MISSING",
        });
      }

      // Facebook Graph API call using account-specific settings
      const response = await fetch(`${settings.wabaApiUrl}`, {
        headers: {
          Authorization: `Bearer ${settings.facebookAccessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Facebook API returned ${response.status}: ${await response.text()}`);
      }

      const fbData = await response.json();

      // Transform response to match our expected format
      const templates = fbData.data.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.category || "Marketing template",
      }));

      res.json(templates);
    } catch (error) {
      console.error("Error fetching Facebook templates:", error);
      res.status(500).json({
        message: "Error fetching Facebook templates",
        error: (error as Error).message,
      });
    }
  });

  // Sample CSV Template for Contacts Import
  router.get("/contact-csv", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "uploads", "sample_contacts_template.csv");
      const csvContent = fs.readFileSync(filePath, "utf8");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=sample_contacts_template.csv");
      res.status(200).send(csvContent);
    } catch (error) {
      console.error("Error serving CSV template:", error);
      res.status(500).json({ message: "Error fetching CSV template", error: (error as Error).message });
    }
  });

  return router;
}

