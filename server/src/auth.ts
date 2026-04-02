import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { Request, Response, NextlewareFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-me-in-production';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$mt.PFr/Ba0IrXrzyXxJGBeFfi4N6scaUfKh76t9eH/6sNBadCLAJW'; // Default: "admin"

export interface AuthRequest extends Request {
  user?: { authenticated: boolean };
}

// Generate a password hash (run once to create ADMIN_PASSWORD_HASH)
export async function generatePasswordHash(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

// Generate JWT token
export function generateToken(): string {
  return jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// Middleware to check authentication
export function authMiddleware(req: AuthRequest, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.user = { authenticated: true };
  next();
}

// Public middleware (no auth required)
export function publicMiddleware(req: AuthRequest, res: Response, next: Function) {
  req.user = { authenticated: false };
  next();
}

export { ADMIN_PASSWORD_HASH };
