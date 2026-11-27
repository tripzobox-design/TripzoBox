import { Router } from 'express';
import {
  getTrips,
  getMyTrips,
  getSavedTrips,
  toggleSaveTrip,
  getTripById,
  getTripByRoomCode,
  joinTripByRoomCode,
  createTrip,
  updateTrip,
  deleteTrip,
  transferTripLeadershipHandler,
  updateRoomType,
  requestJoinTrip,
  getTripJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
  cancelJoinRequest,
} from '../controllers/tripController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createTripSchema, joinRequestSchema } from '../validators/tripValidator.js';

const router = Router();

// Public / Discover trips (with optional auth for personal state)
router.get('/', optionalAuth, getTrips);
router.get('/my', requireAuth, getMyTrips);
router.get('/saved', requireAuth, getSavedTrips);
router.post('/saved/:id/toggle', requireAuth, toggleSaveTrip);

// Room Code access
router.get('/code/:code', optionalAuth, getTripByRoomCode);
router.post('/join-by-code', requireAuth, joinTripByRoomCode);

router.get('/:id', optionalAuth, getTripById);
router.post('/', requireAuth, validateRequest({ body: createTripSchema }), createTrip);
router.put('/:id', requireAuth, updateTrip);
router.delete('/:id', requireAuth, deleteTrip);
router.post('/:id/transfer-leadership', requireAuth, transferTripLeadershipHandler);
router.put('/:id/room-type', requireAuth, updateRoomType);

// Join Requests
router.post('/:id/join', requireAuth, validateRequest({ body: joinRequestSchema }), requestJoinTrip);
router.get('/:id/requests', requireAuth, getTripJoinRequests);
router.post('/:id/requests/:requestId/accept', requireAuth, acceptJoinRequest);
router.post('/:id/requests/:requestId/decline', requireAuth, declineJoinRequest);
router.delete('/:id/requests/:requestId', requireAuth, cancelJoinRequest);

export default router;

