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
    
    # Ensure all dependencies are available
    echo "Ensuring all dependencies are installed..."
    
    # Check if vite is installed
    if ! npx --no-install vite --version > /dev/null 2>&1; then
      echo "Vite not found in local node_modules, installing build dependencies..."
      npm install --no-save vite esbuild
    fi
    
    # Try to build the application
    echo "Building the application..."
    NODE_ENV=production npx vite build && \
    NODE_ENV=production npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
    
    # Check if build was successful
    if [ -d "dist" ] && [ -f "dist/index.js" ]; then
      echo "Build successful, starting server"
      NODE_ENV=production node --enable-source-maps dist/index.js
    else
      echo "Build failed or dist/index.js not found, falling back to development mode"
      echo "Error details may be above. Common issues:"
      echo "- Missing dependencies (vite, esbuild)"
      echo "- TypeScript errors"
      echo "Attempting to run in development mode..."
      NODE_ENV=production tsx server/index.ts
    fi
  fi
else
  # Development mode
  echo "Starting in DEVELOPMENT mode"
  NODE_ENV=development tsx server/index.ts
fi