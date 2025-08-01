# CampaignHub Installation Guide

This guide explains how to run CampaignHub using [PM2](https://pm2.keymetrics.io/),
a Node.js process manager. PM2 keeps the application running,
restarts it if it crashes and can be configured to start on boot.

## Prerequisites

- A Linux server (Ubuntu, Debian, CentOS, etc.)
- Node.js and npm installed
- PostgreSQL database installed and configured
- Git (to clone the repository)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/campaign-central.git
cd campaign-central
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Application

```bash
npm run build
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory with your configuration:

```bash
cp .env.example .env
nano .env
```

Make sure to set the following variables:

- `DATABASE_URL` or individual PostgreSQL connection parameters (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`)
- Email configuration (SES_USERNAME, SES_PASSWORD, SES_SENDER, SES_REGION)
- Session secret (SESSION_SECRET)
- Other API keys as needed

### 5. Initialize the Database

```bash
node scripts/reset_database.js
```

This will create all the necessary database tables and a default admin user.

### 6. Install PM2 and Start the App

Install PM2 globally (may require `sudo`):

```bash
npm install -g pm2
```

Start the application with PM2:

```bash
pm2 start dist/index.js --name campaignhub
```

Configure PM2 to start on boot and save the process list:

```bash
pm2 startup
pm2 save
```

### 7. Verify the Process is Running

```bash
pm2 status campaignhub
```

You should see output indicating that the process is online.

## Managing the Service

### Start the Service

```bash
pm2 start campaignhub
```

### Stop the Service

```bash
pm2 stop campaignhub
```

### Restart the Service

```bash
pm2 restart campaignhub
```

### View the Service Logs

```bash
pm2 logs campaignhub
```

### Remove the Service

To stop and remove the PM2 process:

```bash
pm2 delete campaignhub
```

## Troubleshooting

### Service Fails to Start

Check the logs for details:

```bash
pm2 logs campaignhub
```

Common issues include:
- Environment variables not set correctly
- Database connection problems
- Port conflicts
- File permission issues

### Database Initialization

If you encounter database issues, you can reset the database:

```bash
node scripts/reset_database.js
```

For non-interactive (automated) environments:

```bash
node scripts/force_reset_database.js
```

## Default Admin Credentials

After installation, you can log in with the default admin account:

- Username: `admin`
- Password: `admin123`

**IMPORTANT:** Change this password immediately after first login!

## Updating the Application

To update the application:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Restart the service:
   ```bash
   pm2 restart campaignhub
   ```
