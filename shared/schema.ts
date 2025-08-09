import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  accountId: integer("account_id").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
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
  scheduledFor: timestamp("scheduled_for"),
  accountId: integer("account_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  name: true,
  template: true,
  contactLabel: true,
  scheduledFor: true,
  accountId: true,
});

// Analytics schema
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  sent: integer("sent").default(0).notNull(),
  delivered: integer("delivered").default(0).notNull(),
  read: integer("read").default(0).notNull(),
  optout: integer("optout").default(0).notNull(),
  hold: integer("hold").default(0).notNull(),
  failed: integer("failed").default(0).notNull(),
  accountId: integer("account_id").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  campaignId: true,
  sent: true,
  delivered: true,
  read: true,
  optout: true,
  hold: true,
  failed: true,
  accountId: true,
});

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  contactId: integer("contact_id").notNull().references(() => contacts.id),
  messageId: text("message_id"),
  status: text("status").notNull().default("sent"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  campaignId: true,
  contactId: true,
  messageId: true,
  status: true,
  error: true,
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

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  facebookAccessToken: text("facebook_access_token"),
  partnerMobile: text("partner_mobile"), // Partner mobile number for campaign API
  wabaId: text("waba_id"), // WhatsApp Business Account ID
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  accountId: true,
  facebookAccessToken: true,
  partnerMobile: true,
  wabaId: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

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
  scheduledFor: z.string().optional(),
});
