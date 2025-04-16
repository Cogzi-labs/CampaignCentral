#!/bin/bash

# build.sh - A direct build script that avoids Vite config loading issues
# This script uses a simpler approach that doesn't rely on loading vite.config.ts

echo "=== CampaignHub Production Build Script ==="
echo "This script builds the application without relying on vite.config.ts"

# Clean up any previous builds
echo "Cleaning previous builds..."
rm -rf dist

# Make sure we have the required build tools
echo "Installing required build dependencies..."
npm install --no-save vite@latest esbuild@latest @vitejs/plugin-react@latest typescript@latest

# Create a minimal temporary vite config file
echo "Creating temporary Vite configuration..."
cat > temp-vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cartographerPlugin } from '@replit/vite-plugin-cartographer';
import { replitThemeJsonPlugin } from '@replit/vite-plugin-shadcn-theme-json';
import { runtimeErrorModalPlugin } from '@replit/vite-plugin-runtime-error-modal';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    cartographerPlugin(),
    replitThemeJsonPlugin(),
    runtimeErrorModalPlugin(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
      '@assets': resolve(__dirname, './attached_assets'),
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
EOF

# Build the client using the temporary config
echo "Building client with temporary Vite config..."
NODE_ENV=production ./node_modules/.bin/vite build --config temp-vite.config.js

# Build the server
echo "Building server with esbuild..."
NODE_ENV=production ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Clean up the temporary configuration
echo "Cleaning up temporary files..."
rm temp-vite.config.js

# Verify the build
if [ -d "dist/client" ] && [ -f "dist/index.js" ]; then
  echo "✓ Build completed successfully!"
  echo "- Client files in dist/client/"
  echo "- Server file at dist/index.js"
  echo ""
  echo "To start the application in production mode:"
  echo "NODE_ENV=production node dist/index.js"
else
  echo "✗ Build failed. Check the errors above."
fi