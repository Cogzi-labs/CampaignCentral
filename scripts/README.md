# Database Initialization Scripts

These scripts help set up the PostgreSQL database for the Campaign Management System.

## Overview

The scripts in this directory will:

1. Create a new PostgreSQL database and user
2. Create all necessary tables (users, accounts, contacts, campaigns, analytics, sessions)
3. Add initial seed data (admin user, sample contacts and campaigns)

## Available Scripts

- `setup.sql` - Single script that creates the database, user, all tables and indexes, and inserts seed data
- `initialize_database.sh` - Bash script that runs the SQL setup (interactive)
- `initialize_database.cjs` - Node.js script that performs the same tasks programmatically

## Running the Scripts

### Option 1: Using the Bash script (Linux/macOS)

```bash
cd scripts
./initialize_database.sh
```

Follow the prompts to set up your database with custom values or use the defaults.

### Option 2: Using the Node.js script

```bash
cd scripts
node initialize_database.js
```

Follow the prompts to set up your database with custom values or use the defaults.

### Option 3: Manual execution with psql

If you prefer to run the SQL yourself:

```bash
sudo -u postgres psql -f setup.sql
```

## Default Credentials

After initialization, you can log in to the application with:

- **Username**: admin
- **Password**: admin123

> ⚠️ **Important**: Change the admin password in production!

## Environment Configuration

After running the initialization scripts, you should set the `DATABASE_URL` environment variable:

```
DATABASE_URL=postgres://campaign_manager:your_secure_password@localhost:5432/campaign_management
```

Replace the values with your custom choices if you changed them during setup.

## Troubleshooting

- If you encounter "permission denied" errors, make sure the PostgreSQL user has proper privileges.
- If you have trouble connecting, check that PostgreSQL is running and accessible.
- For connection issues, verify your database host, port, username, and password.