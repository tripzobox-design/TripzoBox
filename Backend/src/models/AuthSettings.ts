import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISmsOtpConfig {
  enabled: boolean;
  providerName: string;
  apiKey?: string;
  senderId?: string;
  otpExpiryMinutes: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
}

export interface IAppleAuthConfig {
  enabled: boolean;
  clientId?: string;
  teamId?: string;
  keyId?: string;
  privateKey?: string;
  callbackUrl?: string;
}

export interface IGoogleAuthConfig {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
}

export interface IEmailOtpConfig {
  enabled: boolean;
  otpExpiryMinutes: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
}

export interface IAuthSettings extends Document {
  key: string;
  smsOtp: ISmsOtpConfig;
  appleAuth: IAppleAuthConfig;
  googleAuth: IGoogleAuthConfig;
  emailOtp: IEmailOtpConfig;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

const SmsOtpSchema = new Schema<ISmsOtpConfig>(
  {
    enabled: { type: Boolean, default: false },
    providerName: { type: String, default: 'Fast2SMS' },
    apiKey: { type: String, default: '' },
    senderId: { type: String, default: 'TRIPZO' },
    otpExpiryMinutes: { type: Number, default: 5, min: 1, max: 60 },
    resendCooldownSeconds: { type: Number, default: 60, min: 10, max: 300 },
    maxAttempts: { type: Number, default: 5, min: 1, max: 10 },
  },
  { _id: false }
);

const AppleAuthSchema = new Schema<IAppleAuthConfig>(
  {
    enabled: { type: Boolean, default: false },
    clientId: { type: String, default: '' },
    teamId: { type: String, default: '' },
    keyId: { type: String, default: '' },
    privateKey: { type: String, default: '' },
    callbackUrl: { type: String, default: 'http://localhost:5000/api/auth/apple/callback' },
  },
  { _id: false }
);

const GoogleAuthSchema = new Schema<IGoogleAuthConfig>(
  {
    enabled: { type: Boolean, default: true },
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    callbackUrl: { type: String, default: 'http://localhost:5000/api/auth/google/callback' },
  },
  { _id: false }
);

const EmailOtpSchema = new Schema<IEmailOtpConfig>(
  {
    enabled: { type: Boolean, default: true },
    otpExpiryMinutes: { type: Number, default: 15, min: 1, max: 60 },
    resendCooldownSeconds: { type: Number, default: 60, min: 10, max: 300 },
    maxAttempts: { type: Number, default: 5, min: 1, max: 10 },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    smtpFrom: { type: String, default: '' },
  },
  { _id: false }
);

const AuthSettingsSchema = new Schema<IAuthSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'default_auth_settings' },
    smsOtp: { type: SmsOtpSchema, default: () => ({}) },
    appleAuth: { type: AppleAuthSchema, default: () => ({}) },
    googleAuth: { type: GoogleAuthSchema, default: () => ({}) },
    emailOtp: { type: EmailOtpSchema, default: () => ({}) },
    updatedBy: { type: String, default: 'system' },
  },
  {
    timestamps: true,
  }
);

export const AuthSettings: Model<IAuthSettings> =
  mongoose.models.AuthSettings ||
  mongoose.model<IAuthSettings>('AuthSettings', AuthSettingsSchema);
