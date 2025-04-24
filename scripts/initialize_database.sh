#!/bin/bash

# initialize_database.sh
# This script runs all the necessary SQL scripts to set up the database

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Campaign Management System - Database Initialization${NC}"
echo -e "${YELLOW}=====================================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if psql is installed
if ! command_exists psql; then
  echo -e "${RED}Error: PostgreSQL client (psql) is not installed.${NC}"
  echo "Please install PostgreSQL client tools and try again."
  exit 1
fi

# Ask for PostgreSQL superuser credentials
read -p "Enter PostgreSQL superuser name [postgres]: " PG_SUPERUSER
PG_SUPERUSER=${PG_SUPERUSER:-postgres}

# Optional: Ask for custom database name and user
read -p "Enter database name [campaign_management]: " DB_NAME
DB_NAME=${DB_NAME:-campaign_management}

read -p "Enter database user [campaign_manager]: " DB_USER
DB_USER=${DB_USER:-campaign_manager}

read -p "Enter database password [your_secure_password]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-your_secure_password}

# Update the setup_db.sql file with the provided values
sed -i.bak "s/campaign_manager/$DB_USER/g" setup_db.sql
sed -i.bak "s/your_secure_password/$DB_PASSWORD/g" setup_db.sql
sed -i.bak "s/campaign_management/$DB_NAME/g" setup_db.sql

echo -e "\n${YELLOW}Step 1/3: Creating database and user${NC}"
PGPASSWORD=$PG_PASSWORD psql -U $PG_SUPERUSER -f setup_db.sql

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to create database and user.${NC}"
  echo "Please check your PostgreSQL credentials and try again."
  exit 1
fi

echo -e "\n${YELLOW}Step 2/4: Creating tables${NC}"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f create_tables.sql

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to create tables.${NC}"
  exit 1
fi

echo -e "\n${YELLOW}Step 3/4: Creating session table${NC}"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f create_session_table.sql

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Warning: Session table creation failed, but continuing.${NC}"
  echo -e "${YELLOW}If this is because the table already exists, you can ignore this warning.${NC}"
fi

echo -e "\n${YELLOW}Step 4/4: Adding seed data${NC}"
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f seed_data.sql

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to add seed data.${NC}"
  exit 1
fi

# Restore the original SQL files
mv setup_db.sql.bak setup_db.sql 2>/dev/null

# Done!
echo -e "\n${GREEN}Database initialization completed successfully!${NC}"
echo -e "${GREEN}You can now use the following DATABASE_URL in your application:${NC}"
echo -e "DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo -e "${YELLOW}Default Admin Credentials:${NC}"
echo -e "Username: admin"
echo -e "Password: admin123"
echo -e "${RED}Note: Please change the admin password in production!${NC}"