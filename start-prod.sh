#!/bin/bash

# Production startup script for CampaignCentral
# This script is designed to be simple and have minimal dependencies

# Load environment variables
if [ -f .env ]; then
  # Export all variables from .env file to environment
  set -a
  source .env
  set +a
  echo "Loaded environment variables from .env file"
fi

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ] && [ -n "$PGHOST" ] && [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGDATABASE" ]; then
  # Construct DATABASE_URL from individual PostgreSQL variables
  PGPORT=${PGPORT:-5432}
  export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
  echo "Constructed DATABASE_URL from PostgreSQL environment variables"
fi

# Verify critical variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  echo "Please set DATABASE_URL environment variable or the individual PostgreSQL variables"
  exit 1
fi

# Random session secret if not provided
if [ -z "$SESSION_SECRET" ]; then
  export SESSION_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
  echo "Generated random SESSION_SECRET for this session"
fi

# Start the application in production mode
echo "Starting Campaign Central in PRODUCTION mode..."
NODE_ENV=production exec node dist/index.js