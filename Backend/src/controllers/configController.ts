import { Request, Response, NextFunction } from 'express';
import { getPublicAuthConfig } from '../services/authSettingsService.js';
import { sendSuccess } from '../utils/response.js';

export const getPublicAuthConfigHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const config = await getPublicAuthConfig();
    sendSuccess(res, config, 'Authentication provider configuration loaded');
  } catch (error) {
    next(error);
  }
};

