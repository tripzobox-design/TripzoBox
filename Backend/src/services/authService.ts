import bcrypt from 'bcryptjs';
import { IUser } from '../models/User.js';
import { signToken, TokenPayload } from '../utils/token.js';

export const authService = {
  /**
   * Hashes a plaintext password using bcrypt
   */
  hashPassword: async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
  },

  /**
   * Compares a plaintext password with a hashed password
   */
  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  /**
   * Strips sensitive authentication fields from a user object
   */
  sanitizeUser: (user: any) => {
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.passwordHash;
    delete userObj.__v;
    return userObj;
  },

  /**
   * Generates a signed JWT token payload for a user
   */
  createTokenPayload: (user: IUser): TokenPayload => {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  },

  /**
   * Generates a signed JWT token for a user
   */
  signUserToken: (user: IUser): string => {
    return signToken(authService.createTokenPayload(user));
  },
};
