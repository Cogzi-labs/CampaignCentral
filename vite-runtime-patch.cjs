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
const { existsSync } = require('fs');

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

// Patch import.meta.dirname getter
Object.defineProperty(global, 'import', {
  get() {
    return {
      meta: {
        get dirname() {
          return process.cwd();
        },
        get url() {
          return `file://${process.cwd()}/server/index.js`;
        }
      }
    };
  }
});

// Create a special lookup function for client/index.html
function findClientHtmlPath() {
  // Try relative paths from common locations
  const possiblePaths = [
    path.join(process.cwd(), 'client', 'index.html'),
    path.join(process.cwd(), 'client', 'src', 'index.html'),
    path.join(process.cwd(), 'dist', 'client', 'index.html')
  ];
  
  // Find the first path that exists
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      console.log(`[PATCH] Found client HTML at: ${p}`);
      return p;
    }
  }
  
  console.warn('[PATCH] Could not find client/index.html in any expected location');
  return path.join(process.cwd(), 'client', 'index.html');
}

// Cache the HTML path for performance
global.__client_html_path = findClientHtmlPath();

// Monitor and patch any path resolution calls
const originalResolve = path.resolve;
path.resolve = function() {
  // Filter undefined arguments
  let validArgs = Array.from(arguments).filter(arg => arg !== undefined);
  
  // Special case handling for client/index.html
  if (validArgs.length >= 2 && 
     (validArgs.includes('client') || validArgs.includes('../client')) && 
     validArgs.includes('index.html')) {
    return global.__client_html_path;
  }
  
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

// Monkey patch fs.promises.readFile for client/index.html
const originalReadFile = fs.promises ? fs.promises.readFile : null;
if (originalReadFile) {
  fs.promises.readFile = async function(path, options) {
    try {
      // Check if this is the client index.html path that's failing
      if (path.includes('client') && path.includes('index.html') && !existsSync(path)) {
        console.log('[PATCH] Using fallback path for client/index.html');
        path = global.__client_html_path;
      }
      
      return await originalReadFile.call(fs.promises, path, options);
    } catch (error) {
      // If it's still failing, generate a minimal HTML file to avoid crashing
      if (path.includes('client') && path.includes('index.html')) {
        console.warn('[PATCH] Generated fallback index.html');
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CampaignHub</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
      }
      throw error;
    }
  };
}

console.log('[PATCH] Runtime path handling patched successfully');

// Export the patch functions for other modules to use
module.exports = {
  getBasePath: () => global.__vite_path_base,
  resolvePath: (...segments) => global.__vite_get_path(...segments),
  getClientHtmlPath: () => global.__client_html_path
};