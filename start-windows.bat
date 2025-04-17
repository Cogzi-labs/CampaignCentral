@echo off
REM Standard startup script for CampaignHub

echo Starting CampaignHub...

REM Load environment variables
if exist .env (
  echo Loading environment variables from .env file...
  for /F "tokens=*" %%A in (.env) do (
    set %%A
  )
  echo Environment variables loaded.
) else (
  echo No .env file found. Using environment variables if available.
)

REM Check for DATABASE_URL
if not defined DATABASE_URL (
  if defined PGHOST (
    if defined PGUSER (
      if defined PGPASSWORD (
        if defined PGDATABASE (
          if not defined PGPORT set PGPORT=5432
          set DATABASE_URL=postgresql://%PGUSER%:%PGPASSWORD%@%PGHOST%:%PGPORT%/%PGDATABASE%
          echo Constructed DATABASE_URL from PostgreSQL environment variables.
        )
      )
    )
  )
)

REM Verify critical variables
if not defined DATABASE_URL (
  echo ERROR: DATABASE_URL is not set.
  echo Please make sure your .env file or environment contains:
  echo DATABASE_URL=postgresql://username:password@hostname:port/database
  echo Or set individual variables: PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
  exit /b 1
)

REM Generate random SESSION_SECRET if not provided
if not defined SESSION_SECRET (
  set SESSION_SECRET=randomsecret%RANDOM%%RANDOM%%RANDOM%
  echo Generated SESSION_SECRET for this session.
)

REM Check if we should run production or development mode
if exist "dist\client" if exist "dist\index.js" (
  echo Starting in PRODUCTION mode...
  set NODE_ENV=production
  node dist\index.js
) else (
  echo Starting in DEVELOPMENT mode...
  npm run dev
)