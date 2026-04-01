import { Router, Request, Response } from 'express';
import { getState, getTeam, setTeam, deleteTeam, persistState } from '../store.js';
import { Team } from '../types.js';

const router = Router();

// GET /api/teams
router.get('/', (req: Request, res: Response) => {
  const state = getState();
  res.json(state.teams);
});

// POST /api/teams - Create a new team
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, school } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Team name required' });
      return;
    }

    const state = getState();
    const injectKeys = Object.keys(state.inject_data);

    const newTeam: Team = {
      school: school || 'N/A',
      uptime: 0,
      red_team: 0,
      defense: 0,
      remarks: '',
      injects: {},
    };

    // Initialize injects for this team
    for (const injectName of injectKeys) {
      newTeam.injects[injectName] = { raw: 10.0, sub_time: '', late: 0, final: 10.0 };
    }

    setTeam(name, newTeam);
    await persistState();

    res.json(newTeam);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/teams/:name - Update team (uptime, red_team, remarks, school)
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const team = getTeam(name);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if ('school' in req.body) team.school = req.body.school;
    if ('uptime' in req.body) team.uptime = req.body.uptime;
    if ('red_team' in req.body) team.red_team = req.body.red_team;
    if ('defense' in req.body) team.defense = req.body.defense;
    if ('remarks' in req.body) team.remarks = req.body.remarks;

    setTeam(name, team);
    await persistState();

    res.json(team);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/teams/:name/injects - Batch save all inject scores for a team
router.put('/:name/injects', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const team = getTeam(name);

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const scores = req.body; // { [injectName]: { raw, sub_time, late, final } }

    for (const injectName in scores) {
      if (!team.injects[injectName]) {
        team.injects[injectName] = { raw: 0, sub_time: '', late: 0, final: 0 };
      }
      const updates = scores[injectName];
      if ('raw' in updates) team.injects[injectName].raw = updates.raw;
      if ('sub_time' in updates) team.injects[injectName].sub_time = updates.sub_time;
      if ('late' in updates) team.injects[injectName].late = updates.late;
      if ('final' in updates) team.injects[injectName].final = updates.final;
    }

    setTeam(name, team);
    await persistState();

    res.json(team);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/teams/:name
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    deleteTeam(name);
    await persistState();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
