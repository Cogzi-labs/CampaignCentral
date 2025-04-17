# CampaignHub Startup Scripts

This document explains the various startup scripts available for running the CampaignHub application.

## Standard Scripts

### `start.sh` - Standard Startup
The main script for starting the application in a Unix environment.
```bash
./start.sh
```
- Loads environment variables from .env
- Automatically detects development/production mode
- Uses tsx for TypeScript execution in development mode

### `start-env.sh` - Enhanced Environment Variables
Similar to start.sh but with enhanced environment variable handling.
```bash
./start-env.sh
```
- Provides detailed output about loaded environment variables
- Shows debugging information for key configuration settings
- Good for troubleshooting environment variable issues

### `simple-start.sh` - Production Simplified
A simplified script focused on production deployment.
```bash
./simple-start.sh
```
- Builds the application if necessary
- Runs in production mode
- Minimal complexity for reliable deployment

## Compatibility Scripts

### `start-stable.sh` - Maximum Compatibility (Recommended)
The most reliable script that works across different Node.js versions and environments.
```bash
./start-stable.sh
```
- Adds compatibility polyfills for Node.js
- Handles the import.meta.dirname issue in vite.config.ts
- Should resolve most startup issues on different systems

### `start-basic.sh` - Ultra-Simple Fallback
A simplified script with minimal dependencies.
```bash
./start-basic.sh
```
- Uses basic Node.js functionality
- Minimal external dependencies
- Useful for troubleshooting or minimal environments

### `start-with-node-version-check.sh` - Version Compatibility
Checks Node.js compatibility before starting.
```bash
./start-with-node-version-check.sh
```
- Verifies Node.js version compatibility
- Adds compatibility layers if needed
- Good for identifying version-specific issues

## Windows Scripts

### `start-windows.bat` - Windows Compatibility
For Windows environments:
```
start-windows.bat
```
- Equivalent to start.sh but for Windows
- Handles Windows-specific path and environment issues

## Troubleshooting

If you encounter startup issues:

1. Try `start-stable.sh` first, which has the most robust error handling
2. Check that .env file exists and has correct format (no spaces around equals sign)
3. Verify Node.js version is v18.0.0 or higher for best compatibility
4. Ensure PostgreSQL database is running and accessible
5. Check that all required environment variables are set (DATABASE_URL, etc.)

For persistent issues:
- Check the logs for specific error messages
- Try the compatibility scripts (`start-stable.sh` or `start-basic.sh`)
- Ensure all dependencies are installed with `npm install`
- Verify file permissions (scripts should be executable)