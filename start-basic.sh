#!/bin/bash

# start-basic.sh - Ultra-simple startup script without complex dependencies
# This script uses direct commands without polyfills or compatibility layers

echo "=== Starting CampaignHub in basic mode ==="

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  source .env
  echo "Environment variables loaded successfully"
else
  echo "Warning: .env file not found"
fi

# Set Node.js options the simplest way possible
export NODE_OPTIONS="--no-warnings"

# Check if we should run production or development mode
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  echo "Production build found. Running in PRODUCTION mode..."
  NODE_ENV=production node dist/index.js
else
  echo "No production build found. Running in DEVELOPMENT mode..."
  
  # Install minimal dependencies
  echo "Installing required packages..."
  npm install --no-save tsx > /dev/null
  
  echo "Starting in simple development mode..."
  NODE_ENV=development npx tsx server/index.ts
fi