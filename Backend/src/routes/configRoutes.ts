import { Router } from 'express';
import { getPublicAuthConfigHandler } from '../controllers/configController.js';

const router = Router();

// Public auth providers availability configuration
router.get('/auth', getPublicAuthConfigHandler);

export default router;

