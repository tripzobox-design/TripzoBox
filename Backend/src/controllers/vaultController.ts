import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { VaultDocument } from '../models/VaultDocument.js';
import { OTPVerification } from '../models/OTPVerification.js';
import { User } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { Notification } from '../models/Notification.js';
import { sendDocumentVerificationEmail } from '../services/emailService.js';
import { sendPhoneOtp } from '../services/smsService.js';
import { getAuthSettings } from '../services/authSettingsService.js';
import {
  EmergencyContact,
  TrustedContact,
  SharedAccessRecord,
  VaultSettings,
} from '../models/VaultSettings.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';
import { config } from '../config/env.js';

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

    const requestedId =
      typeof req.body?.id === 'string' && req.body.id.trim().length > 0
        ? req.body.id.trim()
        : `doc_${Date.now()}`;

    const newDoc = new VaultDocument({
      ...req.body,
      id: requestedId,
      userId: req.user.id,
      uploadedAt: req.body?.uploadedAt || new Date().toLocaleDateString('en-GB'),
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

    await SharedAccessRecord.deleteMany({ documentId: id, userId: req.user.id });

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
      id:
        typeof req.body?.id === 'string' && req.body.id.trim().length > 0
          ? req.body.id.trim()
          : `em_${Date.now()}`,
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

const maskRecipientEmail = (email?: string): string | undefined => {
  if (!email || !email.includes('@')) return undefined;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const computeShareExpiryDate = (expiresLabel?: string): Date | undefined => {
  const now = Date.now();
  if (expiresLabel === '24 hours') return new Date(now + 24 * 60 * 60 * 1000);
  if (expiresLabel === '7 days') return new Date(now + 7 * 24 * 60 * 60 * 1000);
  return undefined;
};

// Eligible TripzoBox Contact Search (Registered, non-deleted, non-suspended TripzoBox users)
export const searchEligibleContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    // Identify co-travelers from user's shared trips first so trip companions appear prioritized
    const userTrips = await Trip.find({
      $or: [{ 'leader.id': req.user.id }, { 'members.id': req.user.id }],
    }).select('leader.id members.id');

    const coTravelerIds = new Set<string>();
    for (const trip of userTrips) {
      if (trip.leader?.id && trip.leader.id !== req.user.id) {
        coTravelerIds.add(trip.leader.id);
      }
      for (const m of trip.members || []) {
        if (m.id && m.id !== req.user.id) {
          coTravelerIds.add(m.id);
        }
      }
    }

    const filter: Record<string, any> = {
      id: { $ne: req.user.id },
      isDeleted: { $ne: true },
      isSuspended: { $ne: true },
    };

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { username: regex }, { email: q.toLowerCase() }];
    } else if (coTravelerIds.size > 0) {
      // Without search query, prioritize co-travelers, supplemented by verified TripzoBox users
      filter.$or = [{ id: { $in: Array.from(coTravelerIds) } }, { emailVerified: true }];
    }

    const users = await User.find(filter)
      .select('id name username avatarUrl city email emailVerified identityVerificationStatus')
      .limit(20);

    const formatted = users
      .map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl || '',
        city: u.city || 'TripzoBox Traveller',
        emailVerified: Boolean(u.emailVerified),
        identityVerified: u.identityVerificationStatus === 'VERIFIED',
        isCoTraveler: coTravelerIds.has(u.id),
        role: coTravelerIds.has(u.id) ? 'Trip companion' : 'TripzoBox Member',
        maskedEmail: maskRecipientEmail(u.email),
      }))
      .sort((a, b) => Number(b.isCoTraveler) - Number(a.isCoTraveler));

    sendSuccess(res, formatted);
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

    const {
      id: requestedShareId,
      documentId,
      documentName,
      documentType,
      sharedWithUserId,
      sharedWithName,
      sharedWithRole,
      sharedWithAvatar,
      permission,
      expires,
    } = req.body || {};

    if (!documentId) {
      sendError(res, 'Document ID is required to share access.', 400);
      return;
    }

    const doc = await VaultDocument.findOne({ id: documentId, userId: req.user.id });
    if (!doc) {
      sendError(res, 'Document not found or you do not have permission to share it.', 404);
      return;
    }

    let resolvedRecipient: any = null;
    if (sharedWithUserId) {
      if (sharedWithUserId === req.user.id) {
        sendError(res, 'You already own this document.', 400);
        return;
      }

      resolvedRecipient = await User.findOne({
        id: sharedWithUserId,
        isDeleted: { $ne: true },
        isSuspended: { $ne: true },
      }).select('id name username avatarUrl');

      if (!resolvedRecipient) {
        sendError(
          res,
          'Selected contact does not have an active TripzoBox account.',
          404
        );
        return;
      }
    }

    const expiresAt = computeShareExpiryDate(expires);
    const normalizedPermission: 'View' | 'View • Download' =
      permission === 'View • Download' ? 'View • Download' : 'View';

    // Update existing active share cleanly if owner shares same doc with same TripzoBox account
    if (resolvedRecipient) {
      const existingShare = await SharedAccessRecord.findOne({
        userId: req.user.id,
        documentId: doc.id,
        sharedWithUserId: resolvedRecipient.id,
        active: true,
      });

      if (existingShare) {
        existingShare.permission = normalizedPermission;
        existingShare.expires = expires || 'Until trip end';
        existingShare.expiresAt = expiresAt;
        existingShare.documentName = doc.name;
        existingShare.documentType = doc.type;
        existingShare.ownerName = req.user.name;
        existingShare.ownerAvatarUrl = req.user.avatarUrl || '';
        await existingShare.save();

        sendSuccess(res, existingShare, 'Document access permissions updated', 200);
        return;
      }
    }

    const record = new SharedAccessRecord({
      id:
        typeof requestedShareId === 'string' && requestedShareId.trim().length > 0
          ? requestedShareId.trim()
          : `share_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user.id,
      documentId: doc.id,
      documentName: doc.name || documentName,
      documentType: doc.type || documentType,
      ownerName: req.user.name,
      ownerAvatarUrl: req.user.avatarUrl || '',
      sharedWithUserId: resolvedRecipient?.id,
      sharedWithUsername: resolvedRecipient?.username,
      sharedWithName: resolvedRecipient?.name || sharedWithName,
      sharedWithRole: sharedWithRole || (resolvedRecipient ? 'TripzoBox Member' : 'Trip member'),
      sharedWithAvatar: resolvedRecipient?.avatarUrl || sharedWithAvatar || '',
      permission: normalizedPermission,
      expires: expires || 'Until trip end',
      expiresAt,
      active: true,
    });

    await record.save();

    if (doc.visibility === 'private') {
      doc.visibility = 'trusted-contacts';
      await doc.save();
    }

    if (resolvedRecipient?.id) {
      await Notification.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: resolvedRecipient.id,
        type: 'system',
        title: 'Travel Document Shared With You',
        message: `${req.user.name} shared "${doc.name}" with you (${normalizedPermission}).`,
        timestamp: 'Just now',
        read: false,
        link: '/app/vault?view=shared',
      }).catch(() => {});
    }

    sendSuccess(res, record, 'Document shared successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getSharedWithMeDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const now = new Date();
    const shares = await SharedAccessRecord.find({
      sharedWithUserId: req.user.id,
      active: true,
    }).sort({ createdAt: -1 });

    const validShares = shares.filter((s) => !s.expiresAt || s.expiresAt > now);
    if (validShares.length === 0) {
      sendSuccess(res, []);
      return;
    }

    const docIds = Array.from(new Set(validShares.map((s) => s.documentId)));
    const ownerIds = Array.from(new Set(validShares.map((s) => s.userId)));

    const [docs, owners] = await Promise.all([
      VaultDocument.find({ id: { $in: docIds } }),
      User.find({ id: { $in: ownerIds }, isDeleted: { $ne: true } }).select(
        'id name username avatarUrl'
      ),
    ]);

    const docMap = new Map(docs.map((d) => [d.id, d]));
    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    const items = validShares
      .map((share) => {
        const doc = docMap.get(share.documentId);
        const owner = ownerMap.get(share.userId);
        if (!doc || !owner) return null;

        return {
          shareId: share.id,
          permission: share.permission,
          expires: share.expires,
          expiresAt: share.expiresAt || null,
          sharedAt: share.createdAt,
          owner: {
            id: owner.id,
            name: owner.name || share.ownerName || 'TripzoBox Member',
            username: owner.username,
            avatarUrl: owner.avatarUrl || share.ownerAvatarUrl || '',
          },
          document: {
            id: doc.id,
            type: doc.type,
            name: doc.name,
            referenceNumber: doc.referenceNumber,
            validTill: doc.validTill,
            issuingCountry: doc.issuingCountry,
            details: doc.details || {},
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            fileMime: doc.fileMime,
            thumbnailUrl: doc.thumbnailUrl,
            isVerified: doc.isVerified,
            uploadedAt: doc.uploadedAt,
            visibility: doc.visibility,
          },
        };
      })
      .filter(Boolean);

    sendSuccess(res, items);
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
          primaryContact: '',
          secondaryContact: '',
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

    const candidateUserIds = [
      user?.id,
      user?._id ? String(user._id) : null,
      req.user.id,
      req.user._id ? String(req.user._id) : null,
      req.userId,
    ].filter((id): id is string => Boolean(id));

    let targetIdentifier = '';
    if (channel === 'phone') {
      const authSettings = await getAuthSettings();
      if (!authSettings.smsOtp?.enabled) {
        sendError(res, 'SMS OTP verification is currently disabled. Please verify via your registered email.', 403);
        return;
      }
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
      const authSettings = await getAuthSettings();
      if (!authSettings.emailOtp?.enabled) {
        sendError(res, 'Email OTP verification is currently disabled by administrator.', 403);
        return;
      }
      if (!user.email) {
        sendError(res, 'No registered email found on your account.', 400);
        return;
      }
      targetIdentifier = user.email.toLowerCase();
    }

    // Cooldown check (60s rate limit)
    const recentOtp = await OTPVerification.findOne({
      $or: [
        { userId: { $in: candidateUserIds }, identifier: targetIdentifier },
        { identifier: targetIdentifier },
      ],
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
      {
        $or: [
          { userId: { $in: candidateUserIds } },
          { identifier: targetIdentifier },
        ],
        type: 'document_verification',
        consumed: false,
      },
      { $set: { consumed: true } }
    );

    // Create OTP record
    await OTPVerification.create({
      userId: user.id || req.user.id,
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
        ...(config.nodeEnv !== 'production' && process.env.RENDER !== 'true' && { devOtp: rawOtp }),
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

    const cleanIdentifier = String(identifier || '').trim().toLowerCase();

    const user = (await User.findOne({ $or: [{ id: req.user.id }, { _id: req.user._id }] })) || req.user;

    const candidateUserIds = [
      user?.id,
      user?._id ? String(user._id) : null,
      req.user.id,
      req.user._id ? String(req.user._id) : null,
      req.userId,
    ].filter((id): id is string => Boolean(id));

    // Match conditions for finding active, unconsumed document verification OTP
    const searchConditions: any[] = [];
    if (cleanIdentifier) {
      searchConditions.push({ identifier: cleanIdentifier });
    }
    if (user?.email) {
      searchConditions.push({ identifier: user.email.toLowerCase() });
    }
    if (req.user.email) {
      searchConditions.push({ identifier: req.user.email.toLowerCase() });
    }
    if (user?.phone) {
      searchConditions.push({ identifier: user.phone });
    }
    if (req.user.phone) {
      searchConditions.push({ identifier: req.user.phone });
    }
    if (candidateUserIds.length > 0) {
      searchConditions.push({ userId: { $in: candidateUserIds } });
    }

    const otpRecord = await OTPVerification.findOne({
      $or: searchConditions,
      type: 'document_verification',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      sendError(res, 'No active verification code found. Please request a new code.', 400);
      return;
    }

    // Safety authorization check: ensure the record belongs to the authenticated user
    const belongsToUser =
      (otpRecord.userId && candidateUserIds.includes(otpRecord.userId)) ||
      (user?.email && otpRecord.identifier === user.email.toLowerCase()) ||
      (user?.phone && otpRecord.identifier === user.phone) ||
      (req.user.email && otpRecord.identifier === req.user.email.toLowerCase()) ||
      (req.user.phone && otpRecord.identifier === req.user.phone);

    if (!belongsToUser) {
      sendError(res, 'Verification code does not belong to this account', 403);
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
      verifiedDoc = await VaultDocument.findOne({
        id: documentId,
        $or: [{ userId: { $in: candidateUserIds } }, { userId: req.user.id }],
      });
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

