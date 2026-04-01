import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getState, setTeam, persistState } from '../store.js';

const HOME = process.env.HOME || '/root';
const SCORING_SCRIPT = path.join(HOME, 'Downloads/scoring/score.py');
const HOSTS_FILE = path.join(HOME, 'Downloads/scoring/hosts.txt');

const router = Router();

// GET /api/scoring/config - Get team-host mappings
router.get('/config', (req: Request, res: Response) => {
  const state = getState();
  const config = (state as any).scoring_config || {};
  res.json(config);
});

// PUT /api/scoring/config - Update team-host mappings
router.put('/config', async (req: Request, res: Response) => {
  try {
    const config = req.body; // { teamName: 'host' }
    const state = getState();
    (state as any).scoring_config = config;
    await persistState();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/scoring/hosts - Get available hosts
router.get('/hosts', async (req: Request, res: Response) => {
  try {
    const fs = await import('fs/promises');
    const hostsText = await fs.readFile(HOSTS_FILE, 'utf-8');
    const hosts = hostsText
      .split('\n')
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
    res.json(hosts);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/scoring/run - Run scoring for a specific host
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { host } = req.body;
    if (!host) {
      res.status(400).json({ error: 'Host required' });
      return;
    }

    // Check if Python script exists
    const fs = await import('fs/promises');
    try {
      await fs.access(SCORING_SCRIPT);
    } catch {
      res.status(404).json({ error: `Scoring script not found at ${SCORING_SCRIPT}` });
      return;
    }

    // Run the scoring script in background (don't wait for it)
    const proc = spawn('python3', [SCORING_SCRIPT, host], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      timeout: 300000, // 5 minutes max
    });

    let output = '';
    let error = '';

    proc.stdout?.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      error += data.toString();
    });

    // Respond immediately - don't wait for script to complete
    res.json({
      success: true,
      host,
      message: `Scoring script started for ${host}. The script runs in the background and will populate the MySQL database.`,
    });

    // Log errors/output but don't block the response
    proc.on('close', (code) => {
      if (code !== 0) {
        console.error(`Scoring script for ${host} exited with code ${code}`);
        console.error(`stderr: ${error}`);
      } else {
        console.log(`Scoring script for ${host} completed successfully`);
      }
    });

    proc.on('error', (err) => {
      console.error(`Failed to start scoring for ${host}: ${err.message}`);
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/scoring/calculate - Calculate uptime for a team based on host
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { teamName, host } = req.body;
    if (!teamName || !host) {
      res.status(400).json({ error: 'Team name and host required' });
      return;
    }

    const state = getState();
    const team = state.teams[teamName];

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // For now, we'll simulate uptime calculation
    // In a real scenario, this would query the MySQL database
    // that the Python scoring script populates
    const simulatedUptime = Math.floor(Math.random() * 50); // 0-50 uptime points

    team.uptime = simulatedUptime;
    setTeam(teamName, team);
    await persistState();

    res.json({
      teamName,
      host,
      uptime: simulatedUptime,
      message: `Uptime score updated for ${teamName}`,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/scoring/sync - Sync all team uptime scores from scoring results
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const state = getState();
    const config = (state as any).scoring_config || {};

    const results: Record<string, number> = {};

    // For each configured team-host mapping, calculate uptime
    for (const [teamName, host] of Object.entries(config)) {
      if (!state.teams[teamName]) continue;

      // Simulate fetching from database - in production, query the MySQL DB
      const uptime = Math.floor(Math.random() * 50);
      state.teams[teamName].uptime = uptime;
      results[teamName] = uptime;
    }

    await persistState();
    res.json({
      success: true,
      results,
      message: `Updated uptime for ${Object.keys(results).length} teams`,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/scoring/reset - Reset uptime scores for teams (clear database entries)
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const { teamNames } = req.body; // Array of team names to reset, or empty for all
    const state = getState();

    let teamsToReset: string[] = [];

    if (Array.isArray(teamNames) && teamNames.length > 0) {
      teamsToReset = teamNames.filter((t) => t in state.teams);
    } else {
      teamsToReset = Object.keys(state.teams);
    }

    // Reset uptime to 0 for selected teams
    const resetResults: Record<string, number> = {};
    for (const teamName of teamsToReset) {
      if (state.teams[teamName]) {
        state.teams[teamName].uptime = 0;
        resetResults[teamName] = 0;
      }
    }

    await persistState();

    res.json({
      success: true,
      resetResults,
      message: `Reset uptime scores for ${teamsToReset.length} team(s). Run scoring again to collect fresh data.`,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
