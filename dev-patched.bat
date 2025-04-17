@echo off
REM Enhanced dev script with path resolution patches for Windows
REM This script runs the application in development mode with our path resolution patch

echo Starting development server with path resolution patch...

REM Fix path resolution for ubuntu client
if not exist "%USERPROFILE%\ubuntu" mkdir "%USERPROFILE%\ubuntu"
mklink /D "%USERPROFILE%\ubuntu\client" "%CD%\client"
echo Created compatibility path links

REM Run the application with our runtime patch
echo Running with Node.js runtime patch...
set NODE_ENV=development
set NODE_OPTIONS=--require ./vite-runtime-patch.cjs
npx tsx server\index.ts