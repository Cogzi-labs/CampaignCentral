-- setup.sql
-- Consolidated database setup for CampaignHub
-- Run as a PostgreSQL superuser

-- 1. Create the application user and database
CREATE USER campaign_user WITH PASSWORD 'your_password' CREATEDB;
CREATE DATABASE campaign_db OWNER campaign_user;

-- 2. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campaign_db TO campaign_user;

-- 3. Connect to the new database
\c campaign_management

DROP TABLE IF EXISTS
  analytics,
  campaigns,
  users,
  contacts,
  settings,
  "session",
  accounts
CASCADE;

-- 4. Create tables
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  reset_token TEXT,
  reset_token_expiry TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  location TEXT,
  label TEXT,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_mobile ON contacts(mobile);
CREATE INDEX IF NOT EXISTS idx_contacts_label ON contacts(label);

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  contact_label TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_account_id ON campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sent INTEGER NOT NULL DEFAULT 0,
  delivered INTEGER NOT NULL DEFAULT 0,
  read INTEGER NOT NULL DEFAULT 0,
  optout INTEGER NOT NULL DEFAULT 0,
  hold INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_campaign_id ON analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_account_id ON analytics(account_id);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  facebook_access_token TEXT,
  partner_mobile TEXT,
  waba_id TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_settings_account_id ON settings(account_id);

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");


-- 5. Insert seed data
INSERT INTO accounts (name, created_at)
VALUES ('Default Account', NOW())
ON CONFLICT (id) DO NOTHING
RETURNING id;

INSERT INTO users (username, password, name, email, account_id, created_at)
VALUES ('admin', '$2b$10$Vt5xmUMkMZVR26myzEYVCeIdMEr8eVa.fBQmgn6S8Zrdi2XJ80Wca', 'Administrator', 'admin@example.com', 1, NOW())
ON CONFLICT (username) DO NOTHING;

INSERT INTO contacts (name, mobile, location, label, account_id, created_at)
VALUES
  ('John Doe', '5551234567', 'New York', 'VIP', 1, NOW()),
  ('Jane Smith', '5559876543', 'Los Angeles', 'Customer', 1, NOW()),
  ('Bob Johnson', '5552223333', 'Chicago', 'Lead', 1, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO campaigns (name, template, contact_label, status, account_id, scheduled_at, created_at)
VALUES
  ('Welcome Campaign', 'welcome_template', 'Customer', 'draft', 1, NOW() + INTERVAL '1 day', NOW()),
  ('Special Offer', 'special_offer_template', 'VIP', 'draft', 1, NOW() + INTERVAL '2 days', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO analytics (campaign_id, sent, delivered, read, optout, hold, failed, account_id, updated_at)
VALUES
  (1, 100, 95, 80, 5, 3, 2, 1, NOW()),
  (2, 50, 48, 40, 2, 1, 1, 1, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO settings (account_id, facebook_access_token, partner_mobile, waba_id, updated_at)
VALUES
  (1, 'SAMPLE_FB_TOKEN', '+919876543210', 'waba_123456789', NOW())
ON CONFLICT DO NOTHING;


