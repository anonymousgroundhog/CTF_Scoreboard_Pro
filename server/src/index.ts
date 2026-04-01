import express from 'express';
import cors from 'cors';
import { loadState, persistState } from './store.js';
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

// Mount routes
app.use('/api/state', stateRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/injects', injectsRouter);
app.use('/api/broadcast', broadcastRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/scoring', scoringRouter);
app.use('/api', importExportRouter);

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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
