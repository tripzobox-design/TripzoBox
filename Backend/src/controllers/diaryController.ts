import { Response, NextFunction } from 'express';
import { DiaryEntry } from '../models/DiaryEntry.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const getEntries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const entries = await DiaryEntry.find({ userId: req.user.id }).sort({ createdAt: -1 });
    sendSuccess(res, entries);
  } catch (error) {
    next(error);
  }
};

export const createEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const newEntry = new DiaryEntry({
      ...req.body,
      id: `diary_${Date.now()}`,
      userId: req.user.id,
    });

    await newEntry.save();
    sendSuccess(res, newEntry, 'Diary experience saved', 201);
  } catch (error) {
    next(error);
  }
};

export const updateEntry = async (
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
    const entry = await DiaryEntry.findOne({ id, userId: req.user.id });

    if (!entry) {
      sendError(res, 'Diary entry not found or unauthorized', 404);
      return;
    }

    Object.assign(entry, req.body);
    await entry.save();

    sendSuccess(res, entry, 'Diary entry updated');
  } catch (error) {
    next(error);
  }
};

export const deleteEntry = async (
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
    const result = await DiaryEntry.deleteOne({ id, userId: req.user.id });

    if (result.deletedCount === 0) {
      sendError(res, 'Diary entry not found or unauthorized', 404);
      return;
    }

    sendSuccess(res, null, 'Diary entry deleted');
  } catch (error) {
    next(error);
  }
};

