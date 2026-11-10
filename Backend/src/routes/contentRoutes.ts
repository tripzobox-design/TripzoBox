import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// Public CMS Content routes
router.get('/homepage', adminController.getPublicHomepageContent);
router.get('/pages/:slug', adminController.getPublicPageContent);

export default router;

