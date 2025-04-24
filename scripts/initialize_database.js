#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script initializes the PostgreSQL database for the Campaign Management System.
 * It's a Node.js alternative to the Bash script for platforms like Windows.
 * 
 * Usage:
 *   node initialize_database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline.question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Function to read SQL file
function readSqlFile(fileName) {
  return fs.readFileSync(path.join(__dirname, fileName), 'utf8');
}

// Main function
async function initializeDatabase() {
  try {
    console.log(`${colors.yellow}Campaign Management System - Database Initialization${colors.reset}`);
    console.log(`${colors.yellow}=====================================================${colors.reset}`);
    
    // Get PostgreSQL credentials
    const pgSuperUser = await question('Enter PostgreSQL superuser name [postgres]: ') || 'postgres';
    const dbName = await question('Enter database name [campaign_management]: ') || 'campaign_management';
    const dbUser = await question('Enter database user [campaign_manager]: ') || 'campaign_manager';
    const dbPassword = await question('Enter database password [your_secure_password]: ') || 'your_secure_password';
    
    // Update SQL files with custom values
    let setupSql = readSqlFile('setup_db.sql');
    setupSql = setupSql
      .replace(/campaign_manager/g, dbUser)
      .replace(/your_secure_password/g, dbPassword)
      .replace(/campaign_management/g, dbName);
    
    // Write updated SQL to temporary file
    const setupTempPath = path.join(__dirname, 'setup_db_temp.sql');
    fs.writeFileSync(setupTempPath, setupSql);
    
    // Step 1: Create database and user
    console.log(`\n${colors.yellow}Step 1/4: Creating database and user${colors.reset}`);
    
    const superUserPool = new Pool({
      user: pgSuperUser,
      host: 'localhost',
      port: 5432,
      database: 'postgres' // Connect to default database
    });
    
    try {
      await superUserPool.query(setupSql);
      console.log(`${colors.green}Database and user created successfully!${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error creating database and user:${colors.reset}`, error.message);
      process.exit(1);
    } finally {
      await superUserPool.end();
    }
    
    // Connect to the new database for remaining operations
    const dbPool = new Pool({
      user: dbUser,
      password: dbPassword,
      host: 'localhost',
      port: 5432,
      database: dbName
    });
    
    // Step 2: Create tables
    console.log(`\n${colors.yellow}Step 2/4: Creating tables${colors.reset}`);
    try {
      const createTablesSql = readSqlFile('create_tables.sql');
      await dbPool.query(createTablesSql);
      console.log(`${colors.green}Tables created successfully!${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error creating tables:${colors.reset}`, error.message);
      process.exit(1);
    }
    
    // Step 3: Create session table
    console.log(`\n${colors.yellow}Step 3/4: Creating session table${colors.reset}`);
    try {
      const createSessionTableSql = readSqlFile('create_session_table.sql');
      await dbPool.query(createSessionTableSql);
      console.log(`${colors.green}Session table created successfully!${colors.reset}`);
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Session table creation issue:${colors.reset}`, error.message);
      console.warn(`${colors.yellow}If this is because the table already exists, you can ignore this warning.${colors.reset}`);
    }
    
    // Step 4: Add seed data
    console.log(`\n${colors.yellow}Step 4/4: Adding seed data${colors.reset}`);
    try {
      const seedDataSql = readSqlFile('seed_data.sql');
      await dbPool.query(seedDataSql);
      console.log(`${colors.green}Seed data added successfully!${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error adding seed data:${colors.reset}`, error.message);
      process.exit(1);
    } finally {
      await dbPool.end();
    }
    
    // Clean up temporary file
    fs.unlinkSync(setupTempPath);
    
    // Done!
    console.log(`\n${colors.green}Database initialization completed successfully!${colors.reset}`);
    console.log(`${colors.green}You can now use the following DATABASE_URL in your application:${colors.reset}`);
    console.log(`DATABASE_URL=postgres://${dbUser}:${dbPassword}@localhost:5432/${dbName}`);
    console.log('');
    console.log(`${colors.yellow}Default Admin Credentials:${colors.reset}`);
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log(`${colors.red}Note: Please change the admin password in production!${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}An unexpected error occurred:${colors.reset}`, error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the function
initializeDatabase();