# CampaignHub - Campaign Management System

A full-stack campaign management system with contact organization, de-duplication, and campaign launch capabilities.

## Features

- **User Authentication**: Secure login and registration
- **Contact Management**: Add, import, organize and manage contacts
- **Contact De-duplication**: Prevent duplicate contacts during import
- **Campaign Creation**: Create marketing campaigns with customizable templates
- **Campaign Launch**: Launch campaigns to targeted contact groups
- **Analytics Dashboard**: Track campaign performance metrics
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- **React**: Core library for building the user interface
- **TypeScript**: For type-safe JavaScript development
- **TailwindCSS**: For utility-first styling
- **Shadcn UI**: Component library built on Radix UI primitives
- **React Hook Form**: For form validation and handling
- **Zod**: For schema validation
- **TanStack Query** (React Query): For data fetching, caching, and state management
- **Wouter**: Lightweight routing library
- **Recharts**: For responsive charts and data visualization
- **Lucide React**: For icons

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **Drizzle ORM**: For database operations with PostgreSQL
- **Drizzle-zod**: For integrating Drizzle schemas with Zod validation
- **Passport.js**: For authentication
- **Multer**: For handling file uploads (CSV import)
- **CSV-parse**: For parsing CSV files

### Database
- **PostgreSQL**: For persistent data storage

## Deployment Guide

### Prerequisites
1. **Node.js**: Make sure you have Node.js v20 installed
2. **PostgreSQL**: Install PostgreSQL database (required for production deployment)
3. **Git**: For cloning the repository

### Step-by-Step Deployment

#### 1. Clone the repository
```bash
git clone <your-repository-url>
cd <repository-directory>
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Set up the PostgreSQL database
- Create a new PostgreSQL database for the application
- Note down the database connection details (host, port, username, password, database name)

#### 4. Configure environment variables
Create a `.env` file in the root directory with the following variables:
```
# Database Configuration
# Format: postgresql://username:password@hostname:port/database
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>

# Session Configuration
SESSION_SECRET=your_secret_key_here
PORT=5000

# AWS SES Email Configuration (if using password reset functionality)
SES_USERNAME=your_aws_access_key_id
SES_PASSWORD=your_aws_secret_access_key
SES_REGION=ap-south-1
SES_SENDER=your_verified_email@example.com
```

Important notes:
- The `.env` file must be in the project's root directory
- Make sure no spaces are present around the equal sign (=)
- Do not use quotes around values
- You can reference the included `.env.example` file for a template

#### 5. Initialize the database (First-time Setup)
There are two approaches to set up the database:

##### Option A: Using the automatic database initialization script
```bash
# Install required dependencies
npm install pg

# Run the interactive database initialization script
node scripts/initialize_database.cjs
```
This script will:
1. Create the database and user with appropriate permissions
2. Create all required tables and indexes
3. Insert seed data including default admin user
4. Provide the necessary DATABASE_URL to add to your .env file

When you run the script, it will interactively ask for:
- PostgreSQL superuser credentials (to create the database)
- Database name (default: campaign_management)
- Database user (default: campaign_manager)
- Database password
- Host and port information

**Note:** The script creates a default admin user with credentials:
- Username: admin
- Password: admin123

Make sure to change this password in production!

##### Option B: Using Drizzle ORM migrations
If you prefer to use the Drizzle ORM migration system or already have a database set up:
```bash
# Generate and run migrations based on your schema
npx drizzle-kit generate
npx drizzle-kit push
```

#### 6. Install build dependencies
```bash
# Install Vite as a development dependency
npm install --save-dev vite @vitejs/plugin-react esbuild

# Alternatively, you can use this command to install all required build dependencies
npm install --save-dev vite @vitejs/plugin-react esbuild typescript @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-shadcn-theme-json
```

#### 7. Build the application
```bash
npm run build
```

#### 8. Start the server

##### For Linux/Mac:
```bash
# RECOMMENDED FOR PRODUCTION: Use our custom production runner (avoids all Vite config issues)
./run-prod.sh

