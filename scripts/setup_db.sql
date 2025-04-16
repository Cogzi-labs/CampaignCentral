-- setup_db.sql
-- This script creates the database, user, and necessary privileges
-- Run as a database administrator

-- Create the database user (customize username and password)
CREATE USER campaign_manager WITH PASSWORD 'your_secure_password' CREATEDB;

-- Create the database
CREATE DATABASE campaign_management OWNER campaign_manager;

-- Connect to the new database
\c campaign_management

-- Create necessary extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campaign_management TO campaign_manager;

-- Output success message
\echo 'Database and user created successfully!'
\echo 'DATABASE_URL=postgres://campaign_manager:your_secure_password@localhost:5432/campaign_management'