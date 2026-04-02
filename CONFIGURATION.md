# Configuration Guide

This guide explains how to modify and customize your CTF Scoreboard Pro system for different deployment scenarios.

---

## Table of Contents

1. [Server Configuration](#server-configuration)
2. [Frontend Configuration](#frontend-configuration)
3. [Network Exposure](#network-exposure)
4. [Environment Variables](#environment-variables)
5. [Port Configuration](#port-configuration)
6. [Discord Integration](#discord-integration)
7. [Password & Security](#password--security)
8. [Data Persistence](#data-persistence)
9. [Scoring Configuration](#scoring-configuration)

---

## Server Configuration

### Backend Server (Express.js)

The backend server is located in `server/src/index.ts`.

#### Default Configuration
- **Port:** `3001` (can be overridden with `PORT` environment variable)
- **Host:** `0.0.0.0` (listens on all network interfaces)
- **CORS:** Enabled for all origins
- **Body Limit:** 50MB

#### Modifying Server Port

Edit `server/src/index.ts`:

```typescript
const PORT = process.env.PORT || 3001;  // Change 3001 to your preferred port
```

Or set via environment variable:
```bash
PORT=4000 npm run dev
```

#### Changing Network Binding

To restrict the server to localhost only (development):
```typescript
// In server/src/index.ts, change:
app.listen(PORT, '0.0.0.0', () => {
// To:
app.listen(PORT, 'localhost', () => {
```

To expose to specific IP address:
```typescript
app.listen(PORT, '192.168.1.100', () => {
```

---

## Frontend Configuration

### Vite Dev Server

The frontend is configured in `client/vite.config.ts`.

#### Default Configuration
- **Port:** `5173`
- **Host:** `0.0.0.0` (listens on all network interfaces)
- **Proxy:** `/api` routes to `http://localhost:3001`

#### Modifying Frontend Port

Edit `client/vite.config.ts`:

```typescript
server: {
  host: '0.0.0.0',
  port: 5174,  // Change to your preferred port
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
```

Or use environment variable:
```bash
VITE_PORT=5174 npm run dev --prefix client
```

#### Updating API Proxy Target

If your backend is on a different machine:

```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://192.168.1.100:3001',  // Your backend URL
      changeOrigin: true,
    },
  },
},
```

---

## Network Exposure

### Local Development (Localhost Only)

To run on localhost only, modify both files:

**server/src/index.ts:**
```typescript
app.listen(PORT, 'localhost', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

**client/vite.config.ts:**
```typescript
server: {
  host: 'localhost',
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
```

### Network Exposure (Current Default)

The application is configured to expose on all interfaces (`0.0.0.0`):

- Frontend accessible at: `http://<your-ip>:5173`
- Backend API at: `http://<your-ip>:3001`

Find your machine IP:
```bash
# Linux/macOS
hostname -I
ifconfig

# Windows
ipconfig
```

### Behind a Proxy or Load Balancer

If running behind nginx/Apache/HAProxy, configure the proxy target:

**client/vite.config.ts:**
```typescript
proxy: {
  '/api': {
    target: 'http://backend-internal-ip:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api'  // Adjust if API has a path prefix
    },
  },
},
```

---

## Environment Variables

### Create a `.env` file in the project root:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Security
ADMIN_PASSWORD_HASH=$2a$10$mt.PFr/Ba0IrXrzyXxJGBeFfi4N6scaUfKh76t9eH/6sNBadCLAJW
JWT_SECRET=your-super-secret-random-key-here

# Frontend Configuration
VITE_API_URL=http://localhost:3001

# Discord Integration (optional)
DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...

# Uptime Scoring (optional)
UPTIME_SCRIPT_PATH=./scoring.py
UPTIME_CHECK_INTERVAL=300
```

### Loading Environment Variables

**Development:**
```bash
export $(cat .env | xargs)
npm run dev
```

**Production:**
```bash
# Using systemd, docker, or process manager
npm run build
npm start
```

---

## Port Configuration

### Changing Multiple Ports

If you need to run multiple instances:

**Instance 1:**
```bash
PORT=3001 VITE_PORT=5173 npm run dev
```

**Instance 2:**
```bash
PORT=3002 VITE_PORT=5174 npm run dev
```

Update the proxy target in each instance's `vite.config.ts` to match its backend port.

### Port Forwarding for External Access

If behind a firewall:

```bash
# Using SSH tunneling
ssh -R 5173:localhost:5173 -R 3001:localhost:3001 user@remote-server

# Using ngrok (temporary)
ngrok http 5173
ngrok http 3001
```

---

## Discord Integration

### Configuring Webhooks

Webhooks are configured in the **Management** tab or via API:

**API Endpoint:**
```bash
PUT /api/webhooks
Content-Type: application/json

{
  "channels": {
    "team-name": "https://discordapp.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"
  }
}
```

### Webhook Format

Injects are broadcast with this embed structure:
- **Title:** Inject name
- **Description:** Inject description
- **Timestamp:** Broadcast time (used to calculate lateness)
- **Color:** Varies by inject status

### Creating Discord Webhooks

1. Open your Discord server → Channel settings
2. Go to **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Copy the webhook URL
5. Paste in CTF Scoreboard's Management tab

---

## Password & Security

### Changing Admin Password

See **[AUTHENTICATION.md](./AUTHENTICATION.md)** for detailed instructions.

Quick version:

```bash
# Generate hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123!', 10, (err, hash) => console.log(hash));"

# Set environment variable
export ADMIN_PASSWORD_HASH="$2a$10$..."
npm run dev
```

### Updating JWT Secret

For production, set a strong random JWT secret:

```bash
# Generate random secret
openssl rand -base64 32

# Add to .env
JWT_SECRET=your-generated-secret-here
```

The JWT secret must be the same across all instances if running in a cluster.

---

## Data Persistence

### File-Based Storage

Data is stored in JSON files in the project root:

- **`team_scores.json`** — Main application state (teams, injects, scores)
- **`autosave_scoreboard.json`** — Auto-backup every 5 minutes

### Changing Data Directory

Modify `server/src/store.ts`:

```typescript
const DATA_DIR = process.env.DATA_DIR || './';
const STATE_FILE = path.join(DATA_DIR, 'team_scores.json');
const BACKUP_FILE = path.join(DATA_DIR, 'autosave_scoreboard.json');
```

Set via environment:
```bash
DATA_DIR=/var/ctf-data npm run dev
```

### Backup Schedule

Auto-save interval is hardcoded to 5 minutes in `server/src/index.ts`:

```typescript
setInterval(async () => {
  await persistState();
}, 5 * 60 * 1000);  // Change 5 to desired minutes
```

### Manual Backup

Export data from the **Management** tab or via API:
```bash
GET /api/export
```

---

## Scoring Configuration

### Inject Scoring Formulas

Edit in-place in the **Scores** tab, or configure via API:

**PUT /api/injects** — Update inject point values and weights

### Uptime Scoring

Configure in the **Uptime Scoring** tab:

1. **Map teams to hosts** — Assign IP addresses to monitor
2. **Set check interval** — How often to run availability checks
3. **Configure script** — Python script path for monitoring
4. **Enable auto-run** — Periodic automatic checks

**Environment variables for uptime:**

```bash
UPTIME_SCRIPT_PATH=./scoring.py
UPTIME_DB_HOST=localhost
UPTIME_DB_USER=ctf_user
UPTIME_DB_PASSWORD=secure_password
UPTIME_CHECK_INTERVAL=300
```

### Custom Scoring Script

Place Python script at specified path:

```python
#!/usr/bin/env python3
# scoring.py

import sys
import mysql.connector

def check_host_uptime(host_ip, db_connection):
    # Your uptime checking logic
    return uptime_percentage

if __name__ == '__main__':
    # Process hosts from hosts.txt
    with open('hosts.txt', 'r') as f:
        hosts = f.read().strip().split('\n')
    
    for host in hosts:
        uptime = check_host_uptime(host, db_conn)
        print(f'{host}: {uptime}%')
```

---

## Production Configuration

### Build for Production

```bash
npm run build
```

This:
1. Compiles TypeScript server to `server/dist/`
2. Bundles React frontend to `client/dist/`

### Run Production Build

```bash
npm start
```

Or directly:
```bash
node server/dist/index.js
```

### Production Environment File

Create `.env.production`:

```bash
NODE_ENV=production
PORT=3001
ADMIN_PASSWORD_HASH=$2a$10$...
JWT_SECRET=your-secure-random-key
VITE_API_URL=https://your-domain.com
```

### Using a Process Manager

**PM2:**
```bash
pm2 start server/dist/index.js --name "ctf-api"
pm2 start "npm run preview --prefix client" --name "ctf-ui"
pm2 save
```

**Systemd:**
```ini
[Unit]
Description=CTF Scoreboard API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/CTF_Scoreboard_Pro
ExecStart=/usr/bin/node server/dist/index.js
Restart=on-failure
Environment="PORT=3001"
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

---

## Troubleshooting Configuration Issues

### API Connection Failing

Check proxy configuration in `client/vite.config.ts`:
```bash
# Test API directly
curl http://localhost:3001/api/state
```

### Port Already in Use

```bash
# Kill process on port
lsof -i :3001
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### CORS Issues

Check `server/src/index.ts`:
```typescript
app.use(cors());  // Allows all origins

// To restrict:
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com'],
}));
```

### Changes Not Taking Effect

1. Stop the dev server (`Ctrl+C`)
2. Clear node_modules if you changed dependencies: `rm -rf node_modules server/node_modules client/node_modules`
3. Reinstall: `npm install:all`
4. Restart: `npm run dev`

---

## See Also

- **[README.md](./README.md)** — Project overview
- **[SETUP.md](./SETUP.md)** — Initial setup and team configuration
- **[AUTHENTICATION.md](./AUTHENTICATION.md)** — Security and JWT details
