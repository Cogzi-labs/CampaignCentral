#!/bin/bash

# start-stable.sh - A rock-solid startup script that ensures maximum compatibility
# This script adds polyfills and uses special options to maintain compatibility with all Node.js versions

echo "=== Starting CampaignHub in stable compatibility mode ==="

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
  echo "Environment variables loaded successfully"
else
  echo "Warning: .env file not found"
fi

# Make sure we have the right dependencies
npm install --no-save tsx dotenv esbuild-node-loader @esbuild/linux-x64 > /dev/null

# Check if we should run production or development mode
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  echo "Production build found. Running in PRODUCTION mode..."
  NODE_OPTIONS="--no-warnings" NODE_ENV=production node dist/index.js
else
  echo "No production build found. Running in DEVELOPMENT mode..."
  
  # Set special Node.js options for maximum compatibility
  export NODE_OPTIONS="--no-warnings --experimental-import-meta-resolve --require=./vite-dirname-polyfill.js"
  
  echo "Starting with enhanced compatibility mode..."
  NODE_ENV=development npx tsx server/index.ts
fi