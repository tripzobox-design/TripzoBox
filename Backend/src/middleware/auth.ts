import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/token.js';
import { User, IUser } from '../models/User.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.tripzobox_token) {
      token = req.cookies.tripzobox_token;
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401);
      return;
    }

    const decoded: TokenPayload = verifyToken(token);
    const user = await User.findOne({
      $or: [
        { id: decoded.userId },
        { _id: decoded.userId.match(/^[0-9a-fA-F]{24}$/) ? decoded.userId : null },
      ],
    });

    if (!user) {
      sendError(res, 'User session invalid. Please log in again.', 401);
      return;
    }

    // Safety enforcement: check if account is suspended
    if (user.isSuspended) {
      sendError(
        res,
        `Your account has been suspended by TripzoBox Moderation: ${
          user.suspensionReason || 'Violation of community safety standards'
        }. Please contact safety@tripzobox.com for inquiries.`,
        403
      );
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Session expired. Please log in again.', 401);
      return;
    }
    sendError(res, 'Invalid authentication token', 401);
  }
};

const ADMIN_ROLES = ['admin', 'superadmin', 'moderator', 'support', 'content_manager'];

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role as any)) {
    sendError(res, 'Forbidden: Admin authorization required. Administrator privileges required to access this resource.', 403);
    return;
  }
  next();
};

export const requireRoles = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || (!roles.includes(req.user.role as any) && (req.user.role as any) !== 'superadmin')) {
      sendError(res, `Forbidden: Requires one of these roles: ${roles.join(', ')}`, 403);
      return;
    }
    next();
  };
};

export const requireSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || (req.user.role as any) !== 'superadmin') {
    sendError(res, 'Forbidden: Super Administrator privileges required.', 403);
    return;
  }
  next();
};

export const requireAdminOnly = requireRoles(['admin']);
export const requireModerator = requireRoles(['moderator', 'admin']);
export const requireSupport = requireRoles(['support', 'moderator', 'admin']);
export const requireContentManager = requireRoles(['content_manager', 'admin']);

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.tripzobox_token) {
      token = req.cookies.tripzobox_token;
    }

    if (token) {
      const decoded: TokenPayload = verifyToken(token);
      const user = await User.findOne({
        $or: [
          { id: decoded.userId },
          { _id: decoded.userId.match(/^[0-9a-fA-F]{24}$/) ? decoded.userId : null },
        ],
      });
      if (user && !user.isSuspended) {
        req.user = user;
        req.userId = user.id;
      }
    }
  } catch (e) {
    // optional token invalid, ignore and proceed as guest
  }
  next();
};
