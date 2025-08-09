import { Router, type Request, type Response } from "express";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import * as path from "path";
import { storage } from "./storage";
import { contactValidationSchema } from "@shared/schema";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up file upload
const upload = multer({ dest: "uploads/" });

export function createContactsRouter(checkAuth: (req: Request, res: Response, next: Function) => void) {
  const router = Router();

  router.use(checkAuth);

  router.get("/", async (req, res) => {
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

  router.post("/", async (req, res) => {
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

  router.put("/:id", async (req, res) => {
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

  router.delete("/:id", async (req, res) => {
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

  router.post("/batch-delete", async (req, res) => {
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

  router.post("/import", upload.single("file"), async (req, res) => {
    try {
      const user = req.user!;
      const file = req.file;
      const deduplicate = req.body.deduplicate === "true";

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
        .on("data", (data) => {
          records.push(data);
        })
        .on("end", async () => {
          // Process and validate each contact - filter out rows with empty name, mobile, or location
          const contacts = records
            .filter((record) => {
              return (
                record.name && record.name.trim() !== "" &&
                record.mobile && record.mobile.trim() !== "" &&
                record.location && record.location.trim() !== ""
              );
            })
            .map((record) => ({
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
        .on("error", (err) => {
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

  return router;
}

