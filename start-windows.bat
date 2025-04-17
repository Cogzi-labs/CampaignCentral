@echo off
echo === CampaignHub Startup (Windows) ===

:: Check if we have a production build
if exist "dist\index.js" if exist "dist\client" (
  echo Production build found. Running in PRODUCTION mode...
  set NODE_ENV=production
  node dist\index.js
) else (
  echo No production build found. Running in DEVELOPMENT mode...
  
  :: Install dependencies if needed
  echo Installing dependencies...
  call npm install --no-save tsx
  
  :: Run in development mode
  echo Starting in development mode...
  set NODE_ENV=development
  set NODE_OPTIONS=--no-warnings
  npx tsx server\index.ts
)