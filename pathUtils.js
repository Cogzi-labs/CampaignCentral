/**
 * Path utilities for consistent path resolution across the application
 * This should be used in place of import.meta.dirname for path resolution
 */

import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Get the dirname for the current module (replaces import.meta.dirname in ESM)
 * @param {string} importMetaUrl - The import.meta.url value
 * @returns {string} The directory path
 */
export function getDirname(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  return path.dirname(__filename);
}

/**
 * Get the path to the root of the project from any module
 * @param {string} importMetaUrl - The import.meta.url value
 * @returns {string} The absolute path to the project root
 */
export function getProjectRoot(importMetaUrl) {
  const currentDirname = getDirname(importMetaUrl);
  
  // Check if we're in the server directory or client directory
  if (path.basename(currentDirname) === 'server' || path.basename(currentDirname) === 'client') {
    return path.resolve(currentDirname, '..');
  }
  
  // Check if we're in src directories
  if (path.basename(path.dirname(currentDirname)) === 'src') {
    return path.resolve(currentDirname, '..', '..', '..');
  }
  
  // Default: assume we're already at the root
  return currentDirname;
}

/**
 * Get paths relative to the project root
 * @param {string} importMetaUrl - The import.meta.url value
 * @param {...string} pathSegments - Path segments to join with the root
 * @returns {string} The absolute path to the resolved location
 */
export function getPath(importMetaUrl, ...pathSegments) {
  return path.resolve(getProjectRoot(importMetaUrl), ...pathSegments);
}