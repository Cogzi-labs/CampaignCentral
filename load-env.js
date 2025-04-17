/**
 * Cross-platform environment variable loader
 * Works on Windows, Mac, and Linux
 * 
 * Usage:
 *   node -r ./load-env.js yourScript.js
 * 
 * This will load environment variables from .env before your script runs
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  console.log('Loading environment variables from .env file...');
  
  // Use current working directory by default
  const cwd = process.cwd();
  
  // Try to find .env file in the current directory and parent directories
  let envPath = '';
  
  // First try the current directory
  const currentDirEnvPath = path.resolve(cwd, '.env');
  if (fs.existsSync(currentDirEnvPath)) {
    envPath = currentDirEnvPath;
  } else {
    // Try parent directory as fallback
    const parentDirEnvPath = path.resolve(cwd, '..', '.env');
    if (fs.existsSync(parentDirEnvPath)) {
      envPath = parentDirEnvPath;
    }
  }
  
  if (!envPath) {
    console.warn('Warning: .env file not found in current or parent directories');
    return;
  }
  
  try {
    // Read and parse the .env file
    let envContent;
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (readError) {
      console.error(`Error reading .env file at ${envPath}:`, readError.message);
      return;
    }
    
    // Use both \n and \r\n as possible line endings
    const envLines = envContent.replace(/\r\n/g, '\n').split('\n');
    
    let varsLoaded = 0;
    
    // Process each line
    envLines.forEach((line, lineNumber) => {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) {
        return;
      }
      
      // Split by the first equals sign
      const equalsPos = line.indexOf('=');
      if (equalsPos > 0) {
        const key = line.substring(0, equalsPos).trim();
        const value = line.substring(equalsPos + 1).trim();
        
        if (!key) {
          console.warn(`Warning: Line ${lineNumber + 1} has an empty key, skipping`);
          return;
        }
        
        // Set the environment variable
        process.env[key] = value;
        varsLoaded++;
      } else {
        console.warn(`Warning: Line ${lineNumber + 1} is not properly formatted (missing "="), skipping: ${line}`);
      }
    });
    
    console.log(`Environment variables loaded: ${varsLoaded} variables from ${envPath}`);
    
    // Check for important environment variables
    if (process.env.DATABASE_URL) {
      console.log('Database connection string found');
    } else {
      console.warn('Warning: DATABASE_URL not found in .env file');
    }
  } catch (error) {
    console.error('Error processing .env file:', error.message);
  }
}

// Load environment variables immediately when this module is required
loadEnv();