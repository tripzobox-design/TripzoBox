import { Router } from 'express';
import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../controllers/diaryController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getEntries);
router.post('/', createEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;

