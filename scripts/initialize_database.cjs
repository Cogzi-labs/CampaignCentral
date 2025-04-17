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
const { spawn } = require('child_process');

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

// Process SQL to remove psql meta-commands
function processSqlForNodePg(sql) {
  // Split by lines
  const lines = sql.split('\n');
  
  // Filter out lines that start with psql meta commands like \c, \echo, etc.
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    return !trimmedLine.startsWith('\\');
  });
  
  // Join back into a single string
  return filteredLines.join('\n');
}

// Function to run the create_database.js script
async function createDatabase(superuser, password, host, port, dbName, owner) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.yellow}Creating database with separate script...${colors.reset}`);
    
    const scriptPath = path.join(__dirname, 'create_database.cjs');
    const child = spawn('node', [
      scriptPath, 
      superuser, 
      password, 
      host, 
      port.toString(), 
      dbName, 
      owner
    ]);
    
    // Capture output
    child.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    child.stderr.on('data', (data) => {
      console.error(`${colors.red}${data.toString().trim()}${colors.reset}`);
    });
    
    // Handle completion
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}Database creation script completed successfully${colors.reset}`);
        resolve(true);
      } else {
        console.error(`${colors.red}Database creation failed with code ${code}${colors.reset}`);
        resolve(false);
      }
    });
    
    child.on('error', (err) => {
      console.error(`${colors.red}Failed to start database creation script: ${err.message}${colors.reset}`);
      reject(err);
    });
  });
}

// Execute a SQL script with support for statements that can't run in transactions
async function executeSQL(client, sql, label) {
  try {
    console.log(`\n${colors.yellow}${label}${colors.reset}`);
    
    // Split the SQL into individual statements
    const statements = sql.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement individually
    for (const statement of statements) {
      // If this is a CREATE DATABASE command, we need special handling
      if (statement.toUpperCase().includes('CREATE DATABASE')) {
        try {
          // Use pg package's direct connection approach instead
          console.log(`${colors.yellow}Executing: ${statement}${colors.reset}`);
          
          try {
            // Try to execute directly (might fail if database exists)
            await client.query(statement + ';');
            console.log(`${colors.green}Database created successfully${colors.reset}`);
          } catch (dbError) {
            // If error is just that database exists, we can continue
            if (dbError.message.includes("already exists")) {
              console.log(`${colors.yellow}Note: Database already exists, continuing...${colors.reset}`);
            } else {
              // Otherwise, this is a real error
              throw dbError;
            }
          }
        } catch (err) {
          console.error(`${colors.red}Error creating database: ${err.message}${colors.reset}`);
          // Re-throw to indicate failure
          throw err;
        }
      } else if (statement.length > 0) {
        // For all other statements, use normal query
        console.log(`${colors.yellow}Executing: ${statement}${colors.reset}`);
        await client.query(statement + ';');
      }
    }
    
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
    let grantPrivilegesSql = readSqlFile('grant_privileges.sql');
    const createTablesSql = readSqlFile('create_tables.sql');
    const seedDataSql = readSqlFile('seed_data.sql');

    // Replace placeholders in SQL files
    setupDbSql = replacePlaceholders(setupDbSql, {
      'campaign_manager': dbUser,
      'your_secure_password': dbPassword,
      'campaign_management': dbName
    });
    
    grantPrivilegesSql = replacePlaceholders(grantPrivilegesSql, {
      'campaign_manager': dbUser,
      'campaign_management': dbName
    });
    
    // Remove psql meta-commands like \c and \echo
    setupDbSql = processSqlForNodePg(setupDbSql);
    grantPrivilegesSql = processSqlForNodePg(grantPrivilegesSql);

    // Step 1: Create database and user
    console.log(`\n${colors.yellow}Step 1/3: Creating database and user${colors.reset}`);
    
    // First, extract non-database-creation statements from setup_db.sql
    const userCreationSQL = setupDbSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
      .filter(statement => !statement.toUpperCase().includes('CREATE DATABASE'))
      .join(';\n') + ';';
    
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

    // Execute user creation and permissions
    let success = true;
    try {
      console.log(`${colors.yellow}Creating user and setting permissions...${colors.reset}`);
      await superuserClient.query(userCreationSQL);
      console.log(`${colors.green}User created successfully${colors.reset}`);
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log(`${colors.yellow}Note: User already exists, continuing...${colors.reset}`);
      } else {
        console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
        success = false;
      }
    }
    
    // Create the database using our separate script
    if (success) {
      const dbCreationSuccess = await createDatabase(superuser, superuserPassword, host, port, dbName, dbUser);
      if (!dbCreationSuccess) {
        success = false;
      } else {
        // Grant privileges after database creation
        try {
          console.log(`${colors.yellow}Setting database privileges...${colors.reset}`);
          await superuserClient.query(grantPrivilegesSql);
          console.log(`${colors.green}Database privileges granted successfully${colors.reset}`);
        } catch (err) {
          console.error(`${colors.red}Error granting privileges: ${err.message}${colors.reset}`);
          console.log(`${colors.yellow}Continuing anyway, this might not be critical...${colors.reset}`);
        }
      }
    }
    
    await superuserClient.end();

    if (!success) {
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

    // Process SQL files to remove psql meta-commands
    const processedCreateTablesSql = processSqlForNodePg(createTablesSql);
    const processedSeedDataSql = processSqlForNodePg(seedDataSql);
    
    // Step 2: Create tables
    const success2 = await executeSQL(userClient, processedCreateTablesSql, 'Step 2/3: Creating tables');
    if (!success2) {
      throw new Error('Failed to create tables');
    }

    // Step 3: Add seed data
    const success3 = await executeSQL(userClient, processedSeedDataSql, 'Step 3/3: Adding seed data');
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