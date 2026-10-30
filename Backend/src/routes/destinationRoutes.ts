import { Router } from 'express';
import {
  getDestinations,
  getDestinationBySlug,
  createDestination,
} from '../controllers/destinationController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getDestinations);
router.get('/:slug', optionalAuth, getDestinationBySlug);
router.post('/', requireAuth, createDestination);

export default router;

