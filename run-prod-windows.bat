@echo off
echo === Starting CampaignHub in production mode on Windows ===

:: Load environment variables from .env file
echo Loading environment variables from .env file...
if exist .env (
    for /f "tokens=*" %%a in (.env) do (
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
    echo Environment variables loaded
) else (
    echo Warning: .env file not found
)

:: Check if we need to build
if not exist dist\client (
    echo Production build not found
    echo Running Windows build script...
    
    :: Run the Windows build script
    call build-windows.bat
    
    :: Check if build was successful
    if not exist dist\index.js (
        echo Build failed, cannot start production server
        echo Falling back to development mode...
        set NODE_ENV=development
        npx tsx server/index.ts
        exit /b 1
    )
)

:: Start the production server
echo Starting production server...
set NODE_ENV=production
node dist/index.js