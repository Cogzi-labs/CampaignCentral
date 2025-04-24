#!/usr/bin/env node

/**
 * Reset Database Script
 * 
 * This script drops and recreates all tables in the database to ensure a clean state.
 * WARNING: This will delete all existing data!
 * 
 * Usage:
 *   node scripts/reset_database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
const resetAllTablesSQL = fs.readFileSync(
  path.join(__dirname, 'reset_all_tables.sql'), 
  'utf8'
);

async function resetDatabase() {
  console.log('\x1b[33m%s\x1b[0m', '⚠️  WARNING: This will delete ALL data in the database! ⚠️');
  console.log('Database URL:', process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 
    `${process.env.PGUSER}:****@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`);
  
  // Ask for confirmation
  rl.question('\nType "RESET" to confirm: ', async (answer) => {
    if (answer.trim() !== 'RESET') {
      console.log('\x1b[32m%s\x1b[0m', 'Reset canceled. No changes made.');
      rl.close();
      return;
    }
    
    const pool = new Pool(connectionConfig);
    
    try {
      console.log('\x1b[33m%s\x1b[0m', 'Connecting to PostgreSQL database...');
      await pool.connect();
      
      console.log('\x1b[33m%s\x1b[0m', 'Dropping and recreating all tables...');
      await pool.query(resetAllTablesSQL);
      
      console.log('\x1b[32m%s\x1b[0m', '✅ Database reset successfully!');
      console.log('\x1b[32m%s\x1b[0m', '✅ Created tables: accounts, users, contacts, campaigns, analytics, settings, session');
      console.log('\x1b[32m%s\x1b[0m', '✅ Default admin account created:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('\x1b[31m%s\x1b[0m', 'IMPORTANT: Change the admin password immediately in production!');
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', 'Error:');
      console.error(error);
      process.exit(1);
    } finally {
      await pool.end();
      rl.close();
    }
  });
}

// Run the function
resetDatabase();