# RECOMMENDED FOR ENVIRONMENT VARIABLES ISSUES: Explicitly loads .env variables
./start-env.sh

# Alternative methods:
# Simple start script with minimal complexity
./simple-start.sh 

# Using npm start (may have issues with Vite config)
npm start

# Using the standalone build script (if you want to build without starting)
./build.sh

# Other options available (see Troubleshooting section):
# ./start-prod.sh
# ./start.sh
# node start.js
```

##### For Windows:
```cmd
# RECOMMENDED FOR PRODUCTION: Build and run in one step
run-prod-windows.bat

# Environment variable loading with detailed debugging
start-windows.bat

# For PowerShell users (better environment variable handling)
.\start-windows.ps1

# Build only (if you want to build without starting)
build-windows.bat

# Using npm (may have issues with Vite config)
npm start
```

#### 9. Access the application
Open your browser and navigate to:
```
http://localhost:5000
```

### Development Mode
If you want to run the application in development mode with hot reloading:
```bash
npm run dev
```

## Important Notes
- For security, use a strong, random value for SESSION_SECRET
- The default port is 5000, but you can change it in the .env file
- In production, consider using a process manager like PM2 to keep the application running

## Troubleshooting

### Database Issues
- If you encounter database connection issues, verify your DATABASE_URL is correct
- Make sure PostgreSQL is running and accessible
- Check that the required ports (default: 5432 for PostgreSQL) are not being used by other applications
- For database initialization issues:
  ```bash
  # Check PostgreSQL is running
  pg_isready -h localhost -p 5432
  
  # Verify you can connect as the superuser
  psql -U postgres -h localhost -p 5432 -c "SELECT version();"
  
  # Check if the campaign_management database already exists
  psql -U postgres -h localhost -p 5432 -l | grep campaign_management
  
  # Check if the campaign_manager user already exists
  psql -U postgres -h localhost -p 5432 -c "SELECT usename FROM pg_user WHERE usename='campaign_manager';"
  ```
- If the database or user already exists but has the wrong permissions, you can reinstall:
  ```bash
  # Drop the database (caution: this deletes all data!)
  psql -U postgres -h localhost -p 5432 -c "DROP DATABASE IF EXISTS campaign_management;"
  
  # Drop the user
  psql -U postgres -h localhost -p 5432 -c "DROP USER IF EXISTS campaign_manager;"
  
  # Then re-run the initialization script
  node scripts/initialize_database.cjs
  ```

### Production Deployment Issues
- If you encounter errors loading Vite configuration like:
  - `Cannot find package 'vite' imported from vite.config.ts` 
  - `failed to load config from vite.config.ts`
  - `vite command not found`
  
  Try installing Vite and its dependencies first:
  ```bash
  npm install --save-dev vite @vitejs/plugin-react esbuild
  ```
  
  If the error persists, use our build + run solution that bypasses Vite config issues:
  ```bash
  # Build only
  ./build.sh
  
  # Build and run in one step
  ./run-prod.sh
  ```
  
  These scripts bypass Vite config loading issues by using a temporary JS configuration.
  
- If you encounter environment variable loading issues:
  ```bash
  # Use our environment-focused script
  ./start-env.sh
  ```
  
  This script explicitly loads the variables from your .env file before starting the application.
  
- For other deployment issues, we provide alternative scripts:
  - Simple start script with minimal complexity: `./simple-start.sh`
  - Basic start script: `./start-prod.sh`
  - Detailed logging: `./start.sh` 
  - Cross-platform Node.js script: `node start.js`
  - Windows batch files: `start-windows.bat`, `run-prod-windows.bat`
  - Windows PowerShell: `.\start-windows.ps1`
  
- All our start scripts will:
  - Automatically handle both production and development environments
  - Install necessary build dependencies if missing
  - Detect whether a build exists and create one if needed
  - Fall back to development mode if the build fails
  
- If the build process fails, check:
  - TypeScript errors with `npm run check`
  - Missing environment variables
  - Missing Vite dependencies (install with `npm install --save-dev vite @vitejs/plugin-react esbuild`)
  - Node.js version compatibility (v18+ recommended)
  
- For containerized deployments, use the start-prod.sh script in your entrypoint command

### Windows-Specific Issues
- If CMD batch files don't work correctly, try the PowerShell script (`start-windows.ps1`)
- If you get "Permission denied" errors when running PowerShell scripts:
  1. Open PowerShell as administrator
  2. Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
  3. Try running the script again: `.\start-windows.ps1`
- Path separators in Windows use backslash (`\`) instead of forward slash (`/`), our Windows scripts handle this automatically
- If environment variables aren't loading correctly:
  1. Make sure your .env file doesn't have quotes around values
  2. Try setting them manually before running: `set DATABASE_URL=your_url` or `$env:DATABASE_URL="your_url"` in PowerShell
  3. Use our cross-platform environment loader:
     ```
     node -r ./load-env.js dist/index.js
     ```
     This works on Windows, Mac, and Linux and ensures .env variables are properly loaded
  4. Restart your terminal after making any changes

### Email Sending Issues
- For AWS SES email functionality, make sure these environment variables are set:
  - SES_USERNAME: Your AWS Access Key ID
  - SES_PASSWORD: Your AWS Secret Access Key  
  - SES_REGION: AWS region (default: ap-south-1)
  - SES_SENDER: The verified sender email address
- If you get "SignatureDoesNotMatch" errors, verify your AWS credentials are correct
- Make sure the sender email is verified in AWS SES

## Project Structure
```
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configuration
│   │   ├── pages/         # Page components
│   │   └── ...
├── server/                # Backend Express server
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Data storage interface
│   └── ...
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema definitions
├── scripts/               # Database initialization and utility scripts
│   ├── initialize_database.cjs  # Interactive database setup script
│   ├── create_database.cjs      # Handles database creation outside transaction
│   ├── setup_db.sql       # Creates database user
│   ├── grant_privileges.sql     # Grants database privileges
│   ├── create_tables.sql  # Creates all tables and indexes
│   └── seed_data.sql      # Inserts default data
└── ...
```

## Database Schema

The Campaign Management System uses a PostgreSQL database with the following tables:

### accounts
Represents customer accounts that can have multiple users
- `id`: Primary key
- `name`: Account name
- `created_at`: Creation timestamp

### users
System users who have access to the application
- `id`: Primary key
- `username`: Unique username used for login
- `password`: Bcrypt hashed password
- `name`: Display name
- `account_id`: Foreign key to accounts table
- `created_at`: Creation timestamp

### contacts
Contact entries that can be used in campaigns
- `id`: Primary key
- `name`: Contact name
- `mobile`: Mobile phone number
- `location`: Optional location information
- `label`: Optional category/grouping label
- `account_id`: Foreign key to accounts table
- `created_at`: Creation timestamp

### campaigns
Marketing campaigns created by users
- `id`: Primary key
- `name`: Campaign name
- `template`: WhatsApp template to use
- `contact_label`: Optional label to filter contacts
- `status`: Campaign status (draft, scheduled, sent, etc.)
- `account_id`: Foreign key to accounts table
- `scheduled_at`: Optional future scheduling timestamp
- `created_at`: Creation timestamp

### analytics
Campaign performance metrics
- `id`: Primary key
- `campaign_id`: Foreign key to campaigns table
- `sent`: Count of messages sent
- `delivered`: Count of messages delivered
- `read`: Count of messages read
- `optout`: Count of opt-outs
- `hold`: Count of messages on hold
- `failed`: Count of failed messages
- `account_id`: Foreign key to accounts table
- `updated_at`: Last update timestamp

### settings
Account-specific settings, including API configuration
- `id`: Primary key
- `account_id`: Foreign key to accounts table
- `waba_api_url`: WhatsApp Business API URL
- `facebook_access_token`: API token for Facebook
- `partner_mobile`: Partner mobile number
- `waba_id`: WhatsApp Business Account ID
- `updated_at`: Last update timestamp

## License
[MIT](LICENSE)