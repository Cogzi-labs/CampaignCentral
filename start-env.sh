#!/bin/bash

# start-env.sh - Start script that focuses on loading .env variables
# This script explicitly loads .env variables before starting the application

echo "=== Starting CampaignHub with explicit environment variable loading ==="

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  # Use a safer method that handles empty lines and special characters better
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    if [[ ! "$line" =~ ^# ]] && [[ -n "$line" ]]; then
      # Extract variable and value
      if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        export "$key=$value"
      fi
    fi
  done < .env
  echo "Environment variables loaded successfully"
else
  echo "ERROR: .env file not found. Application may not function correctly."
fi

# Debug output - List environment variables (excluding sensitive values)
echo "Environment variables loaded:"
echo "DATABASE_URL exists: $(if [ -n "$DATABASE_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "SES_REGION: $SES_REGION"
echo "SES_SENDER: $SES_SENDER"
echo "SES_USERNAME: $SES_USERNAME" 
echo "SES_PASSWORD exists: $(if [ -n "$SES_PASSWORD" ]; then echo "Yes"; else echo "No"; fi)"

# Check if we have a built version
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  echo "Production build found. Starting production server..."
  NODE_ENV=production node -r dotenv/config dist/index.js
else
  echo "Development mode. Starting development server..."
  NODE_ENV=development npx tsx -r dotenv/config server/index.ts
fi