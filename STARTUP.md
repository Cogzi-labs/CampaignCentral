# Campaign Central - Startup Guide

## Quick Start

### For Linux/Mac:
```bash
# Make sure the script is executable
chmod +x start.sh

# Run the application
./start.sh
```

### For Windows:
```batch
# Run the application in development mode
start-windows.bat
```

## Startup Script Options

The application includes several startup scripts for different environments:

1. **`start.sh`** - The main startup script with comprehensive error checking and environment handling
2. **`start-prod.sh`** - Production-optimized startup script
3. **`simple-start.sh`** - Minimal dependency script for environments with limited features
4. **`start-windows.bat`** - Windows-compatible startup script (for development only)

Choose the script that best fits your environment.

## Environment Variables

The application requires certain environment variables to function properly. These can be set in a `.env` file in the root directory.

### Required Environment Variables

1. **Database Configuration**:
   - `DATABASE_URL`: The PostgreSQL connection string in the format `postgresql://username:password@hostname:port/database`
   - Alternatively, you can set individual variables:
     - `PGHOST`: PostgreSQL host
     - `PGUSER`: PostgreSQL username
     - `PGPASSWORD`: PostgreSQL password
     - `PGDATABASE`: PostgreSQL database name
     - `PGPORT`: PostgreSQL port (defaults to 5432)
   
   Note: The application will automatically construct the DATABASE_URL from
   individual PostgreSQL environment variables if they are available but
   DATABASE_URL is not set.

2. **Email Configuration (AWS SES)**:
   - `SES_AUTH`: Authentication type (default: "login")
   - `SES_HOST`: SES SMTP host
   - `SES_PORT`: SES SMTP port
   - `SES_USERNAME`: SES SMTP username
   - `SES_PASSWORD`: SES SMTP password
   - `SES_SENDER`: Email sender address
   - `SES_REGION`: AWS region for SES

3. **Session Configuration**:
   - `SESSION_SECRET`: Secret for session cookie encryption (auto-generated if not provided)

4. **Campaign API Configuration**:
   - `CAMPAIGN_API_KEY`: API key for the campaign service

### Optional Environment Variables

- `PORT`: The port to run the server on (default: 5000)
- `NODE_ENV`: Set to "production" for production mode, or "development" for development mode

## Example .env File

See `.env.example` for a template of environment variables.

## Running in Production

For production, build the application first:

```bash
npm run build
```

Then run the start script, which will detect the build and run in production mode:

```bash
./start.sh
```

## Troubleshooting

1. **Database Connection Issues**:
   - Ensure your PostgreSQL server is running
   - Verify the database connection details are correct
   - Check that the database exists and the user has the correct permissions

2. **Permission Denied Error**:
   - Ensure the start scripts are executable: `chmod +x start.sh`

3. **Email Sending Issues**:
   - Verify your AWS SES credentials
   - Ensure the sender email is verified in AWS SES
   - Check for SES sending limits in your AWS account

4. **Vite Configuration Issues**:
   - If you encounter issues with `import.meta.dirname` in the Vite configuration:
     - You can use the alternative configuration in `vite.config.alternative.ts`
     - To use it: `cp vite.config.alternative.ts vite.config.ts`
     - This alternative uses `fileURLToPath` which is more compatible across Node.js versions