import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const notifications = await Notification.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    const unreadCount = notifications.filter((n) => !n.read).length;

    sendSuccess(res, { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (
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
    await Notification.updateOne({ id, userId: req.user.id }, { read: true });

    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

