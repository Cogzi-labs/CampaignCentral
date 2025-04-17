@echo off
echo === Building CampaignHub for production (Windows) ===

:: Set production environment
set NODE_ENV=production

:: Install dependencies if needed
echo Ensuring all dependencies are installed...
call npm install

:: Clean previous build
echo Cleaning previous build...
if exist dist rmdir /s /q dist

:: Build the application
echo Building for production...
call npm run build

:: Check if build was successful
if exist "dist\client" if exist "dist\index.js" (
  echo Build successful! The application is ready for deployment.
  echo Run 'start-windows.bat' or 'node dist\index.js' to start the production server.
) else (
  echo Build failed. Please check the error messages above.
  exit /b 1
)