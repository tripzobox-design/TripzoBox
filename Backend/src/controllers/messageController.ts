import { Response, NextFunction } from 'express';
import { Trip } from '../models/Trip.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { UserBlock } from '../models/UserBlock.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const getThreads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    // Find all trips where user is leader or member
    const userTrips = await Trip.find({
      $or: [{ 'leader.id': req.user.id }, { 'members.id': req.user.id }],
    });

    const threads = await Promise.all(
      userTrips.map(async (trip) => {
        const messages = await Message.find({ tripId: trip.id }).sort({ createdAt: 1 });
        const lastMsg = messages[messages.length - 1];

        const unreadCount = messages.filter(
          (m) => m.sender.id !== req.user!.id && !m.readBy.includes(req.user!.id)
        ).length;

        return {
          id: `thread_${trip.id}`,
          tripId: trip.id,
          tripName: trip.name,
          coverImage: trip.coverImageUrl,
          lastMessage: lastMsg ? lastMsg.text : 'Welcome to the trip group discussion!',
          time: lastMsg ? lastMsg.timestamp : 'Recently',
          unreadCount,
          membersCount: trip.members.length,
          messages: messages.map((m) => ({
            id: m.id,
            senderName: m.sender.name,
            avatarUrl: m.sender.avatarUrl,
            isCurrentUser: m.sender.id === req.user!.id,
            text: m.text,
            time: m.timestamp,
          })),
        };
      })
    );

    sendSuccess(res, threads);
  } catch (error) {
    next(error);
  }
};

export const getMessagesByTrip = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { tripId } = req.params;
    const trip = await Trip.findOne({ id: tripId });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    const isMember =
      trip.leader.id === req.user.id || trip.members.some((m) => m.id === req.user!.id);
    if (!isMember) {
      sendError(res, 'You must be a confirmed member to view group messages', 403);
      return;
    }

    const messages = await Message.find({ tripId }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { tripId, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );

    sendSuccess(res, messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { tripId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      sendError(res, 'Message text cannot be empty', 400);
      return;
    }

    const trip = await Trip.findOne({ id: tripId });
    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    const isMember =
      trip.leader.id === req.user.id || trip.members.some((m) => m.id === req.user!.id);
    if (!isMember) {
      sendError(res, 'Only confirmed members can post messages in this trip', 403);
      return;
    }

    // Safety enforcement: Check if an active block exists between the sender and the trip leader
    if (trip.leader.id !== req.user.id) {
      const activeBlock = await UserBlock.findOne({
        $or: [
          { blockerId: trip.leader.id, blockedUserId: req.user.id },
          { blockerId: req.user.id, blockedUserId: trip.leader.id },
        ],
      });

      if (activeBlock) {
        sendError(
          res,
          'Messaging is restricted because an active block exists between you and the trip organizer.',
          403
        );
        return;
      }
    }

    const newMsg = new Message({
      id: `msg_${Date.now()}`,
      tripId,
      sender: {
        id: req.user.id,
        name: req.user.name,
        avatarUrl: req.user.avatarUrl,
      },
      text: text.trim(),
      timestamp: 'Just now',
      readBy: [req.user.id],
    });

    await newMsg.save();

    // Create notifications for other members
    const recipientIds = trip.members
      .map((m) => m.id)
      .filter((uid) => uid !== req.user!.id);

    for (const recipientId of recipientIds) {
      await Notification.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        userId: recipientId,
        type: 'trip_update',
        title: `${req.user.name} in ${trip.name}`,
        message: text.trim().substring(0, 100),
        timestamp: 'Just now',
        read: false,
        link: `/app/messages`,
      });
    }

    sendSuccess(res, newMsg, 'Message sent', 201);
  } catch (error) {
    next(error);
  }
};

