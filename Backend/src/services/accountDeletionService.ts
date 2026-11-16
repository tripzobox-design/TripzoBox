import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import { ClientSession } from 'mongoose';
import { config } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { TravellerReview } from '../models/TravellerReview.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { Story } from '../models/Story.js';
import { DiaryEntry } from '../models/DiaryEntry.js';
import { VaultDocument } from '../models/VaultDocument.js';
import {
  EmergencyContact,
  TrustedContact,
  SharedAccessRecord,
  VaultSettings,
} from '../models/VaultSettings.js';
import { OTPVerification } from '../models/OTPVerification.js';
import { IdentityVerification } from '../models/IdentityVerification.js';
import { UserBlock } from '../models/UserBlock.js';
import { UserReport } from '../models/UserReport.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { REAUTH_COOKIE_NAME, verifyReauthToken } from '../utils/token.js';
import { runWithTransaction } from '../utils/transaction.js';
import * as emailService from './emailService.js';

const REAUTH_MAX_AGE_MS = 15 * 60 * 1000;
const DELETION_OTP_TTL_MS = 10 * 60 * 1000;
const DELETION_OTP_COOLDOWN_MS = 60 * 1000;

export class AccountDeletionError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 400,
    code = 'deletion_error',
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AccountDeletionError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface BlockingTripSummary {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  eligibleNewLeaders: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    city?: string;
  }>;
}

export interface DeletionPreflightResult {
  canDelete: boolean;
  blockingTrips: BlockingTripSummary[];
  authMethods: {
    hasPassword: boolean;
    isGoogleConnected: boolean;
    isAppleConnected: boolean;
    requiresEmailOtp: boolean;
    maskedEmail: string | null;
    hasRecentReauth: boolean;
  };
  impactSummary: {
    activeLedTrips: number;
    joinedTrips: number;
    pendingJoinRequests: number;
    vaultDocuments: number;
    diaryEntries: number;
    publicStories: number;
    privateOrDraftStories: number;
    reviewsAuthored: number;
    notifications: number;
  };
  retentionPolicy: {
    deleted: string[];
    anonymized: string[];
    retainedForCompliance: string[];
  };
}

