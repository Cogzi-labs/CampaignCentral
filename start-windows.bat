@echo off
REM Simple startup script for CampaignHub (Windows development)

REM Check if we should run production or development mode
if exist "dist\client" if exist "dist\index.js" (
  REM Production mode
  set NODE_ENV=production
  node dist\index.js
) else (
  REM Development mode
  set NODE_ENV=development
  npx tsx server\index.ts
)