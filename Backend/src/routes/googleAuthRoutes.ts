import { Router } from 'express';
import {
  googleOAuthInit,
  googleOAuthCallback,
  exchangeGoogleOAuthCode,
} from '../controllers/authController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const googleOAuthLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

router.get('/google', googleOAuthLimiter, googleOAuthInit);
router.get('/google/callback', googleOAuthLimiter, googleOAuthCallback);
router.post('/google/exchange', googleOAuthLimiter, exchangeGoogleOAuthCode);

export default router;

