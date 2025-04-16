#!/bin/bash

# start.sh - Robust startup script for production and development environments
# This script handles various deployment environments by checking what's available

echo "Starting CampaignHub application..."

# Detect if we're in a production environment
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting in PRODUCTION mode"
  
  # Check if dist directory exists
  if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    echo "Using pre-built production files"
    NODE_ENV=production node --enable-source-maps dist/index.js
  else
    echo "No production build found, attempting to create build..."
    
    # Try to build the application
    npm run build
    
    # Check if build was successful
    if [ -d "dist" ] && [ -f "dist/index.js" ]; then
      echo "Build successful, starting server"
      NODE_ENV=production node --enable-source-maps dist/index.js
    else
      echo "Build failed or dist/index.js not found, falling back to development mode"
      NODE_ENV=production tsx server/index.ts
    fi
  fi
else
  # Development mode
  echo "Starting in DEVELOPMENT mode"
  NODE_ENV=development tsx server/index.ts
fi