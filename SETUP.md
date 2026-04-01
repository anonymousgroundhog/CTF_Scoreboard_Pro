# CTF Scoreboard Pro — Setup & User Guide

A professional web-based competition management system for CTF/cybersecurity competitions with real-time scoring, automated uptime monitoring, and Discord integration.

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Start](#quick-start)
3. [Initial Configuration](#initial-configuration)
4. [Feature Guides](#feature-guides)
5. [Uptime Scoring Setup](#uptime-scoring-setup)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Required Software

- **Node.js** (v18+) — [Download](https://nodejs.org)
- **Python 3.8+** — for uptime scoring script
- **npm** — comes with Node.js

### Optional (for uptime scoring)

- **MySQL/MariaDB** — database for scoring results
- **sshpass** — for SSH service checks
  ```bash
  # Ubuntu/Debian
  sudo apt install sshpass
  
  # macOS
  brew install sshpass
  ```
- **Python mysql-connector**
  ```bash
  pip3 install mysql-connector-python
  ```

---

## Quick Start

### 1. Install Dependencies

```bash
cd /path/to/CTF_Scoreboard_Pro

# Install all packages (root, server, and client)
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Start the Application

```bash
npm run dev
```

The system will start two servers:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

Open your browser to **http://localhost:5173**

### 3. Configure Server Address (if needed)

If your backend API runs on a different server:

1. Click the **⚙️** settings icon in the top-right
2. Enter the API address:
   - Relative: `/api` (default, uses same domain)
   - Absolute: `http://192.168.1.100:3001/api` (different server)
3. Click **Test** to verify, then **Save & Connect**

---

## Initial Configuration

### Step 1: Add Teams

#### Option A: Manual Entry

1. Go to **Management** tab → **Add Inject Row**... wait, that's for injects
2. Teams are auto-loaded from `team_scores.json`

To add teams manually:

1. **Management** tab → scroll to the bottom (future feature)
2. OR edit `team_scores.json` directly and reload

#### Option B: Import from CSV

1. **Management** tab → **Import Teams CSV**
2. CSV format required:
   ```
   Team Name,School Name
   VADER,Wheaton Warrenville South HS
   Team 404,Pekin Community HS
   ```

#### Option C: Pre-configure in JSON

Edit `team_scores.json`:

```json
{
  "teams": {
    "VADER": {
      "school": "Wheaton Warrenville South HS",
      "uptime": 0,
      "red_team": 0,
      "defense": 0,
      "injects": {},
      "remarks": ""
    }
  }
}
```

Then reload the app.

### Step 2: Add Injects

#### Option A: Manual Grid Entry

1. **Management** tab → **Add Inject Row**
2. Fill in:
   - **Name** — inject title (e.g., "Website Inspection")
   - **Description** — full prompt text
   - **Solution** — answer key for graders
   - **Duration (m)** — minutes allowed (e.g., 30)
   - **Rel Time** — release time in HH:MM (e.g., 10:55)
   - **Due Time** — deadline in HH:MM (e.g., 11:25)
3. Click **SAVE GRID CHANGES**

#### Option B: Import from CSV

1. **Management** tab → **Import Injects CSV**
2. CSV format:
   ```
   Description ,Solution,Time to complete,Approx Release Time,Approx Due Time
   Website Inspection,Check SHA256,30,10:55,11:25
   ```
   ⚠️ Note the space after "Description"!

### Step 3: Configure Discord Webhooks (Optional)

To broadcast injects to teams:

1. Create a webhook in Discord:
   - Server → Channel → Edit → Integrations → Webhooks → New
   - Copy the webhook URL
2. **Management** tab → Edit webhook in the table
3. Add channel name and URL pair
4. Click **Save Webhooks**

---

## Feature Guides

### 🏆 Leaderboard Tab

**Real-time team rankings** sorted by total score.

**Displays:**
- Rank (1st place highlighted)
- Team name
- School affiliation
- Uptime % (raw uptime score)
- Injects (sum of all final inject scores)
- Total (combined score)

Auto-updates every 10 seconds. Manual refresh: reload the page.

---

### 📝 Data Entry Tab

**Grade inject submissions and track scores.**

1. **Select Team** — Click team name in left panel
2. **For Each Inject:**
   - **Raw (0-10)** — grader's score
   - **Sub Time** — submission time (HH:MM or HH:MM:SS)
   - **Mins Late** — auto-filled if broadcast time exists
   - **Final Score** — calculated as `max(0, Raw - MinsLate)`
3. Click **SAVE SCORES**

**Discord Broadcast:**
- Click the 📢 button to post inject details to Discord
- Automatically records broadcast timestamp
- Used for auto-calculating lateness

**Tooltips:**
- Hover over inject name to see description + solution key

---

### 📊 Scores Tab

**Full scoring breakdown** for all teams.

**Calculated Fields:**
- **Uptime %** = Uptime ÷ 50
- **Injects %** = Total Inject Score ÷ 50
- **Defense %** = Red Team Assessment ÷ 5
- **Total** = 0.33 × (Uptime % + Injects % + Defense %)

**Enter Scores:**
- Select team
- Enter raw **Uptime** score (0-50 recommended)
- Enter raw **Red Team Assessment** score (0-5 recommended)
- Add optional remarks
- Click **Save**

Updates leaderboard instantly.

---

### 🔍 Uptime Scoring Tab

**Automated service availability monitoring.**

#### Setup Team-Host Mapping

1. For each team, select or **type** a host IP address
   - Use predefined hosts from `hosts.txt`
   - OR enter custom IPs
2. Click **Save Mapping Configuration**

#### Run Scoring

**Manual Mode:**
- Click **Run** next to a team
- Script executes in background
- Results auto-sync after 3 seconds

**Auto Mode:**
- Check **"Auto-run Scoring"**
- Set interval (10-3600 seconds)
- System periodically checks all hosts

**Sync Results:**
- Click **Sync All Results Now** to apply scores to teams
- Updates uptime % in Leaderboard

**Reset Scores:**
- Click **Reset Scores** button
- Choose all teams or select specific ones
- Confirms before clearing
- Uptime reverts to 0

#### Scoring Details

The Python script (`score.py`) checks:
- **HTTP** on ports 80, 800, 8080, 8800
- **SSH** on port 222
- **FTP** on port 210

Each service returns 0 (down) or 1 (up). Final uptime is calculated as a percentage.

---

### ⚙️ Management Tab

**Configure injects, webhooks, and data.**

**Toolbar Buttons:**
- **Import Teams CSV** — bulk load teams
- **Import Injects CSV** — bulk load injects
- **Import JSON** — restore full session state
- **Add Inject Row** — add blank inject
- **SAVE GRID CHANGES** — commit inject edits
- **Export JSON** — download current state

**Inject Grid:**
- Edit inject name, description, solution, times
- Click **Delete** to remove
- Always click **SAVE GRID CHANGES** after editing

**Webhook Config:**
- Manage Discord webhook URLs
- Channel name → Webhook URL pairs
- Click **Save Webhooks** after changes

---

## Uptime Scoring Setup

### Prerequisites

1. **Python 3.8+** installed
2. **MySQL/MariaDB** database running
3. **sshpass** installed (if using SSH checks)
4. **Python mysql-connector** installed:
   ```bash
   pip3 install mysql-connector-python
   ```

### Configure Hosts File

Edit `~/Downloads/scoring/hosts.txt`:

```
10.111.21.218
10.111.21.217
10.111.21.216
10.111.21.215
10.111.21.214
10.111.21.213
10.111.21.212
```

Each line is one host IP.

### Configure Scoring Script

Edit `~/Downloads/scoring/score.py`:

```python
# Database connection
handle = mysql.connector.connect(
    host="localhost",
    user="phpmyadmin",
    passwd="hscyber19",
    database="scoring"
)

# Service checks
ssh_user = "cihscdc_white"
ssh_file = "cihscdc_white.txt"
ftp_user = "cihscdc_white"
ftp_pass = "bulldog_436_jersey"
http_string = "cihscdc_white"  # Must appear in HTTP response
```

Customize credentials and service names as needed.

### Run a Test

In the **Uptime Scoring** tab:

1. Map a test team to a host
2. Click **Run**
3. Check the console for errors
4. Click **Sync All Results Now**
5. Verify uptime appears in Leaderboard

---

## Troubleshooting

### "Cannot reach server" Error

**Solution:**
1. Check servers are running: `npm run dev`
2. Verify ports 3001 (backend) and 5173 (frontend) are free
3. Use **Settings** (⚙️) to reconfigure server address
4. Try `http://localhost:3001/api` as absolute address

### Scoring Script Fails with MySQL Error

**Error:** `ModuleNotFoundError: No module named 'mysql'`

**Solution:**
```bash
pip3 install mysql-connector-python
```

**Error:** `ERROR 2003: Can't connect to MySQL server`

**Solutions:**
- Verify MySQL is running: `mysql -u root -p`
- Check database name, user, password in `score.py`
- Ensure database exists: `CREATE DATABASE scoring;`

### SSH Service Check Fails

**Error:** `sshpass: command not found`

**Solution:**
```bash
# Ubuntu/Debian
sudo apt install sshpass

# macOS
brew install sshpass
```

### Data Not Persisting

**Solution:**
- Check file permissions on `team_scores.json`
- Verify disk space available
- Check browser console for errors (F12)
- Try **Export JSON** to save backup manually

### Import/Export Not Working

**Solution:**
- Use modern browser (Chrome, Firefox, Edge, Safari)
- Check file format matches specification
- Try smaller imports first (one team or inject)
- Check server logs for errors

### Teams Not Appearing in Scoring Tab

**Solution:**
1. Ensure teams are loaded in Leaderboard tab
2. Refresh page (Ctrl+R or Cmd+R)
3. Check `team_scores.json` has teams defined
4. Try importing teams via CSV in Management tab

---

## File Structure

```
CTF_Scoreboard_Pro/
├── team_scores.json              # Current state (teams, injects, webhooks)
├── autosave_scoreboard.json      # Auto-backup (every 5 min)
├── client/                       # React frontend
│   └── src/pages/
│       ├── Leaderboard.tsx       # Rankings
│       ├── DataEntry.tsx         # Inject grading
│       ├── Scores.tsx            # Scoring breakdown
│       ├── Scoring.tsx           # Uptime automation
│       └── Management.tsx        # Admin panel
└── server/                       # Express backend
    └── src/routes/
        ├── teams.ts              # Team management
        ├── injects.ts            # Inject management
        ├── scoring.ts            # Uptime scoring
        ├── broadcast.ts          # Discord integration
        └── importExport.ts       # CSV/JSON I/O
```

---

## Common Workflows

### Pre-Competition Setup

1. Add all teams (CSV import recommended)
2. Add all injects (CSV import recommended)
3. Configure Discord webhooks
4. Set up host-team mappings for uptime scoring
5. Export JSON as backup

### During Competition

1. Monitor **Leaderboard** for live standings
2. Use **Data Entry** to grade and broadcast injects
3. Use **Uptime Scoring** to monitor service health
4. Use **Scores** to verify calculations
5. Export JSON periodically for backups

### Post-Competition

1. Export final JSON state
2. Take screenshots of Leaderboard for records
3. Optionally reset and archive old `team_scores.json`

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review server logs: `npm run dev` output
3. Check browser console (F12 → Console tab)
4. Verify all system requirements are met

---

**Version:** 2.0 (Web-based)  
**Last Updated:** 2026-04-01
