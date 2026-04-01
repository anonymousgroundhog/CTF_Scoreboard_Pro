import { Router, Request, Response } from 'express';
import { getState, setTeam, setInject, deleteInject, persistState } from '../store.js';
import { InjectDefinition } from '../types.js';

const router = Router();

// GET /api/injects
router.get('/', (req: Request, res: Response) => {
  const state = getState();
  res.json(state.inject_data);
});

// POST /api/injects - Create a new inject
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, desc, sol, time, release, due } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Inject name required' });
      return;
    }

    const state = getState();
    const inject: InjectDefinition = {
      desc: desc || '',
      sol: sol || '',
      time: time || '30',
      release: release || '',
      due: due || '',
    };

    setInject(name, inject);

    // Initialize this inject key on all existing teams
    for (const teamName in state.teams) {
      if (!state.teams[teamName].injects[name]) {
        state.teams[teamName].injects[name] = { raw: 10.0, sub_time: '', late: 0, final: 10.0 };
      }
      setTeam(teamName, state.teams[teamName]);
    }

    await persistState();
    res.json(inject);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/injects/:name - Update inject metadata
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const state = getState();
    const inject = state.inject_data[name];

    if (!inject) {
      res.status(404).json({ error: 'Inject not found' });
      return;
    }

    if ('desc' in req.body) inject.desc = req.body.desc;
    if ('sol' in req.body) inject.sol = req.body.sol;
    if ('time' in req.body) inject.time = req.body.time;
    if ('release' in req.body) inject.release = req.body.release;
    if ('due' in req.body) inject.due = req.body.due;

    setInject(name, inject);
    await persistState();

    res.json(inject);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/injects/:name
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    deleteInject(name);
    await persistState();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/injects/batch - Replace all inject_data at once (SAVE GRID CHANGES)
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const newInjectData = req.body; // { [name]: { desc, sol, time, release, due } }
    const state = getState();

    // Replace all inject_data
    state.inject_data = newInjectData;

    // Reconcile team inject keys
    const newInjectKeys = Object.keys(newInjectData);
    for (const teamName in state.teams) {
      const team = state.teams[teamName];
      // Initialize missing injects
      for (const injectName of newInjectKeys) {
        if (!team.injects[injectName]) {
          team.injects[injectName] = { raw: 10.0, sub_time: '', late: 0, final: 10.0 };
        }
      }
      setTeam(teamName, team);
    }

    await persistState();
    res.json(newInjectData);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
