/**
 * This script modifies the Node.js behavior to intercept imports of server/vite.ts
 * and replace any uses of import.meta.dirname with the INSTALL_DIR from environment.
 * 
 * Usage: NODE_OPTIONS="--require ./path-patched.js" npm run dev
 */

// Load dotenv first to ensure environment variables are available
require('dotenv').config();

const Module = require('module');
const fs = require('fs');
const path = require('path');

// Get the installation directory from environment or use current directory
const INSTALL_DIR = process.env.INSTALL_DIR || process.cwd();
console.log(`[path-patched] Setting INSTALL_DIR to: ${INSTALL_DIR}`);

// Store the original _compile method
const originalCompile = Module.prototype._compile;

// Override the _compile method to patch the content of vite.ts
Module.prototype._compile = function(content, filename) {
  // Only patch vite.ts file
  if (filename.endsWith('server/vite.ts')) {
    console.log(`[path-patched] Patching file: ${filename}`);
    
    // Replace any occurrences of import.meta.dirname with INSTALL_DIR
    // This approach preserves the rest of the file exactly as it is
    const patchedContent = content.replace(
      /import\.meta\.dirname/g, 
      `"${INSTALL_DIR.replace(/\\/g, '\\\\')}"`
    );
    
    return originalCompile.call(this, patchedContent, filename);
  }
  
  // For all other files, use the original _compile method
  return originalCompile.call(this, content, filename);
};

console.log('[path-patched] Runtime patching enabled');