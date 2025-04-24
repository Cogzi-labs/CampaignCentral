#!/bin/bash

# Apply all database migrations
# This script applies all Drizzle migrations and ensures the session table exists

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying database migrations${NC}"
echo -e "${YELLOW}=========================${NC}"

# Step 1: Run Drizzle migrations (standard tables)
echo -e "\n${YELLOW}Step 1/2: Running Drizzle migrations${NC}"
npx drizzle-kit push

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to apply Drizzle migrations.${NC}"
  exit 1
fi

echo -e "${GREEN}Drizzle migrations applied successfully.${NC}"

# Step 2: Ensure session table exists
echo -e "\n${YELLOW}Step 2/2: Creating session table if it doesn't exist${NC}"
node scripts/create_session_table.js

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to create session table.${NC}"
  exit 1
fi

echo -e "${GREEN}Session table creation attempted.${NC}"

# Done!
echo -e "\n${GREEN}All migrations completed successfully!${NC}"
echo -e "${YELLOW}The application should now work with persistent sessions.${NC}"