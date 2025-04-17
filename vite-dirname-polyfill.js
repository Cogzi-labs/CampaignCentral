/**
 * Vite dirname polyfill - Adds import.meta.dirname support for older Node.js versions
 * 
 * This script provides a workaround for the error:
 * TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined
 *
 * Usage: 
 *   NODE_OPTIONS="--require ./vite-dirname-polyfill.js" your-command
 */

const { dirname } = require('path');
const { fileURLToPath } = require('url');

// Add dirname property to import.meta if it doesn't exist
if (typeof globalThis.import === 'function' && 
    typeof globalThis.import.meta === 'object' && 
    !globalThis.import.meta.hasOwnProperty('dirname')) {
  
  Object.defineProperty(globalThis.import.meta, 'dirname', {
    get() {
      // Use fileURLToPath to convert import.meta.url to a path
      if (globalThis.import.meta.url) {
        return dirname(fileURLToPath(globalThis.import.meta.url));
      }
      // Fallback to current working directory
      return process.cwd();
    }
  });
  
  console.log('Added import.meta.dirname polyfill for Node.js compatibility');
}