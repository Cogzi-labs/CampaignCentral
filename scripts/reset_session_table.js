#!/usr/bin/env node

/**
 * Reset Session Table Script
 * 
 * This script drops and recreates the session table to ensure a clean state.
 * Use this when encountering "relation public.session does not exist" errors.
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

// Read the SQL file
const resetSessionTableSQL = fs.readFileSync(
  path.join(__dirname, 'reset_session_table.sql'), 
  'utf8'
);

async function resetSessionTable() {
  const pool = new Pool(connectionConfig);
  
  try {
    console.log('Connecting to PostgreSQL database...');
    await pool.connect();
    
    console.log('Dropping and recreating session table...');
    await pool.query(resetSessionTableSQL);
    
    console.log('Session table reset successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('Session table did not exist. A new one has been created.');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run the function
resetSessionTable();