/**
 * Centralized configuration file for environment variables
 * This should be imported by any file that needs to access environment variables
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Database configuration
export const DB_CONFIG = {
  url: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  port: process.env.PGPORT || '5432',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
};

// Email configuration (AWS SES)
export const EMAIL_CONFIG = {
  username: process.env.SES_USERNAME,
  password: process.env.SES_PASSWORD,
  region: process.env.SES_REGION || 'ap-south-1',
  sender: process.env.SES_SENDER
};

// Session configuration
export const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-development-only',
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const
  }
};

// API keys
export const API_KEYS = {
  campaignApiKey: process.env.CAMPAIGN_API_KEY
};

// Server configuration
export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || '5000', 10),
  host: '0.0.0.0',
  environment: process.env.NODE_ENV || 'development'
};

// Debug environment variables
if (SERVER_CONFIG.environment === 'development') {
  console.log("ENV DEBUG: SES_USERNAME =", EMAIL_CONFIG.username);
  console.log("ENV DEBUG: SES_PASSWORD exists =", !!EMAIL_CONFIG.password);
  console.log("ENV DEBUG: SES_SENDER =", EMAIL_CONFIG.sender);
}