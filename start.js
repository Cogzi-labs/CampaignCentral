/**
 * Start script for production deployment
 * This script serves as a compatibility layer for various production environments.
 * 
 * It will try to run the appropriate start command based on what's available:
 * 1. First try to use the built dist/index.js file (normal production)
 * 2. Try to build the application if dist/index.js doesn't exist
 * 3. Fall back to development mode if build fails
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

/**
 * Run a command and handle its output
 */
function runCommand(command, args, env = {}) {
  console.log(`Running: ${command} ${args.join(' ')}`);
  
  const combinedEnv = { ...process.env, ...env };
  
  const proc = spawn(command, args, {
    env: combinedEnv,
    stdio: 'inherit'
  });
  
  proc.on('error', (err) => {
    console.error(`Command failed: ${err.message}`);
    process.exit(1);
  });
  
  return proc;
}

// Main execution
console.log('=== CampaignHub Application Starter ===');

// First check if we have a production build
if (fs.existsSync('dist/index.js') && fs.existsSync('dist/client')) {
  console.log('Production build found. Running in PRODUCTION mode...');
  runCommand('node', ['dist/index.js'], { NODE_ENV: 'production' });
} else {
  console.log('No production build found. Running in DEVELOPMENT mode...');
  
  try {
    // Install development dependencies if needed
    if (!fs.existsSync('node_modules/.bin/tsx')) {
      console.log('Installing development dependencies...');
      execSync('npm install --no-save tsx dotenv');
    }
    
    // Run in development mode
    console.log('Starting in development mode...');
    runCommand('npx', ['tsx', 'server/index.ts'], { 
      NODE_ENV: 'development',
      NODE_OPTIONS: '--no-warnings'
    });
  } catch (err) {
    console.error(`Failed to start application: ${err.message}`);
    process.exit(1);
  }
}