import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripzobox',
  jwtSecret: process.env.JWT_SECRET || 'tripzobox_jwt_dev_secret_key_secure_2026_super_safe',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'tripzobox_cookie_secret_dev_2026',
  frontendUrl: process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
};

export const validateEnv = (): void => {
  if (config.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in production');
    }
  }
};

