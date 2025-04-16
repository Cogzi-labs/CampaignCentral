#!/bin/bash

# start-prod.sh - Simple production startup script that solves the vite import issue
# This script focuses specifically on resolving the "Cannot find package 'vite'" error

echo "Starting CampaignHub in production mode"

# Check if we need to build
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
  echo "Production build not found, creating one now..."

  # Clean up any previous partial builds
  rm -rf dist

  # Install vite and esbuild explicitly
  echo "Installing build dependencies..."
  npm install --no-save vite esbuild @vitejs/plugin-react

  # Build the client first
  echo "Building client..."
  NODE_ENV=production ./node_modules/.bin/vite build

  # Then build the server
  echo "Building server..."
  NODE_ENV=production ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
else
  echo "Using existing production build"
fi

# Start the server
if [ -f "dist/index.js" ]; then
  echo "Starting production server..."
  NODE_ENV=production node dist/index.js
else
  echo "Build failed, falling back to development mode"
  NODE_ENV=production npx tsx server/index.ts
fi