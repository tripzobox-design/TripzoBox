import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ClientSession } from 'mongoose';
import { User, IUser } from '../models/User.js';
import { OTPVerification } from '../models/OTPVerification.js';
import { ConsumedResetToken } from '../models/ConsumedResetToken.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { runWithTransaction } from '../utils/transaction.js';
import {
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  signReauthToken,
  setReauthCookie,
} from '../utils/token.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail, latestEmailDispatches } from '../services/emailService.js';
import { sendPhoneOtp } from '../services/smsService.js';
import { getAuthSettings } from '../services/authSettingsService.js';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GoogleOAuthError,
  getGoogleOAuthConfig,
  createGoogleAuthUrl,
  verifyOAuthStateCookie,
  exchangeCodeForGoogleProfile,
  authenticateGoogleUser,
  reauthenticateGoogleUser,
  buildFrontendErrorRedirect,
  buildFrontendSuccessRedirect,
  buildFrontendReauthSuccessRedirect,
  createOAuthHandoffCode,
  consumeOAuthHandoffCode,
} from '../services/googleOAuthService.js';
import { config } from '../config/env.js';

// In-memory OTP storage for password reset flows
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      emailOrPhone,
      password,
      birthDate,
      gender,
      country,
      travelStyle,
      travelInterests,
      avatarUrl,
      securityQuestion,
      securityAnswer,
    } = req.body;

    const isEmail = emailOrPhone.includes('@');
    const email = isEmail ? emailOrPhone.toLowerCase().trim() : undefined;
    const phone = !isEmail ? emailOrPhone.trim() : undefined;

    const authSettings = await getAuthSettings();
    if (phone && !authSettings.smsOtp?.enabled) {
      sendError(res, 'SMS/Phone registration is currently disabled. Please sign up using your email address.', 403);
      return;
    }

    // Check if user already exists
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        sendError(res, 'An account with this email address already exists', 409);
        return;
      }
    }
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        sendError(res, 'An account with this phone number already exists', 409);
        return;
      }
    }

    const usernameBase = (email ? email.split('@')[0] : name).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const username = `${usernameBase}_${Math.floor(100 + Math.random() * 900)}`;

    let hashedSecurityAnswer: string | undefined;
    if (securityQuestion && securityAnswer) {
      const salt = await bcrypt.genSalt(10);
      hashedSecurityAnswer = await bcrypt.hash(securityAnswer.trim().toLowerCase(), salt);
    }

    const plainRecoveryCodes: string[] = [];
    const hashedRecoveryCodes: Array<{ codeHash: string; used: boolean }> = [];
    for (let i = 0; i < 6; i++) {
      const seg1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const seg2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${seg1}-${seg2}`;
      plainRecoveryCodes.push(code);
      const codeHash = await bcrypt.hash(code, 10);
      hashedRecoveryCodes.push({ codeHash, used: false });
    }

    const user = new User({
      id: `user_${Date.now()}`,
      name,
      username,
      email,
      phone,
      password: password || 'DefaultPass123!',
      avatarUrl: avatarUrl || '',
      birthDate,
      gender,
      country: country || '',
      travelStyle: travelStyle || 'Solo',
      travelInterests: travelInterests || ['Hiking', 'Nature', 'Photography', 'Food'],
      securityQuestion: securityQuestion || undefined,
      securityAnswer: hashedSecurityAnswer,
      recoveryCodes: hashedRecoveryCodes,
      emailVerified: false,
      phoneVerified: false,
    });

    await user.save();

    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    setAuthCookie(res, token);

    let rawEmailOtp: string | undefined;
    if (user.email) {
      rawEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(rawEmailOtp, salt);

      await OTPVerification.updateMany(
        { identifier: user.email.toLowerCase().trim(), type: 'email_verification', consumed: false },
        { $set: { consumed: true } }
      );

      await OTPVerification.create({
        userId: user.id,
        identifier: user.email.toLowerCase().trim(),
        type: 'email_verification',
        hashedOtp,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        resendAvailableAt: new Date(Date.now() + 60 * 1000),
        attempts: 0,
        maxAttempts: 5,
        consumed: false,
      });

      sendVerificationEmail(user.email, user.name, token, rawEmailOtp).catch((err) => {
        console.warn('[Signup] Verification email dispatch note:', err.message);
      });
    }

    sendSuccess(
      res,
      {
        token,
        user: user.toSafeUser(),
        recoveryCodes: plainRecoveryCodes,
        ...(rawEmailOtp && process.env.NODE_ENV !== 'production' && { devOtp: rawEmailOtp }),
      },
      'Account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailOrPhone, password } = req.body;
    const query = emailOrPhone.trim().toLowerCase();
    const isEmail = query.includes('@');

    const user = await User.findOne({
      $or: isEmail
        ? [{ email: query }]
        : [{ phone: query }, { username: query }, { email: query }],
    }).select('+password');

    if (!user) {
      sendError(res, 'Invalid credentials. User not found.', 401);
      return;
    }

    if (user.isDeleted) {
      sendError(res, 'This account has been permanently deleted.', 401);
      return;
    }

    // Accounts without a password cannot authenticate via password login
    if (!user.password) {
      if (user.isGoogleConnected) {
        sendError(
          res,
          'This account signs in with Google. Please continue with Google or reset your password.',
          401
        );
        return;
      }
      sendError(res, 'Invalid credentials.', 401);
      return;
    }

    // Enforce password verification for password-based accounts
    if (!password) {
      sendError(res, 'Invalid credentials.', 401);
      return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      sendError(res, 'Invalid credentials.', 401);
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        token,
        user: user.toSafeUser(),
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Unauthenticated', 401);
    return;
  }
  sendSuccess(res, { user: req.user.toSafeUser() });
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    // Security check: reject explicit attempts to self-verify or elevate privileges
    const forbiddenFields = [
      'emailVerified',
      'phoneVerified',
      'identityVerificationStatus',
      'role',
      'reputation',
      'isSuspended',
    ];

    for (const forbidden of forbiddenFields) {
      if (req.body[forbidden] !== undefined) {
        sendError(
          res,
          `Modifying '${forbidden}' via profile update is strictly prohibited. Use official verification workflows.`,
          403
        );
        return;
      }
    }

    const permittedFields = [
      'name',
      'bio',
      'city',
      'country',
      'languages',
      'travelStyle',
      'travelInterests',
      'budgetStyle',
      'travelPace',
      'preferredGroupSize',
      'dreamDestination',
      'avatarUrl',
      'coverUrl',
    ];

    for (const field of permittedFields) {
      if (req.body[field] !== undefined) {
        (req.user as any)[field] = req.body[field];
      }
    }

    await req.user.save();
    sendSuccess(res, { user: req.user.toSafeUser() }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const setSecurityQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { question, answer } = req.body;
    req.user.securityQuestion = question;
    const salt = await bcrypt.genSalt(10);
    req.user.securityAnswer = await bcrypt.hash(answer.trim().toLowerCase(), salt);
    await req.user.save();

    sendSuccess(res, null, 'Security question configured successfully');
  } catch (error) {
    next(error);
  }
};

export const requestReset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrPhone, method } = req.body;
    const clean = (emailOrPhone || '').trim().toLowerCase();
    const digitsOnly = clean.replace(/\D/g, '');

    let user = await User.findOne({
      $or: [
        { email: clean },
        { phone: clean },
        ...(digitsOnly.length >= 10 ? [{ phone: new RegExp(digitsOnly.slice(-10)) }] : []),
      ],
    });

    if (!user) {
      sendError(res, 'No account found matching this email or phone number', 404);
      return;
    }

    // Method 1: Security Question recovery
    if (method === 'security-question') {
      const { securityAnswer } = req.body;
      const userWithSec = await User.findById(user._id).select('+securityAnswer');
      if (!userWithSec || !userWithSec.securityQuestion) {
        sendError(res, 'No security question configured for this account.', 400);
        return;
      }

      // If user hasn't provided the answer yet, return the question
      if (!securityAnswer) {
        sendSuccess(
          res,
          {
            method: 'security-question',
            question: userWithSec.securityQuestion,
            emailOrPhone: clean,
          },
          'Security question retrieved'
        );
        return;
      }

      // Verify answer (supports both bcrypt hashed and legacy lowercase plaintext)
      const isMatch = userWithSec.securityAnswer?.startsWith('$2')
        ? await bcrypt.compare(securityAnswer.trim().toLowerCase(), userWithSec.securityAnswer)
        : userWithSec.securityAnswer === securityAnswer.trim().toLowerCase();

      if (!isMatch) {
        sendError(res, 'Incorrect security answer. Please check and try again.', 400);
        return;
      }

      // Answer verified! Generate single-use password reset token
      const jti = crypto.randomUUID();
      const targetEmail = user.email || clean;
      const resetToken = jwt.sign(
        { purpose: 'password_reset', email: targetEmail, userId: user.id, jti, tokenVersion: user.tokenVersion ?? 0 },
        config.jwtSecret,
        { expiresIn: '15m' }
      );

      sendSuccess(
        res,
        {
          method: 'security-question',
          verified: true,
          resetToken,
          emailOrPhone: clean,
        },
        'Security question verified. You can now reset your password.'
      );
      return;
    }

    // Method 2: Recovery Code recovery
    if (method === 'recovery-code') {
      const { recoveryCode } = req.body;
      if (!recoveryCode || typeof recoveryCode !== 'string') {
        sendError(res, 'Please provide your account recovery code.', 400);
        return;
      }

      const userWithCodes = await User.findById(user._id).select('+recoveryCodes');
      const codes: any[] = userWithCodes?.recoveryCodes || [];
      const cleanInputCode = recoveryCode.trim().toUpperCase();

      let matchedIndex = -1;
      for (let i = 0; i < codes.length; i++) {
        const item = codes[i];
        if (typeof item === 'string') {
          // Legacy string code
          if (item.toUpperCase() === cleanInputCode) {
            matchedIndex = i;
            break;
          }
        } else if (item && typeof item === 'object') {
          if (!item.used) {
            const isMatch = item.codeHash?.startsWith('$2')
              ? await bcrypt.compare(cleanInputCode, item.codeHash)
              : item.codeHash === cleanInputCode;
            if (isMatch) {
              matchedIndex = i;
              break;
            }
          }
        }
      }

      if (matchedIndex === -1) {
        sendError(res, 'Invalid or already used recovery code.', 400);
        return;
      }

      // Mark the matched recovery code as used (single-use enforcement)
      const matchedItem = codes[matchedIndex];
      if (typeof matchedItem === 'string') {
        codes.splice(matchedIndex, 1);
      } else {
        matchedItem.used = true;
        matchedItem.usedAt = new Date();
      }
      userWithCodes!.markModified('recoveryCodes');
      await userWithCodes!.save();

      // Recovery code verified! Issue single-use password reset token
      const jti = crypto.randomUUID();
      const targetEmail = user.email || clean;
      const resetToken = jwt.sign(
        { purpose: 'password_reset', email: targetEmail, userId: user.id, jti, tokenVersion: user.tokenVersion ?? 0 },
        config.jwtSecret,
        { expiresIn: '15m' }
      );

      sendSuccess(
        res,
        {
          method: 'recovery-code',
          verified: true,
          resetToken,
          emailOrPhone: clean,
        },
        'Recovery code verified. You can now reset your password.'
      );
      return;
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(clean, {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    });
    if (digitsOnly.length >= 10) {
      otpStore.set(digitsOnly.slice(-10), {
        otp,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
    }

    const isPhoneMethod = method === 'phone' || (!clean.includes('@') && digitsOnly.length >= 10);

    const authSettings = await getAuthSettings();
    if (isPhoneMethod && !authSettings.smsOtp?.enabled) {
      sendError(res, 'SMS OTP verification is currently disabled. Please use your registered email address.', 403);
      return;
    }
    if (!isPhoneMethod && !authSettings.emailOtp?.enabled) {
      sendError(res, 'Email OTP password recovery is currently disabled by administrator.', 403);
      return;
    }

    let smsResult: any = null;
    let resetToken: string | undefined;
    if (isPhoneMethod) {
      const targetPhone = user.phone || clean;
      smsResult = await sendPhoneOtp(targetPhone, otp).catch((err) => {
        console.warn('[PasswordReset] Phone OTP dispatch note:', err.message);
        return { success: false, isSimulated: true, status: 'FAILED', error: err.message };
      });
    } else if (user.email || clean.includes('@')) {
      const targetEmail = user.email || clean;
      const jti = crypto.randomUUID();
      resetToken = jwt.sign(
        { purpose: 'password_reset', email: targetEmail, userId: user.id, jti, tokenVersion: user.tokenVersion ?? 0 },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
      try {
        await sendPasswordResetEmail(targetEmail, user.name || 'Traveler', otp, resetToken);
      } catch (err: any) {
        console.error('[PasswordReset] Email dispatch error:', err.message);
        sendError(res, 'Unable to send password reset email. Please try again later or contact support.', 500);
        return;
      }
    }

    sendSuccess(
      res,
      {
        method: isPhoneMethod ? 'phone' : 'email',
        expiresInSeconds: 900,
        phone: user.phone || (!clean.includes('@') ? clean : undefined),
        email: user.email || (clean.includes('@') ? clean : undefined),
        smsStatus: smsResult?.status,
        isSimulated: isPhoneMethod ? (smsResult ? smsResult.isSimulated : false) : false,
        providerError: smsResult?.error,
        // In local development mode only, provide OTP and token in debug payload for effortless testing
        ...(config.nodeEnv !== 'production' && process.env.RENDER !== 'true' && { devOtp: otp, resetToken }),
      },
      isPhoneMethod
        ? (smsResult?.status === 'DELIVERED'
          ? `Verification code delivered via Fast2SMS to ${user.phone || clean}`
          : 'Verification code sent via SMS')
        : `Password reset link sent to ${user.email || clean}`
    );
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrPhone, otp } = req.body;
    const clean = (emailOrPhone || '').trim().toLowerCase();
    const digitsOnly = clean.replace(/\D/g, '');
    const trimmedOtp = (otp || '').trim();

    // Universal dev OTP for local testing
    const isDevDefault = process.env.NODE_ENV !== 'production' && trimmedOtp === '123456';

    if (!isDevDefault) {
      const record = otpStore.get(clean) || (digitsOnly.length >= 10 ? otpStore.get(digitsOnly.slice(-10)) : null);
      if (!record || Date.now() > record.expiresAt) {
        sendError(res, 'Verification code has expired or does not exist. Please request a new one.', 400);
        return;
      }

      if (record.otp !== trimmedOtp) {
        sendError(res, 'Invalid verification code. Please check and try again.', 400);
        return;
      }

      // OTP verified, clear it
      otpStore.delete(clean);
      if (digitsOnly.length >= 10) otpStore.delete(digitsOnly.slice(-10));
    }

    sendSuccess(res, { verified: true }, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

export const syncSession = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // Endpoint removed for security — unauthenticated session creation is not permitted
  sendError(res, 'Not found', 404);
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { emailOrPhone, newPassword, token } = req.body;
    const clean = emailOrPhone.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: clean }, { phone: clean }],
    });

    if (!user || user.isDeleted) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Token is required — reject immediately if missing
    if (!token || typeof token !== 'string') {
      sendError(res, 'A valid reset token is required.', 400);
      return;
    }

    let decodedToken: any;
    let tokenIdentifier: string;
    let tokenExpiresAt: Date;
    try {
      decodedToken = jwt.verify(token, config.jwtSecret);
      // Reject if purpose wrong OR either email OR userId doesn't match (|| not &&)
      if (
        decodedToken.purpose !== 'password_reset' ||
        !decodedToken.email ||
        decodedToken.email.toLowerCase() !== clean ||
        decodedToken.userId !== user.id
      ) {
        sendError(res, 'Invalid password reset token for this account.', 400);
        return;
      }

      // Check if user tokenVersion has changed since this token was issued
      if (decodedToken.tokenVersion !== undefined && decodedToken.tokenVersion !== (user.tokenVersion ?? 0)) {
        sendError(res, 'This password reset token has already been used.', 400);
        return;
      }

      // Enforce single-use across restarts and horizontal instances via persistent MongoDB registry
      tokenIdentifier = decodedToken.jti || crypto.createHash('sha256').update(token).digest('hex');
      const alreadyConsumed = await ConsumedResetToken.findOne({ tokenIdentifier });
      if (alreadyConsumed) {
        sendError(res, 'This password reset token has already been used.', 400);
        return;
      }

      tokenExpiresAt = decodedToken.exp ? new Date(decodedToken.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);
    } catch {
      // JWT invalid, expired, or tampered — always reject
      sendError(res, 'Invalid or expired password reset token.', 400);
      return;
    }

    // Ensure unique security index exists on ConsumedResetToken before critical path
    try {
      await ConsumedResetToken.init();
    } catch (indexErr: any) {
      console.error('[PasswordReset] Failed to ensure security index on ConsumedResetToken:', indexErr?.message);
      sendError(res, 'Authentication service temporarily unavailable. Please try again.', 503);
      return;
    }

    // Check persistent MongoDB registry for consumed tokens
    const alreadyConsumed = await ConsumedResetToken.findOne({ tokenIdentifier });
    if (alreadyConsumed) {
      sendError(res, 'This password reset token has already been used.', 400);
      return;
    }

    // Atomically claim the token and update the user password within a MongoDB transaction
    // when supported (Atlas replica set), falling back safely with rollback on standalone instances.
    let tokenConsumedInDb = false;
    try {
      await runWithTransaction(async (session: ClientSession | null) => {
        const opts = session ? { session } : {};

        // 1. Atomically register the consumed token in persistent MongoDB collection
        await ConsumedResetToken.create(
          [
            {
              tokenIdentifier,
              userId: user.id,
              email: clean,
              expiresAt: tokenExpiresAt,
              consumedAt: new Date(),
            },
          ],
          opts
        );
        tokenConsumedInDb = true;

        // 2. Hash password and atomically update user password + increment tokenVersion
        // Using conditional matching on expectedTokenVersion prevents race conditions when
        // multiple reset tokens for the same account are submitted simultaneously.
        // For expectedTokenVersion === 0, also match legacy records where tokenVersion is missing/null.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const expectedTokenVersion =
          decodedToken.tokenVersion !== undefined ? decodedToken.tokenVersion : (user.tokenVersion ?? 0);

        const versionFilter =
          expectedTokenVersion === 0
            ? {
                $or: [
                  { tokenVersion: 0 },
                  { tokenVersion: { $exists: false } },
                  { tokenVersion: null },
                ],
              }
            : { tokenVersion: expectedTokenVersion };

        const updateResult = await User.updateOne(
          {
            _id: user._id,
            ...versionFilter,
          },
          {
            $set: { password: hashedPassword, mustResetPassword: false },
            $inc: { tokenVersion: 1 },
          },
          opts
        );

        if (updateResult.matchedCount === 0) {
          throw new Error('TOKEN_VERSION_MISMATCH');
        }
      });
    } catch (err: any) {
      if (err?.code === 11000 || (err?.name === 'MongoServerError' && String(err?.message).includes('E11000'))) {
        sendError(res, 'This password reset token has already been used.', 400);
        return;
      }
      if (err?.message === 'TOKEN_VERSION_MISMATCH') {
        sendError(res, 'This password reset token has already been used.', 400);
        return;
      }
      // If transactions are not active (standalone) and user update failed after claiming token:
      if (tokenConsumedInDb) {
        await ConsumedResetToken.deleteOne({ tokenIdentifier }).catch(() => {});
      }
      throw err;
    }

    // Invalidate OTP store for this user
    otpStore.delete(clean);

    sendSuccess(res, null, 'Password reset successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

export const getRecoveryCodes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const user = await User.findById(req.user._id).select('+recoveryCodes');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Generate fresh cryptographically secure recovery codes
    const plainCodes: string[] = [];
    const hashedCodes: Array<{ codeHash: string; used: boolean }> = [];
    for (let i = 0; i < 6; i++) {
      const seg1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const seg2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const code = `${seg1}-${seg2}`;
      plainCodes.push(code);
      const codeHash = await bcrypt.hash(code, 10);
      hashedCodes.push({ codeHash, used: false });
    }

    user.recoveryCodes = hashedCodes;
    await user.save();

    sendSuccess(res, { recoveryCodes: plainCodes }, 'Recovery codes generated successfully');
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authSettings = await getAuthSettings();
    if (!authSettings.emailOtp?.enabled) {
      sendError(res, 'Email verification is currently disabled by administrator.', 403);
      return;
    }

    const { emailOrPhone } = req.body;
    const clean = (emailOrPhone || '').trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ email: clean }, { phone: clean }],
    });

    if (!user) {
      // Check if bearer token is present for a logged-in user updating/verifying their email
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = verifyToken(authHeader.substring(7));
          if (decoded && decoded.userId) {
            user = await User.findById(decoded.userId);
          }
        } catch {
          // ignore token decode error
        }
      }
    }

    if (!user && !clean.includes('@')) {
      sendError(res, 'User not found matching this email or phone', 404);
      return;
    }

    if (user?.isDeleted) {
      sendError(res, 'This account has been permanently deleted.', 401);
      return;
    }

    const targetEmail = clean.includes('@') ? clean : (user?.email || clean).toLowerCase().trim();
    const token = user
      ? signToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion ?? 0,
        })
      : signToken({ userId: 'temp', email: targetEmail, role: 'user' });

    const rawEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(rawEmailOtp, salt);

    await OTPVerification.updateMany(
      { identifier: targetEmail, type: 'email_verification', consumed: false },
      { $set: { consumed: true } }
    );

    await OTPVerification.create({
      userId: user?.id,
      identifier: targetEmail,
      type: 'email_verification',
      hashedOtp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      resendAvailableAt: new Date(Date.now() + 60 * 1000),
      attempts: 0,
      maxAttempts: 5,
      consumed: false,
    });

    const emailResult = await sendVerificationEmail(
      targetEmail,
      user?.name || 'Traveller',
      token,
      rawEmailOtp
    );

    const isProductionEnv = config.nodeEnv === 'production' || process.env.RENDER === 'true';

    sendSuccess(
      res,
      {
        email: user?.email || targetEmail,
        isSimulated: isProductionEnv ? false : emailResult.isSimulated,
        verificationLink: !isProductionEnv ? emailResult.verificationLink : undefined,
        previewUrl: !isProductionEnv ? emailResult.previewUrl : undefined,
        hasSmtpConfigured: !emailResult.isSimulated,
        devOtp: !isProductionEnv ? rawEmailOtp : undefined,
      },
      emailResult.isSimulated && !isProductionEnv
        ? 'Verification code generated (development mode).'
        : `A verification code and link has been sent to ${user?.email || targetEmail}`
    );
  } catch (error) {
    next(error);
  }
};

export const checkVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = (
      (req.query.email as string) ||
      (req as any).user?.email ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!email) {
      sendError(res, 'Email parameter is required', 400);
      return;
    }

    const user = await User.findOne({ email });
    if (!user || user.isDeleted) {
      sendError(res, 'User not found', 404);
      return;
    }

    const dispatch = latestEmailDispatches.get(email);
    const isEmailConfigured = !!(config.brevoApiKey || (config.smtpUser && config.smtpPass));
    const isProductionEnv = config.nodeEnv === 'production' || process.env.RENDER === 'true';

    sendSuccess(res, {
      emailVerified: !!user.emailVerified,
      hasSmtpConfigured: isEmailConfigured,
      isSimulated: isProductionEnv ? false : (dispatch?.isSimulated ?? !isEmailConfigured),
      verificationLink: !isProductionEnv ? dispatch?.verificationLink : undefined,
      previewUrl: !isProductionEnv ? dispatch?.previewUrl : undefined,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.body?.token || (req.query?.token as string);
    const otp = req.body?.otp ? String(req.body.otp).trim() : '';
    const email = (req.body?.email || (req.query?.email as string) || '').trim().toLowerCase();

    // 1. If 6-digit OTP code is supplied:
    if (otp) {
      const targetEmail = (email || (req as any).user?.email || '').toLowerCase().trim();
      if (!targetEmail) {
        sendError(res, 'Email address is required to verify OTP code.', 400);
        return;
      }

      let targetUser = await User.findOne({ email: targetEmail });
      if (!targetUser) {
        // Check if authenticated user is verifying their new email
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const decoded = verifyToken(authHeader.substring(7));
            if (decoded && decoded.userId) {
              targetUser = await User.findById(decoded.userId);
              if (targetUser) {
                targetUser.email = targetEmail;
              }
            }
          } catch {
            // ignore token error
          }
        }
      }

      if (!targetUser) {
        sendError(res, 'User associated with this email address was not found.', 404);
        return;
      }

      const isDevPass = process.env.NODE_ENV !== 'production' && otp === '123456';
      if (!isDevPass) {
        const otpRecord = await OTPVerification.findOne({
          identifier: targetEmail,
          type: 'email_verification',
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

        const isValid = await otpRecord.compareOtp(otp);
        if (!isValid) {
          otpRecord.attempts += 1;
          await otpRecord.save();
          sendError(res, 'Invalid verification code. Please check your email.', 400);
          return;
        }

        otpRecord.consumed = true;
        otpRecord.consumedAt = new Date();
        await otpRecord.save();
      }

      if (targetUser.isDeleted) {
        sendError(res, 'This account has been permanently deleted.', 401);
        return;
      }

      targetUser.emailVerified = true;
      targetUser.emailVerifiedAt = new Date();
      await targetUser.save();

      const authToken = signToken({
        userId: targetUser.id,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
        tokenVersion: targetUser.tokenVersion ?? 0,
      });
      setAuthCookie(res, authToken);

      sendSuccess(
        res,
        {
          user: targetUser.toSafeUser(),
          token: authToken,
          emailVerified: true,
        },
        'Email address verified successfully!'
      );
      return;
    }

    // 2. Otherwise verify via token:
    if (!token) {
      sendError(res, 'Verification token or OTP code is required to verify email address.', 400);
      return;
    }

    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        sendError(res, 'Verification token has expired. Please request a new verification email.', 400);
        return;
      }
      sendError(res, 'Invalid verification token.', 400);
      return;
    }

    if (!decoded || !decoded.userId) {
      sendError(res, 'Invalid token payload', 400);
      return;
    }

    const targetUser = await User.findOne({ id: decoded.userId });
    if (!targetUser || targetUser.isDeleted) {
      sendError(res, 'User associated with verification token not found.', 404);
      return;
    }

    // Check if email was already verified
    if (targetUser.emailVerified && targetUser.emailVerifiedAt) {
      sendSuccess(res, { user: targetUser.toSafeUser(), alreadyVerified: true }, 'Email has already been verified.');
      return;
    }

    targetUser.emailVerified = true;
    targetUser.emailVerifiedAt = new Date();
    await targetUser.save();

    // If opened directly from email link via browser GET:
    if (req.method === 'GET') {
      const authToken = signToken({
        userId: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        tokenVersion: targetUser.tokenVersion ?? 0,
      });
      setAuthCookie(res, authToken);
      res.redirect(`${config.frontendUrl}/auth?step=verify-email&verified=true&email=${encodeURIComponent(targetUser.email || '')}`);
      return;
    }

    sendSuccess(
      res,
      { user: targetUser.toSafeUser() },
      'Email verified successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const oauthLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { provider, email, name, avatarUrl, idToken } = req.body;
    if (!email) {
      sendError(res, 'Email is required for social authentication', 400);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    const authSettings = await getAuthSettings();
    if (provider === 'Apple' && !authSettings.appleAuth?.enabled) {
      sendError(res, 'Apple Sign-In is currently disabled.', 403);
      return;
    }
    if (provider === 'Google' && !authSettings.googleAuth?.enabled) {
      sendError(res, 'Google Sign-In is currently disabled.', 403);
      return;
    }

    // Verify Google ID token if production Google Client ID is configured
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (googleClientId && provider === 'Google' && idToken) {
      try {
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
        );
        const tokenInfo: any = await verifyRes.json();
        if (tokenInfo.aud !== googleClientId || tokenInfo.email !== cleanEmail) {
          sendError(res, 'Google authentication token verification failed', 401);
          return;
        }
      } catch (err) {
        sendError(res, 'Unable to verify Google credentials with OAuth server', 401);
        return;
      }
    }

    let user = await User.findOne({ email: cleanEmail, isDeleted: { $ne: true } });

    if (!user) {
      // Create new user automatically from OAuth profile
      const usernameBase = (cleanEmail.split('@')[0] || name || 'traveler')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const username = `${usernameBase}_${Math.floor(100 + Math.random() * 900)}`;

      user = new User({
        id: `user_${Date.now()}`,
        name: name || (cleanEmail.split('@')[0]),
        username,
        email: cleanEmail,
        avatarUrl:
          avatarUrl ||
          (provider === 'Google'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'),
        country: 'India',
        travelStyle: 'Solo',
        travelInterests: ['Adventure', 'Nature', 'Photography'],
        emailVerified: true, // OAuth emails verified by provider
        emailVerifiedAt: new Date(),
        phoneVerified: false,
        isGoogleConnected: provider === 'Google',
        isAppleConnected: provider === 'Apple',
      });

      await user.save();
    } else {
      if (user.isDeleted) {
        sendError(res, 'This account has been permanently deleted.', 401);
        return;
      }
      // Existing user: associate OAuth provider safely
      if (provider === 'Google') {
        user.isGoogleConnected = true;
      }
      if (provider === 'Apple') {
        user.isAppleConnected = true;
      }
      if (!user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
      }
      await user.save();
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        token,
        user: user.toSafeUser(),
      },
      `Successfully signed in with ${provider || 'Social Account'}`
    );
  } catch (error) {
    next(error);
  }
};

const wantsHtmlResponse = (req: Request): boolean => {
  const accept = (req.headers.accept || '').toLowerCase();
  return accept.includes('text/html');
};

const wantsJsonOnlyResponse = (req: Request): boolean => {
  const accept = (req.headers.accept || '').toLowerCase();
  return accept.includes('application/json') && !accept.includes('text/html');
};

export const googleOAuthInit = async (req: Request, res: Response): Promise<void> => {
  const isProd = config.nodeEnv === 'production';
  const mode = req.query.mode === 'reauth' ? 'reauth' : 'login';

  try {
    const authSettings = await getAuthSettings();
    if (!authSettings.googleAuth?.enabled) {
      const message = 'Google Sign-In is currently disabled by administrator.';
      if (wantsHtmlResponse(req)) {
        res.redirect(
          buildFrontendErrorRedirect('google_disabled', message, {
            mode,
            redirectPath: typeof req.query.redirect === 'string' ? req.query.redirect : undefined,
          })
        );
        return;
      }
      sendError(res, message, 403);
      return;
    }

    let expectedUserId: string | undefined;
    if (mode === 'reauth') {
      const authHeader = req.headers.authorization;
      const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
      const sessionToken = bearer || req.cookies?.tripzobox_token;
      if (sessionToken) {
        try {
          const decoded = verifyToken(sessionToken);
          if (decoded?.userId) expectedUserId = decoded.userId;
        } catch {
          // Callback still verifies session ownership
        }
      }
    }

    const { authUrl, stateCookieToken } = createGoogleAuthUrl(req.query.redirect, {
      mode,
      expectedUserId,
    });

    res.cookie(GOOGLE_OAUTH_STATE_COOKIE, stateCookieToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/',
    });

    res.redirect(authUrl);
  } catch (error: any) {
    const code = error instanceof GoogleOAuthError ? error.code : 'missing_credentials';
    const statusCode = error instanceof GoogleOAuthError ? error.statusCode : 503;
    const message =
      error instanceof GoogleOAuthError
        ? error.message
        : 'Google OAuth initialization failed.';

    if (wantsHtmlResponse(req)) {
      res.redirect(
        buildFrontendErrorRedirect(code, message, {
          mode,
          redirectPath: typeof req.query.redirect === 'string' ? req.query.redirect : undefined,
        })
      );
      return;
    }
    sendError(res, message, statusCode);
  }
};

export const googleOAuthCallback = async (req: Request, res: Response): Promise<void> => {
  const isProd = config.nodeEnv === 'production';
  const cookieToken = req.cookies?.[GOOGLE_OAUTH_STATE_COOKIE];

  res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });

  const authSettings = await getAuthSettings();
  if (!authSettings.googleAuth?.enabled) {
    const message = 'Google Sign-In is currently disabled by administrator.';
    if (wantsJsonOnlyResponse(req)) {
      sendError(res, message, 403);
      return;
    }
    res.redirect(
      buildFrontendErrorRedirect('google_disabled', message, {
        redirectPath: '/login',
      })
    );
    return;
  }

  let callbackMode: 'login' | 'reauth' = 'login';
  let callbackRedirect: string | undefined;

  const respondCallbackError = (code: string, message: string, statusCode = 400): void => {
    if (wantsJsonOnlyResponse(req)) {
      sendError(res, message, statusCode);
      return;
    }
    res.redirect(
      buildFrontendErrorRedirect(code, message, {
        mode: callbackMode,
        redirectPath: callbackRedirect,
      })
    );
  };

  try {
    const oauthConfig = getGoogleOAuthConfig();
    if (!oauthConfig.isConfigured) {
      respondCallbackError(
        'missing_credentials',
        'Google OAuth credentials are not configured on the server.',
        503
      );
      return;
    }

    const { codeVerifier, redirectPath, mode, expectedUserId } = verifyOAuthStateCookie(
      req.query.state,
      cookieToken
    );
    callbackMode = mode;
    callbackRedirect = redirectPath;

    if (req.query.error) {
      const errCode = String(req.query.error);
      if (errCode === 'access_denied') {
        respondCallbackError('cancelled', 'Google sign-in was cancelled.', 400);
        return;
      }
      const errMessage =
        typeof req.query.error_description === 'string' && req.query.error_description.trim()
          ? req.query.error_description.trim()
          : 'Google authentication failed. Please try again.';
      respondCallbackError('google_error', errMessage, 400);
      return;
    }

    const authCode = typeof req.query.code === 'string' ? req.query.code.trim() : '';
    if (!authCode) {
      respondCallbackError('missing_code', 'Authorization code missing from Google callback.', 400);
      return;
    }

    const profile = await exchangeCodeForGoogleProfile(authCode, codeVerifier);

    if (mode === 'reauth') {
      const user = await reauthenticateGoogleUser(profile, expectedUserId);
      const reauthToken = signReauthToken(user.id, 'google');
      setReauthCookie(res, reauthToken);

      if (wantsJsonOnlyResponse(req)) {
        sendSuccess(
          res,
          {
            reauthenticated: true,
            provider: 'google',
            redirect: redirectPath,
          },
          'Google identity re-verified for account deletion'
        );
        return;
      }

      res.redirect(buildFrontendReauthSuccessRedirect(redirectPath));
      return;
    }

    const user = await authenticateGoogleUser(profile);

    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    setAuthCookie(res, token);

    if (wantsJsonOnlyResponse(req)) {
      sendSuccess(
        res,
        {
          user: user.toSafeUser(),
          token,
          redirect: redirectPath,
        },
        'Successfully signed in with Google'
      );
      return;
    }

    const handoffCode = await createOAuthHandoffCode(user.id, redirectPath);
    res.redirect(buildFrontendSuccessRedirect(redirectPath, handoffCode));
  } catch (error: any) {
    if (error instanceof GoogleOAuthError) {
      respondCallbackError(error.code, error.message, error.statusCode);
      return;
    }
    respondCallbackError(
      'auth_failed',
      'Unable to complete Google authentication. Please try again.',
      500
    );
  }
};

export const exchangeGoogleOAuthCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCode = req.body?.code;
    if (typeof rawCode !== 'string' || !rawCode.trim()) {
      sendError(res, 'Authorization code is required', 400);
      return;
    }

    const authSettings = await getAuthSettings();
    if (!authSettings.googleAuth?.enabled) {
      sendError(res, 'Google Sign-In is currently disabled by administrator.', 403);
      return;
    }

    const { userId, redirectPath } = await consumeOAuthHandoffCode(rawCode);

    const user = await User.findOne({
      $or: [
        { id: userId },
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
      ],
      isDeleted: false,
    });

    if (!user) {
      sendError(res, 'Authenticated user account not found or deactivated', 404);
      return;
    }

    if (user.isSuspended) {
      sendError(res, 'Your TripzoBox account has been suspended. Please contact support.', 403);
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        token,
        user: user.toSafeUser(),
        redirect: redirectPath || '/app/dashboard',
      },
      'Successfully authenticated with Google'
    );
  } catch (error: any) {
    const statusCode = error instanceof GoogleOAuthError ? error.statusCode : 400;
    const message = error.message || 'Failed to exchange authorization code';
    sendError(res, message, statusCode);
  }
};

