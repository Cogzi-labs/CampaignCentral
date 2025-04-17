#!/bin/bash

# run-prod.sh - Production mode runner for CampaignHub
# This script assumes the application is already built

echo "=== Running CampaignHub in production mode ==="

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  source .env
  echo "Environment variables loaded"
else
  echo "Warning: .env file not found"
fi

# Check if we have a production build
if [ ! -d "dist/client" ] || [ ! -f "dist/index.js" ]; then
  echo "Error: Production build not found. Please run './build.sh' first."
  exit 1
fi

# Set environment to production
export NODE_ENV=production

# Run the application
echo "Starting production server..."
node dist/index.js