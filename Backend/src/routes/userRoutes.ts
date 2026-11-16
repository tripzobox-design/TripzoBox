import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrfProtection } from '../middleware/csrf.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import {
  deleteCurrentAccount,
  getDeletionPreflight,
  rejectArbitraryUserDeletion,
  sendDeletionConfirmationOtp,
  verifyDeletionReauth,
} from '../controllers/accountDeletionController.js';

const router = Router();

const deletionOtpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Too many account deletion code requests. Please try again later.',
});

const deletionExecuteLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many account deletion attempts. Please try again later.',
});

router.get('/me/deletion-preflight', requireAuth, getDeletionPreflight);
router.post(
  '/me/deletion-reauth',
  requireAuth,
  requireCsrfProtection,
  deletionExecuteLimiter,
  verifyDeletionReauth
);
router.post(
  '/me/deletion-otp',
  requireAuth,
  requireCsrfProtection,
  deletionOtpLimiter,
  sendDeletionConfirmationOtp
);
router.delete(
  '/me',
  requireAuth,
  requireCsrfProtection,
  deletionExecuteLimiter,
  deleteCurrentAccount
);

// Explicit IDOR protection against DELETE /api/users/:id self-escalation attempts
router.delete('/:id', requireAuth, requireCsrfProtection, rejectArbitraryUserDeletion);

export default router;

