# Authentication & Security Guide

## Overview

CTF Scoreboard Pro uses **JWT (JSON Web Tokens)** and **bcrypt** password hashing to secure the admin dashboard. The **Leaderboard is publicly accessible**, but all other features require authentication.

---

## Default Credentials

| Username | Password |
|----------|----------|
| Admin | `admin` |

⚠️ **Change this immediately in production!**

---

## Access Control

### Public (No Authentication Required)
- 🏆 **Leaderboard** — Anyone can view live rankings

### Protected (Authentication Required) 🔒
- 📝 **Data Entry** — Grade inject submissions
- 📊 **Scores** — View scoring breakdown
- 🔍 **Uptime Scoring** — Configure and run automated scoring
- ⚙️ **Management** — Configure teams, injects, webhooks
- ⚙️ **Settings** — Change server address

---

## Changing the Password

### Option 1: Using Environment Variable (Recommended)

Generate a bcrypt hash of your new password:

```bash
# Run this once to generate the hash
cat > /tmp/hash.js << 'EOF'
const bcryptjs = require('bcryptjs');
async function hash(pw) {
  const h = await bcryptjs.hash(pw, 10);
  console.log(h);
}
hash('your-new-password');
EOF
node /tmp/hash.js
```

Copy the output hash, then set environment variable before starting:

```bash
export ADMIN_PASSWORD_HASH="$2a$10$..."
npm run dev
```

### Option 2: Production Setup

Add to your `.env` file:

```
ADMIN_PASSWORD_HASH=$2a$10$mt.PFr/Ba0IrXrzyXxJGBeFfi4N6scaUfKh76t9eH/6sNBadCLAJW
JWT_SECRET=your-secret-key-change-this-too
```

Then load from environment:

```bash
npm run dev
```

---

## JWT Token Management

### How It Works

1. User logs in with password
2. Server validates password against bcrypt hash
3. Server generates JWT token (expires in 24 hours)
4. Client stores token in `localStorage`
5. Client sends token in `Authorization: Bearer <token>` header with each request
6. Server validates token for protected endpoints

### Token Expiration

Tokens are valid for **24 hours**. When a token expires:
- User is redirected to login page
- Old token is cleared from localStorage
- User must login again

### Manual Token Revocation

To force all users to re-authenticate (e.g., security breach):
1. Change the `JWT_SECRET` environment variable
2. Restart the server
3. All existing tokens become invalid

---

## API Authentication

### Login Endpoint

**POST** `/api/auth/login`

Request:
```json
{
  "password": "admin"
}
```

Response (on success):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Login successful"
}
```

Response (on failure):
```json
{
  "error": "Invalid password"
}
```

### Using the Token

Include token in all protected requests:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/teams
```

### Token Verification

**POST** `/api/auth/verify`

Request:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Response:
```json
{
  "valid": true
}
```

---

## Security Best Practices

### 1. Change Default Password

Never deploy with default credentials. Change immediately:

```bash
# Generate new bcrypt hash
cat > /tmp/hash.js << 'EOF'
const bcryptjs = require('bcryptjs');
async function hash(pw) {
  const h = await bcryptjs.hash(pw, 10);
  console.log(h);
}
hash('SecurePassword123!');
EOF
node /tmp/hash.js

# Set environment variable with the output
export ADMIN_PASSWORD_HASH="$2a$10/..."
```

### 2. Protect Environment Variables

Store secrets in `.env` file (excluded from git):

```bash
# .env
ADMIN_PASSWORD_HASH=bcrypt_hash_here
JWT_SECRET=change_this_to_random_string
```

**Make sure `.env` is in `.gitignore`** (already done).

### 3. Use HTTPS in Production

Always serve over HTTPS to protect token in transit:

```bash
# Update server config for HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem')
};

https.createServer(options, app).listen(3001);
```

### 4. Strong Passwords

Use complex passwords with:
- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Symbols (!@#$%^&*)
- Minimum 12 characters

### 5. Monitor Access

- Keep logs of login attempts (implement in future)
- Review access to sensitive data
- Rotate passwords periodically

### 6. Token Storage

Frontend stores token in `localStorage`:
- ✅ Accessible via JavaScript (required for API calls)
- ⚠️ Vulnerable to XSS attacks
- Mitigation: Keep frontend dependencies updated, use Content Security Policy

For extra security, consider:
- Storing token in HTTP-only cookie (requires server-side session)
- Implementing refresh tokens

---

## Deploying with Authentication

### Docker Example

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

# Install dependencies
RUN npm install
RUN npm install --prefix server
RUN npm install --prefix client

# Build frontend
RUN npm run build --prefix client

# Set environment variables
ENV ADMIN_PASSWORD_HASH=$2a$10$...
ENV JWT_SECRET=your-secret-key

# Run server only (client is served statically)
CMD ["node", "server/dist/index.js"]
```

### Docker Compose Example

```yaml
version: '3'
services:
  scoreboard:
    build: .
    ports:
      - "3001:3001"
    environment:
      ADMIN_PASSWORD_HASH: $2a$10$...
      JWT_SECRET: your-secret-key
    volumes:
      - ./team_scores.json:/app/team_scores.json
```

---

## Troubleshooting

### "Unauthorized" Error on Protected Tabs

**Problem:** Clicking a protected tab shows error or redirects to login

**Solutions:**
1. Login with correct password
2. Check browser console (F12) for errors
3. Clear localStorage and refresh:
   ```javascript
   localStorage.removeItem('auth_token');
   location.reload();
   ```
4. Verify server is running: `http://localhost:3001/api/state`

### "Invalid Password" Error

**Problem:** Correct password is rejected

**Solutions:**
1. Check password hasn't been changed (case-sensitive)
2. Verify `ADMIN_PASSWORD_HASH` environment variable is set correctly
3. Restart server: `npm run dev`
4. Regenerate bcrypt hash and restart

### Token Expired / Kicked Back to Login

**Problem:** Session expires after 24 hours

**Solution:** This is normal. Simply login again. Tokens are valid for 24 hours as a security measure.

To extend: Modify `/server/src/auth.ts` line:
```typescript
export function generateToken(): string {
  return jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '7d' }); // 7 days
}
```

---

## Future Enhancements

- [ ] Implement login attempt limits & rate limiting
- [ ] Add admin user management (multiple users)
- [ ] Implement audit logging
- [ ] Add session management dashboard
- [ ] Implement refresh tokens
- [ ] Add two-factor authentication (2FA)
- [ ] IP-based access control
- [ ] Login activity logs

---

## Security Checklist

- [ ] Changed default password from "admin"
- [ ] Set `JWT_SECRET` environment variable to random string
- [ ] `.env` file in `.gitignore`
- [ ] Using HTTPS in production
- [ ] Regular password rotation policy
- [ ] Server running with least privileges
- [ ] Firewall blocking unauthorized access
- [ ] Regular security audits

---

## Support

For security issues or vulnerabilities, please report responsibly and do not disclose publicly until patched.

---

**Version:** 2.0  
**Last Updated:** 2026-04-01
