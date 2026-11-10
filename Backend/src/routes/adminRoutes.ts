import { Router } from 'express';
import {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireAdminOnly,
  requireModerator,
  requireContentManager,
  requireSupport,
} from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadFile } from '../controllers/uploadController.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// ============================================================================
// PUBLIC ADMIN AUTH
// ============================================================================
router.post('/auth/login', adminController.adminLogin);

// ============================================================================
// PROTECTED ADMIN ENDPOINTS (Require Authentication + Staff/Admin Role)
// ============================================================================
router.use(requireAuth);
router.use(requireAdmin);

// Current Admin Profile
router.get('/me', adminController.getAdminMe);
router.put('/me', adminController.updateAdminProfile);
router.put('/me/password', adminController.changeAdminPassword);

// Dashboard Analytics
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', requireAdminOnly, adminController.updateUser);
router.patch('/users/:id/suspend', requireModerator, adminController.toggleUserSuspension);
router.patch('/users/:id/require-password-reset', requireAdminOnly, adminController.requireUserPasswordReset);
router.post('/users/:id/revoke-sessions', requireAdminOnly, adminController.revokeUserSessions);
router.post('/users/:id/notes', requireSupport, adminController.addUserModerationNote);
router.delete('/users/:id', requireAdminOnly, adminController.deleteUser);

// Trip Management
router.get('/trips', adminController.getAllTrips);
router.get('/trips/:id', adminController.getTripById);
router.put('/trips/:id', requireModerator, adminController.updateTrip);
router.patch('/trips/:id/status', requireModerator, adminController.updateTripStatus);
router.delete('/trips/:id', requireAdminOnly, adminController.deleteTrip);

// Join Requests
router.get('/join-requests', adminController.getAllJoinRequests);
router.get('/join-requests/:id', adminController.getJoinRequestById);
router.patch('/join-requests/:id', requireModerator, adminController.updateJoinRequestStatus);
router.delete('/join-requests/:id', requireAdminOnly, adminController.deleteJoinRequest);

// Moderation & Trust & Safety
router.get('/reports', adminController.getAllReports);
router.patch('/reports/:id/resolve', requireModerator, adminController.resolveReport);
router.get('/verifications', adminController.getAllVerifications);
router.patch('/verifications/:id', requireModerator, adminController.reviewVerification);
router.get('/blocks', adminController.getAllBlocks);
router.delete('/blocks/:id', requireModerator, adminController.unblockUser);
router.get('/reviews', adminController.getAllReviews);
router.patch('/reviews/:id/status', requireModerator, adminController.updateReviewStatus);
router.delete('/reviews/:id', requireModerator, adminController.deleteReview);

// Broadcast Notifications
router.post('/notifications/broadcast', requireAdminOnly, adminController.broadcastNotification);
router.get('/notifications/history', adminController.getNotificationHistory);

// Message Moderation
router.get('/messages/flagged', requireModerator, adminController.getFlaggedMessages);
router.delete('/messages/flagged/:id', requireModerator, adminController.deleteFlaggedMessage);

// CMS Content Management
router.get('/cms', adminController.getCmsContent);
router.put('/cms', requireContentManager, adminController.updateCmsContent);

// Destinations Management
router.get('/destinations', adminController.getAllDestinationsAdmin);
router.post('/destinations', requireContentManager, adminController.createDestinationAdmin);
router.put('/destinations/:id', requireContentManager, adminController.updateDestinationAdmin);
router.delete('/destinations/:id', requireContentManager, adminController.deleteDestinationAdmin);

// Media Library
router.get('/media', adminController.getMediaFiles);
router.post('/media', requireContentManager, upload.single('file'), uploadFile);
router.delete('/media/:filename', requireContentManager, adminController.deleteMediaFile);

// Travel Diary Community Moderation
router.get('/diary', adminController.getAllDiaryEntries);
router.patch('/diary/:id/visibility', requireModerator, adminController.updateDiaryVisibility);
router.delete('/diary/:id', requireModerator, adminController.deleteDiaryEntry);

// Travel Packages
router.get('/packages', adminController.getAllPackages);
router.post('/packages', requireContentManager, adminController.createPackage);
router.put('/packages/:id', requireContentManager, adminController.updatePackage);
router.delete('/packages/:id', requireContentManager, adminController.deletePackage);

// Platform Settings & System Status
router.get('/settings', adminController.getPlatformSettings);
router.put('/settings', requireSuperAdmin, adminController.updatePlatformSettings);
router.get('/system/services', adminController.getSmsEmailStatus);
router.post('/system/test-service', requireAdminOnly, adminController.testSmsEmailDelivery);
router.get('/system/health', adminController.getSystemHealth);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/roles/permissions', adminController.getRolePermissions);

// Administrator & RBAC Management (Superadmin Only)
router.get('/admins', adminController.getAllAdmins);
router.post('/admins', requireSuperAdmin, adminController.createAdminAccount);
router.patch('/admins/:id/role', requireSuperAdmin, adminController.updateAdminRole);
router.delete('/admins/:id', requireSuperAdmin, adminController.deleteAdminAccount);

export default router;

