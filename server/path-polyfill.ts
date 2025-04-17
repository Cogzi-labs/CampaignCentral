/**
 * Path polyfill for ESM import.meta.dirname
 * Works around issues with import.meta.dirname being undefined in some environments
 */

import path from 'path';
import { fileURLToPath } from 'url';

// Patch global import.meta if needed
if (typeof globalThis !== 'undefined' && typeof import.meta === 'object' && import.meta !== null) {
  if (!('dirname' in import.meta)) {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // Define it on the import.meta object
      Object.defineProperty(import.meta, 'dirname', {
        get: () => __dirname,
      });
      
      // Also store in global namespace for other modules to access
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__pathPolyfillDirname = __dirname;
      }
      
      console.log('Applied path polyfill for import.meta.dirname');
    } catch (error) {
      console.error('Failed to apply path polyfill:', error);
    }
  }
}

// Helper function to get path resolution even if the polyfill fails
export function getServerRootDir() {
  try {
    if ('dirname' in import.meta) {
      return import.meta.dirname;
    }
    
    // Fallback to using the current file and navigating to server root
    const __filename = fileURLToPath(import.meta.url);
    return path.dirname(__filename);
  } catch (error) {
    // Final fallback - use current working directory
    console.warn('Using CWD as fallback for path resolution:', process.cwd());
    return process.cwd();
  }
}