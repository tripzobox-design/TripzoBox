import { Router } from 'express';
import {
  getThreads,
  getMessagesByTrip,
  sendMessage,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/threads', getThreads);
router.get('/threads/:tripId', getMessagesByTrip);
router.post('/threads/:tripId', sendMessage);

export default router;

