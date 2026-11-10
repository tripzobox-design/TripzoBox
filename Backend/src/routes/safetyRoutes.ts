import { Router } from 'express';
import {
  requestPhoneOtp,
  verifyPhoneOtp,
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
  initiateIdentityVerification,
  getIdentityStatus,
  simulateIdentityResult,
  submitTravellerReview,
  getUserReviews,
  reportTravellerReview,
  getReviewableCompanions,
  submitReport,
  getMyReports,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getEmergencyInfo,
  shareTripWithEmergencyContact,
  getAdminReports,
  getAdminReportById,
  updateReportStatus,
  suspendUserAccount,
  restoreUserAccount,
  getModerationAuditLogs,
} from '../controllers/safetyController.js';
import {
  requestDocumentOtp,
  verifyDocumentOtp,
} from '../controllers/vaultController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Rate limiter for OTP requests (5 per 15 mins)
const otpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many OTP verification requests. Please try again later.',
});

// Rate limiter for reports (10 per hour)
const reportLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Too many reports submitted. Please wait before submitting another report.',
});

// 1. Mobile Phone OTP
router.post('/phone/request-otp', requireAuth, otpLimiter, requestPhoneOtp);
router.post('/phone/verify-otp', requireAuth, verifyPhoneOtp);

// 1.1 Email Change OTP
router.post('/email/request-otp', requireAuth, otpLimiter, requestEmailChangeOtp);
router.post('/email/verify-otp', requireAuth, verifyEmailChangeOtp);

// 1.2 Document Verification OTP
router.post('/document/request-otp', requireAuth, otpLimiter, requestDocumentOtp);
router.post('/document/verify-otp', requireAuth, verifyDocumentOtp);

// 2. Identity Verification
router.post('/identity/initiate', requireAuth, initiateIdentityVerification);
router.get('/identity/status', requireAuth, getIdentityStatus);
router.post('/identity/simulate-result', requireAuth, simulateIdentityResult);

// 3. Traveller Reviews & Reputation
router.post('/reviews', requireAuth, submitTravellerReview);
router.get('/reviews/companions', requireAuth, getReviewableCompanions);
router.get('/reviews/user/:userId', getUserReviews);
router.post('/reviews/:reviewId/report', requireAuth, reportTravellerReview);

// 4. Report & Block
router.post('/reports', requireAuth, reportLimiter, submitReport);
router.get('/reports/my', requireAuth, getMyReports);
router.post('/block', requireAuth, blockUser);
router.post('/unblock', requireAuth, unblockUser);
router.get('/blocked-users', requireAuth, getBlockedUsers);

// 5. Emergency & Trip Safety
router.get('/emergency-info', getEmergencyInfo);
router.post('/emergency-share', requireAuth, shareTripWithEmergencyContact);

// 6. Admin Moderation (strictly protected by requireAuth + requireAdmin)
router.get('/admin/reports', requireAuth, requireAdmin, getAdminReports);
router.get('/admin/reports/:reportId', requireAuth, requireAdmin, getAdminReportById);
router.put('/admin/reports/:reportId/status', requireAuth, requireAdmin, updateReportStatus);
router.post('/admin/users/:userId/suspend', requireAuth, requireAdmin, suspendUserAccount);
router.post('/admin/users/:userId/restore', requireAuth, requireAdmin, restoreUserAccount);
router.get('/admin/audit-logs', requireAuth, requireAdmin, getModerationAuditLogs);

export default router;

