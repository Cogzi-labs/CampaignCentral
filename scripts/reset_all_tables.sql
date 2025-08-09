-- Reset all database tables script
-- This script drops all tables and recreates them from scratch

-- Drop all existing tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "analytics" CASCADE;
DROP TABLE IF EXISTS "campaigns" CASCADE;
DROP TABLE IF EXISTS "contacts" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;

-- Create accounts table
CREATE TABLE "accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create users table
CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "account_id" integer NOT NULL,
  "reset_token" text,
  "reset_token_expiry" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_username_unique" UNIQUE("username"),
  CONSTRAINT "users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE
);

-- Create contacts table
CREATE TABLE "contacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "mobile" text NOT NULL,
  "location" text,
  "label" text,
  "account_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE
);

-- Create campaigns table
CREATE TABLE "campaigns" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "template" text NOT NULL,
  "contact_label" text,
  "status" text DEFAULT 'draft' NOT NULL,
  "scheduled_for" timestamp,
  "account_id" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "campaigns_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE
);

-- Create analytics table
CREATE TABLE "analytics" (
  "id" serial PRIMARY KEY NOT NULL,
  "campaign_id" integer NOT NULL,
  "sent" integer DEFAULT 0 NOT NULL,
  "delivered" integer DEFAULT 0 NOT NULL,
  "read" integer DEFAULT 0 NOT NULL,
  "optout" integer DEFAULT 0 NOT NULL,
  "hold" integer DEFAULT 0 NOT NULL,
  "failed" integer DEFAULT 0 NOT NULL,
  "account_id" integer NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE,
  CONSTRAINT "analytics_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE
);

-- Create settings table
CREATE TABLE "settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" integer NOT NULL,
  "facebook_access_token" text,
  "partner_mobile" text,
  "waba_id" text,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "settings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE
);

-- Create session table
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_account_id_idx" ON "users"("account_id");
CREATE INDEX IF NOT EXISTS "contacts_account_id_idx" ON "contacts"("account_id");
CREATE INDEX IF NOT EXISTS "contacts_label_idx" ON "contacts"("label");
CREATE INDEX IF NOT EXISTS "campaigns_account_id_idx" ON "campaigns"("account_id");
CREATE INDEX IF NOT EXISTS "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX IF NOT EXISTS "analytics_campaign_id_idx" ON "analytics"("campaign_id");
CREATE INDEX IF NOT EXISTS "analytics_account_id_idx" ON "analytics"("account_id");
CREATE INDEX IF NOT EXISTS "settings_account_id_idx" ON "settings"("account_id");
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session"("expire");

-- Insert default data: Default account
INSERT INTO "accounts" ("id", "name", "created_at") 
VALUES (1, 'Default Account', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert default admin user (password is 'admin123')
INSERT INTO "users" ("username", "password", "name", "email", "account_id", "created_at")
VALUES ('admin', '$2b$10$Vt5xmUMkMZVR26myzEYVCeIdMEr8eVa.fBQmgn6S8Zrdi2XJ80Wca', 'Administrator', 'admin@example.com', 1, NOW())
ON CONFLICT (username) DO NOTHING;