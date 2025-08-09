import { Router, type Request, type Response } from "express";
import { storage } from "./storage";

export function createAnalyticsRouter(checkAuth: (req: Request, res: Response, next: Function) => void) {
  const router = Router();

  router.use(checkAuth);

  router.get("/", async (req, res) => {
    try {
      const user = req.user!;
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;

      const analytics = await storage.getAnalytics(user.accountId, campaignId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics", error: (error as Error).message });
    }
  });

  router.post("/update-metrics", async (req, res) => {
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

  router.get("/export/csv", async (req, res) => {
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

  router.get("/export/pdf", async (req, res) => {
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

  return router;
}

