#!/usr/bin/env node

/**
 * Start script for production deployment
 * This script serves as a compatibility layer for various production environments.
 * 
 * It will try to run the appropriate start command based on what's available:
 * 1. First try to use the built dist/index.js file (normal production)
 * 2. Fall back to development mode if dist/index.js doesn't exist
 */

import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we have a built version
const distFilePath = join(__dirname, 'dist', 'index.js');
const hasBuiltVersion = existsSync(distFilePath);

console.log('Starting CampaignHub application...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

let startCommand;
let startArgs;

if (hasBuiltVersion) {
  console.log('Using production build from dist/index.js');
  startCommand = 'node';
  startArgs = ['--enable-source-maps', distFilePath];
} else {
  console.log('No production build found, starting in development mode');
  startCommand = 'tsx';
  startArgs = ['server/index.ts'];
}

console.log(`Running command: ${startCommand} ${startArgs.join(' ')}`);

// Run the start command
const result = spawnSync(startCommand, startArgs, { 
  stdio: 'inherit',
  env: { ...process.env }
});

// Handle the exit
process.exit(result.status || 0);