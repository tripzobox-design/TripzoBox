import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { VaultDocument } from '../models/VaultDocument.js';
import { OTPVerification } from '../models/OTPVerification.js';
import { User } from '../models/User.js';
import { sendDocumentVerificationEmail } from '../services/emailService.js';
import { sendPhoneOtp } from '../services/smsService.js';
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

/**
 * Request OTP to verify a document uploaded to Travel Vault
 * Allows dispatching to registered email or registered phone number
 */
export const requestDocumentOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { channel = 'email', documentName = 'Document', documentType } = req.body;

    const user = (await User.findOne({ $or: [{ id: req.user.id }, { _id: req.user._id }] })) || req.user;

    let targetIdentifier = '';
    if (channel === 'phone') {
      if (!user.phone) {
        sendError(
          res,
          'No registered phone number found on your account. Please link your mobile number in Account Security or verify via your registered email.',
          400
        );
        return;
      }
      targetIdentifier = user.phone;
    } else {
      if (!user.email) {
        sendError(res, 'No registered email found on your account.', 400);
        return;
      }
      targetIdentifier = user.email.toLowerCase();
    }

    // Cooldown check (60s rate limit)
    const recentOtp = await OTPVerification.findOne({
      userId: user.id,
      identifier: targetIdentifier,
      type: 'document_verification',
      resendAvailableAt: { $gt: new Date() },
      consumed: false,
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil((recentOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      sendError(res, `Please wait ${waitSeconds} seconds before requesting a new code`, 429);
      return;
    }

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    const resendAvailableAt = new Date(now.getTime() + 60 * 1000); // 60 seconds

    // Invalidate prior pending document OTPs for this user
    await OTPVerification.updateMany(
      { userId: user.id, type: 'document_verification', consumed: false },
      { $set: { consumed: true } }
    );

    // Create OTP record
    await OTPVerification.create({
      userId: user.id,
      identifier: targetIdentifier,
      type: 'document_verification',
      hashedOtp,
      expiresAt,
      resendAvailableAt,
      attempts: 0,
      maxAttempts: 5,
      consumed: false,
    });

    // Dispatch via chosen channel
    let dispatchStatus = 'SENT';
    if (channel === 'phone') {
      const smsResult = await sendPhoneOtp(targetIdentifier, rawOtp);
      dispatchStatus = smsResult.status;
    } else {
      await sendDocumentVerificationEmail(
        targetIdentifier,
        user.name || 'Traveller',
        documentName,
        rawOtp
      );
    }

    // Mask identifier for safety in response
    const maskedIdentifier =
      channel === 'phone'
        ? targetIdentifier.slice(0, 3) + '••••' + targetIdentifier.slice(-3)
        : targetIdentifier.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '•••' + c);

    sendSuccess(
      res,
      {
        channel,
        identifier: targetIdentifier,
        maskedIdentifier,
        registeredPhone: user.phone || null,
        registeredEmail: user.email || null,
        expiresInSeconds: 600,
        resendCooldownSeconds: 60,
        dispatchStatus,
        ...(process.env.NODE_ENV !== 'production' && { devOtp: rawOtp }),
      },
      `Verification code sent to your registered ${channel === 'phone' ? 'phone number' : 'email address'}`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify OTP entered by user to approve document verification
 */
export const verifyDocumentOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { identifier, otp, documentId, documentType } = req.body;

    if (!identifier || !otp) {
      sendError(res, 'Identifier and 6-digit OTP code are required', 400);
      return;
    }

    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      sendError(res, 'Please provide a valid 6-digit verification code', 400);
      return;
    }

    const cleanIdentifier = String(identifier).trim().toLowerCase();

    const otpRecord = await OTPVerification.findOne({
      userId: req.user.id,
      identifier: cleanIdentifier,
      type: 'document_verification',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      sendError(res, 'No active verification code found. Please request a new code.', 400);
      return;
    }

    if (otpRecord.expiresAt < new Date()) {
      sendError(res, 'Verification code has expired. Please request a new code.', 400);
      return;
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      otpRecord.consumed = true;
      await otpRecord.save();
      sendError(res, 'Maximum verification attempts exceeded. Please request a new code.', 429);
      return;
    }

    const isMatch = await otpRecord.compareOtp(cleanOtp);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      sendError(
        res,
        `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        400
      );
      return;
    }

    // OTP is valid!
    otpRecord.consumed = true;
    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    // If documentId is provided, mark it verified in MongoDB
    let verifiedDoc = null;
    if (documentId) {
      verifiedDoc = await VaultDocument.findOne({ id: documentId, userId: req.user.id });
      if (verifiedDoc) {
        verifiedDoc.isVerified = true;
        await verifiedDoc.save();
      }
    }

    // If it's a primary identity document (Passport, Aadhaar, DrivingLicense), also elevate user's identityVerificationStatus
    const isIdDoc = ['Passport', 'Aadhaar', 'DrivingLicense'].includes(
      documentType || verifiedDoc?.type || ''
    );
    if (isIdDoc) {
      const user = await User.findOne({ $or: [{ id: req.user.id }, { _id: req.user._id }] });
      if (user && user.identityVerificationStatus !== 'VERIFIED') {
        user.identityVerificationStatus = 'VERIFIED';
        await user.save();
      }
    }

    sendSuccess(
      res,
      {
        isVerified: true,
        documentId: documentId || null,
        identityVerified: isIdDoc,
      },
      'Document successfully verified with OTP!'
    );
  } catch (error) {
    next(error);
  }
};