export const maskEmailAddress = (email?: string): string | null => {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(6, local.length - 2))}@${domain}`;
};

const isTripBlockingLeaderDeletion = (trip: any): boolean => {
  if (trip.status === 'closed') return false;
  const otherMembers = Array.isArray(trip.members)
    ? trip.members.filter((m: any) => m.id !== trip.leader?.id)
    : [];

  if (trip.status === 'draft' && otherMembers.length === 0) {
    return false;
  }

  return true;
};

export const hasValidRecentReauth = (user: IUser, req?: Request): boolean => {
  const now = Date.now();
  if (user.recentReauthAt && now - new Date(user.recentReauthAt).getTime() <= REAUTH_MAX_AGE_MS) {
    return true;
  }

  const reauthCookie = req?.cookies?.[REAUTH_COOKIE_NAME];
  if (typeof reauthCookie === 'string' && reauthCookie) {
    try {
      const decoded = verifyReauthToken(reauthCookie);
      if (decoded.userId === user.id) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
};

export const verifyPasswordReauth = async (
  userId: string,
  currentPassword: string
): Promise<IUser> => {
  const user = await User.findOne({ id: userId }).select('+password');
  if (!user || user.isDeleted) {
    throw new AccountDeletionError('User account not found or already deleted.', 404, 'user_not_found');
  }
  if (!user.password) {
    throw new AccountDeletionError(
      'This account uses social sign-in rather than a password. Please re-authenticate with Google or Apple.',
      400,
      'password_not_configured'
    );
  }
  if (!currentPassword || typeof currentPassword !== 'string') {
    throw new AccountDeletionError(
      'Current password is required to verify your identity.',
      400,
      'password_required'
    );
  }
  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw new AccountDeletionError(
      'Current password is incorrect. Please try again.',
      401,
      'invalid_password'
    );
  }

  user.recentReauthAt = new Date();
  await user.save();
  return user;
};

export const verifyOAuthFallbackReauth = async (
  userId: string,
  provider: 'apple' | 'passwordless',
  confirmationPhrase: string
): Promise<IUser> => {
  const user = await User.findOne({ id: userId }).select('+password');
  if (!user || user.isDeleted) {
    throw new AccountDeletionError('User account not found or already deleted.', 404, 'user_not_found');
  }

  if (user.password) {
    throw new AccountDeletionError(
      'Password verification is required for password-based accounts.',
      400,
      'password_required'
    );
  }

  if (provider === 'apple' && !user.isAppleConnected) {
    throw new AccountDeletionError(
      'Apple Sign-In is not connected to this account.',
      400,
      'apple_not_connected'
    );
  }

  if (user.isGoogleConnected && !user.isAppleConnected) {
    throw new AccountDeletionError(
      'Google accounts must re-authenticate directly with Google OAuth.',
      400,
      'google_reauth_required'
    );
  }

  if (String(confirmationPhrase || '').trim().toUpperCase() !== 'DELETE MY ACCOUNT') {
    throw new AccountDeletionError(
      'Type "DELETE MY ACCOUNT" to confirm identity re-verification.',
      400,
      'invalid_confirmation_phrase'
    );
  }

  user.recentReauthAt = new Date();
  await user.save();
  return user;
};

export const getAccountDeletionPreflight = async (
  userId: string,
  req?: Request
): Promise<DeletionPreflightResult> => {
  const user = await User.findOne({ id: userId }).select('+password');
  if (!user || user.isDeleted) {
    throw new AccountDeletionError('Account not found or already deleted.', 404, 'user_not_found');
  }

  const [
    ledTrips,
    joinedTripsCount,
    pendingJoinRequestsCount,
    vaultDocsCount,
    diaryCount,
    publicStoriesCount,
    privateDraftStoriesCount,
    reviewsAuthoredCount,
    notificationsCount,
  ] = await Promise.all([
    Trip.find({ 'leader.id': user.id }),
    Trip.countDocuments({ 'members.id': user.id, 'leader.id': { $ne: user.id } }),
    JoinRequest.countDocuments({ userId: user.id, status: 'pending' }),
    VaultDocument.countDocuments({ userId: user.id }),
    DiaryEntry.countDocuments({ userId: user.id }),
    Story.countDocuments({ 'author.id': user.id, visibility: 'public', status: 'published' }),
    Story.countDocuments({
      'author.id': user.id,
      $or: [{ visibility: 'private' }, { status: 'draft' }],
    }),
    TravellerReview.countDocuments({ reviewerId: user.id }),
    Notification.countDocuments({ userId: user.id }),
  ]);

  const blockingTrips: BlockingTripSummary[] = ledTrips
    .filter(isTripBlockingLeaderDeletion)
    .map((trip) => ({
      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      eligibleNewLeaders: (trip.members || [])
        .filter((m) => m.id !== user.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          avatarUrl: m.avatarUrl,
          city: m.city,
        })),
    }));

  return {
    canDelete: blockingTrips.length === 0,
    blockingTrips,
    authMethods: {
      hasPassword: Boolean(user.password),
      isGoogleConnected: Boolean(user.isGoogleConnected),
      isAppleConnected: Boolean(user.isAppleConnected),
      requiresEmailOtp: Boolean(user.email && user.emailVerified),
      maskedEmail: maskEmailAddress(user.email),
      hasRecentReauth: hasValidRecentReauth(user, req),
    },
    impactSummary: {
      activeLedTrips: blockingTrips.length,
      joinedTrips: joinedTripsCount,
      pendingJoinRequests: pendingJoinRequestsCount,
      vaultDocuments: vaultDocsCount,
      diaryEntries: diaryCount,
      publicStories: publicStoriesCount,
      privateOrDraftStories: privateDraftStoriesCount,
      reviewsAuthored: reviewsAuthoredCount,
      notifications: notificationsCount,
    },
    retentionPolicy: {
      deleted: [
        'Profile details, email address, phone number, password/OAuth links, recovery codes, and uploaded avatar/cover images',
        'Travel Vault documents, physical uploaded files, emergency contacts, trusted contacts, and vault PIN settings',
        'Private diary entries, private/draft stories, notifications, and pending trip join requests',
      ],
      anonymized: [
        'Published community travel stories (attributed to Deleted User)',
        'Ratings and reviews authored by you (personal details removed, ratings preserved)',
        'Shared trip chat messages (sender replaced with Deleted User to preserve other members’ history)',
      ],
      retainedForCompliance: [
        'Minimal trust, safety, moderation, identity compliance metadata, and security audit logs (without personal contact info or sensitive uploads)',
      ],
    },
  };
};

export const transferTripLeadership = async (
  actorUser: IUser,
  tripId: string,
  newLeaderId: string
) => {
  if (!newLeaderId || typeof newLeaderId !== 'string') {
    throw new AccountDeletionError('A valid eligible member ID is required.', 400, 'invalid_member');
  }

  const trip = await Trip.findOne({ id: tripId });
  if (!trip) {
    throw new AccountDeletionError('Trip not found.', 404, 'trip_not_found');
  }

  if (trip.leader.id !== actorUser.id) {
    throw new AccountDeletionError(
      'Only the current trip leader can transfer trip leadership.',
      403,
      'not_trip_leader'
    );
  }

  if (trip.status === 'closed') {
    throw new AccountDeletionError(
      'Closed trips do not require leadership transfer.',
      400,
      'trip_closed'
    );
  }

  if (newLeaderId === actorUser.id) {
    throw new AccountDeletionError(
      'You must select another member to take over trip leadership.',
      400,
      'same_leader'
    );
  }

  const targetMember = (trip.members || []).find((m) => m.id === newLeaderId);
  if (!targetMember) {
    throw new AccountDeletionError(
      'Leadership can only be transferred to an existing confirmed member of this trip.',
      400,
      'member_not_found'
    );
  }

  const targetUser = await User.findOne({ id: newLeaderId });
  if (!targetUser || targetUser.isDeleted || targetUser.isSuspended) {
    throw new AccountDeletionError(
      'Selected member is not eligible to assume trip leadership.',
      400,
      'ineligible_leader'
    );
  }

  trip.leader = {
    id: targetUser.id,
    name: targetUser.name,
    username: targetUser.username,
    avatarUrl: targetUser.avatarUrl || '',
    city: targetUser.city || targetMember.city || 'India',
  };

  trip.members = (trip.members || []).map((member) => {
    if (member.id === newLeaderId) {
      return {
        ...member,
        name: targetUser.name,
        avatarUrl: targetUser.avatarUrl || member.avatarUrl || '',
        city: targetUser.city || member.city,
        role: 'Trip Leader',
      };
    }
    if (member.id === actorUser.id) {
      return {
        ...member,
        role: 'Member',
      };
    }
    return member;
  });

  await trip.save();

  await Notification.create({
    id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    userId: targetUser.id,
    type: 'trip_invite',
    title: 'Trip Leadership Transferred to You',
    message: `${actorUser.name} transferred leadership of "${trip.name}" to you.`,
    timestamp: 'Just now',
    read: false,
    link: `/app/trips/${trip.id}`,
  });

  return trip;
};

export const requestDeletionOtp = async (
  userId: string,
  req: Request,
  options: { currentPassword?: string } = {}
): Promise<{
  otpRequired: boolean;
  maskedEmail: string | null;
  expiresInSeconds?: number;
  resendCooldownSeconds?: number;
}> => {
  const user = await User.findOne({ id: userId }).select('+password');
  if (!user || user.isDeleted) {
    throw new AccountDeletionError('User account not found.', 404, 'user_not_found');
  }

  // Ensure caller recently authenticated or supplied valid current password
  if (user.password && options.currentPassword) {
    await verifyPasswordReauth(user.id, options.currentPassword);
  } else if (!hasValidRecentReauth(user, req)) {
    throw new AccountDeletionError(
      user.password
        ? 'Please verify your current password before requesting a deletion confirmation code.'
        : 'Please complete recent re-authentication before requesting a deletion confirmation code.',
      401,
      'reauth_required'
    );
  }

  if (!user.email || !user.emailVerified) {
    return {
      otpRequired: false,
      maskedEmail: maskEmailAddress(user.email),
    };
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const now = new Date();

  // Enforce resend cooldown on active pending OTPs for this user
  const latestActiveOtp = await OTPVerification.findOne({
    userId: user.id,
    type: 'account_deletion',
    consumed: false,
  }).sort({ createdAt: -1 });

  if (latestActiveOtp && latestActiveOtp.resendAvailableAt > now) {
    const waitSeconds = Math.max(
      1,
      Math.ceil((latestActiveOtp.resendAvailableAt.getTime() - now.getTime()) / 1000)
    );
    throw new AccountDeletionError(
      `Please wait ${waitSeconds} seconds before requesting another confirmation code.`,
      429,
      'otp_cooldown',
      { retryAfterSeconds: waitSeconds }
    );
  }

  // Invalidate prior unconsumed deletion OTPs
  await OTPVerification.updateMany(
    { userId: user.id, type: 'account_deletion', consumed: false },
    { $set: { consumed: true, consumedAt: now } }
  );

  // Cryptographically random 6-digit OTP (no hardcoded or demo codes)
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(rawOtp, salt);

  await OTPVerification.create({
    userId: user.id,
    identifier: normalizedEmail,
    type: 'account_deletion',
    hashedOtp,
    expiresAt: new Date(now.getTime() + DELETION_OTP_TTL_MS),
    resendAvailableAt: new Date(now.getTime() + DELETION_OTP_COOLDOWN_MS),
    attempts: 0,
    maxAttempts: 5,
    consumed: false,
  });

  await emailService.sendAccountDeletionOtpEmail(normalizedEmail, user.name || 'Traveller', rawOtp);

  return {
    otpRequired: true,
    maskedEmail: maskEmailAddress(normalizedEmail),
    expiresInSeconds: Math.floor(DELETION_OTP_TTL_MS / 1000),
    resendCooldownSeconds: Math.floor(DELETION_OTP_COOLDOWN_MS / 1000),
  };
};

const extractLocalUploadFilename = (url?: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return null;
    }
  }

  const uploadsMarker = '/uploads/';
  const idx = pathname.indexOf(uploadsMarker);
  if (idx === -1) return null;

  const rel = pathname.slice(idx + uploadsMarker.length);
  if (!rel || rel.includes('..') || rel.includes('/') || rel.includes('\\')) {
    return null;
  }
  return rel;
};

const collectOwnedFileNames = async (user: IUser): Promise<string[]> => {
  const candidates = new Set<string>();
  const addUrl = (url?: string) => {
    const filename = extractLocalUploadFilename(url);
    if (filename) candidates.add(filename);
  };

  addUrl(user.avatarUrl);
  addUrl(user.coverUrl);

  const [vaultDocs, diaryEntries, privateStories] = await Promise.all([
    VaultDocument.find({ userId: user.id }).select('fileUrl'),
    DiaryEntry.find({ userId: user.id }).select('photos'),
    Story.find({
      'author.id': user.id,
      $or: [{ visibility: 'private' }, { status: 'draft' }],
    }).select('coverImageUrl galleryImages entries'),
  ]);

  for (const doc of vaultDocs) {
    addUrl(doc.fileUrl);
  }
  for (const entry of diaryEntries) {
    for (const photo of entry.photos || []) {
      addUrl(photo);
    }
  }
  for (const story of privateStories) {
    addUrl(story.coverImageUrl);
    for (const img of story.galleryImages || []) {
      addUrl(img);
    }
    if (Array.isArray(story.entries)) {
      for (const item of story.entries) {
        addUrl(item?.photoUrl);
        if (Array.isArray(item?.photos)) {
          for (const p of item.photos) addUrl(p);
        }
      }
    }
  }

  return Array.from(candidates);
};

const deleteOwnedUploadFiles = async (filenames: string[], excludeUserId: string): Promise<void> => {
  if (filenames.length === 0) return;

  const uploadRoot = path.resolve(config.uploadDir);
  for (const filename of filenames) {
    const resolvedPath = path.resolve(uploadRoot, filename);
    if (!resolvedPath.startsWith(uploadRoot + path.sep)) {
      continue;
    }

    // Ensure no other active record still references this exact uploaded filename
    const filePattern = new RegExp(`/uploads/${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const [otherUserRef, otherVaultRef, otherDiaryRef, otherStoryRef] = await Promise.all([
      User.exists({
        id: { $ne: excludeUserId },
        isDeleted: { $ne: true },
        $or: [{ avatarUrl: filePattern }, { coverUrl: filePattern }],
      }),
      VaultDocument.exists({ fileUrl: filePattern }),
      DiaryEntry.exists({ photos: filePattern }),
      Story.exists({ $or: [{ coverImageUrl: filePattern }, { galleryImages: filePattern }] }),
    ]);

    if (otherUserRef || otherVaultRef || otherDiaryRef || otherStoryRef) {
      continue;
    }

    await fs.promises.unlink(resolvedPath).catch((err: any) => {
      if (err?.code !== 'ENOENT') {
        console.warn('[Account Deletion] Failed to remove local upload file:', err?.message || err);
      }
    });
  }
};

