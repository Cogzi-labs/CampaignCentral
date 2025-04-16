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
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
SESSION_SECRET=your_secret_key_here
PORT=5000
```

#### 5. Run database migrations
```bash
npx drizzle-kit generate
npx drizzle-kit push
```

#### 6. Build the application
```bash
npm run build
```

#### 7. Start the server
```bash
# RECOMMENDED: Use our custom production runner (avoids all Vite config issues)
./run-prod.sh

# Alternative methods:
# Using npm start (may have issues with Vite config)
npm start

# Using the standalone build script (if you want to build without starting)
./build.sh

# Other options available (see Troubleshooting section):
# ./start-prod.sh
# ./start.sh
# node start.js
```

#### 8. Access the application
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

### Production Deployment Issues
- If you encounter errors loading Vite configuration like:
  - `Cannot find package 'vite' imported from vite.config.ts` 
  - `failed to load config from vite.config.ts`
  
  Use our new build + run solution:
  ```bash
  # Build only
  ./build.sh
  
  # Build and run in one step
  ./run-prod.sh
  ```
  
  These scripts bypass Vite config loading issues by using a temporary JS configuration.
  
- For other deployment issues, we provide alternative scripts:
  - Simple start script: `./start-prod.sh`
  - Detailed logging: `./start.sh` 
  - Windows environments: `node start.js`
  
- All our start scripts will:
  - Automatically handle both production and development environments
  - Install necessary build dependencies if missing
  - Detect whether a build exists and create one if needed
  - Fall back to development mode if the build fails
  
- If the build process fails, check:
  - TypeScript errors with `npm run check`
  - Missing environment variables
  - Node.js version compatibility (v18+ recommended)
  
- For containerized deployments, use the start-prod.sh script in your entrypoint command

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
└── ...
```

## License
[MIT](LICENSE)