import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { clearAllSessionCookies, setReauthCookie, signReauthToken } from '../utils/token.js';
import {
  AccountDeletionError,
  executeAccountDeletion,
  getAccountDeletionPreflight,
  requestDeletionOtp,
  verifyOAuthFallbackReauth,
  verifyPasswordReauth,
} from '../services/accountDeletionService.js';

const rejectIdorTargetMismatch = (req: AuthRequest, res: Response): boolean => {
  const authenticatedUserId = req.user?.id;
  if (!authenticatedUserId) return false;

  const suppliedTargetIds = [
    req.params?.userId,
    req.params?.id,
    req.body?.userId,
    req.body?.targetUserId,
    req.query?.userId,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0 && v.trim() !== 'me');

  if (suppliedTargetIds.some((candidate) => candidate.trim() !== authenticatedUserId)) {
    sendError(
      res,
      'Forbidden: Account deletion operates strictly on the authenticated session user.',
      403
    );
    return true;
  }

  return false;
};

const handleServiceError = (res: Response, error: unknown, next: NextFunction): void => {
  if (error instanceof AccountDeletionError) {
    sendError(
      res,
      error.message,
      error.statusCode,
      error.details
        ? [{ field: error.code, message: JSON.stringify(error.details) }]
        : undefined
    );
    return;
  }
  next(error);
};

export const getDeletionPreflight = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    const preflight = await getAccountDeletionPreflight(req.user.id, req);
    sendSuccess(res, preflight, 'Account deletion preflight checks loaded');
  } catch (error) {
    handleServiceError(res, error, next);
  }
};

export const verifyDeletionReauth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (rejectIdorTargetMismatch(req, res)) return;

    const { currentPassword, provider, confirmationPhrase } = req.body || {};

    if (provider === 'apple' || provider === 'passwordless') {
      const user = await verifyOAuthFallbackReauth(req.user.id, provider, confirmationPhrase);
      const reauthToken = signReauthToken(user.id, 'apple');
      setReauthCookie(res, reauthToken);
      sendSuccess(
        res,
        { reauthenticated: true, expiresInSeconds: 900 },
        'Identity re-verified for account deletion'
      );
      return;
    }

    const user = await verifyPasswordReauth(req.user.id, currentPassword);
    const reauthToken = signReauthToken(user.id, 'password');
    setReauthCookie(res, reauthToken);

    sendSuccess(
      res,
      { reauthenticated: true, expiresInSeconds: 900 },
      'Password verified for account deletion'
    );
  } catch (error) {
    handleServiceError(res, error, next);
  }
};

export const sendDeletionConfirmationOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (rejectIdorTargetMismatch(req, res)) return;

    const { currentPassword } = req.body || {};
    const result = await requestDeletionOtp(req.user.id, req, { currentPassword });

    sendSuccess(
      res,
      result,
      result.otpRequired
        ? 'A confirmation verification code has been sent to your registered email address.'
        : 'Your account is verified via re-authentication and ready for deletion confirmation.'
    );
  } catch (error) {
    handleServiceError(res, error, next);
  }
};

export const deleteCurrentAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (rejectIdorTargetMismatch(req, res)) return;

    const { currentPassword, otp, confirmationText, confirmDeletion, reason } = req.body || {};

    const result = await executeAccountDeletion(req.user.id, req, {
      currentPassword,
      otp,
      confirmationText,
      confirmDeletion,
      reason,
    });

    clearAllSessionCookies(res);

    sendSuccess(
      res,
      {
        deleted: true,
        deletedAt: result.deletedAt.toISOString(),
        confirmationEmailSent: result.confirmationEmailSent,
      },
      'Your TripzoBox account deletion request has been completed.'
    );
  } catch (error) {
    handleServiceError(res, error, next);
  }
};

export const rejectArbitraryUserDeletion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    sendError(res, 'Authentication required.', 401);
    return;
  }

  sendError(
    res,
    'Forbidden: Arbitrary user ID deletion is not allowed. Authenticated users may only delete /api/users/me.',
    403
  );
};

