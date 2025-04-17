/**
 * Path resolver module that provides consistent path resolution functions
 * for the entire application, especially for modules that need to work with filesystem paths.
 * 
 * This module exports functions that can be used to resolve paths relative to the
 * installation directory, which can be configured via the INSTALL_DIR environment variable.
 */

import path from 'path';
import { PATH_CONFIG } from './config';

/**
 * Resolves a path relative to the installation directory
 * @param {...string} pathSegments - Path segments to append to the installation directory
 * @returns {string} - Absolute path with the installation directory as the base
 */
export function resolveFromInstallDir(...pathSegments: string[]): string {
  return path.resolve(PATH_CONFIG.installDir, ...pathSegments);
}

/**
 * Gets the path to the client directory
 * @returns {string} - Absolute path to the client directory
 */
export function getClientDir(): string {
  return resolveFromInstallDir('client');
}

/**
 * Gets the path to the client's index.html file
 * @returns {string} - Absolute path to the client's index.html file
 */
export function getClientIndexPath(): string {
  return resolveFromInstallDir('client', 'index.html');
}

/**
 * Gets the path to the public directory where built assets are stored
 * @returns {string} - Absolute path to the public directory
 */
export function getPublicDir(): string {
  return resolveFromInstallDir('public');
}

/**
 * Gets the server directory path
 * @returns {string} - Absolute path to the server directory
 */
export function getServerDir(): string {
  return resolveFromInstallDir('server');
}

// Monkey patch global for import.meta.dirname if needed
// This is a direct replacement for import.meta.dirname when used for resolving paths
if (typeof global !== 'undefined') {
  (global as any).__pathResolver = {
    resolveFromInstallDir,
    getClientDir,
    getClientIndexPath,
    getPublicDir,
    getServerDir,
    installDir: PATH_CONFIG.installDir
  };
}

// If we can patch import.meta directly, do so with our resolver
if (typeof globalThis !== 'undefined' && typeof import.meta === 'object' && import.meta !== null) {
  try {
    const originalDirname = import.meta.dirname;
    
    // Only override if dirname doesn't already exist
    if (!originalDirname) {
      Object.defineProperty(import.meta, 'dirname', {
        get: () => PATH_CONFIG.installDir,
        configurable: true
      });
      console.log('Path resolver: Applied import.meta.dirname polyfill');
    }
  } catch (error) {
    console.error('Path resolver: Failed to apply import.meta.dirname polyfill', error);
  }
}

export default {
  resolveFromInstallDir,
  getClientDir,
  getClientIndexPath,
  getPublicDir,
  getServerDir,
  installDir: PATH_CONFIG.installDir
};