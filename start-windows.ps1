# CampaignHub Windows PowerShell Startup Script
Write-Host "=== Starting CampaignHub on Windows using PowerShell ===" -ForegroundColor Green

# Function to load environment variables from .env file
function Load-EnvFile {
    param (
        [string]$envFile = ".env"
    )
    
    if (Test-Path $envFile) {
        Write-Host "Loading environment variables from $envFile..." -ForegroundColor Cyan
        
        # Read the .env file line by line
        Get-Content $envFile | ForEach-Object {
            # Skip comments and empty lines
            if ($_ -notmatch "^\s*#" -and $_ -match "=") {
                $line = $_.Trim()
                $key, $value = $line -split "=", 2
                
                # Set as environment variable
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "  Set: $key" -ForegroundColor Gray
            }
        }
        
        Write-Host "Environment variables loaded successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: .env file not found at: $envFile" -ForegroundColor Red
        Write-Host "Application may not function correctly without environment variables." -ForegroundColor Yellow
    }
}

# Load environment variables
Load-EnvFile

# Debug output for key environment variables
Write-Host "`nEnvironment Variables Check:" -ForegroundColor Yellow
Write-Host "DATABASE_URL exists: $(if ([string]::IsNullOrEmpty($env:DATABASE_URL)) { 'No' } else { 'Yes' })"
Write-Host "SES_REGION: $env:SES_REGION"
Write-Host "SES_SENDER: $env:SES_SENDER"
Write-Host "SES_USERNAME: $env:SES_USERNAME"
Write-Host "SES_PASSWORD exists: $(if ([string]::IsNullOrEmpty($env:SES_PASSWORD)) { 'No' } else { 'Yes' })"
Write-Host "PGDATABASE: $env:PGDATABASE"
Write-Host "PGHOST: $env:PGHOST"

# Check if we have a built version
if (Test-Path "dist/index.js") {
    Write-Host "`nProduction build found. Starting production server..." -ForegroundColor Green
    # Set NODE_ENV to production
    $env:NODE_ENV = "production"
    # Start the server
    node dist/index.js
} else {
    Write-Host "`nDevelopment mode. Starting development server..." -ForegroundColor Yellow
    # Set NODE_ENV to development
    $env:NODE_ENV = "development"
    # Start the server using tsx
    npx tsx server/index.ts
}