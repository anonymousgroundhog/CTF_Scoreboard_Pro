import express from 'express';
import cors from 'cors';
import { loadState, persistState } from './store.js';
import { authMiddleware, publicMiddleware } from './auth.js';
import authRouter from './routes/auth.js';
import stateRouter from './routes/state.js';
import teamsRouter from './routes/teams.js';
import injectsRouter from './routes/injects.js';
import broadcastRouter from './routes/broadcast.js';
import webhooksRouter from './routes/webhooks.js';
import importExportRouter from './routes/importExport.js';
import scoringRouter from './routes/scoring.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Public routes (no auth required)
app.use('/api/auth', authRouter);
app.use('/api/state', publicMiddleware, stateRouter); // State is public (for leaderboard)

// Protected routes (auth required)
app.use('/api/teams', authMiddleware, teamsRouter);
app.use('/api/injects', authMiddleware, injectsRouter);
app.use('/api/broadcast', authMiddleware, broadcastRouter);
app.use('/api/webhooks', authMiddleware, webhooksRouter);
app.use('/api/scoring', authMiddleware, scoringRouter);
app.use('/api/import', authMiddleware);
app.use('/api/export', authMiddleware);
app.use('/api', authMiddleware, importExportRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Startup
async function start() {
  try {
    await loadState();

    // Periodic persist (5-minute backup)
    setInterval(async () => {
      try {
        await persistState();
      } catch (err) {
        console.error('Auto-persist failed:', err);
      }
    }, 5 * 60 * 1000);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
