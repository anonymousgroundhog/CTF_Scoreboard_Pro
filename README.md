# CIHSCDC Competition Manager

A desktop scoreboard and competition management tool for running CTF/cybersecurity competitions. Tracks inject scores, uptime, red team assessments, and live leaderboard standings for multiple teams. Supports Discord webhook integration for broadcasting injects to teams in real time.

---

## Requirements

- Python 3.8 or later
- `tkinter` (included with most Python installations)
- `requests` library

### Install dependencies

```bash
pip install requests
```

> **Note:** On some Linux systems, `tkinter` is a separate package. Install it with:
> ```bash
> sudo apt install python3-tk   # Debian/Ubuntu
> sudo dnf install python3-tkinter  # Fedora/RHEL
> ```

---

## Running the Application

```bash
python scoreboard.py
```

The window opens at 1650×900. A widescreen monitor is recommended.

---

## First-Time Setup

### Step 1 — Load or configure your teams

You have two options:

**Option A: Import a CSV file**

Go to the **Management** tab and click **Import Teams CSV**. The CSV must have at minimum these column headers:

| Column | Description |
|---|---|
| `Team Name` or `Name` | The team's display name |
| `School Name` | The school the team represents |

Example:
```
Team Name,School Name
VADER,Wheaton Warrenville South HS
Team 404,Pekin Community HS
```

**Option B: Edit `scoreboard.py` defaults**

The `init_defaults()` method near the top of the file contains a hardcoded team list. Edit this list before launching if you want teams pre-loaded without a CSV:

```python
t_list = [
    ("Team Name", "School Name"),
    ...
]
```

---

### Step 2 — Load or configure your injects

**Option A: Import a CSV file**

In the **Management** tab, click **Import Injects CSV**. Required column headers:

| Column | Description |
|---|---|
| `Description ` *(note trailing space)* or `Inject` | Inject name/title |
| `Solution` | Answer key or grading notes |
| `Time to complete` | Duration in minutes |
| `Approx Release Time` | Scheduled release time (e.g. `10:55`) |
| `Approx Due Time` | Deadline (e.g. `11:25`) |

**Option B: Add injects manually**

In the **Management** tab, click **Add Inject Row** to create a blank row in the grid. Fill in:
- **Name** — short inject title
- **Description** — full inject prompt shown to graders as a tooltip
- **Solution** — answer key (shown as a tooltip to graders)
- **Duration(m)** — minutes teams have to complete it
- **Rel Time** — release time (HH:MM)
- **Due Time** — due time (HH:MM)

Click **SAVE GRID CHANGES** when done. Injects will appear in the Data Entry and Scores tabs.

---

### Step 3 — Configure Discord Webhooks (Optional)

Discord webhook integration allows you to broadcast injects to team channels directly from the app.

1. In Discord, go to your inject announcement channel → **Edit Channel** → **Integrations** → **Webhooks** → **New Webhook**.
2. Copy the webhook URL.
3. Open `team_scores.json` (or an exported JSON file) and add the webhook under `"webhooks"`:

```json
"webhooks": {
    "Channel Display Name": "https://discord.com/api/webhooks/..."
}
```

4. Re-import the JSON via **Management** → **Import JSON**, or add the webhook before the first run.

The channel selector dropdown at the top of the **Data Entry** tab will populate with your configured channels.

---

### Step 4 — Save/Load State

The app auto-saves all data to `autosave_scoreboard.json` every 5 minutes in the working directory.

To manually save your full session state, go to **Management** → **Export JSON**. To restore it on a future run, use **Import JSON**.

---

## Using the Application

### Leaderboard Tab

Displays a live-ranked table of all teams sorted by total score (descending).

| Column | Description |
|---|---|
| Rank | Current standing |
| Team | Team name |
| School | School affiliation |
| Uptime % | Raw uptime score |
| Injects | Sum of all inject final scores |
| Total | Combined score (Injects + Uptime + Red Team + Defense) |

