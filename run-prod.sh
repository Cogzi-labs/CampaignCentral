#!/bin/bash

# run-prod.sh - Production startup script that avoids Vite configuration issues
# This script first builds the app using our custom build script and then runs it

echo "=== Starting CampaignHub in production mode ==="

# Check if we need to build
if [ ! -d "dist/client" ] || [ ! -f "dist/index.js" ]; then
  echo "Production build not found or incomplete"
  echo "Running custom build script..."
  
  # Run our custom build script
  ./build.sh
  
  # Check if build was successful
  if [ ! -d "dist/client" ] || [ ! -f "dist/index.js" ]; then
    echo "Build failed, cannot start production server"
    echo "Falling back to development mode..."
    NODE_ENV=development npx tsx server/index.ts
    exit 1
  fi
fi

# Start the production server
echo "Starting production server..."
NODE_ENV=production node dist/index.js