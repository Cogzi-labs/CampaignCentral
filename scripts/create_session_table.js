#!/usr/bin/env node

/**
 * Create PostgreSQL session table
 * 
 * This script creates the session table in PostgreSQL for the Connect PG Simple session store
 * It can be run directly with Node.js
 * 
 * Usage: 
 *   node create_session_table.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Get database connection info from environment variables
const connectionConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: {
        rejectUnauthorized: false
      }
    };

if (!process.env.DATABASE_URL && 
    !(process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE)) {
  console.error('Database connection information must be set in environment variables');
  process.exit(1);
}

// SQL to create the session table if it doesn't exist
const sessionTableSQL = `
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'session'
  ) THEN
    -- Create the session table
    CREATE TABLE "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
    
    -- Create an index on the expire column for faster pruning
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    
    RAISE NOTICE 'Session table created successfully!';
  ELSE
    RAISE NOTICE 'Session table already exists. No changes made.';
  END IF;
END $$;
`;

async function createSessionTable() {
  const pool = new Pool(connectionConfig);
  
  try {
    console.log('Connecting to PostgreSQL database...');
    await pool.connect();
    
    console.log('Creating session table if it doesn\'t exist...');
    await pool.query(sessionTableSQL);
    
    console.log('Session table setup completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the function
createSessionTable();