import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { User, IUser } from '../models/User.js';

export const GOOGLE_OAUTH_STATE_COOKIE = 'tripzobox_oauth_state';

export interface VerifiedGoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export class GoogleOAuthError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'GoogleOAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const getGoogleOAuthConfig = () => {
  const clientId = (process.env.GOOGLE_CLIENT_ID ?? config.googleClientId).trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? config.googleClientSecret).trim();
  const callbackUrl = (
    process.env.GOOGLE_CALLBACK_URL ??
    config.googleCallbackUrl ??
    'http://localhost:5000/api/auth/google/callback'
  ).trim();
  const frontendUrl = (
    process.env.FRONTEND_ORIGIN ||
    process.env.FRONTEND_URL ||
    config.frontendUrl ||
    'http://localhost:5173'
  )
    .trim()
    .replace(/\/+$/, '');

  return {
    clientId,
    clientSecret,
    callbackUrl,
    frontendUrl,
    isConfigured: Boolean(clientId && clientSecret && callbackUrl),
  };
};

export const sanitizeRedirectPath = (rawRedirect: unknown): string => {
  if (typeof rawRedirect !== 'string') return '/app/dashboard';
  const trimmed = rawRedirect.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    /[\r\n]/.test(trimmed)
  ) {
    return '/app/dashboard';
  }
  return trimmed;
};

export const buildFrontendErrorRedirect = (
  code: string,
  message: string,
  options?: { mode?: 'login' | 'reauth'; redirectPath?: string }
): string => {
  const { frontendUrl } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    oauth_error: code,
    message,
  });
  if (options?.mode === 'reauth') {
    const safePath = sanitizeRedirectPath(options.redirectPath || '/app/account-security');
    const sep = safePath.includes('?') ? '&' : '?';
    return `${frontendUrl}${safePath}${sep}${params.toString()}`;
  }
  return `${frontendUrl}/login?${params.toString()}`;
};

export const buildFrontendSuccessRedirect = (redirectPath: string): string => {
  const { frontendUrl } = getGoogleOAuthConfig();
  const params = new URLSearchParams({
    oauth: 'google',
    redirect: sanitizeRedirectPath(redirectPath),
  });
  return `${frontendUrl}/login?${params.toString()}`;
};

export const buildFrontendReauthSuccessRedirect = (redirectPath: string): string => {
  const { frontendUrl } = getGoogleOAuthConfig();
  const safePath = sanitizeRedirectPath(redirectPath || '/app/account-security');
  const sep = safePath.includes('?') ? '&' : '?';
  return `${frontendUrl}${safePath}${sep}reauth=google`;
};

const createOAuthClient = (): OAuth2Client => {
  const { clientId, clientSecret, callbackUrl, isConfigured } = getGoogleOAuthConfig();
  if (!isConfigured) {
    throw new GoogleOAuthError(
      'missing_credentials',
      'Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.',
      503
    );
  }
  return new OAuth2Client(clientId, clientSecret, callbackUrl);
};

export const createGoogleAuthUrl = (
  redirectPath?: unknown,
  options?: { mode?: 'login' | 'reauth'; expectedUserId?: string }
): { authUrl: string; stateCookieToken: string } => {
  const client = createOAuthClient();
  const state = crypto.randomBytes(32).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const safeRedirect = sanitizeRedirectPath(
    redirectPath || (options?.mode === 'reauth' ? '/app/account-security?action=delete-account' : '/app/dashboard')
  );
  const mode = options?.mode === 'reauth' ? 'reauth' : 'login';

  const stateCookieToken = jwt.sign(
    {
      purpose: 'google_oauth_state',
      state,
      codeVerifier,
      redirectPath: safeRedirect,
      mode,
      expectedUserId: options?.expectedUserId || undefined,
    },
    config.jwtSecret,
    { expiresIn: '10m' }
  );

  const authUrl = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });

  return { authUrl, stateCookieToken };
};

export const verifyOAuthStateCookie = (
  queryState: unknown,
  cookieToken: unknown
): {
  codeVerifier: string;
  redirectPath: string;
  mode: 'login' | 'reauth';
  expectedUserId?: string;
} => {
  if (typeof queryState !== 'string' || !queryState || typeof cookieToken !== 'string' || !cookieToken) {
    throw new GoogleOAuthError(
      'invalid_state',
      'Security verification failed (missing OAuth state). Please try again.',
      403
    );
  }

  let decoded: any;
  try {
    decoded = jwt.verify(cookieToken, config.jwtSecret);
  } catch {
    throw new GoogleOAuthError(
      'invalid_state',
      'Your Google sign-in session expired. Please try again.',
      403
    );
  }

  if (
    !decoded ||
    decoded.purpose !== 'google_oauth_state' ||
    typeof decoded.state !== 'string' ||
    typeof decoded.codeVerifier !== 'string'
  ) {
    throw new GoogleOAuthError(
      'invalid_state',
      'Security verification failed (invalid OAuth state payload). Please try again.',
      403
    );
  }

  const expectedBuf = Buffer.from(decoded.state, 'utf8');
  const receivedBuf = Buffer.from(queryState, 'utf8');
  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    throw new GoogleOAuthError(
      'invalid_state',
      'Security verification failed (OAuth state mismatch). Please try again.',
      403
    );
  }

  return {
    codeVerifier: decoded.codeVerifier,
    redirectPath: sanitizeRedirectPath(decoded.redirectPath),
    mode: decoded.mode === 'reauth' ? 'reauth' : 'login',
    expectedUserId: typeof decoded.expectedUserId === 'string' ? decoded.expectedUserId : undefined,
  };
};

