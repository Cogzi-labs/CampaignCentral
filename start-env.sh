#!/bin/bash

# start-env.sh - Advanced environment variable handling startup script

echo "=== Starting CampaignHub with enhanced environment handling ==="

# Load environment variables from .env file with detailed output
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  
  # Process each line in .env file
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    if [[ ! "$line" =~ ^\s*# && -n "$line" ]]; then
      # Extract variable name
      varname=$(echo "$line" | cut -d '=' -f 1)
      
      # Skip export keywords if present
      if [[ "$varname" == "export "* ]]; then
        varname=$(echo "$varname" | sed 's/^export //')
      fi
      
      # Export the full line (handles complex values with spaces, quotes, etc.)
      export "$line"
      
      # Output variable name (not value for security)
      echo "  Loaded: $varname"
    fi
  done < .env
  
  echo "Environment variables loaded successfully"
else
  echo "Warning: .env file not found"
fi

# Show critical environment variables (without showing actual values)
echo "Critical environment variables check:"
for var in "DATABASE_URL" "NODE_ENV" "PORT" "SESSION_SECRET"; do
  if [ -n "${!var}" ]; then
    echo "  $var: ✓ (set)"
  else
    echo "  $var: ✗ (not set)"
  fi
done

# Install essential packages
echo "Installing essential packages..."
npm install --no-save tsx dotenv > /dev/null

# Run the application
echo "Starting the application..."
NODE_ENV=development npx tsx server/index.ts