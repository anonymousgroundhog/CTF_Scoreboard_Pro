import { Router, Request, Response } from 'express';
import { getState, setBroadcastTime, persistState, getWebhook } from '../store.js';

const router = Router();

// POST /api/broadcast/:injectName - Send Discord embed and record timestamp
router.post('/:injectName', async (req: Request, res: Response) => {
  try {
    const { injectName } = req.params;
    const { channel } = req.body;

    const state = getState();
    const inject = state.inject_data[injectName];

    if (!inject) {
      res.status(404).json({ error: 'Inject not found' });
      return;
    }

    const webhookUrl = state.webhooks[channel];
    if (!webhookUrl) {
      res.status(400).json({ error: 'Webhook not configured for channel' });
      return;
    }

    // Record broadcast time
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8); // HH:MM:SS

    // Create Discord embed
    const payload = {
      embeds: [
        {
          title: `🚀 INJECT: ${injectName}`,
          description: inject.desc,
          color: 3447003,
          fields: [
            { name: 'Duration', value: `${inject.time}m` },
            { name: 'Due', value: inject.due },
          ],
        },
      ],
    };

    // Send to Discord
    try {
      const discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!discordRes.ok) {
        console.error('Discord webhook failed:', discordRes.status, await discordRes.text());
      }
    } catch (discordErr) {
      console.error('Failed to send Discord webhook:', discordErr);
      // Continue anyway - record the broadcast time even if Discord fails
    }

    // Record broadcast time
    setBroadcastTime(injectName, timeStr);
    await persistState();

    res.json({ broadcast_time: timeStr });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/broadcast_times
router.get('/times', (req: Request, res: Response) => {
  const state = getState();
  res.json(state.broadcast_times);
});

export default router;
