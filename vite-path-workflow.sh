#!/bin/bash

# Make sure all our scripts are executable
chmod +x start-patched.sh

# Start the application using our patched version
NODE_OPTIONS="--require ./path-patched.js" npm run dev