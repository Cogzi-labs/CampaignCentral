@echo off
REM Apply all database migrations
REM This script applies all Drizzle migrations and ensures the session table exists

echo Applying database migrations
echo =========================

REM Step 1: Run Drizzle migrations (standard tables)
echo.
echo Step 1/2: Running Drizzle migrations
call npx drizzle-kit push

if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to apply Drizzle migrations.
  exit /b 1
)

echo Drizzle migrations applied successfully.

REM Step 2: Ensure session table exists
echo.
echo Step 2/2: Creating session table if it doesn't exist
node scripts/create_session_table.js

if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to create session table.
  exit /b 1
)

echo Session table creation attempted.

REM Done!
echo.
echo All migrations completed successfully!
echo The application should now work with persistent sessions.