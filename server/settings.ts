import { Router, type Request, type Response } from "express";
import { storage } from "./storage";

export function createSettingsRouter(checkAuth: (req: Request, res: Response, next: Function) => void) {
  const router = Router();

  router.use(checkAuth);

  router.get("/", async (req, res) => {
    try {
      const user = req.user!;
      const settings = await storage.getSettings(user.accountId);
      res.json(settings || { accountId: user.accountId });
    } catch (error) {
      res.status(500).json({ message: "Error fetching settings", error: (error as Error).message });
    }
  });

  router.put("/", async (req, res) => {
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

  return router;
}

