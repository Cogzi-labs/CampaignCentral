/**
 * Simple path utilities for resolving client paths
 */
import path from 'path';

/**
 * Get the path to the client directory
 * @returns {string} - Absolute path to the client directory
 */
export function getClientDir(): string {
  return path.resolve(process.cwd(), 'client');
}

/**
 * Gets the path to the client's index.html file
 * @returns {string} - Absolute path to the client's index.html file
 */
export function getClientIndexPath(): string {
  return path.resolve(getClientDir(), 'index.html');
}

/**
 * Gets the path to the client's build directory
 * @returns {string} - Absolute path to the client's build directory
 */
export function getClientBuildDir(): string {
  return path.resolve(process.cwd(), 'public');
}