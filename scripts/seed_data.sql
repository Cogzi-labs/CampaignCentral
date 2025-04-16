-- seed_data.sql
-- This script adds initial data to get started with the application
-- Run this after creating tables

-- Insert a default account
INSERT INTO accounts (name, created_at) 
VALUES ('Default Account', NOW())
ON CONFLICT (id) DO NOTHING
RETURNING id;

-- Insert admin user (password is 'admin123' - change in production!)
-- Note: In production, use proper password hashing
INSERT INTO users (username, password, name, account_id, created_at)
VALUES ('admin', '$2b$10$Vt5xmUMkMZVR26myzEYVCeIdMEr8eVa.fBQmgn6S8Zrdi2XJ80Wca', 'Administrator', 1, NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert sample contacts
INSERT INTO contacts (name, mobile, location, label, account_id, created_at)
VALUES
  ('John Doe', '5551234567', 'New York', 'VIP', 1, NOW()),
  ('Jane Smith', '5559876543', 'Los Angeles', 'Customer', 1, NOW()),
  ('Bob Johnson', '5552223333', 'Chicago', 'Lead', 1, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample campaign templates
INSERT INTO campaigns (name, template, contact_label, status, account_id, scheduled_at, created_at)
VALUES
  ('Welcome Campaign', 'welcome_template', 'Customer', 'draft', 1, NOW() + INTERVAL '1 day', NOW()),
  ('Special Offer', 'special_offer_template', 'VIP', 'draft', 1, NOW() + INTERVAL '2 days', NOW())
ON CONFLICT DO NOTHING;

-- Insert sample analytics data
INSERT INTO analytics (campaign_id, sent, delivered, read, optout, hold, failed, account_id, updated_at)
VALUES
  (1, 100, 95, 80, 5, 3, 2, 1, NOW()),
  (2, 50, 48, 40, 2, 1, 1, 1, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample settings
INSERT INTO settings (account_id, waba_api_url, facebook_access_token, partner_mobile, waba_id, updated_at)
VALUES 
  (1, 'https://graph.facebook.com/v17.0/123456789/message_templates', 'SAMPLE_FB_TOKEN', '+919876543210', 'waba_123456789', NOW())
ON CONFLICT DO NOTHING;

-- Output success message
\echo 'Seed data inserted successfully!'