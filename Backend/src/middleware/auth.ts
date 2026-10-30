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
      $or: [{ id: decoded.userId }, { _id: decoded.userId.match(/^[0-9a-fA-F]{24}$/) ? decoded.userId : null }],
    });

    if (!user) {
      sendError(res, 'User session invalid. Please log in again.', 401);
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
        $or: [{ id: decoded.userId }, { _id: decoded.userId.match(/^[0-9a-fA-F]{24}$/) ? decoded.userId : null }],
      });
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
  } catch (e) {
    // optional token invalid, ignore and proceed as guest
  }
  next();
};

