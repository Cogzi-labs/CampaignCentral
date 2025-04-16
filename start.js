#!/usr/bin/env node

/**
 * Start script for production deployment
 * This script serves as a compatibility layer for various production environments.
 * 
 * It will try to run the appropriate start command based on what's available:
 * 1. First try to use the built dist/index.js file (normal production)
 * 2. Try to build the application if dist/index.js doesn't exist
 * 3. Fall back to development mode if build fails
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

// Function to run a command and return success status
function runCommand(command, args, env = {}) {
  console.log(`Running command: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { 
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
  return result.status === 0;
}

// Starting logic
if (hasBuiltVersion) {
  console.log('Using production build from dist/index.js');
  runCommand('node', ['--enable-source-maps', distFilePath]);
} else {
  console.log('No production build found, attempting to create build...');
  
  // Ensure build dependencies are installed
  console.log('Checking for build dependencies...');
  try {
    const checkViteResult = spawnSync('npx', ['--no-install', 'vite', '--version'], { 
      stdio: 'pipe',
      encoding: 'utf-8' 
    });
    
    if (checkViteResult.status !== 0) {
      console.log('Vite not found in local node_modules, installing build dependencies...');
      runCommand('npm', ['install', '--no-save', 'vite', 'esbuild']);
    } else {
      console.log(`Vite found: ${checkViteResult.stdout.trim()}`);
    }
  } catch (error) {
    console.log('Error checking for Vite, will try to install:', error.message);
    runCommand('npm', ['install', '--no-save', 'vite', 'esbuild']);
  }
  
  // Use npx to ensure we have the right path to the binaries
  console.log('Building client assets with Vite...');
  const viteBuildSuccess = runCommand('npx', ['vite', 'build'], { NODE_ENV: 'production' });
  
  if (viteBuildSuccess) {
    console.log('Building server with esbuild...');
    const esbuildSuccess = runCommand('npx', [
      'esbuild', 
      'server/index.ts', 
      '--platform=node', 
      '--packages=external', 
      '--bundle', 
      '--format=esm', 
      '--outdir=dist'
    ], { NODE_ENV: 'production' });
    
    if (esbuildSuccess && existsSync(distFilePath)) {
      console.log('Build successful, starting server');
      runCommand('node', ['--enable-source-maps', distFilePath]);
    } else {
      console.log('Server build failed, falling back to development mode');
      runCommand('npx', ['tsx', 'server/index.ts']);
    }
  } else {
    console.log('Client build failed, falling back to development mode');
    console.log('Common build failures:');
    console.log('- Missing dependencies (vite, esbuild)');
    console.log('- TypeScript errors in the codebase');
    runCommand('npx', ['tsx', 'server/index.ts']);
  }
}