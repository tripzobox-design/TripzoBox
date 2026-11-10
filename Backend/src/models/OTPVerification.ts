import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IOTPVerification extends Document {
  id: string;
  userId?: string;
  identifier: string; // phone number (e.g. +919876543210) or email
  type: 'phone_verification' | 'email_verification' | 'password_reset' | 'email_change' | 'document_verification';
  hashedOtp: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  resendAvailableAt: Date;
  consumed: boolean;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  compareOtp(candidateOtp: string): Promise<boolean>;
}

const OTPVerificationSchema = new Schema<IOTPVerification>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, index: true },
    identifier: { type: String, required: true, index: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ['phone_verification', 'email_verification', 'password_reset', 'email_change', 'document_verification'],
      required: true,
      index: true,
    },
    hashedOtp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '1h' } }, // TTL index auto-cleans old records
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    resendAvailableAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false, index: true },
    consumedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

OTPVerificationSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

OTPVerificationSchema.methods.compareOtp = async function (candidateOtp: string): Promise<boolean> {
  if (!this.hashedOtp || !candidateOtp) return false;
  return bcrypt.compare(candidateOtp, this.hashedOtp);
};

export const OTPVerification: Model<IOTPVerification> = mongoose.model<IOTPVerification>(
  'OTPVerification',
  OTPVerificationSchema
);

