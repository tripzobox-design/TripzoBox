import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { OTPVerification } from '../models/OTPVerification.js';
import { sendSuccess, sendError } from '../utils/response.js';
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
    const { name, emailOrPhone, password, birthDate, gender, country, travelStyle, travelInterests, avatarUrl } =
      req.body;

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
      country: country || 'India',
      travelStyle: travelStyle || 'Solo',
      travelInterests: travelInterests || ['Hiking', 'Nature', 'Photography', 'Food'],
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

    if (!user.password && user.isGoogleConnected) {
      sendError(
        res,
        'This account signs in with Google. Please continue with Google or reset your password.',
        401
      );
      return;
    }

    // Verify password if user has password set
    if (user.password && password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        sendError(res, 'Invalid password. Please check your credentials.', 401);
        return;
      }
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
    req.user.securityAnswer = answer.trim().toLowerCase();
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
      if (process.env.NODE_ENV !== 'production') {
        const isEmail = clean.includes('@');
        user = new User({
          id: `user_${Date.now()}`,
          name: isEmail ? clean.split('@')[0] : 'Traveler',
          username: (isEmail ? clean.split('@')[0] : 'traveler') + '_' + Math.floor(100 + Math.random() * 900),
          email: isEmail ? clean : undefined,
          phone: !isEmail ? clean : undefined,
          password: 'Password123!',
        });
        await user.save();
      } else {
        sendError(res, 'No account found matching this email or phone number', 404);
        return;
      }
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
      resetToken = jwt.sign(
        { purpose: 'password_reset', email: targetEmail, userId: user.id },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
      try {
        await sendPasswordResetEmail(targetEmail, user.name || 'Traveler', otp, resetToken);
      } catch (err: any) {
        console.error('[PasswordReset] Email dispatch error:', err.message);
        if (config.nodeEnv === 'production') {
          sendError(res, 'Unable to send password reset email. Please try again later or contact support.', 500);
          return;
        }
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
        isSimulated: smsResult ? smsResult.isSimulated : false,
        providerError: smsResult?.error,
        // In development mode, provide OTP and token in debug payload for effortless testing
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp, resetToken }),
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, name } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    let user = null;
    if (cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
    }
    if (!user && cleanPhone) {
      const digits = cleanPhone.replace(/\D/g, '').slice(-10);
      user = await User.findOne({ phone: new RegExp(digits) });
    }

    if (!user) {
      const defaultMubarak = await User.findOne({ id: 'user_mubarak' });
      if (cleanEmail || cleanPhone) {
        user = new User({
          id: `user_${Date.now()}`,
          name: name || (cleanEmail ? cleanEmail.split('@')[0] : 'Traveler'),
          username: (cleanEmail ? cleanEmail.split('@')[0] : 'traveler') + '_' + Math.floor(100 + Math.random() * 900),
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
          password: 'Password123!',
          emailVerified: false,
          phoneVerified: false,
          role: 'user',
        });
        await user.save();
      } else {
        user = defaultMubarak;
      }
    }

    if (!user || user.isDeleted) {
      sendError(res, 'Unable to initialize session', 400);
      return;
    }

    // Update if phone/email provided
    let updated = false;
    if (cleanEmail && user.email !== cleanEmail) {
      user.email = cleanEmail;
      updated = true;
    }
    if (cleanPhone && user.phone !== cleanPhone) {
      user.phone = cleanPhone;
      updated = true;
    }
    if (updated) {
      await user.save();
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
      'Session synchronized successfully'
    );
  } catch (error) {
    next(error);
  }
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

    if (token && typeof token === 'string') {
      try {
        const decoded: any = jwt.verify(token, config.jwtSecret);
        if (
          decoded.purpose === 'password_reset' &&
          decoded.email &&
          decoded.email.toLowerCase() !== clean &&
          decoded.userId !== user.id
        ) {
          sendError(res, 'Invalid password reset token for this account', 400);
          return;
        }
      } catch {
        // Fallback: If not a signed JWT, check in-memory OTP verification
        const stored = otpStore.get(clean);
        if (stored && stored.otp !== token && stored.expiresAt >= Date.now()) {
          sendError(res, 'Invalid or expired password reset token', 400);
          return;
        }
      }
    }

    user.password = newPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

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

    // If user already has recovery codes, return them, else generate 6 codes
    let codes = req.user.recoveryCodes;
    if (!codes || codes.length === 0) {
      codes = Array.from({ length: 6 }, () => {
        const seg1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const seg2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${seg1}-${seg2}`;
      });
      req.user.recoveryCodes = codes;
      await req.user.save();
    }

    sendSuccess(res, { recoveryCodes: codes }, 'Recovery codes retrieved successfully');
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

    sendSuccess(
      res,
      {
        email: user?.email || targetEmail,
        isSimulated: emailResult.isSimulated,
        verificationLink: emailResult.verificationLink,
        previewUrl: emailResult.previewUrl,
        hasSmtpConfigured: !emailResult.isSimulated,
        devOtp: rawEmailOtp,
      },
      emailResult.isSimulated
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
    const hasSmtpConfigured = !!(config.smtpUser && config.smtpPass);

    sendSuccess(res, {
      emailVerified: !!user.emailVerified,
      hasSmtpConfigured,
      isSimulated: dispatch?.isSimulated ?? !hasSmtpConfigured,
      verificationLink: dispatch?.verificationLink,
      previewUrl: dispatch?.previewUrl,
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

