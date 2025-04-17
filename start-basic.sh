#!/bin/bash

# start-basic.sh - A simplified startup script with maximum compatibility
# Uses only basic Node.js features, no npx or fancy paths

echo "=== Starting CampaignHub with ultra-compatible startup script ==="

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  
  # Use a very simple, portable method to load env vars
  export $(grep -v '^#' .env | xargs)
  
  echo "Environment variables loaded successfully"
else
  echo "Warning: .env file not found"
fi

# Check if we should run production or development mode
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  echo "Production build found. Running in PRODUCTION mode..."
  NODE_ENV=production node dist/index.js
else
  echo "No production build found. Running in DEVELOPMENT mode..."
  
  # Install required dependencies if they don't exist
  if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/tsx" ]; then
    echo "Installing required dependencies..."
    npm install
  fi
  
  # Run the application
  echo "Starting development server..."
  NODE_ENV=development node -r tsx/cjs server/index.ts
fi