import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  accountId: integer("account_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  accountId: true,
});

// Account schema
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  name: true,
});

// Contact schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  location: text("location"),
  label: text("label"),
  accountId: integer("account_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  mobile: true,
  location: true,
  label: true,
  accountId: true,
});

// Campaign schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  template: text("template").notNull(),
  contactLabel: text("contact_label"),
  status: text("status").default("draft").notNull(),
  accountId: integer("account_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  name: true,
  template: true,
  contactLabel: true,
  accountId: true,
});

// Analytics schema
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  sent: integer("sent").default(0).notNull(),
  opened: integer("opened").default(0).notNull(),
  clicked: integer("clicked").default(0).notNull(),
  converted: integer("converted").default(0).notNull(),
  accountId: integer("account_id").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  campaignId: true,
  sent: true,
  opened: true,
  clicked: true,
  converted: true,
  accountId: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// Zod schemas for validation
export const contactValidationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  mobile: z.string().min(10, { message: "Mobile number must be at least 10 digits" }),
  location: z.string().optional(),
  label: z.string().optional(),
});

export const campaignValidationSchema = z.object({
  name: z.string().min(3, { message: "Campaign name must be at least 3 characters" }),
  template: z.string().min(1, { message: "You must select a template" }),
  contactLabel: z.string().optional(),
});