export interface ExecuteAccountDeletionInput {
  currentPassword?: string;
  otp?: string;
  confirmationText?: string;
  confirmDeletion?: boolean;
  reason?: string;
}

export interface ExecuteAccountDeletionResult {
  deletedAt: Date;
  usedTransaction: boolean;
  confirmationEmailSent: boolean;
}

export const executeAccountDeletion = async (
  userId: string,
  req: Request,
  input: ExecuteAccountDeletionInput
): Promise<ExecuteAccountDeletionResult> => {
  if (input.confirmDeletion !== true) {
    throw new AccountDeletionError(
      'Explicit confirmation is required before deleting your account.',
      400,
      'confirmation_required'
    );
  }

  // Atomic check-and-lock prevents concurrent duplicate deletion requests for the same account
  const existingUser = await User.findOne({ id: userId }).select('+password');
  if (!existingUser) {
    throw new AccountDeletionError('User account not found.', 404, 'user_not_found');
  }
  if (existingUser.isDeleted) {
    throw new AccountDeletionError(
      'This account has already been deleted.',
      409,
      'already_deleted'
    );
  }

  const lockedUser = await User.findOneAndUpdate(
    {
      id: userId,
      isDeleted: { $ne: true },
      deletionInProgress: { $ne: true },
    },
    { $set: { deletionInProgress: true } },
    { new: true }
  ).select('+password');

  if (!lockedUser) {
    throw new AccountDeletionError(
      'An account deletion request is already in progress or completed.',
      409,
      'deletion_in_progress'
    );
  }

  try {
    // 1. Verify active trip leadership blockers BEFORE mutating any records
    const ledTrips = await Trip.find({ 'leader.id': lockedUser.id });
    const blockingTrips = ledTrips.filter(isTripBlockingLeaderDeletion);
    if (blockingTrips.length > 0) {
      throw new AccountDeletionError(
        'Please transfer trip leadership to another member or cancel your active trips before deleting your account.',
        409,
        'active_trip_leader_blocker',
        {
          blockingTrips: blockingTrips.map((trip) => ({
            id: trip.id,
            name: trip.name,
            destination: trip.destination,
            eligibleNewLeaders: (trip.members || []).filter((m) => m.id !== lockedUser.id),
          })),
        }
      );
    }

    // 2. Verify recent re-authentication or current password
    if (lockedUser.password) {
      if (input.currentPassword) {
        const matches = await lockedUser.comparePassword(input.currentPassword);
        if (!matches) {
          throw new AccountDeletionError(
            'Current password is incorrect.',
            401,
            'invalid_password'
          );
        }
      } else if (!hasValidRecentReauth(lockedUser, req)) {
        throw new AccountDeletionError(
          'Current password or recent verification is required before account deletion.',
          401,
          'reauth_required'
        );
      }
    } else if (!hasValidRecentReauth(lockedUser, req)) {
      throw new AccountDeletionError(
        'Please re-authenticate your account before confirming deletion.',
        401,
        'reauth_required'
      );
    }

    // 3. For email-verified accounts, strictly validate fresh non-expired, single-use OTP
    const verifiedEmail =
      lockedUser.email && lockedUser.emailVerified
        ? lockedUser.email.toLowerCase().trim()
        : undefined;

    if (verifiedEmail) {
      const candidateOtp = String(input.otp || '').trim();
      if (!candidateOtp) {
        throw new AccountDeletionError(
          'A fresh 6-digit verification code sent to your email is required.',
          400,
          'otp_required'
        );
      }

      const otpRecord = await OTPVerification.findOne({
        userId: lockedUser.id,
        identifier: verifiedEmail,
        type: 'account_deletion',
      }).sort({ createdAt: -1 });

      if (!otpRecord || otpRecord.consumed) {
        throw new AccountDeletionError(
          'No active deletion confirmation code found. Please request a fresh verification code.',
          400,
          'otp_not_found_or_used'
        );
      }

      const now = new Date();
      if (otpRecord.expiresAt <= now) {
        otpRecord.consumed = true;
        otpRecord.consumedAt = now;
        await otpRecord.save();
        throw new AccountDeletionError(
          'This deletion verification code has expired. Please request a new code.',
          400,
          'otp_expired'
        );
      }

      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        otpRecord.consumed = true;
        otpRecord.consumedAt = now;
        await otpRecord.save();
        throw new AccountDeletionError(
          'Maximum OTP verification attempts exceeded. Please request a new code.',
          429,
          'otp_max_attempts'
        );
      }

      const otpMatches = await otpRecord.compareOtp(candidateOtp);
      if (!otpMatches) {
        otpRecord.attempts += 1;
        if (otpRecord.attempts >= otpRecord.maxAttempts) {
          otpRecord.consumed = true;
          otpRecord.consumedAt = now;
        }
        await otpRecord.save();

        const remainingAttempts = Math.max(0, otpRecord.maxAttempts - otpRecord.attempts);
        throw new AccountDeletionError(
          remainingAttempts > 0
            ? `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
            : 'Invalid verification code. Maximum attempts exceeded; please request a new code.',
          remainingAttempts > 0 ? 400 : 429,
          'invalid_otp',
          { remainingAttempts }
        );
      }

      // Consume OTP immediately to prevent replay attacks
      otpRecord.consumed = true;
      otpRecord.consumedAt = now;
      await otpRecord.save();
    } else if (
      input.confirmationText !== undefined &&
      String(input.confirmationText).trim().toUpperCase() !== 'DELETE'
    ) {
      throw new AccountDeletionError(
        'Please type DELETE to confirm permanent account deletion.',
        400,
        'invalid_confirmation_text'
      );
    }

    const userDisplayName = lockedUser.name || 'Traveller';
    const userPhone = lockedUser.phone;
    const userEmail = lockedUser.email;
    const deletedAt = new Date();
    const deletedAlias = `deleted_${crypto
      .createHash('sha256')
      .update(`${lockedUser.id}:${deletedAt.toISOString()}:${crypto.randomBytes(8).toString('hex')}`)
      .digest('hex')
      .slice(0, 14)}`;

    // Collect owned private upload file paths before DB deletion removes references
    const ownedFilesToRemove = await collectOwnedFileNames(lockedUser);

    const { usedTransaction } = await runWithTransaction(async (session: ClientSession | null) => {
      const opts = session ? { session } : {};

      // A. Travel Vault & personal security/emergency data -> permanent delete
      await VaultDocument.deleteMany({ userId: lockedUser.id }, opts);
      await EmergencyContact.deleteMany({ userId: lockedUser.id }, opts);
      await TrustedContact.deleteMany({ userId: lockedUser.id }, opts);
      await SharedAccessRecord.deleteMany(
        { $or: [{ userId: lockedUser.id }, { sharedWithUserId: lockedUser.id }] },
        opts
      );
      await VaultSettings.deleteMany({ userId: lockedUser.id }, opts);

      // B. Notifications & User Blocks -> permanent delete
      await Notification.deleteMany({ userId: lockedUser.id }, opts);
      await UserBlock.deleteMany(
        { $or: [{ blockerId: lockedUser.id }, { blockedUserId: lockedUser.id }] },
        opts
      );

      // C. Travel Diary & Stories -> delete private/draft, anonymize published public stories
      await DiaryEntry.deleteMany({ userId: lockedUser.id }, opts);
      await Story.deleteMany(
        {
          'author.id': lockedUser.id,
          $or: [{ visibility: 'private' }, { status: 'draft' }],
        },
        opts
      );
      await Story.updateMany(
        { 'author.id': lockedUser.id, visibility: 'public', status: 'published' },
        {
          $set: {
            'author.id': deletedAlias,
            'author.name': 'Deleted User',
            'author.avatarUrl': '',
          },
          $unset: { 'author.city': 1 },
        },
        opts
      );
      await Story.updateMany(
        { likedBy: lockedUser.id },
        { $pull: { likedBy: lockedUser.id } },
        opts
      );

      // D. Join Requests -> remove all join requests by user so applicant PII is deleted
      await JoinRequest.deleteMany({ userId: lockedUser.id }, opts);

      // E. Trips -> handle draft/closed led trips, remove active memberships, anonymize reviews & closed trip references
      const deletedTripIds: string[] = [];
      const draftLedTrips = await Trip.find(
        { 'leader.id': lockedUser.id, status: 'draft' },
        'id',
        opts
      );
      for (const dt of draftLedTrips) {
        deletedTripIds.push(dt.id);
      }
      await Trip.deleteMany(
        { 'leader.id': lockedUser.id, status: 'draft' },
        opts
      );

      const ledClosedTrips = await Trip.find(
        { 'leader.id': lockedUser.id, status: 'closed' },
        null,
        opts
      );
      for (const trip of ledClosedTrips) {
        const otherMembers = (trip.members || []).filter((m) => m.id !== lockedUser.id);
        if (otherMembers.length === 0) {
          deletedTripIds.push(trip.id);
          await Trip.deleteOne({ _id: trip._id }, opts);
        } else {
          trip.leader = {
            id: deletedAlias,
            name: 'Deleted User',
            username: deletedAlias,
            avatarUrl: '',
            city: '',
          };
          trip.members = (trip.members || []).map((m) =>
            m.id === lockedUser.id
              ? { id: deletedAlias, name: 'Deleted User', avatarUrl: '', role: m.role, city: '' }
              : m
          );
          await trip.save(opts);
        }
      }

      if (deletedTripIds.length > 0) {
        await JoinRequest.deleteMany({ tripId: { $in: deletedTripIds } }, opts);
        await Message.deleteMany({ tripId: { $in: deletedTripIds } }, opts);
      }

      const memberTrips = await Trip.find({ 'members.id': lockedUser.id }, null, opts);
      for (const trip of memberTrips) {
        if (trip.status === 'closed') {
          trip.members = (trip.members || []).map((m) =>
            m.id === lockedUser.id
              ? { id: deletedAlias, name: 'Deleted User', avatarUrl: '', role: m.role, city: '' }
              : m
          );
        } else {
          trip.members = (trip.members || []).filter((m) => m.id !== lockedUser.id);
          trip.spotsLeft = Math.max(0, trip.maxMembers - trip.members.length);
          if (trip.status === 'full' && trip.spotsLeft > 0) {
            trip.status = 'open';
          }
        }
        await trip.save(opts);
      }

      await Trip.updateMany(
        { savedBy: lockedUser.id },
        { $pull: { savedBy: lockedUser.id } },
        opts
      );

      // Anonymize embedded trip reviews authored by deleted user
      await Trip.updateMany(
        { 'reviews.author.id': lockedUser.id },
        {
          $set: {
            'reviews.$[rev].author.id': deletedAlias,
            'reviews.$[rev].author.name': 'Deleted User',
            'reviews.$[rev].author.avatarUrl': '',
          },
        },
        {
          arrayFilters: [{ 'rev.author.id': lockedUser.id }],
          ...opts,
        }
      );

      // F. Messages -> preserve shared chat continuity while stripping sender PII
      await Message.updateMany(
        { 'sender.id': lockedUser.id },
        {
          $set: {
            'sender.id': deletedAlias,
            'sender.name': 'Deleted User',
            'sender.avatarUrl': '',
          },
        },
        opts
      );
      await Message.updateMany(
        { readBy: lockedUser.id },
        { $pull: { readBy: lockedUser.id } },
        opts
      );

      // G. Traveller Reviews -> anonymize reviewer PII while preserving ratings
      await TravellerReview.updateMany(
        { reviewerId: lockedUser.id },
        {
          $set: {
            reviewerId: deletedAlias,
            reviewerName: 'Deleted User',
            reviewerAvatar: '',
          },
        },
        opts
      );
      await TravellerReview.updateMany(
        { revieweeId: lockedUser.id },
        { $set: { revieweeName: 'Deleted User' } },
        opts
      );

      // H. OTPs -> purge all OTP records tied to deleted user or deleted identifiers
      const otpIdentifiers = [userEmail, userPhone]
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.toLowerCase().trim());
      await OTPVerification.deleteMany(
        {
          $or: [
            { userId: lockedUser.id },
            ...(otpIdentifiers.length > 0 ? [{ identifier: { $in: otpIdentifiers } }] : []),
          ],
        },
        opts
      );

      // I. Minimal Retained Compliance / Moderation / Audit Records (PII scrubbed)
      await UserReport.updateMany(
        { reporterId: lockedUser.id },
        { $set: { reporterName: 'Deleted User' } },
        opts
      );
      await UserReport.updateMany(
        { targetType: 'user', targetId: lockedUser.id },
        { $set: { targetName: 'Deleted User' } },
        opts
      );
      await IdentityVerification.deleteMany(
        {
          userId: lockedUser.id,
          status: { $in: ['NOT_STARTED', 'PENDING', 'EXPIRED', 'FAILED'] },
        },
        opts
      );
      await IdentityVerification.updateMany(
        { userId: lockedUser.id },
        {
          $set: {
            'verificationMetadata.checkSummary':
              'Account deleted; non-essential verification details redacted for compliance.',
          },
        },
        opts
      );

      await AdminAuditLog.create(
        [
          {
            id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            adminId: 'self_service',
            adminName: 'Account Owner (Self-Service)',
            adminEmail: 'self-service@system.tripzobox.local',
            action: 'ACCOUNT_SELF_DELETED',
            targetType: 'user',
            targetId: lockedUser.id,
            targetName: 'Deleted User',
            details: 'Account permanently deleted by verified owner via self-service workflow.',
          },
        ],
        opts
      );

      // J. Finally scrub and tombstone the User record so no PII remains and sessions are invalidated
      await User.updateOne(
        { id: lockedUser.id },
        {
          $set: {
            isDeleted: true,
            deletedAt,
            deletionReason: input.reason ? String(input.reason).slice(0, 300) : 'User requested deletion',
            deletionInProgress: false,
            isSuspended: false,
            name: 'Deleted User',
            username: deletedAlias,
            avatarUrl: '',
            coverUrl: '',
            city: '',
            country: '',
            languages: [],
            bio: '',
            emailVerified: false,
            phoneVerified: false,
            isGoogleConnected: false,
            isAppleConnected: false,
            travelInterests: [],
            tokenVersion: (lockedUser.tokenVersion ?? 0) + 1,
          },
          $unset: {
            email: 1,
            phone: 1,
            password: 1,
            googleId: 1,
            birthDate: 1,
            travelStyle: 1,
            securityQuestion: 1,
            securityAnswer: 1,
            recoveryCodes: 1,
            emergencyContact: 1,
            suspensionReason: 1,
            suspendedAt: 1,
            suspendedBy: 1,
            lastLoginIp: 1,
            internalNotes: 1,
            recentReauthAt: 1,
            identityProviderRef: 1,
            identityRejectionReason: 1,
            emailVerifiedAt: 1,
            phoneVerifiedAt: 1,
          },
        },
        opts
      );
    });

    // Clean up local uploaded files after DB transaction commits/finishes cleanly
    await deleteOwnedUploadFiles(ownedFilesToRemove, lockedUser.id);

    let confirmationEmailSent = false;
    if (verifiedEmail) {
      const emailResult = await emailService.sendAccountDeletionConfirmationEmail(verifiedEmail, userDisplayName, {
        deletedAt,
        retainedSummary:
          'Your profile, credentials, private diary entries, notifications, and Travel Vault documents were permanently deleted. Public community reviews and shared chat messages remain anonymized, and minimal moderation/security audit records are retained for legal and safety compliance.',
        supportEmail: 'support@tripzobox.com',
      }).catch(() => ({ sent: false }));
      confirmationEmailSent = Boolean(emailResult?.sent);
    }

    return {
      deletedAt,
      usedTransaction,
      confirmationEmailSent,
    };
  } catch (error) {
    // Release concurrency lock ONLY if account has not yet been tombstoned
    await User.updateOne(
      { id: userId, isDeleted: { $ne: true } },
      { $set: { deletionInProgress: false } }
    ).catch(() => {});
    throw error;
  }
};
