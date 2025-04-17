#!/bin/bash

# Enhanced startup script for CampaignHub
# Specifically addresses path resolution issues

echo "Starting CampaignHub with path resolution fixes..."

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  
  # Use export to ensure variables are available to child processes
  set -a
  source .env
  set +a
  
  echo "Environment variables loaded."
else
  echo "No .env file found. Using environment variables if available."
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ] && [ -n "$PGHOST" ] && [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGDATABASE" ]; then
  # Construct DATABASE_URL from individual PostgreSQL variables
  PGPORT=${PGPORT:-5432}
  export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
  echo "Constructed DATABASE_URL from PostgreSQL environment variables."
fi

# Verify critical variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Please make sure your .env file or environment contains:"
  echo "DATABASE_URL=postgresql://username:password@hostname:port/database"
  echo "Or set individual variables: PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT"
  exit 1
fi

# Random session secret if not provided
if [ -z "$SESSION_SECRET" ]; then
  export SESSION_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
  echo "Generated random SESSION_SECRET for this session."
fi

# Check if we should run production or development mode
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  # Production mode
  echo "Starting in PRODUCTION mode with path resolution patch..."
  NODE_ENV=production node -r ./vite-runtime-patch.js dist/index.js
else
  # Development mode with runtime patch
  echo "Starting in DEVELOPMENT mode with path resolution patch..."
  NODE_ENV=development NODE_OPTIONS="--require ./vite-runtime-patch.js" npx tsx server/index.ts
fi