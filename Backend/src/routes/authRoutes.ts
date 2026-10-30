import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  setSecurityQuestion,
  requestReset,
  verifyOtp,
  resetPassword,
  getRecoveryCodes,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  securityQuestionSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';

const router = Router();

// Rate limiting for auth endpoints (20 per 15 min)
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

router.post('/signup', authLimiter, validateRequest({ body: signupSchema }), signup);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, validateRequest({ body: updateProfileSchema }), updateProfile);
router.post(
  '/security-question',
  requireAuth,
  validateRequest({ body: securityQuestionSchema }),
  setSecurityQuestion
);
router.get('/recovery-codes', requireAuth, getRecoveryCodes);

// Forgot Password Flow
router.post(
  '/forgot-password/request',
  authLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  requestReset
);
router.post(
  '/forgot-password/verify-otp',
  authLimiter,
  validateRequest({ body: verifyOtpSchema }),
  verifyOtp
);
router.post(
  '/forgot-password/reset',
  authLimiter,
  validateRequest({ body: resetPasswordSchema }),
  resetPassword
);

export default router;

