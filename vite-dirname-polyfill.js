/**
 * Vite dirname polyfill - For maximum compatibility with CampaignHub
 * 
 * This script provides a specific workaround for vite.config.ts using import.meta.dirname
 * which causes: TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
 *
 * Usage: 
 *   NODE_OPTIONS="--require ./vite-dirname-polyfill.js" your-command
 */

const path = require('path');
const fs = require('fs');

// Direct patch for import.meta
if (typeof globalThis !== 'undefined') {
  // Create import.meta if it doesn't exist
  if (!globalThis.import) {
    globalThis.import = {};
  }
  
  if (!globalThis.import.meta) {
    globalThis.import.meta = {};
  }
  
  // Hard-code the dirname directly to the project root
  // This is the most reliable way to handle this specific vite.config.ts issue
  const projectRoot = process.cwd();
  
  globalThis.import.meta.dirname = projectRoot;
  
  console.log(`[Polyfill] Patched import.meta.dirname = "${projectRoot}"`);
  
  // Also patch any early access to module.meta
  if (typeof module !== 'undefined') {
    if (!module.meta) {
      module.meta = {};
    }
    module.meta.dirname = projectRoot;
  }
}

// Extra safety for ESM module handling
try {
  // This might fail in some environments, which is ok
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  
  // Add a special hook just for vite.config.ts
  Module.prototype.require = function(id) {
    const result = originalRequire.apply(this, arguments);
    
    // Check if we're loading vite.config.ts/js
    if (id.includes('vite.config')) {
      console.log(`[Polyfill] Enhanced module: ${id}`);
      
      // Ensure imported module can access the dirname
      if (result && typeof result === 'object' && !result.meta) {
        result.meta = { dirname: process.cwd() };
      }
    }
    
    return result;
  };
} catch (err) {
  // Ignore errors in this experimental section
}