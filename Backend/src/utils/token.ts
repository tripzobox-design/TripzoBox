import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role?: string;
}

export const signToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };
  return jwt.sign(payload, config.jwtSecret, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const setAuthCookie = (res: Response, token: string): void => {
  const isProd = config.nodeEnv === 'production';
  res.cookie('tripzobox_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookie = (res: Response): void => {
  const isProd = config.nodeEnv === 'production';
  res.clearCookie('tripzobox_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
  });
};

