import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { OTPVerification } from '../models/OTPVerification.js';
import { IdentityVerification } from '../models/IdentityVerification.js';
import { TravellerReview } from '../models/TravellerReview.js';
import { UserReport } from '../models/UserReport.js';
import { UserBlock } from '../models/UserBlock.js';
import { ModerationAction } from '../models/ModerationAction.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { sendPhoneOtp, getSmsProviderStatus } from '../services/smsService.js';
import { identityVerificationService } from '../services/identityVerificationService.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { signToken, setAuthCookie } from '../utils/token.js';

// ============================================================================
// 1. MOBILE PHONE OTP VERIFICATION
// ============================================================================

export const requestPhoneOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const phone = (req.body.phone || req.user.phone || '').trim();
    if (!phone) {
      sendError(res, 'Phone number is required for verification', 400);
      return;
    }

    // Validate phone number format (at least 10 digits)
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      sendError(res, 'Please provide a valid mobile number with 10 to 15 digits', 400);
      return;
    }

    // Cooldown check (60s rate limit)
    const recentOtp = await OTPVerification.findOne({
      identifier: phone,
      type: 'phone_verification',
      resendAvailableAt: { $gt: new Date() },
      consumed: false,
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil((recentOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      sendError(res, `Please wait ${waitSeconds} seconds before requesting a new OTP`, 429);
      return;
    }

    // Generate random 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    const resendAvailableAt = new Date(now.getTime() + 60 * 1000); // 60 seconds

    // Save or update phone in user record if changed
    if (req.user.phone !== phone) {
      req.user.phone = phone;
      req.user.phoneVerified = false;
      await req.user.save();
    }

    // Invalidate prior pending OTPs for this phone
    await OTPVerification.updateMany(
      { identifier: phone, type: 'phone_verification', consumed: false },
      { $set: { consumed: true } }
    );

    // Create new OTP record
    await OTPVerification.create({
      userId: req.user.id,
      identifier: phone,
      type: 'phone_verification',
      hashedOtp,
      expiresAt,
      resendAvailableAt,
      attempts: 0,
      maxAttempts: 5,
      consumed: false,
    });

    // Dispatch via SMS service
    const smsResult = await sendPhoneOtp(phone, rawOtp);

    sendSuccess(
      res,
      {
        phone,
        expiresInSeconds: 300,
        resendCooldownSeconds: 60,
        smsStatus: smsResult.status,
        isSimulated: smsResult.isSimulated,
        provider: smsResult.provider,
        providerError: smsResult.error,
        // In local development, safely provide debug OTP for testing
        ...(process.env.NODE_ENV !== 'production' && { devOtp: rawOtp }),
      },
      smsResult.status === 'DELIVERED'
        ? `Verification code sent to ${phone} via Fast2SMS`
        : smsResult.error
        ? `Fast2SMS Note: ${smsResult.error}`
        : `Verification code generated for ${phone}`
    );
  } catch (error) {
    next(error);
  }
};

export const verifyPhoneOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { phone, otp } = req.body;
    const targetPhone = (phone || req.user.phone || '').trim();
    const candidateOtp = (otp || '').trim();

    if (!targetPhone || !candidateOtp) {
      sendError(res, 'Both phone number and 6-digit OTP code are required', 400);
      return;
    }

    const otpRecord = await OTPVerification.findOne({
      identifier: targetPhone,
      type: 'phone_verification',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      sendError(res, 'No active OTP verification found. Please request a new code.', 404);
      return;
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      otpRecord.consumed = true;
      await otpRecord.save();
      sendError(res, 'Verification code has expired. Please request a fresh OTP.', 400);
      return;
    }

    // Check brute-force attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      otpRecord.consumed = true;
      await otpRecord.save();
      sendError(
        res,
        'Too many failed attempts. For your security, this code has been invalidated. Please request a new one.',
        429
      );
      return;
    }

    // Increment attempts
    otpRecord.attempts += 1;

    // Securely compare bcrypt hash (or allow universal test OTP 123456 in development)
    const isDevPass = process.env.NODE_ENV !== 'production' && candidateOtp === '123456';
    const isValid = isDevPass || (await otpRecord.compareOtp(candidateOtp));
    if (!isValid) {
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      sendError(
        res,
        `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        400
      );
      return;
    }

    // Success: Mark single-use consumed
    otpRecord.consumed = true;
    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    // Update user record
    req.user.phone = targetPhone;
    req.user.phoneVerified = true;
    req.user.phoneVerifiedAt = new Date();
    await req.user.save();

    sendSuccess(
      res,
      {
        user: req.user.toSafeUser(),
        phoneVerified: true,
      },
      'Mobile phone number verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// EMAIL CHANGE WITH OTP VERIFICATION
// ============================================================================

export const requestEmailChangeOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const rawEmail = (req.body.email || req.body.newEmail || '').trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes('@') || !rawEmail.includes('.')) {
      sendError(res, 'Please provide a valid email address', 400);
      return;
    }

    if (rawEmail === req.user.email?.toLowerCase().trim()) {
      sendError(res, 'This is already your current email address', 400);
      return;
    }

    // Check if another account already uses this email
    const existing = await User.findOne({ email: rawEmail });
    if (existing && existing.id !== req.user.id) {
      sendError(res, 'This email address is already in use by another account', 409);
      return;
    }

    // Cooldown check (60s rate limit)
    const recentOtp = await OTPVerification.findOne({
      userId: req.user.id,
      identifier: rawEmail,
      type: 'email_change',
      resendAvailableAt: { $gt: new Date() },
      consumed: false,
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil((recentOtp.resendAvailableAt.getTime() - Date.now()) / 1000);
      sendError(res, `Please wait ${waitSeconds} seconds before requesting a new code`, 429);
      return;
    }

    // Generate random 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    const resendAvailableAt = new Date(now.getTime() + 60 * 1000); // 60 seconds

    // Invalidate prior pending change requests for this user
    await OTPVerification.updateMany(
      { userId: req.user.id, type: 'email_change', consumed: false },
      { $set: { consumed: true } }
    );

    // Create OTP record
    await OTPVerification.create({
      userId: req.user.id,
      identifier: rawEmail,
      type: 'email_change',
      hashedOtp,
      expiresAt,
      resendAvailableAt,
      attempts: 0,
      maxAttempts: 5,
      consumed: false,
    });

    // Send real email via SMTP
    const token = signToken({
      userId: req.user.id,
      email: rawEmail,
      role: req.user.role,
    });

    const emailResult = await sendVerificationEmail(
      rawEmail,
      req.user.name || 'Traveller',
      token,
      rawOtp
    );

    sendSuccess(
      res,
      {
        email: rawEmail,
        expiresInSeconds: 900,
        resendCooldownSeconds: 60,
        isSimulated: emailResult.isSimulated,
        previewUrl: emailResult.previewUrl,
        hasSmtpConfigured: !emailResult.isSimulated,
        ...(process.env.NODE_ENV !== 'production' && { devOtp: rawOtp }),
      },
      emailResult.isSimulated
        ? `Verification code generated for ${rawEmail} (development mode)`
        : `A 6-digit verification code has been sent to ${rawEmail}`
    );
  } catch (error) {
    next(error);
  }
};

export const verifyEmailChangeOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const rawEmail = (req.body.email || req.body.newEmail || '').trim().toLowerCase();
    const rawOtp = String(req.body.otp || '').trim();

    if (!rawEmail || !rawOtp) {
      sendError(res, 'Email address and 6-digit verification code are required', 400);
      return;
    }

    // Re-verify that no other account took this email
    const existing = await User.findOne({ email: rawEmail, id: { $ne: req.user.id } });
    if (existing) {
      sendError(res, 'This email address is already in use by another account', 409);
      return;
    }

    const isDevPass = process.env.NODE_ENV !== 'production' && rawOtp === '123456';

    if (!isDevPass) {
      const otpRecord = await OTPVerification.findOne({
        userId: req.user.id,
        identifier: rawEmail,
        type: 'email_change',
        consumed: false,
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        sendError(res, 'No active verification code found for this email. Please request a new code.', 404);
        return;
      }

      if (new Date() > otpRecord.expiresAt) {
        otpRecord.consumed = true;
        await otpRecord.save();
        sendError(res, 'Verification code has expired. Please request a new one.', 400);
        return;
      }

      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        otpRecord.consumed = true;
        await otpRecord.save();
        sendError(res, 'Too many failed attempts. Please request a new code.', 429);
        return;
      }

      const isValid = await otpRecord.compareOtp(rawOtp);
      if (!isValid) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = Math.max(0, otpRecord.maxAttempts - otpRecord.attempts);
        sendError(res, `Invalid verification code. ${remaining} attempts remaining.`, 400);
        return;
      }

      // Mark OTP consumed
      otpRecord.consumed = true;
      otpRecord.consumedAt = new Date();
      await otpRecord.save();
    }

    // SUCCESS: Save new email to database and mark verified
    const user = (await User.findOne({
      $or: [{ id: req.user.id }, { _id: req.user._id }],
    })) || req.user;

    if (!user) {
      sendError(res, 'User record not found', 404);
      return;
    }

    user.email = rawEmail;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    // Generate fresh JWT token with the new email
    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        user: user.toSafeUser(),
        token,
        email: user.email,
        emailVerified: true,
      },
      'Email address updated and verified successfully!'
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 2. OPTIONAL GOVERNMENT ID VERIFICATION
// ============================================================================

export const initiateIdentityVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { documentType, consentGiven } = req.body;

    if (!consentGiven) {
      sendError(
        res,
        'Explicit user consent is legally required before initiating identity verification.',
        400
      );
      return;
    }

    const validTypes = ['aadhaar', 'passport', 'driving_license', 'voter_id', 'other'];
    if (!documentType || !validTypes.includes(documentType)) {
      sendError(res, `Invalid document type. Allowed types: ${validTypes.join(', ')}`, 400);
      return;
    }

    // Prevent duplicate active pending requests
    const existingPending = await IdentityVerification.findOne({
      userId: req.user.id,
      status: 'PENDING',
    });

    if (existingPending) {
      sendSuccess(
        res,
        {
          referenceId: existingPending.providerReferenceId,
          status: 'PENDING',
          submittedAt: existingPending.submittedAt,
        },
        'An identity verification request is already in progress.'
      );
      return;
    }

    // Delegate to service abstraction
    const providerResult = await identityVerificationService.initiate({
      userId: req.user.id,
      documentType,
      consentGiven: true,
    });

    const record = await IdentityVerification.create({
      userId: req.user.id,
      provider: 'SandboxIdentityService',
      providerReferenceId: providerResult.providerReferenceId,
      documentType,
      status: 'PENDING',
      consentGiven: true,
      consentTimestamp: new Date(),
      submittedAt: new Date(),
    });

    req.user.identityVerificationStatus = 'PENDING';
    req.user.identityProviderRef = record.providerReferenceId;
    await req.user.save();

    sendSuccess(
      res,
      {
        verificationId: record.id,
        referenceId: record.providerReferenceId,
        status: 'PENDING',
        redirectUrl: providerResult.redirectUrl,
        isMock: providerResult.isMock,
      },
      'Identity verification initiated. Verification is in progress.',
      202
    );
  } catch (error) {
    next(error);
  }
};

export const getIdentityStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const latest = await IdentityVerification.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    sendSuccess(res, {
      status: req.user.identityVerificationStatus || 'NOT_STARTED',
      verifiedAt: req.user.identityVerifiedAt,
      documentType: latest?.documentType,
      submittedAt: latest?.submittedAt,
      rejectionReason: req.user.identityRejectionReason,
      providerStatus: identityVerificationService.getProviderStatus(),
    });
  } catch (error) {
    next(error);
  }
};

// Webhook simulation / testing endpoint (used for automated tests & sandboxing)
export const simulateIdentityResult = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    // Restricted to development/test environments or admin role
    if (process.env.NODE_ENV === 'production' && req.user.role !== 'admin') {
      sendError(res, 'Simulation endpoint is disabled in production', 403);
      return;
    }

    const { status, rejectionReason } = req.body;
    if (!['VERIFIED', 'REJECTED', 'FAILED', 'EXPIRED'].includes(status)) {
      sendError(res, 'Status must be VERIFIED, REJECTED, FAILED, or EXPIRED', 400);
      return;
    }

    const record = await IdentityVerification.findOne({
      userId: req.user.id,
      status: 'PENDING',
    }).sort({ createdAt: -1 });

    if (!record) {
      sendError(res, 'No pending identity verification found to update', 404);
      return;
    }

    record.status = status;
    record.verifiedAt = status === 'VERIFIED' ? new Date() : undefined;
    record.rejectionReason = status !== 'VERIFIED' ? rejectionReason || 'Verification check failed' : undefined;
    await record.save();

    req.user.identityVerificationStatus = status;
    req.user.identityVerifiedAt = record.verifiedAt;
    req.user.identityRejectionReason = record.rejectionReason;
    await req.user.save();

    sendSuccess(
      res,
      {
        status: req.user.identityVerificationStatus,
        verifiedAt: req.user.identityVerifiedAt,
      },
      `Identity verification updated to ${status}`
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 3. TRAVELLER RATINGS AND REVIEWS (Peer-to-Peer Post-Trip)
// ============================================================================

export const submitTravellerReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { tripId, revieweeId, ratings, comment, tags } = req.body;

    if (!tripId || !revieweeId || !ratings) {
      sendError(res, 'tripId, revieweeId, and ratings are required', 400);
      return;
    }

    // Prevent self-review
    if (req.user.id === revieweeId) {
      sendError(res, 'You cannot review yourself.', 400);
      return;
    }

    // Validate rating values (1 to 5)
    const friendliness = Number(ratings.friendliness || ratings.respectfulBehaviour || 5);
    const communication = Number(ratings.communication || 5);
    const punctuality = Number(ratings.punctuality || 5);
    const cooperation = Number(ratings.cooperation || 5);
    const responsibility = Number(ratings.responsibility || 5);
    const overall = ratings.overall !== undefined
      ? Number(ratings.overall)
      : Math.round(((friendliness + communication + punctuality + cooperation + responsibility) / 5) * 10) / 10;

    const allScores = [overall, friendliness, communication, punctuality, cooperation, responsibility];
    for (const score of allScores) {
      if (typeof score !== 'number' || isNaN(score) || score < 1 || score > 5) {
        sendError(res, 'All rating categories must be numbers between 1 and 5.', 400);
        return;
      }
    }

    // Optional review comment (up to 1000 characters)
    const cleanComment = typeof comment === 'string' ? comment.trim() : '';
    if (cleanComment.length > 1000) {
      sendError(res, 'Review comment cannot exceed 1000 characters.', 400);
      return;
    }

    // Verify trip exists and both users participated
    const trip = await Trip.findOne({ id: tripId });
    if (!trip) {
      sendError(res, 'Trip not found.', 404);
      return;
    }

    const allParticipantIds = [trip.leader.id, ...trip.members.map((m) => m.id)];
    const reviewerInTrip = allParticipantIds.includes(req.user.id);
    const revieweeInTrip = allParticipantIds.includes(revieweeId);

    if (!reviewerInTrip) {
      sendError(res, 'You cannot review participants of a trip you did not join.', 403);
      return;
    }

    if (!revieweeInTrip) {
      sendError(res, 'The selected user was not a confirmed participant in this trip.', 400);
      return;
    }

    // Prevent reviews before trip has concluded
    const tripEndDate = new Date(trip.endDate);
    const now = new Date();
    // Allow if trip status is 'completed', 'closed', or endDate is in the past
    const isCompleted = (trip.status as string) === 'completed' || trip.status === 'closed' || (!isNaN(tripEndDate.getTime()) && now >= tripEndDate);
    if (!isCompleted) {
      sendError(res, 'Traveller reviews can only be submitted after the trip has been completed.', 400);
      return;
    }

    // Prevent duplicate review for the same user on the same trip
    const existingReview = await TravellerReview.findOne({
      tripId,
      reviewerId: req.user.id,
      revieweeId,
    });

    if (existingReview) {
      sendError(res, 'You have already submitted a review for this traveller on this trip.', 409);
      return;
    }

    const reviewee = await User.findOne({ id: revieweeId });
    if (!reviewee) {
      sendError(res, 'Reviewee user account not found.', 404);
      return;
    }

    // Sanitize optional feedback tags
    const validTags = Array.isArray(tags)
      ? tags.map((t: string) => String(t).trim()).filter((t: string) => t.length > 0 && t.length <= 30).slice(0, 8)
      : [];

    // Create the review
    const newReview = await TravellerReview.create({
      tripId,
      tripName: trip.name,
      reviewerId: req.user.id,
      reviewerName: req.user.name,
      reviewerAvatar: req.user.avatarUrl,
      revieweeId,
      revieweeName: reviewee.name,
      ratings: {
        overall,
        friendliness,
        communication,
        punctuality,
        cooperation,
        responsibility,
        respectfulBehaviour: friendliness,
      },
      tags: validTags,
      comment: cleanComment,
      status: 'active',
      isReported: false,
    });

    // Recompute reviewee's reputation on backend
    const allReviewsForUser = await TravellerReview.find({ revieweeId, status: { $ne: 'hidden' } });
    const count = allReviewsForUser.length;

    const avgOverall = allReviewsForUser.reduce((acc, r) => acc + (r.ratings.overall || 5), 0) / count;
    const avgFriend = allReviewsForUser.reduce((acc, r) => acc + (r.ratings.friendliness || r.ratings.respectfulBehaviour || 5), 0) / count;
    const avgComm = allReviewsForUser.reduce((acc, r) => acc + (r.ratings.communication || 5), 0) / count;
    const avgPunct = allReviewsForUser.reduce((acc, r) => acc + (r.ratings.punctuality || 5), 0) / count;
    const avgCoop = allReviewsForUser.reduce((acc, r) => acc + (r.ratings.cooperation || 5), 0) / count;
    const avgResp = allReviewsForUser.reduce((acc, r) => acc + (r.ratings.responsibility || 5), 0) / count;

    // 5-to-1 Star distribution
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tagCounts: Record<string, number> = {};
    for (const r of allReviewsForUser) {
      const star = Math.min(5, Math.max(1, Math.round(r.ratings.overall || 5))) as 1 | 2 | 3 | 4 | 5;
      dist[star] = (dist[star] || 0) + 1;
      if (Array.isArray(r.tags)) {
        for (const tg of r.tags) {
          tagCounts[tg] = (tagCounts[tg] || 0) + 1;
        }
      }
    }

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 6);

    reviewee.reputation = {
      averageRating: Math.round(avgOverall * 10) / 10,
      reviewCount: count,
      friendlinessRating: Math.round(avgFriend * 10) / 10,
      communicationRating: Math.round(avgComm * 10) / 10,
      punctualityRating: Math.round(avgPunct * 10) / 10,
      cooperationRating: Math.round(avgCoop * 10) / 10,
      responsibilityRating: Math.round(avgResp * 10) / 10,
      respectfulRating: Math.round(avgFriend * 10) / 10,
      completedTripsCount: (reviewee.reputation?.completedTripsCount || 0) + 1,
      ratingDistribution: dist,
      topTags: sortedTags,
    };
    await reviewee.save();

    sendSuccess(
      res,
      {
        review: newReview,
        updatedReputation: reviewee.reputation,
      },
      'Traveller review submitted successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ id: userId });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const reviews = await TravellerReview.find({ revieweeId: userId, status: { $ne: 'hidden' } }).sort({ createdAt: -1 });

    const total = reviews.length;
    const distribution = {
      5: { count: 0, percent: 0 },
      4: { count: 0, percent: 0 },
      3: { count: 0, percent: 0 },
      2: { count: 0, percent: 0 },
      1: { count: 0, percent: 0 },
    };

    const tagCounts: Record<string, number> = {};

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.ratings.overall || 5))) as 1 | 2 | 3 | 4 | 5;
      distribution[star].count += 1;
      if (Array.isArray(r.tags)) {
        r.tags.forEach((t) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });

    if (total > 0) {
      (Object.keys(distribution) as unknown as Array<1 | 2 | 3 | 4 | 5>).forEach((s) => {
        distribution[s].percent = Math.round((distribution[s].count / total) * 100);
      });
    }

    const positiveTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .slice(0, 8);

    sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        city: user.city,
        country: user.country,
        reputation: user.reputation,
        createdAt: user.createdAt,
      },
      stats: {
        totalReviews: total,
        averageRating: user.reputation?.averageRating || 0,
        distribution,
        categories: {
          overall: user.reputation?.averageRating || 0,
          friendliness: user.reputation?.friendlinessRating || user.reputation?.respectfulRating || 0,
          communication: user.reputation?.communicationRating || 0,
          punctuality: user.reputation?.punctualityRating || 0,
          cooperation: user.reputation?.cooperationRating || 0,
          responsibility: user.reputation?.responsibilityRating || 0,
        },
        positiveTags,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const reportTravellerReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const { reviewId } = req.params;
    const { reason } = req.body;
    if (!reason || String(reason).trim().length < 5) {
      sendError(res, 'A clear reason is required to report a review', 400);
      return;
    }
    const isValidObjId = mongoose.Types.ObjectId.isValid(reviewId);
    const review = await TravellerReview.findOne(
      isValidObjId ? { $or: [{ id: reviewId }, { _id: reviewId }] } : { id: reviewId }
    );
    if (!review) {
      sendError(res, 'Review not found', 404);
      return;
    }
    review.isReported = true;
    review.status = 'flagged';
    review.reportReason = String(reason).trim();
    review.reportedBy = req.user.id;
    await review.save();

    sendSuccess(res, null, 'Review flagged for moderation review. Thank you for keeping TripzoBox safe.');
  } catch (error) {
    next(error);
  }
};

export const getReviewableCompanions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const userId = req.user.id;
    const userTrips = await Trip.find({
      $or: [{ 'leader.id': userId }, { 'members.id': userId }],
    });

    const now = new Date();
    const completedTrips = userTrips.filter((t) => {
      const isPast = t.endDate && !isNaN(new Date(t.endDate).getTime()) && new Date(t.endDate) <= now;
      return (t.status as string) === 'completed' || t.status === 'closed' || isPast;
    });

    const companions: Array<{
      tripId: string;
      tripName: string;
      companionId: string;
      companionName: string;
      companionAvatar: string;
      alreadyReviewed: boolean;
      existingReview?: any;
    }> = [];

    for (const trip of completedTrips) {
      const allParticipants = [
        { id: trip.leader.id, name: trip.leader.name, avatar: trip.leader.avatarUrl || '' },
        ...trip.members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatarUrl || '' })),
      ].filter((p) => p.id !== userId);

      for (const comp of allParticipants) {
        const existing = await TravellerReview.findOne({
          tripId: trip.id,
          reviewerId: userId,
          revieweeId: comp.id,
        });
        companions.push({
          tripId: trip.id,
          tripName: trip.name,
          companionId: comp.id,
          companionName: comp.name,
          companionAvatar: comp.avatar,
          alreadyReviewed: Boolean(existing),
          existingReview: existing || undefined,
        });
      }
    }

    sendSuccess(res, { companions });
  } catch (error) {
    next(error);
  }
};

export const getTripReviewEligibility = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.id;

    const trip = await Trip.findOne({ id: tripId });
    if (!trip) {
      sendError(res, 'Trip not found.', 404);
      return;
    }

    const tripEndDate = new Date(trip.endDate);
    const now = new Date();
    const isCompleted =
      (trip.status as string) === 'completed' ||
      trip.status === 'closed' ||
      (!isNaN(tripEndDate.getTime()) && now >= tripEndDate);

    const allParticipants = [
      { id: trip.leader.id, name: trip.leader.name, avatarUrl: trip.leader.avatarUrl || '', role: 'leader' },
      ...trip.members.map((m) => ({ id: m.id, name: m.name, avatarUrl: m.avatarUrl || '', role: 'member' })),
    ];

    const isUserParticipant = userId ? allParticipants.some((p) => p.id === userId) : false;

    // Check review status for each companion if user is authenticated
    const participantsStatus = await Promise.all(
      allParticipants
        .filter((p) => p.id !== userId)
        .map(async (companion) => {
          let hasReviewed = false;
          let reviewData = null;

          if (userId) {
            const existing = await TravellerReview.findOne({
              tripId,
              reviewerId: userId,
              revieweeId: companion.id,
            });
            if (existing) {
              hasReviewed = true;
              reviewData = existing;
            }
          }

          return {
            id: companion.id,
            name: companion.name,
            avatarUrl: companion.avatarUrl,
            role: companion.role,
            isEligible: isCompleted && isUserParticipant,
            hasReviewed,
            reviewData,
          };
        })
    );

    sendSuccess(res, {
      trip: {
        id: trip.id,
        name: trip.name,
        destination: trip.destination,
        status: trip.status,
        isCompleted,
      },
      isEligible: isCompleted && isUserParticipant,
      canReviewCount: participantsStatus.filter((p) => !p.hasReviewed).length,
      participants: participantsStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getTripReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tripId } = req.params;
    const reviews = await TravellerReview.find({ tripId, status: { $ne: 'hidden' } }).sort({ createdAt: -1 });
    sendSuccess(res, { reviews, total: reviews.length });
  } catch (error) {
    next(error);
  }
};

export const getUserReviewSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ id: userId });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const reviews = await TravellerReview.find({ revieweeId: userId, status: { $ne: 'hidden' } });
    const count = reviews.length;
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.ratings.overall || 5))) as 1 | 2 | 3 | 4 | 5;
      dist[star] = (dist[star] || 0) + 1;
    });

    sendSuccess(res, {
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      averageRating: user.reputation?.averageRating || 0,
      totalReviews: count,
      distribution: dist,
      categoryAverages: {
        friendliness: user.reputation?.friendlinessRating || 0,
        communication: user.reputation?.communicationRating || 0,
        punctuality: user.reputation?.punctualityRating || 0,
        cooperation: user.reputation?.cooperationRating || 0,
        responsibility: user.reputation?.responsibilityRating || 0,
        overall: user.reputation?.averageRating || 0,
      },
      topTags: user.reputation?.topTags || [],
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 4. REPORT & BLOCK SYSTEM
// ============================================================================

export const submitReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { targetType, targetId, category, description, evidenceUrl, targetName } = req.body;

    if (!targetType || !targetId || !category || !description) {
      sendError(res, 'targetType, targetId, category, and description are required', 400);
      return;
    }

    // Prevent reporting oneself
    if (targetType === 'user' && targetId === req.user.id) {
      sendError(res, 'You cannot report your own account.', 400);
      return;
    }

    const cleanDesc = description.trim();
    if (cleanDesc.length < 10) {
      sendError(res, 'Please provide at least 10 characters describing the safety concern.', 400);
      return;
    }

    const report = await UserReport.create({
      reporterId: req.user.id,
      reporterName: req.user.name,
      targetType,
      targetId,
      targetName: targetName || '',
      category,
      description: cleanDesc,
      evidenceUrl,
      status: 'OPEN',
    });

    sendSuccess(
      res,
      {
        reportId: report.id,
        status: report.status,
        submittedAt: report.createdAt,
      },
      'Your report has been securely submitted to TripzoBox Trust & Safety. Reports are strictly confidential.',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const reports = await UserReport.find({ reporterId: req.user.id }).sort({ createdAt: -1 });

    sendSuccess(res, { reports });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { targetUserId, reason } = req.body;
    if (!targetUserId) {
      sendError(res, 'targetUserId is required', 400);
      return;
    }

    if (targetUserId === req.user.id) {
      sendError(res, 'You cannot block yourself.', 400);
      return;
    }

    const targetUser = await User.findOne({ id: targetUserId });
    if (!targetUser) {
      sendError(res, 'User to block not found', 404);
      return;
    }

    const existingBlock = await UserBlock.findOne({
      blockerId: req.user.id,
      blockedUserId: targetUserId,
    });

    if (existingBlock) {
      sendSuccess(res, { isBlocked: true }, `${targetUser.name} is already blocked.`);
      return;
    }

    await UserBlock.create({
      blockerId: req.user.id,
      blockedUserId: targetUserId,
      blockedUserName: targetUser.name,
      reason,
    });

    sendSuccess(
      res,
      { isBlocked: true, blockedUserId: targetUserId },
      `User ${targetUser.name} has been blocked. They can no longer send you direct messages.`
    );
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { targetUserId } = req.body;
    if (!targetUserId) {
      sendError(res, 'targetUserId is required', 400);
      return;
    }

    const deleted = await UserBlock.findOneAndDelete({
      blockerId: req.user.id,
      blockedUserId: targetUserId,
    });

    if (!deleted) {
      sendError(res, 'Block record not found.', 404);
      return;
    }

    sendSuccess(res, { isBlocked: false }, 'User has been unblocked.');
  } catch (error) {
    next(error);
  }
};

export const getBlockedUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const blocks = await UserBlock.find({ blockerId: req.user.id }).sort({ createdAt: -1 });

    sendSuccess(res, { blockedUsers: blocks });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 5. EMERGENCY & TRIP SAFETY
// ============================================================================

export const getEmergencyInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    sendSuccess(res, {
      nationalHelplines: [
        { name: 'All-in-One National Emergency Helpline', number: '112', description: 'Police, Ambulance & Fire across India' },
        { name: 'Police Assistance', number: '100', description: 'Immediate law enforcement' },
        { name: 'Women Helpline / Safety', number: '1091', description: '24x7 Emergency helpline for women' },
        { name: 'Medical & Ambulance', number: '108', description: 'Emergency medical services' },
        { name: 'National Tourist Helpline', number: '1363', description: 'Multi-lingual tourist support' },
      ],
      safetyGuidelines: [
        'Meet your group in public areas for initial departure gatherings.',
        'Keep emergency contacts updated in your Travel Vault.',
        'Share your trip itinerary with trusted family or friends back home.',
        'Keep essential documents secured in offline mode within your Travel Vault.',
      ],
    });
  } catch (error) {
    next(error);
  }
};

export const shareTripWithEmergencyContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { tripId, contactPhone, contactEmail, shareLocationConsent } = req.body;
    if (!tripId) {
      sendError(res, 'tripId is required', 400);
      return;
    }

    const trip = await Trip.findOne({ id: tripId });
    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    sendSuccess(
      res,
      {
        tripId,
        sharedWith: contactPhone || contactEmail || 'Emergency Contacts',
        itinerarySummary: `${trip.name} (${trip.destination}, ${trip.startDate} to ${trip.endDate})`,
        locationSharingActive: Boolean(shareLocationConsent),
      },
      'Trip details successfully shared with your designated contact.'
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// 6. ADMIN MODERATION SYSTEM
// ============================================================================

export const getAdminReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, category } = req.query;
    const filter: Record<string, any> = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }

    const reports = await UserReport.find(filter).sort({ createdAt: -1 });

    sendSuccess(res, { reports, count: reports.length });
  } catch (error) {
    next(error);
  }
};

export const getAdminReportById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reportId } = req.params;
    const report = await UserReport.findOne({ id: reportId });

    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }

    sendSuccess(res, { report });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { reportId } = req.params;
    const { status, moderatorNotes } = req.body;

    if (!['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }

    const report = await UserReport.findOne({ id: reportId });
    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }

    report.status = status;
    report.moderatorNotes = moderatorNotes || report.moderatorNotes;
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
    }
    await report.save();

    // Log moderation action audit record
    await ModerationAction.create({
      adminId: req.user.id,
      adminName: req.user.name,
      reportId: report.id,
      targetUserId: report.targetType === 'user' ? report.targetId : undefined,
      action: status === 'RESOLVED' ? 'RESOLVE_REPORT' : status === 'DISMISSED' ? 'DISMISS_REPORT' : 'UNDER_REVIEW',
      reason: moderatorNotes || `Status updated to ${status}`,
    });

    sendSuccess(res, { report }, `Report status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

export const suspendUserAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { userId } = req.params;
    const { reason, reportId } = req.body;

    if (!reason || reason.trim().length < 5) {
      sendError(res, 'A clear reason is required to suspend a user account', 400);
      return;
    }

    const targetUser = await User.findOne({ id: userId });
    if (!targetUser) {
      sendError(res, 'Target user not found', 404);
      return;
    }

    if (targetUser.role === 'admin') {
      sendError(res, 'Cannot suspend an admin account', 400);
      return;
    }

    targetUser.isSuspended = true;
    targetUser.suspensionReason = reason.trim();
    targetUser.suspendedAt = new Date();
    targetUser.suspendedBy = req.user.id;
    await targetUser.save();

    // Audit log
    await ModerationAction.create({
      adminId: req.user.id,
      adminName: req.user.name,
      reportId,
      targetUserId: targetUser.id,
      action: 'SUSPEND_USER',
      reason: reason.trim(),
    });

    sendSuccess(res, { userId, isSuspended: true }, `User ${targetUser.name} has been suspended.`);
  } catch (error) {
    next(error);
  }
};

export const restoreUserAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { userId } = req.params;
    const { reason } = req.body;

    const targetUser = await User.findOne({ id: userId });
    if (!targetUser) {
      sendError(res, 'Target user not found', 404);
      return;
    }

    targetUser.isSuspended = false;
    targetUser.suspensionReason = undefined;
    targetUser.suspendedAt = undefined;
    targetUser.suspendedBy = undefined;
    await targetUser.save();

    await ModerationAction.create({
      adminId: req.user.id,
      adminName: req.user.name,
      targetUserId: targetUser.id,
      action: 'RESTORE_USER',
      reason: reason || 'Account restored after moderation review.',
    });

    sendSuccess(res, { userId, isSuspended: false }, `User ${targetUser.name} has been restored.`);
  } catch (error) {
    next(error);
  }
};

export const getModerationAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logs = await ModerationAction.find().sort({ createdAt: -1 }).limit(100);
    sendSuccess(res, { logs, count: logs.length });
  } catch (error) {
    next(error);
  }
};

