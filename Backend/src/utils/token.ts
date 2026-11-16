import jwt, { SignOptions } from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role?: string;
  tokenVersion?: number;
}

export interface ReauthTokenPayload {
  purpose: 'account_deletion_reauth';
  userId: string;
  provider: 'password' | 'google' | 'apple';
}

export const AUTH_COOKIE_NAME = 'tripzobox_token';
export const REAUTH_COOKIE_NAME = 'tripzobox_reauth';

export const signToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
  };
  return jwt.sign(
    {
      ...payload,
      tokenVersion: payload.tokenVersion ?? 0,
    },
    config.jwtSecret,
    options
  );
};

export const signReauthToken = (
  userId: string,
  provider: 'password' | 'google' | 'apple'
): string => {
  return jwt.sign(
    {
      purpose: 'account_deletion_reauth',
      userId,
      provider,
    } satisfies ReauthTokenPayload,
    config.jwtSecret,
    { expiresIn: '15m' }
  );
};

export const verifyReauthToken = (token: string): ReauthTokenPayload => {
  const decoded = jwt.verify(token, config.jwtSecret) as ReauthTokenPayload;
  if (
    !decoded ||
    decoded.purpose !== 'account_deletion_reauth' ||
    typeof decoded.userId !== 'string' ||
    !decoded.userId
  ) {
    throw new Error('Invalid re-authentication token');
  }
  return decoded;
};

export const generateToken = signToken;

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const setAuthCookie = (res: Response, token: string): void => {
  const isProd = config.nodeEnv === 'production';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearAuthCookie = (res: Response): void => {
  const isProd = config.nodeEnv === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
  });
};

export const setReauthCookie = (res: Response, reauthToken: string): void => {
  const isProd = config.nodeEnv === 'production';
  res.cookie(REAUTH_COOKIE_NAME, reauthToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

export const clearReauthCookie = (res: Response): void => {
  const isProd = config.nodeEnv === 'production';
  res.clearCookie(REAUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
};

export const clearAllSessionCookies = (res: Response): void => {
  clearAuthCookie(res);
  clearReauthCookie(res);
};

