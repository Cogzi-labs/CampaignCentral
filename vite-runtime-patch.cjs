/**
 * Runtime patch for Vite server path resolution
 * This script is designed to be required before any other code executes
 * Using CommonJS format for compatibility
 */

// Create a namespace mock for ESM path handling
global.__dirname = process.cwd();
global.__filename = `${process.cwd()}/dummy.js`;

// Store references to required modules
const fs = require('fs');
const path = require('path');

console.log('[PATCH] Applying runtime patch for path resolution...');

// Create a robust path resolution system using the current working directory
global.__vite_path_base = process.cwd();
global.__vite_get_path = function(...segments) {
  try {
    return path.resolve(global.__vite_path_base, ...segments.filter(Boolean));
  } catch (error) {
    console.error('[PATCH] Path resolution error:', error.message);
    return process.cwd();
  }
};

// Monitor and patch any path resolution calls
const originalResolve = path.resolve;
path.resolve = function() {
  // Filter undefined arguments
  const validArgs = Array.from(arguments).filter(arg => arg !== undefined);
  
  // If we end up with no valid arguments, use CWD
  if (validArgs.length === 0) {
    return process.cwd();
  }
  
  try {
    return originalResolve.apply(this, validArgs);
  } catch (error) {
    console.error('[PATCH] Path resolution fallback due to error:', error.message);
    return process.cwd();
  }
};

console.log('[PATCH] Runtime path handling patched successfully');

// Export the patch functions for other modules to use
module.exports = {
  getBasePath: () => global.__vite_path_base,
  resolvePath: (...segments) => global.__vite_get_path(...segments)
};