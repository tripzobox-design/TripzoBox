import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimiter = (options: {
  windowMs: number; // e.g. 15 * 60 * 1000 (15 min)
  max: number; // e.g. 20 attempts
  message?: string;
}) => {
  const { windowMs, max, message = 'Too many requests from this IP, please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, bypass rate limiter
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      memoryStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      sendError(res, message, 429);
      return;
    }

    record.count += 1;
    next();
  };
};

