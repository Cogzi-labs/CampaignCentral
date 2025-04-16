@echo off
echo === CampaignHub Windows Build Script ===
echo This script builds the application for Windows environments

:: Clean up any previous builds
echo Cleaning previous builds...
if exist dist rmdir /s /q dist
mkdir dist

:: Make sure we have the required build tools
echo Installing required build dependencies...
call npm install --no-save vite@latest esbuild@latest @vitejs/plugin-react@latest typescript@latest

:: Create a minimal temporary vite config file
echo Creating temporary Vite configuration...
echo import { defineConfig } from 'vite'; > temp-vite.config.js
echo import react from '@vitejs/plugin-react'; >> temp-vite.config.js
echo import { resolve } from 'path'; >> temp-vite.config.js
echo. >> temp-vite.config.js
echo export default defineConfig({ >> temp-vite.config.js
echo   plugins: [react()], >> temp-vite.config.js
echo   build: { >> temp-vite.config.js
echo     outDir: 'dist/client' >> temp-vite.config.js
echo   }, >> temp-vite.config.js
echo   resolve: { >> temp-vite.config.js
echo     alias: { >> temp-vite.config.js
echo       '@': resolve(__dirname, './client/src'), >> temp-vite.config.js
echo       '@shared': resolve(__dirname, './shared'), >> temp-vite.config.js
echo       '@server': resolve(__dirname, './server'), >> temp-vite.config.js
echo     } >> temp-vite.config.js
echo   } >> temp-vite.config.js
echo }); >> temp-vite.config.js

:: Build the client
echo Building client...
set NODE_ENV=production
call npx vite build --config temp-vite.config.js client

:: Build the server
echo Building server...
call npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

:: Clean up temporary files
echo Cleaning up temporary files...
del temp-vite.config.js

echo Build completed successfully!
echo You can now run the application using node dist/index.js