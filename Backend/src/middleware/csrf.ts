import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { AUTH_COOKIE_NAME } from '../utils/token.js';
import { sendError } from '../utils/response.js';

const getTrustedOrigins = (): string[] => [
  config.frontendUrl,
  config.adminUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

const isTrustedOrigin = (originValue: string): boolean => {
  try {
    const parsed = new URL(originValue);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const trusted = getTrustedOrigins();
    if (trusted.includes(origin)) return true;
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.tripzobox.com') ||
      origin.endsWith('.workers.dev') ||
      origin.endsWith('.pages.dev')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Protects sensitive state-changing endpoints against Cross-Site Request Forgery (CSRF),
 * especially when authenticated via HttpOnly cookies.
 */
export const requireCsrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }

  const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  if (originHeader && !isTrustedOrigin(originHeader)) {
    sendError(res, 'CSRF protection rejected untrusted request origin.', 403);
    return;
  }

  const refererHeader = typeof req.headers.referer === 'string' ? req.headers.referer.trim() : '';
  if (refererHeader && !isTrustedOrigin(refererHeader)) {
    sendError(res, 'CSRF protection rejected untrusted referer header.', 403);
    return;
  }

  const hasAuthCookie = Boolean(req.cookies?.[AUTH_COOKIE_NAME]);
  const hasBearerHeader =
    typeof req.headers.authorization === 'string' &&
    req.headers.authorization.startsWith('Bearer ');

  // Cookie-authenticated mutations require an explicit custom anti-CSRF header that browsers
  // will never attach to cross-origin simple requests (e.g. HTML form submits).
  if (hasAuthCookie && !hasBearerHeader) {
    const requestedWith = String(req.headers['x-requested-with'] || '').trim();
    if (!requestedWith) {
      sendError(
        res,
        'CSRF protection requires explicit application request header (X-Requested-With).',
        403
      );
      return;
    }
  }

  next();
};

