#!/bin/bash

# build.sh - Build script for CampaignHub for production deployment

echo "=== Building CampaignHub for production ==="

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  source .env
  echo "Environment variables loaded successfully"
else
  echo "Warning: .env file not found. Using default environment variables."
  # Set default environment variables for build
  export NODE_ENV=production
fi

# Install dependencies if needed
echo "Ensuring all dependencies are installed..."
npm install

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist

# Build the application
echo "Building for production..."
npm run build

# Check if build was successful
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  echo "Build successful! The application is ready for deployment."
  echo "Run './start.sh' or 'node dist/index.js' to start the production server."
else
  echo "Build failed. Please check the error messages above."
  exit 1
fi