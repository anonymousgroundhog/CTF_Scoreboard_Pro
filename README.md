# CTF Scoreboard Pro

**A modern, professional web-based competition management system for CTF/cybersecurity competitions.**

![Version](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

🏆 **Live Leaderboard** — Real-time team rankings with automatic scoring updates

📝 **Data Entry** — Grade inject submissions with auto-lateness calculation and Discord broadcast

📊 **Scores Dashboard** — Full scoring breakdown with weighted percentages and formulas

🔍 **Uptime Scoring** — Automated service availability monitoring with manual or periodic runs

⚙️ **Management** — Configure injects, webhooks, teams via web UI or CSV/JSON import/export

🎯 **Discord Integration** — Broadcast injects to team channels with automatic timestamp recording

---

## Quick Start

### 1. Clone & Install

```bash
cd CTF_Scoreboard_Pro
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Start the Application

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

### 3. Configure Server (if needed)

Click ⚙️ in the top-right to change API server address.

---

## 📖 Complete Setup & User Guide

→ **[Read SETUP.md](./SETUP.md)** for:

- Detailed requirements
- Team and inject configuration
- Feature guides for each tab
- Uptime scoring setup
- Troubleshooting

---

## Architecture

### Frontend (React + Vite)

- Modern, responsive UI with dark cybersecurity theme
- Tabs for Leaderboard, Data Entry, Scores, Uptime Scoring, Management
- Real-time updates via polling
- Configurable server connection

### Backend (Express.js + TypeScript)

- RESTful API for all operations
- Automatic persistence to `team_scores.json`
- Write-through saves on every mutation
- CSV/JSON import-export
- Discord webhook integration
- Uptime scoring script runner

### Data Storage

- `team_scores.json` — Main state file
- `autosave_scoreboard.json` — 5-minute auto-backup
- No database required (file-based)

---

## File Structure

```
CTF_Scoreboard_Pro/
├── SETUP.md                    # Complete setup guide
├── README.md                   # This file
├── team_scores.json            # Main data file
├── package.json                # Root scripts
├── server/                     # Express API
│   ├── src/index.ts            # Server entry
│   ├── src/store.ts            # State management
│   └── src/routes/             # API endpoints
└── client/                     # React UI
    ├── src/App.tsx             # Main app
    ├── src/pages/              # Tab components
    └── src/store/              # Zustand store
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/state` | Get full application state |
| GET/POST/PUT/DELETE | `/api/teams[/:name]` | Team CRUD |
| GET/POST/DELETE | `/api/injects[/:name]` | Inject CRUD |
| POST | `/api/injects/batch` | Bulk save injects |
| PUT | `/api/teams/:name/injects` | Save team inject scores |
| GET | `/api/scoring/hosts` | List available hosts |
| PUT | `/api/scoring/config` | Save team-host mappings |
| POST | `/api/scoring/run` | Execute scoring script |
| POST | `/api/scoring/sync` | Apply scoring results |
| POST | `/api/scoring/reset` | Clear uptime scores |
| POST | `/api/broadcast/:name` | Send Discord embed |
| PUT | `/api/webhooks` | Save webhook URLs |
| POST/GET | `/api/import-*` | Import CSV/JSON |
| GET | `/api/export` | Download JSON |

---

## Scoring Formulas

### Leaderboard Total (raw sum)
```
Total = Injects Total + Uptime + Red Team Assessment + Defense
```

### Scores Tab Total (weighted)
```
Uptime % = Uptime ÷ 50
Injects % = Injects Total ÷ 50
Defense % = Red Team Assessment ÷ 5
Total = 0.33×(Uptime %) + 0.33×(Injects %) + 0.33×(Defense %)
```

### Inject Final Score
```
Final Score = max(0, Raw Score - Minutes Late)
```

---

## System Requirements

- **Node.js** v18+ — [Download](https://nodejs.org)
- **npm** — comes with Node.js
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Optional (for uptime scoring)

- Python 3.8+
- MySQL/MariaDB
- sshpass (Linux/macOS)
- `pip3 install mysql-connector-python`

---

## Common Tasks

### Add Teams & Injects

1. Open **Management** tab
2. Click **Import Teams CSV** or **Import Injects CSV**
3. Upload CSV files
4. Edit in-place if needed
5. Click **SAVE GRID CHANGES**

### Grade Inject Submissions

1. Open **Data Entry** tab
2. Select team from left panel
3. Enter raw scores, submission times
4. Click **SAVE SCORES**
5. Watch leaderboard update

### Monitor Uptime

1. Open **Uptime Scoring** tab
2. Map teams to host IPs
3. Click **Run** or enable **Auto-run Scoring**
4. Click **Sync All Results Now**
5. View uptime in **Leaderboard**

### Broadcast Injects

1. **Data Entry** tab → Select team
2. Click 📢 button for an inject
3. Select Discord channel
4. Timestamp auto-recorded
5. Lateness auto-calculated from broadcast

---

## Development

### Build for Production

```bash
npm run build
npm start
```

Builds the server (TypeScript → JavaScript) and client (React → optimized bundle).

### Ports

- Frontend dev server: `localhost:5173`
- Backend API server: `localhost:3001`
- Vite proxies `/api` to backend

---

## Troubleshooting

### Servers won't start
```bash
# Kill any running processes
pkill -f "npm run dev"
# Check ports aren't in use
lsof -i :3001
lsof -i :5173
```

### Teams/injects not loading
- Check `team_scores.json` exists and is valid JSON
- Try importing CSV again
- Check browser console for errors (F12)

### Uptime scoring fails
- Install Python requirements: `pip3 install mysql-connector-python sshpass`
- Verify MySQL database and credentials
- Check `~/Downloads/scoring/hosts.txt` exists
- Review SETUP.md's Uptime Scoring section

### Server address issues
- Click ⚙️ settings icon
- Test connection before saving
- Use full URL if backend is on different machine

---

## Data Backup

Auto-save happens every 5 minutes to `autosave_scoreboard.json`.

Manual export:
1. **Management** tab → **Export JSON**
2. Save to secure location
3. Reload later via **Import JSON**

---

## License

MIT — Use freely in educational and competition contexts.

---

## Support

- Read [SETUP.md](./SETUP.md) for detailed guides
- Check browser console (F12) for errors
- Verify system requirements are met
- Review troubleshooting section above

---

**Made for CIHSCDC and cybersecurity competition organizers.**  
v2.0 — Web-based (2026)
