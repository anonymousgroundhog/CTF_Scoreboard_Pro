import { Router, Request, Response } from 'express';
import { getState } from '../store.js';

const router = Router();

// GET /api/state - Return complete state
router.get('/', (req: Request, res: Response) => {
  const state = getState();
  res.json(state);
});

export default router;
