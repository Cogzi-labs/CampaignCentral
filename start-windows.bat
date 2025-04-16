@echo off
echo === Starting CampaignHub on Windows ===

:: Load environment variables from .env file
echo Loading environment variables from .env file...
if exist .env (
    for /f "tokens=*" %%a in (.env) do (
        echo Processing: %%a
        :: Skip comments and empty lines
        echo %%a | findstr /b "#" >nul
        if errorlevel 1 (
            echo %%a | findstr /v "=" >nul
            if errorlevel 1 (
                :: Set the environment variable
                set %%a
            )
        )
    )
    echo Environment variables loaded successfully
) else (
    echo ERROR: .env file not found. Application may not function correctly.
)

:: Debug output for key environment variables
echo Environment variables loaded:
echo DATABASE_URL exists: %DATABASE_URL:~0,1% 
echo SES_REGION: %SES_REGION%
echo SES_SENDER: %SES_SENDER%
echo SES_USERNAME: %SES_USERNAME%
echo SES_PASSWORD exists: %SES_PASSWORD:~0,1%
echo PGDATABASE: %PGDATABASE%
echo PGHOST: %PGHOST%

:: Check if we have a built version
if exist dist\index.js (
    echo Production build found. Starting production server...
    :: Set NODE_ENV to production
    set NODE_ENV=production
    :: Start the server
    node dist\index.js
) else (
    echo Development mode. Starting development server...
    :: Set NODE_ENV to development
    set NODE_ENV=development
    :: Start the server using tsx
    npx tsx server/index.ts
)