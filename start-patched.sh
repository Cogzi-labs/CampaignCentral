#!/bin/bash

# Load environment variables
if [ -f .env ]; then
  # Export all variables from .env file to environment
  set -a
  source .env
  set +a
  echo "Loaded environment variables from .env file"
fi

# Set INSTALL_DIR if not already set
if [ -z "$INSTALL_DIR" ]; then
  export INSTALL_DIR=$(pwd)
  echo "Setting INSTALL_DIR to current directory: $INSTALL_DIR"
fi

# Check for required variables
if [ -z "$DATABASE_URL" ] && [ -n "$PGHOST" ] && [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGDATABASE" ]; then
  # Construct DATABASE_URL from individual PostgreSQL variables
  PGPORT=${PGPORT:-5432}
  export DATABASE_URL="postgresql://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
  echo "Constructed DATABASE_URL from PostgreSQL environment variables"
fi

# Random session secret if not provided
if [ -z "$SESSION_SECRET" ]; then
  export SESSION_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 32)
  echo "Generated random SESSION_SECRET for this session"
fi

# Run with runtime patch that properly sets import.meta.dirname in vite.ts
echo "Starting application with patched Vite (INSTALL_DIR=$INSTALL_DIR)..."
NODE_OPTIONS="--require ./vite-runtime-patch.cjs" npm run dev