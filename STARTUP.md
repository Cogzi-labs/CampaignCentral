# CampaignHub Startup

This document explains how to start the CampaignHub application.

## Quick Start

- On Unix/Linux/Mac: `./start.sh`
- On Windows (Development only): `start-windows.bat`

## Scripts

### `start.sh`
The main script for starting the application in a Unix environment.
```bash
./start.sh
```
- Loads environment variables from .env if present
- Automatically detects development/production mode
- Uses tsx for TypeScript execution in development mode

### `start-windows.bat`
For Windows development environments:
```
start-windows.bat
```
- For development and testing only, not for production deployment
- Automatically detects development/production mode
- Uses tsx for TypeScript execution in development mode

## Troubleshooting

If you encounter startup issues:

1. Check that .env file exists with proper configuration
2. Verify Node.js is installed and up-to-date
3. Ensure PostgreSQL database is running and accessible
4. Check that all required environment variables are set (DATABASE_URL, etc.)
5. Verify file permissions on Unix (scripts should be executable with `chmod +x script.sh`)