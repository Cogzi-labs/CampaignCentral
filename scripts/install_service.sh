#!/bin/bash

# CampaignHub Service Installation Script
# This script installs the application as a systemd service
# Run with sudo: sudo ./install_service.sh

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

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}Installing CampaignHub as a system service...${NC}"

# Check if the service file exists
if [ ! -f "$SCRIPT_DIR/campaignhub.service" ]; then
  echo -e "${RED}Error: campaignhub.service file not found in $SCRIPT_DIR${NC}"
  exit 1
fi

# Copy the service file to systemd directory
cp "$SCRIPT_DIR/campaignhub.service" /etc/systemd/system/

# Replace the WorkingDirectory path in the service file
INSTALL_PATH="${APP_DIR}"
sed -i "s|WorkingDirectory=.*|WorkingDirectory=${INSTALL_PATH}|g" /etc/systemd/system/campaignhub.service

# Replace EnvironmentFile path in the service file
sed -i "s|EnvironmentFile=.*|EnvironmentFile=${INSTALL_PATH}/.env|g" /etc/systemd/system/campaignhub.service

# Get current user
CURRENT_USER=$(who am i | awk '{print $1}')

# Replace User in the service file
sed -i "s|User=.*|User=${CURRENT_USER}|g" /etc/systemd/system/campaignhub.service

echo -e "${GREEN}Service file installed to /etc/systemd/system/campaignhub.service${NC}"
echo -e "${YELLOW}Reloading systemd daemon...${NC}"

# Reload systemd
systemctl daemon-reload

echo -e "${YELLOW}Enabling service to start on boot...${NC}"

# Enable the service
systemctl enable campaignhub.service

echo -e "${GREEN}Service enabled!${NC}"
echo ""
echo -e "${YELLOW}You can now control the service with the following commands:${NC}"
echo "  Start:   sudo systemctl start campaignhub"
echo "  Stop:    sudo systemctl stop campaignhub"
echo "  Restart: sudo systemctl restart campaignhub"
echo "  Status:  sudo systemctl status campaignhub"
echo "  Logs:    sudo journalctl -u campaignhub -f"
echo ""
echo -e "${YELLOW}Do you want to start the service now? (y/n)${NC}"
read -r START_NOW

if [[ $START_NOW =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Starting CampaignHub service...${NC}"
  systemctl start campaignhub.service
  
  # Check if the service started successfully
  if systemctl is-active --quiet campaignhub.service; then
    echo -e "${GREEN}Service started successfully!${NC}"
    echo "Check the status with: sudo systemctl status campaignhub"
  else
    echo -e "${RED}Service failed to start. Check the logs with:${NC}"
    echo "sudo journalctl -u campaignhub -e"
  fi
else
  echo -e "${YELLOW}Service installation complete. Start it when ready with:${NC}"
  echo "sudo systemctl start campaignhub"
fi