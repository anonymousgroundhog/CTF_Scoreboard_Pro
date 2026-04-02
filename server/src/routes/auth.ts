import { Router, Request, Response } from 'express';
import { generateToken, verifyPassword, ADMIN_PASSWORD_HASH } from '../auth.js';

const router = Router();

// POST /api/auth/login - Authenticate and get JWT token
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password required' });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Generate and return token
    const token = generateToken();
    res.json({ token, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/auth/verify - Verify token
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ valid: false });
      return;
    }

    const valid = require('../auth.js').verifyToken(token);
    res.json({ valid });
  } catch (err) {
    res.status(500).json({ valid: false, error: String(err) });
  }
});

export default router;
