#!/bin/bash

# Enhanced dev script with path resolution patches
# This script runs the application in development mode with our path resolution patch

echo "Starting development server with path resolution patch..."

# Fix path resolution for ubuntu client
mkdir -p ~/ubuntu
ln -sf "$(pwd)/client" ~/ubuntu/
echo "Created compatibility path links"

# Run the application with our runtime patch
echo "Running with Node.js runtime patch..."
NODE_ENV=development NODE_OPTIONS="--require ./vite-runtime-patch.cjs" npx tsx server/index.ts