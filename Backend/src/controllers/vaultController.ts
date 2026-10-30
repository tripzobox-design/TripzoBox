import { Response, NextFunction } from 'express';
import { VaultDocument } from '../models/VaultDocument.js';
import {
  EmergencyContact,
  TrustedContact,
  SharedAccessRecord,
  VaultSettings,
} from '../models/VaultSettings.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const docs = await VaultDocument.find({ userId: req.user.id }).sort({ createdAt: -1 });
    sendSuccess(res, docs);
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const newDoc = new VaultDocument({
      ...req.body,
      id: `doc_${Date.now()}`,
      userId: req.user.id,
      uploadedAt: new Date().toLocaleDateString('en-GB'),
    });

    await newDoc.save();
    sendSuccess(res, newDoc, 'Document added to Vault', 201);
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const doc = await VaultDocument.findOne({ id, userId: req.user.id });

    if (!doc) {
      sendError(res, 'Document not found or unauthorized', 404);
      return;
    }

    Object.assign(doc, req.body);
    await doc.save();

    sendSuccess(res, doc, 'Document updated');
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const result = await VaultDocument.deleteOne({ id, userId: req.user.id });

    if (result.deletedCount === 0) {
      sendError(res, 'Document not found or unauthorized', 404);
      return;
    }

    sendSuccess(res, null, 'Document removed from Vault');
  } catch (error) {
    next(error);
  }
};

// Emergency Contacts
export const getEmergencyContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const contacts = await EmergencyContact.find({ userId: req.user.id }).sort({ isPrimary: -1 });
    sendSuccess(res, contacts);
  } catch (error) {
    next(error);
  }
};

export const createEmergencyContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const contact = new EmergencyContact({
      ...req.body,
      id: `em_${Date.now()}`,
      userId: req.user.id,
    });

    await contact.save();
    sendSuccess(res, contact, 'Emergency contact added', 201);
  } catch (error) {
    next(error);
  }
};

export const deleteEmergencyContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    await EmergencyContact.deleteOne({ id, userId: req.user.id });
    sendSuccess(res, null, 'Emergency contact deleted');
  } catch (error) {
    next(error);
  }
};

// Trusted Contacts
export const getTrustedContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const contacts = await TrustedContact.find({ userId: req.user.id });
    sendSuccess(res, contacts);
  } catch (error) {
    next(error);
  }
};

export const toggleTrustedContactAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const contact = await TrustedContact.findOne({ id, userId: req.user.id });

    if (!contact) {
      sendError(res, 'Trusted contact not found', 404);
      return;
    }

    contact.hasVaultAccess = !contact.hasVaultAccess;
    await contact.save();

    sendSuccess(res, contact, 'Access permission updated');
  } catch (error) {
    next(error);
  }
};

// Shared Access Records
export const getSharedAccessRecords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const records = await SharedAccessRecord.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    sendSuccess(res, records);
  } catch (error) {
    next(error);
  }
};

export const createSharedAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const record = new SharedAccessRecord({
      ...req.body,
      id: `share_${Date.now()}`,
      userId: req.user.id,
      active: true,
    });

    await record.save();
    sendSuccess(res, record, 'Document shared successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const revokeSharedAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    await SharedAccessRecord.deleteOne({ id, userId: req.user.id });

    sendSuccess(res, null, 'Document share revoked');
  } catch (error) {
    next(error);
  }
};

// Vault Preferences & Security Settings
export const getVaultSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    let settings = await VaultSettings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = await VaultSettings.create({
        userId: req.user.id,
        emergencyConfig: {
          includedDocTypes: ['Passport', 'Insurance'],
          primaryContact: '+91 98765 43210',
          secondaryContact: '+91 98765 43211',
        },
        securitySettings: {
          twoFactorEnabled: true,
          autoLockTime: '15 minutes',
        },
        offlineAccessSettings: {},
      });
    }

    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

export const updateEmergencyConfig = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    let settings = await VaultSettings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new VaultSettings({ userId: req.user.id });
    }

    settings.emergencyConfig = {
      ...settings.emergencyConfig,
      ...req.body,
    };
    await settings.save();

    sendSuccess(res, settings.emergencyConfig, 'Emergency access configuration updated');
  } catch (error) {
    next(error);
  }
};

export const updateSecuritySettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    let settings = await VaultSettings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new VaultSettings({ userId: req.user.id });
    }

    settings.securitySettings = {
      ...settings.securitySettings,
      ...req.body,
    };
    await settings.save();

    sendSuccess(res, settings.securitySettings, 'Vault security settings updated');
  } catch (error) {
    next(error);
  }
};

