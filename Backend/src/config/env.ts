import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

const isProduction =
  (process.env.NODE_ENV || '').trim().toLowerCase() === 'production' ||
  process.env.RENDER === 'true';

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: (process.env.NODE_ENV || (process.env.RENDER === 'true' ? 'production' : 'development')).trim().toLowerCase(),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripzobox',
  jwtSecret: process.env.JWT_SECRET || 'tripzobox_jwt_dev_secret_key_secure_2026_super_safe',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'tripzobox_cookie_secret_dev_2026',
  frontendUrl:
    process.env.FRONTEND_ORIGIN ||
    process.env.FRONTEND_URL ||
    (isProduction ? 'https://tripzobox.com' : 'http://localhost:5173'),
  adminUrl: process.env.ADMIN_ORIGIN || process.env.ADMIN_URL || 'http://localhost:5174',
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  brevoApiKey: (
    process.env.BREVO_API_KEY ||
    process.env.BREVO_KEY ||
    process.env.SENDINBLUE_API_KEY ||
    ''
  ).trim(),
  emailFrom: (process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@tripzobox.com').trim(),
  emailFromName: (process.env.EMAIL_FROM_NAME || 'TripzoBox').trim(),
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '"TripzoBox" <no-reply@tripzobox.com>',
  fast2SmsApiKey: process.env.FAST2SMS_API_KEY || '',
  smsOtpEnabled: process.env.SMS_OTP_ENABLED === 'true',
  appleAuthEnabled: process.env.APPLE_AUTH_ENABLED === 'true',
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  googleClientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
  googleCallbackUrl: (
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  ).trim(),
};

export const validateEnv = (): void => {
  if (config.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in production');
    }
    const hasBrevo = Boolean(process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim());
    const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!hasBrevo && !hasSmtp) {
      console.warn(
        '[Config Warning] Production is missing BREVO_API_KEY (or SMTP_USER/SMTP_PASS). Transactional email delivery requires BREVO_API_KEY in Render.'
      );
    }
  }
};

