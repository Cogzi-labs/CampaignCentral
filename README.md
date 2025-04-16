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
npm start
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
- If you encounter database connection issues, verify your DATABASE_URL is correct
- Make sure PostgreSQL is running and accessible
- Check that the required ports (default: 5000) are not being used by other applications

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