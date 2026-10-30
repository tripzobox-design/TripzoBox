import { Router } from 'express';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getEmergencyContacts,
  createEmergencyContact,
  deleteEmergencyContact,
  getTrustedContacts,
  toggleTrustedContactAccess,
  getSharedAccessRecords,
  createSharedAccess,
  revokeSharedAccess,
  getVaultSettings,
  updateEmergencyConfig,
  updateSecuritySettings,
} from '../controllers/vaultController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Documents
router.get('/documents', getDocuments);
router.post('/documents', createDocument);
router.put('/documents/:id', updateDocument);
router.delete('/documents/:id', deleteDocument);

// Emergency Contacts
router.get('/emergency-contacts', getEmergencyContacts);
router.post('/emergency-contacts', createEmergencyContact);
router.delete('/emergency-contacts/:id', deleteEmergencyContact);

// Trusted Contacts
router.get('/trusted-contacts', getTrustedContacts);
router.put('/trusted-contacts/:id/toggle', toggleTrustedContactAccess);

// Shared Access
router.get('/shared-access', getSharedAccessRecords);
router.post('/shared-access', createSharedAccess);
router.delete('/shared-access/:id', revokeSharedAccess);

// Vault Security & Emergency Configuration
router.get('/settings', getVaultSettings);
router.put('/emergency-config', updateEmergencyConfig);
router.put('/security-settings', updateSecuritySettings);

export default router;

