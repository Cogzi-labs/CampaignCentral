#!/bin/bash

# Extremely simple startup script with minimal dependencies
# For environments where bash scripting features might be limited

# Load environment variables (if .env exists)
[ -f .env ] && export $(grep -v '^#' .env | xargs)

# Run the server
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  # Production build exists
  NODE_ENV=production node dist/index.js
else
  # Development mode
  NODE_ENV=development npx tsx server/index.ts
fi