# CampaignHub Startup Scripts

This document explains the various startup scripts available for running the CampaignHub application.

## Quick Start

For the most reliable experience:
- On Unix/Linux/Mac: `./start.js` or `node start.js`
- On Windows: `start-windows.bat` or `start-windows.ps1`

## Standard Scripts

### `start.js` - Universal Node.js Starter (Recommended)
The most reliable and cross-platform way to start the application.
```bash
node start.js
```
- Works on all platforms (Windows, Mac, Linux)
- No bash/shell dependencies
- Automatically detects development/production mode
- Handles environment variable loading

### `start.sh` - Standard Unix Startup
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

### `start-stable.sh` - Maximum Compatibility
A reliable script that works across different Node.js versions and environments.
```bash
./start-stable.sh
```
- Adds compatibility options for Node.js
- Attempts to handle the import.meta.dirname issue in vite.config.ts
- May help resolve startup issues on different systems

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

### `start-windows.bat` - Windows Command Prompt
For Windows command prompt environments:
```
start-windows.bat
```
- Equivalent to start.sh but for Windows Command Prompt
- Handles Windows-specific path and environment issues

### `start-windows.ps1` - Windows PowerShell
For Windows PowerShell environments:
```powershell
.\start-windows.ps1
```
- Enhanced version for Windows PowerShell
- Better environment variable handling
- Improved error messages with colors

## Build Scripts

### `build.sh` - Unix Build Script
Builds the application for production on Unix systems:
```bash
./build.sh
```
- Creates optimized production build
- Verifies build success
- Cleans previous builds

### `build-windows.bat` - Windows Build Script
Builds the application for production on Windows:
```
build-windows.bat
```
- Creates optimized production build for Windows
- Verifies build success
- Cleans previous builds

## Troubleshooting

If you encounter startup issues:

1. Try `node start.js` first, as it's the most universally compatible option
2. Check that .env file exists and has correct format (no spaces around equals sign)
3. Verify Node.js version is v18.0.0 or higher for best compatibility
4. Ensure PostgreSQL database is running and accessible
5. Check that all required environment variables are set (DATABASE_URL, etc.)

For persistent issues:
- Check the logs for specific error messages
- Try the compatibility scripts (`start-basic.sh` or `start-stable.sh`)
- Ensure all dependencies are installed with `npm install`
- Verify file permissions on Unix (scripts should be executable with `chmod +x script.sh`)