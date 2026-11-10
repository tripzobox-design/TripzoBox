import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// Public Platform Settings
router.get('/public', adminController.getPublicSettings);

export default router;