export const exchangeCodeForGoogleProfile = async (
  code: string,
  codeVerifier: string
): Promise<VerifiedGoogleProfile> => {
  const { clientId } = getGoogleOAuthConfig();
  const client = createOAuthClient();

  let tokens: any;
  try {
    const tokenResponse = await client.getToken({ code, codeVerifier });
    tokens = tokenResponse.tokens;
  } catch {
    throw new GoogleOAuthError(
      'auth_failed',
      'Failed to exchange Google authorization code. Please try again.',
      401
    );
  }

  if (!tokens?.id_token) {
    throw new GoogleOAuthError(
      'auth_failed',
      'Google did not return a verified identity token.',
      401
    );
  }

  let payload: any;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new GoogleOAuthError(
      'auth_failed',
      'Google identity token verification failed.',
      401
    );
  }

  if (!payload?.sub || !payload?.email) {
    throw new GoogleOAuthError(
      'auth_failed',
      'Google account did not provide a valid email address.',
      400
    );
  }

  if (payload.email_verified !== true) {
    throw new GoogleOAuthError(
      'unverified_email',
      'Your Google email address must be verified before signing in.',
      403
    );
  }

  return {
    googleId: String(payload.sub),
    email: String(payload.email).trim().toLowerCase(),
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    avatarUrl: typeof payload.picture === 'string' ? payload.picture.trim() : '',
  };
};

const generateUniqueUsername = async (email: string, name: string): Promise<string> => {
  const rawBase = (email.split('@')[0] || name || 'traveler')
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  const base = rawBase || 'traveler';

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}_${crypto.randomInt(100, 9999)}`;
    const exists = await User.exists({ username: candidate });
    if (!exists) return candidate;
  }
  return `${base}_${Date.now().toString(36)}`;
};

const linkExistingGoogleUser = async (
  user: IUser,
  profile: VerifiedGoogleProfile
): Promise<IUser> => {
  if (user.isDeleted) {
    throw new GoogleOAuthError(
      'deleted',
      'This TripzoBox account has been permanently deleted.',
      403
    );
  }

  if (user.isSuspended) {
    throw new GoogleOAuthError(
      'suspended',
      `Your account has been suspended by TripzoBox Moderation: ${
        user.suspensionReason || 'Violation of community safety standards'
      }. Please contact safety@tripzobox.com for inquiries.`,
      403
    );
  }

  if (user.googleId && user.googleId !== profile.googleId) {
    throw new GoogleOAuthError(
      'account_conflict',
      'This email is already linked to a different Google account.',
      409
    );
  }

  if (!user.googleId) {
    user.googleId = profile.googleId;
  }
  user.isGoogleConnected = true;

  if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
  }

  // Preserve existing profile values; only fill missing fields
  if (!user.name && profile.name) {
    user.name = profile.name;
  }
  if (!user.avatarUrl && profile.avatarUrl) {
    user.avatarUrl = profile.avatarUrl;
  }

  user.lastLoginAt = new Date();
  await user.save();
  return user;
};

export const authenticateGoogleUser = async (
  profile: VerifiedGoogleProfile
): Promise<IUser> => {
  let existingUser = await User.findOne({ googleId: profile.googleId, isDeleted: { $ne: true } });
  if (!existingUser) {
    existingUser = await User.findOne({ email: profile.email, isDeleted: { $ne: true } });
  }

  if (existingUser) {
    return linkExistingGoogleUser(existingUser, profile);
  }

  const username = await generateUniqueUsername(profile.email, profile.name);
  const user = new User({
    id: `user_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    name: profile.name || profile.email.split('@')[0],
    username,
    email: profile.email,
    avatarUrl: profile.avatarUrl || '',
    googleId: profile.googleId,
    isGoogleConnected: true,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    phoneVerified: false,
    lastLoginAt: new Date(),
    role: 'user',
  });

  try {
    await user.save();
    return user;
  } catch (err: any) {
    // Recover cleanly if a concurrent request created the email record first
    if (err?.code === 11000) {
      const concurrentUser = await User.findOne({ email: profile.email, isDeleted: { $ne: true } });
      if (concurrentUser) {
        return linkExistingGoogleUser(concurrentUser, profile);
      }
    }
    throw err;
  }
};

export const reauthenticateGoogleUser = async (
  profile: VerifiedGoogleProfile,
  expectedUserId?: string
): Promise<IUser> => {
  let user: IUser | null = null;

  if (expectedUserId) {
    user = await User.findOne({ id: expectedUserId });
    if (!user || user.isDeleted) {
      throw new GoogleOAuthError('deleted', 'This account no longer exists.', 404);
    }
    if (user.googleId && user.googleId !== profile.googleId) {
      throw new GoogleOAuthError(
        'account_mismatch',
        'Please re-authenticate using the same Google account linked to your TripzoBox profile.',
        403
      );
    }
    if (!user.googleId && user.email && user.email.toLowerCase() !== profile.email.toLowerCase()) {
      throw new GoogleOAuthError(
        'account_mismatch',
        'The Google email you selected does not match your TripzoBox account email.',
        403
      );
    }
  } else {
    user =
      (await User.findOne({ googleId: profile.googleId, isDeleted: { $ne: true } })) ||
      (await User.findOne({ email: profile.email, isDeleted: { $ne: true } }));
  }

  if (!user || user.isDeleted) {
    throw new GoogleOAuthError(
      'account_not_found',
      'No active TripzoBox account matches this Google sign-in.',
      404
    );
  }

  if (user.isSuspended) {
    throw new GoogleOAuthError('suspended', 'This account is currently suspended.', 403);
  }

  user.recentReauthAt = new Date();
  await user.save();
  return user;
};

