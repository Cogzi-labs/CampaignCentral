# CampaignHub Installation Guide

This guide explains how to install CampaignHub as a system service on Linux using systemd. This ensures that the application starts automatically when the system boots and restarts if it crashes.

## Prerequisites

- A Linux server with systemd (Ubuntu, Debian, CentOS, etc.)
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

### 6. Install as a System Service

```bash
sudo ./scripts/install_service.sh
```

The script will:
- Copy the service configuration to `/etc/systemd/system/`
- Configure the service with the correct paths and user
- Enable the service to start on boot
- Offer to start the service immediately

### 7. Verify the Service is Running

```bash
sudo systemctl status campaignhub
```

You should see output indicating that the service is active (running).

## Managing the Service

### Start the Service

```bash
sudo systemctl start campaignhub
```

### Stop the Service

```bash
sudo systemctl stop campaignhub
```

### Restart the Service

```bash
sudo systemctl restart campaignhub
```

### View the Service Logs

```bash
sudo journalctl -u campaignhub -f
```

### Uninstall the Service

If you need to remove the service:

```bash
sudo ./scripts/uninstall_service.sh
```

## Troubleshooting

### Service Fails to Start

Check the logs for details:

```bash
sudo journalctl -u campaignhub -e
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
   sudo systemctl restart campaignhub
   ```