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
  
  // Find .env file in the current directory
  const envPath = path.resolve(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.warn('Warning: .env file not found at:', envPath);
    return;
  }
  
  try {
    // Read and parse the .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    let varsLoaded = 0;
    
    // Process each line
    envLines.forEach(line => {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) {
        return;
      }
      
      // Split by the first equals sign
      const equalsPos = line.indexOf('=');
      if (equalsPos > 0) {
        const key = line.substring(0, equalsPos).trim();
        const value = line.substring(equalsPos + 1).trim();
        
        // Set the environment variable
        process.env[key] = value;
        varsLoaded++;
      }
    });
    
    console.log(`Environment variables loaded: ${varsLoaded} variables`);
  } catch (error) {
    console.error('Error loading .env file:', error.message);
  }
}

// Load environment variables immediately when this module is required
loadEnv();