#!/bin/bash

# Production startup script for CampaignHub
# Used by the systemd service to start the application

# Load environment variables
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Set production environment
export NODE_ENV=production

# Run the application
npm run start