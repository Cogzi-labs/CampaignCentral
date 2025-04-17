@echo off
REM Enhanced startup script for CampaignHub (Windows)
REM Specifically addresses path resolution issues

echo Starting CampaignHub with path resolution fixes...

REM Load environment variables from .env file
if exist ".env" (
  echo Loading environment variables from .env file...
  for /F "tokens=*" %%A in (.env) do (
    set %%A
  )
  
  echo Environment variables loaded.
) else (
  echo No .env file found. Using environment variables if available.
)

REM Check DATABASE_URL or construct it from PostgreSQL variables
if not defined DATABASE_URL (
  if defined PGHOST if defined PGUSER if defined PGPASSWORD if defined PGDATABASE (
    if not defined PGPORT (
      set PGPORT=5432
    )
    
    set DATABASE_URL=postgresql://%PGUSER%:%PGPASSWORD%@%PGHOST%:%PGPORT%/%PGDATABASE%
    echo Constructed DATABASE_URL from PostgreSQL environment variables.
  ) else (
    echo ERROR: DATABASE_URL not set and PostgreSQL variables incomplete.
    echo Please set DATABASE_URL or all of: PGHOST, PGUSER, PGPASSWORD, PGDATABASE
    exit /b 1
  )
)

REM Generate SESSION_SECRET if not set
if not defined SESSION_SECRET (
  REM Create a simple random string (not cryptographically secure but ok for dev)
  set SESSION_SECRET=randomsecret%RANDOM%%RANDOM%%RANDOM%
  echo Generated SESSION_SECRET for this session.
)

REM Check if we should run production or development mode
if exist "dist\client" if exist "dist\index.js" (
  echo Starting in PRODUCTION mode with path resolution patch...
  set NODE_ENV=production
  node -r ./vite-runtime-patch.cjs dist\index.js
) else (
  echo Starting in DEVELOPMENT mode with path resolution patch...
  set NODE_ENV=development
  set NODE_OPTIONS=--require ./vite-runtime-patch.cjs
  npx tsx server\index.ts
)