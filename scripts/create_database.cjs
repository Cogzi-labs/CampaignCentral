#!/usr/bin/env node

/**
 * create_database.cjs
 * A specialized script to create a PostgreSQL database (cannot be done inside transactions)
 */

const { Client } = require('pg');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 5) {
  console.error('Usage: node create_database.cjs <superuser> <password> <host> <port> <dbname> <owner>');
  process.exit(1);
}

const superuser = args[0];
const password = args[1];
const host = args[2];
const port = parseInt(args[3], 10);
const dbName = args[4];
const ownerName = args[5] || 'postgres';

async function createDatabase() {
  // Connect to PostgreSQL as superuser
  const client = new Client({
    user: superuser,
    password: password,
    host: host,
    port: port,
    database: 'postgres' // Connect to default database
  });

  try {
    await client.connect();
    console.log(`Connected to PostgreSQL as ${superuser}`);
    
    // Create the database
    try {
      await client.query(`CREATE DATABASE ${dbName} OWNER ${ownerName};`);
      console.log(`Database ${dbName} created successfully!`);
    } catch (err) {
      // If the database already exists, that's okay
      if (err.message.includes('already exists')) {
        console.log(`Note: Database ${dbName} already exists, continuing...`);
      } else {
        throw err;
      }
    }
    
    return true;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return false;
  } finally {
    await client.end();
  }
}

// Execute the function
createDatabase().then(success => {
  process.exit(success ? 0 : 1);
});