#!/usr/bin/env node

/**
 * initialize_database.js
 * A Node.js script to initialize the PostgreSQL database for the Campaign Management System
 * 
 * This script reads SQL files and executes them against a PostgreSQL database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const util = require('util');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Default values
const defaults = {
  superuser: 'postgres',
  dbName: 'campaign_management',
  dbUser: 'campaign_manager',
  dbPassword: 'your_secure_password',
  host: 'localhost',
  port: 5432
};

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline.question
const question = util.promisify((query, callback) => {
  rl.question(query, (answer) => callback(null, answer));
});

// Function to read SQL files
function readSqlFile(filename) {
  return fs.readFileSync(path.join(__dirname, filename), 'utf8');
}

// Replace placeholders in SQL script
function replacePlaceholders(sql, replacements) {
  let result = sql;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }
  return result;
}

// Execute a SQL script
async function executeSQL(client, sql, label) {
  try {
    console.log(`\n${colors.yellow}${label}${colors.reset}`);
    await client.query(sql);
    console.log(`${colors.green}Success!${colors.reset}`);
    return true;
  } catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(`${colors.yellow}Campaign Management System - Database Initialization${colors.reset}`);
  console.log(`${colors.yellow}=====================================================${colors.reset}\n`);

  try {
    // Get user inputs
    const superuser = await question(`Enter PostgreSQL superuser name [${defaults.superuser}]: `) || defaults.superuser;
    const superuserPassword = await question('Enter PostgreSQL superuser password: ');
    const dbName = await question(`Enter database name [${defaults.dbName}]: `) || defaults.dbName;
    const dbUser = await question(`Enter database user [${defaults.dbUser}]: `) || defaults.dbUser;
    const dbPassword = await question(`Enter database password [${defaults.dbPassword}]: `) || defaults.dbPassword;
    const host = await question(`Enter database host [${defaults.host}]: `) || defaults.host;
    const port = await question(`Enter database port [${defaults.port}]: `) || defaults.port;

    // Read SQL files
    let setupDbSql = readSqlFile('setup_db.sql');
    const createTablesSql = readSqlFile('create_tables.sql');
    const seedDataSql = readSqlFile('seed_data.sql');

    // Replace placeholders in setup SQL
    setupDbSql = replacePlaceholders(setupDbSql, {
      'campaign_manager': dbUser,
      'your_secure_password': dbPassword,
      'campaign_management': dbName
    });

    // Connect to PostgreSQL as superuser
    const superuserClient = new Client({
      user: superuser,
      password: superuserPassword,
      host,
      port,
      database: 'postgres' // Connect to default database initially
    });

    await superuserClient.connect();
    console.log(`${colors.green}Connected to PostgreSQL as ${superuser}${colors.reset}`);

    // Step 1: Create database and user
    const success1 = await executeSQL(superuserClient, setupDbSql, 'Step 1/3: Creating database and user');
    await superuserClient.end();

    if (!success1) {
      throw new Error('Failed to create database and user');
    }

    // Connect to the new database as the new user
    const userClient = new Client({
      user: dbUser,
      password: dbPassword,
      host,
      port,
      database: dbName
    });

    await userClient.connect();
    console.log(`${colors.green}Connected to ${dbName} as ${dbUser}${colors.reset}`);

    // Step 2: Create tables
    const success2 = await executeSQL(userClient, createTablesSql, 'Step 2/3: Creating tables');
    if (!success2) {
      throw new Error('Failed to create tables');
    }

    // Step 3: Add seed data
    const success3 = await executeSQL(userClient, seedDataSql, 'Step 3/3: Adding seed data');
    if (!success3) {
      throw new Error('Failed to add seed data');
    }

    await userClient.end();

    // Done!
    console.log(`\n${colors.green}Database initialization completed successfully!${colors.reset}`);
    console.log(`${colors.green}You can now use the following DATABASE_URL in your application:${colors.reset}`);
    console.log(`DATABASE_URL=postgres://${dbUser}:${dbPassword}@${host}:${port}/${dbName}`);
    console.log(`\n${colors.yellow}Default Admin Credentials:${colors.reset}`);
    console.log(`Username: admin`);
    console.log(`Password: admin123`);
    console.log(`${colors.red}Note: Please change the admin password in production!${colors.reset}`);

  } catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the main function
main();