#!/bin/bash

# CampaignHub Service Uninstallation Script
# This script removes the application systemd service
# Run with sudo: sudo ./uninstall_service.sh

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo)${NC}"
  exit 1
fi

echo -e "${YELLOW}Uninstalling CampaignHub system service...${NC}"

# Check if the service file exists
if [ ! -f "/etc/systemd/system/campaignhub.service" ]; then
  echo -e "${RED}Error: Service file not found. The service may not be installed.${NC}"
  exit 1
fi

# Stop the service if it's running
if systemctl is-active --quiet campaignhub.service; then
  echo -e "${YELLOW}Stopping CampaignHub service...${NC}"
  systemctl stop campaignhub.service
fi

# Disable the service from starting on boot
echo -e "${YELLOW}Disabling service...${NC}"
systemctl disable campaignhub.service

# Remove the service file
echo -e "${YELLOW}Removing service file...${NC}"
rm /etc/systemd/system/campaignhub.service

# Reload systemd
echo -e "${YELLOW}Reloading systemd daemon...${NC}"
systemctl daemon-reload

echo -e "${GREEN}CampaignHub service has been successfully uninstalled.${NC}"