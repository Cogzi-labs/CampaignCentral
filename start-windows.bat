@echo off
REM Simple startup script for CampaignHub (Windows development)

REM Load environment variables from .env file
if exist ".env" (
  echo Loading environment variables from .env file...
  for /F "tokens=*" %%A in (.env) do (
    set %%A
  )
  
  REM Verify critical variables
  if not defined DATABASE_URL (
    echo ERROR: DATABASE_URL is not set or empty in your .env file.
    echo Please make sure your .env file contains: DATABASE_URL=postgresql://username:password@hostname:port/database
    exit /b 1
  )
  
  echo Environment variables loaded successfully.
) else (
  echo ERROR: .env file not found.
  echo Please create a .env file with the required environment variables.
  exit /b 1
)

REM Check if we should run production or development mode
if exist "dist\client" if exist "dist\index.js" (
  echo Starting in PRODUCTION mode...
  set NODE_ENV=production
  node dist\index.js
) else (
  echo Starting in DEVELOPMENT mode...
  set NODE_ENV=development
  npx tsx server\index.ts
)