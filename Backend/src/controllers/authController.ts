import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { AuthRequest } from '../middleware/auth.js';

// In-memory OTP storage for password reset flows
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, emailOrPhone, password, birthDate, gender, country, travelStyle, travelInterests } =
      req.body;

    const isEmail = emailOrPhone.includes('@');
    const email = isEmail ? emailOrPhone.toLowerCase().trim() : undefined;
    const phone = !isEmail ? emailOrPhone.trim() : undefined;

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
    });

    setAuthCookie(res, token);

    sendSuccess(
      res,
      {
        token,
        user: user.toSafeUser(),
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
    const clean = emailOrPhone.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: clean }, { phone: clean }],
    });

    if (!user) {
      sendError(res, 'No account found matching this email or phone number', 404);
      return;
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(clean, {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    });

    sendSuccess(
      res,
      {
        method,
        expiresInSeconds: 900,
        // In development mode, provide OTP in debug payload for effortless testing
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
      },
      `Verification code sent via ${method}`
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
    const clean = emailOrPhone.trim().toLowerCase();

    const record = otpStore.get(clean);
    if (!record || Date.now() > record.expiresAt) {
      sendError(res, 'Verification code has expired or does not exist. Please request a new one.', 400);
      return;
    }

    if (record.otp !== otp.trim()) {
      sendError(res, 'Invalid verification code. Please check and try again.', 400);
      return;
    }

    // OTP verified, clear it
    otpStore.delete(clean);

    sendSuccess(res, { verified: true }, 'OTP verified successfully');
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
    const { emailOrPhone, newPassword } = req.body;
    const clean = emailOrPhone.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: clean }, { phone: clean }],
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    user.password = newPassword;
    await user.save();

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

