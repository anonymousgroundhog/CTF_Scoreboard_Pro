import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { getState, setState, setTeam, setInject, persistState } from '../store.js';
import { Team, InjectDefinition } from '../types.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/export - Download full JSON state
router.get('/export', (req: Request, res: Response) => {
  try {
    const state = getState();
    res.setHeader('Content-Disposition', 'attachment; filename="ctf-scoreboard-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(state, null, 2));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/import/json - Upload and replace state from JSON
router.post('/import/json', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const data = JSON.parse(req.file.buffer.toString('utf-8'));
    setState(data);
    await persistState();

    res.json(getState());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/import/teams-csv - Upload and upsert teams from CSV
router.post('/import/teams-csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const csvText = req.file.buffer.toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    const state = getState();

    for (const row of records) {
      const name = row['Team Name'] || row['Name'];
      if (!name) continue;

      const school = row['School Name'] || 'N/A';

      // Initialize if new team
      if (!state.teams[name]) {
        const injectKeys = Object.keys(state.inject_data);
        const newTeam: Team = {
          school,
          uptime: 0,
          red_team: 0,
          defense: 0,
          remarks: '',
          injects: {},
        };
        for (const injectName of injectKeys) {
          newTeam.injects[injectName] = { raw: 10.0, sub_time: '', late: 0, final: 10.0 };
        }
        setTeam(name, newTeam);
      } else {
        // Update school if existing
        state.teams[name].school = school;
        setTeam(name, state.teams[name]);
      }
    }

    await persistState();
    res.json(state.teams);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/import/injects-csv - Upload and upsert injects from CSV
router.post('/import/injects-csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const csvText = req.file.buffer.toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    const state = getState();

    for (const row of records) {
      // Accept "Description " (with trailing space) or "Inject" column
      const name = row['Description '] || row['Inject'];
      if (!name) continue;

      const inject: InjectDefinition = {
        desc: name, // Use the name as description if not provided separately
        sol: row['Solution'] || '',
        time: row['Time to complete'] || '30',
        release: row['Approx Release Time'] || '',
        due: row['Approx Due Time'] || '',
      };

      setInject(name, inject);

      // Initialize this inject on all existing teams
      for (const teamName in state.teams) {
        if (!state.teams[teamName].injects[name]) {
          state.teams[teamName].injects[name] = { raw: 10.0, sub_time: '', late: 0, final: 10.0 };
        }
        setTeam(teamName, state.teams[teamName]);
      }
    }

    await persistState();
    res.json(state.inject_data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
