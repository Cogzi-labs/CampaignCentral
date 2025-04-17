# CampaignHub Startup PowerShell Script for Windows

Write-Host "=== CampaignHub Startup (Windows PowerShell) ===" -ForegroundColor Green

# Load environment variables from .env file if it exists
if (Test-Path ".env") {
    Write-Host "Loading environment variables from .env file..." -ForegroundColor Cyan
    Get-Content ".env" | ForEach-Object {
        if (-not $_.StartsWith("#") -and $_.Length -gt 0) {
            $name, $value = $_.Split('=', 2)
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "  Loaded: $name" -ForegroundColor DarkGray
        }
    }
} else {
    Write-Host "Warning: .env file not found" -ForegroundColor Yellow
}

# Check if we have a production build
if ((Test-Path "dist\index.js") -and (Test-Path "dist\client")) {
    Write-Host "Production build found. Running in PRODUCTION mode..." -ForegroundColor Green
    $env:NODE_ENV = "production"
    node dist\index.js
} else {
    Write-Host "No production build found. Running in DEVELOPMENT mode..." -ForegroundColor Yellow
    
    # Install dependencies if needed
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install --no-save tsx
    
    # Run in development mode
    Write-Host "Starting in development mode..." -ForegroundColor Green
    $env:NODE_ENV = "development"
    $env:NODE_OPTIONS = "--no-warnings"
    npx tsx server\index.ts
}