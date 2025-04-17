#!/bin/bash

# Simple startup script for CampaignHub

# Load environment variables
if [ -f .env ]; then
  source .env
fi

# Check if we should run production or development mode
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  # Production mode
  NODE_ENV=production node dist/index.js
else
  # Development mode
  NODE_ENV=development npx tsx server/index.ts
fi