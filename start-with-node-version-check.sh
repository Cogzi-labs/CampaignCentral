#!/bin/bash

# start-with-node-version-check.sh - A startup script that checks for Node.js compatibility
# This script ensures Node.js version is compatible with vite.config.ts

echo "=== Starting CampaignHub with Node.js version check ==="

# Check Node.js version
NODE_VERSION=$(node -v)
REQUIRED_VERSION="v18.0.0"

# Function to compare versions
version_gt() {
  test "$(echo "$@" | tr " " "\n" | sort -V | head -n 1)" != "$1";
}

if ! version_gt "$NODE_VERSION" "$REQUIRED_VERSION"; then
  echo "Warning: Node.js version $NODE_VERSION may be too old for import.meta.dirname"
  echo "Minimum recommended version is $REQUIRED_VERSION"
  echo "Installing tsx with ESM compatibility..."
  npm install --no-save tsx esbuild-node-loader
fi

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
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
  
  # Force ESM compatibility
  echo "Starting with ESM compatibility mode..."
  NODE_ENV=development NODE_OPTIONS="--no-warnings --loader=esbuild-node-loader" npx tsx server/index.ts
fi