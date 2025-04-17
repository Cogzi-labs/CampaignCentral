-- setup_db.sql
-- This script creates the database, user, and necessary privileges
-- Run as a database administrator

-- Create the database user (customize username and password)
CREATE USER campaign_manager WITH PASSWORD 'your_secure_password' CREATEDB;

-- Create the database (will be executed separately outside transaction)
CREATE DATABASE campaign_management OWNER campaign_manager;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campaign_management TO campaign_manager;