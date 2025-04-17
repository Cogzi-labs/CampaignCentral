@echo off
REM Simple startup script for CampaignHub (Windows development)

REM Load environment variables from .env file
if exist ".env" (
  echo Loading environment variables from .env file...
  for /F "tokens=*" %%A in (.env) do (
    set %%A
  )
  
  echo Environment variables loaded successfully.
) else (
  echo WARNING: .env file not found.
  echo Using environment variables if available.
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
  set "chars=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  set SESSION_SECRET=
  for /L %%i in (1,1,32) do call :append_random_char
  echo Generated random SESSION_SECRET for this session.
)

REM Check if we should run production or development mode
if exist "dist\client" if exist "dist\index.js" (
  echo Starting in PRODUCTION mode...
  set NODE_ENV=production
  node -r ./load-env.js dist\index.js
) else (
  echo Starting in DEVELOPMENT mode...
  set NODE_ENV=development
  npx tsx server\index.ts
)
exit /b 0

:append_random_char
  set /a rand=!random! %% 62
  for /f %%j in ("!rand!") do set SESSION_SECRET=!SESSION_SECRET!!chars:~%%j,1!
  exit /b 0