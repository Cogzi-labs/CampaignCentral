/**
 * Runtime patch for vite.ts to use INSTALL_DIR environment variable
 * This applies a monkey patch to the import.meta object for path resolution
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Determine installation directory
const INSTALL_DIR = process.env.INSTALL_DIR || process.cwd();
console.log(`[vite-runtime-patch] Setting installation directory to: ${INSTALL_DIR}`);

// Monkey patch import.meta.dirname to use INSTALL_DIR when used in vite.ts
const originalLoader = require.extensions['.ts'];

require.extensions['.ts'] = function(module, filename) {
  // Check if this is vite.ts being loaded
  if (filename.endsWith('server/vite.ts')) {
    console.log(`[vite-runtime-patch] Patching ${filename}`);
    
    // Read the original file content
    const content = fs.readFileSync(filename, 'utf8');
    
    // Define INSTALL_DIR in the module scope
    const patchedContent = `
      // Injected by vite-runtime-patch.cjs
      const __INSTALL_DIR = ${JSON.stringify(INSTALL_DIR)};
      Object.defineProperty(import.meta, 'dirname', { 
        get: function() { return __INSTALL_DIR; }
      });
      
      ${content}
    `;
    
    // Load the patched content
    module._compile(patchedContent, filename);
    return;
  }
  
  // For other .ts files, use the original loader
  return originalLoader(module, filename);
};

console.log('[vite-runtime-patch] Patching complete');