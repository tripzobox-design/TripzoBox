import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import {
  submitTravellerReview,
  getUserReviews,
  getTripReviewEligibility,
  getTripReviews,
  getUserReviewSummary,
  reportTravellerReview,
} from '../controllers/safetyController.js';

const router = Router();

// ============================================================================
// INDIVIDUAL TRAVELLER RATING & REVIEW SYSTEM ROUTES
// ============================================================================

// Submit a new traveller rating and review (authenticated)
router.post('/', requireAuth, submitTravellerReview);

// Get all verified reviews & distribution for a specific traveller (public)
router.get('/user/:userId', getUserReviews);

// Get summary of reviews & category averages for a user (public)
router.get('/summary/:userId', getUserReviewSummary);

// Get review eligibility and companions list for a specific trip
router.get('/trip/:tripId', optionalAuth, getTripReviewEligibility);

// Explicit eligibility endpoint
router.get('/eligibility/:tripId', optionalAuth, getTripReviewEligibility);

// Get all reviews for a trip
router.get('/trip/:tripId/all', getTripReviews);

// Report a review (authenticated)
router.post('/:reviewId/report', requireAuth, reportTravellerReview);

export default router;
