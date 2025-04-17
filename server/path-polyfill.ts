/**
 * Path polyfill for ESM import.meta.dirname
 * Works around issues with import.meta.dirname being undefined in some environments
 */

import path from 'path';
import { fileURLToPath } from 'url';

// Patch import.meta if needed
if (typeof import.meta === 'object' && import.meta !== null) {
  if (!('dirname' in import.meta)) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    Object.defineProperty(import.meta, 'dirname', {
      get: () => __dirname,
    });
    
    console.log('Applied path polyfill for import.meta.dirname');
  }
}