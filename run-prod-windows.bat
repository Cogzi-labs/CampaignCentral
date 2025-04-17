@echo off
echo === Running CampaignHub in production mode (Windows) ===

:: Check if we have a production build
if not exist "dist\client" (
  echo Error: Production build not found. Please run 'build-windows.bat' first.
  exit /b 1
)

if not exist "dist\index.js" (
  echo Error: Production build not found. Please run 'build-windows.bat' first.
  exit /b 1
)

:: Set environment to production
set NODE_ENV=production

:: Run the application
echo Starting production server...
node dist\index.js