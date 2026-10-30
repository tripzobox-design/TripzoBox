import { Router } from 'express';
import {
  getStories,
  getStoryBySlug,
  createStory,
  updateStory,
  deleteStory,
  likeStory,
} from '../controllers/storyController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getStories);
router.get('/:slug', optionalAuth, getStoryBySlug);
router.post('/', requireAuth, createStory);
router.put('/:id', requireAuth, updateStory);
router.delete('/:id', requireAuth, deleteStory);
router.post('/:id/like', requireAuth, likeStory);

export default router;