The leaderboard updates automatically whenever scores are saved.

---

### Data Entry Tab

Used to grade inject submissions for each team.

1. Select a team from the left-hand list.
2. For each inject, fill in:
   - **Raw (0-10)** — the grader's raw score
   - **Sub Time** — the time the team submitted (HH:MM or HH:MM:SS). If a Discord broadcast time exists, lateness is calculated automatically.
   - **Mins Late** — minutes past the deadline. Auto-filled if Sub Time is provided; can be overridden manually.
   - **Final Score** — calculated automatically as `Raw - Mins Late` (minimum 0).
3. Click **SAVE SCORES** to commit the scores for that team.

**Tooltips:** Hover over an inject name to see the full description and solution key.

**Discord Broadcast:** Click the **Discord** button next to an inject to post the inject prompt to the selected Discord channel. The broadcast timestamp is recorded and used for automatic lateness calculation.

---

### Scores Tab

Displays a full scoring breakdown for all teams and allows entry of **Uptime** and **Red Team Assessment** raw scores.

#### Calculated fields

| Field | Formula |
|---|---|
| Uptime % | `Uptime / 50` |
| Injects % | `Injects Total / 50` |
| Defense against Red Team | `Red Team Assessment / 5` |
| Total | `0.33 × Uptime% + 0.33 × Injects% + 0.33 × Defense%` |

#### Entering scores

At the bottom of the tab, use the input bar to:
1. Select a **Team** from the dropdown.
2. Enter the raw **Uptime** score.
3. Enter the raw **Red Team Assessment** score.
4. Optionally add a **Remarks** note.
5. Click **Save**.

The grid and leaderboard update immediately. Click **Refresh** at any time to recalculate.

---

### Management Tab

Manages inject configuration and data import/export.

| Button | Action |
|---|---|
| Import Teams CSV | Load teams from a CSV file |
| Import Injects CSV | Load injects from a CSV file |
| Add Inject Row | Add a blank inject row to the grid |
| SAVE GRID CHANGES | Commit all edits in the inject grid |
| Export JSON | Save full session state to a JSON file |
| Import JSON | Restore session state from a JSON file |

You can edit inject names, descriptions, solutions, durations, release times, and due times directly in the grid. Click **Delete** on any row to remove that inject. Always click **SAVE GRID CHANGES** after editing.

---

## JSON State File Structure

The exported/autosaved JSON has the following structure:

```json
{
    "teams": {
        "Team Name": {
            "school": "School Name",
            "uptime": 0.0,
            "red_team": 0.0,
            "defense": 0.0,
            "remarks": "",
            "injects": {
                "Inject Name": {
                    "raw": 10.0,
                    "sub_time": "11:30",
                    "late": 5,
                    "final": 5.0
                }
            }
        }
    },
    "inject_data": {
        "Inject Name": {
            "desc": "Full inject description",
            "sol": "Answer key",
            "time": "30",
            "release": "10:55",
            "due": "11:25"
        }
    },
    "webhooks": {
        "Channel Name": "https://discord.com/api/webhooks/..."
    },
    "broadcast_times": {
        "Inject Name": "10:55:00"
    }
}
```

You can edit this file directly to pre-configure webhooks, teams, or injects before launching the app, then use **Import JSON** to load it.

---

## Workflow Summary (Day of Competition)

1. `python scoreboard.py`
2. **Management** → Import Teams CSV and Import Injects CSV (or Import JSON if resuming)
3. Configure Discord webhooks in the JSON and import
4. As each inject is released: **Data Entry** tab → click **Discord** to broadcast to teams
5. As submissions come in: select each team, fill in Raw score and Sub Time, click **SAVE SCORES**
6. After the red team exercise: **Scores** tab → enter Uptime and Red Team Assessment for each team
7. Monitor **Leaderboard** tab for live standings
8. **Management** → Export JSON to archive final results
