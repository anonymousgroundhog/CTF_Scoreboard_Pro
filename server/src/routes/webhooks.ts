import { Router, Request, Response } from 'express';
import { getState, setWebhooks, persistState } from '../store.js';

const router = Router();

// GET /api/webhooks
router.get('/', (req: Request, res: Response) => {
  const state = getState();
  res.json(state.webhooks);
});

// PUT /api/webhooks - Replace all webhooks
router.put('/', async (req: Request, res: Response) => {
  try {
    const webhooks = req.body; // { [channelName]: url }
    setWebhooks(webhooks);
    await persistState();
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/webhooks/:channel
router.delete('/:channel', async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;
    const state = getState();
    delete state.webhooks[channel];
    setWebhooks(state.webhooks);
    await persistState();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
