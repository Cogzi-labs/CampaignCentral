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
# Standard startup
chmod +x start.sh
./start.sh

# If you encounter path resolution errors, use the patched script:
chmod +x fixed-start.sh
./fixed-start.sh
```

##### For Windows:
```cmd
# Standard startup
start-windows.bat

# If you encounter path resolution errors, use the patched script:
fixed-start-windows.bat
```

The startup scripts will automatically:
- Load environment variables from .env file
- Construct DATABASE_URL from PostgreSQL variables if needed
- Generate a SESSION_SECRET if not provided
- Detect whether to run in production or development mode

##### Path Resolution Fix
If you encounter errors like: `TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string. Received undefined`, use the patched startup scripts which implement Node.js runtime fixes without modifying sensitive files.

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
  
  Install Vite and its dependencies:
  ```bash
  npm install --save-dev vite @vitejs/plugin-react esbuild
  ```

- For environment variable issues, check that your `.env` file:
  - Is in the root directory
  - Contains all required variables (see .env.example)
  - Has no spaces around equal signs (=)
  - Has no quotes around values
  
- Our start scripts will automatically:
  - Handle both production and development environments
  - Detect whether to use the production build or development mode
  - Construct DATABASE_URL from individual PG* variables if needed
  - Generate a SESSION_SECRET if not provided
  
- If the build process fails, check:
  - TypeScript errors with `npm run check`
  - Missing environment variables
  - Node.js version compatibility (v18+ recommended)
  
- For containerized deployments, use start-prod.sh in your entrypoint command

### Windows-Specific Issues
- Make sure your .env file has no quotes around values
- If environment variables aren't loading correctly:
  - Try setting them manually in the command prompt: `set DATABASE_URL=your_url`
  - Or in PowerShell: `$env:DATABASE_URL="your_url"`
  - Restart your terminal after making any changes
- The start-windows.bat script handles Windows path separators automatically

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