#!/bin/bash

# Unified startup script for CampaignHub

set -e

echo "Starting CampaignHub..."

# Load environment variables if .env exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Construct DATABASE_URL from individual PG variables if needed
if [ -z "$DATABASE_URL" ] && [ -n "$PGHOST" ] && [ -n "$PGUSER" ] && \
   [ -n "$PGPASSWORD" ] && [ -n "$PGDATABASE" ]; then
  PGPORT=${PGPORT:-5432}
  export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
fi

# Verify DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

# Generate random SESSION_SECRET if not provided
if [ -z "$SESSION_SECRET" ]; then
  export SESSION_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
  echo "Generated random SESSION_SECRET for this session."
fi

# Determine mode
if [ -d "dist/public" ] && [ -f "dist/index.js" ]; then
  echo "Starting in PRODUCTION mode..."
  NODE_ENV=production node dist/index.js
else
  echo "Starting in DEVELOPMENT mode..."
  NODE_ENV=development npm run dev
fi

