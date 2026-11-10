import mongoose, { Schema, Document, Model } from 'mongoose';

export type IdentityStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'FAILED';

export interface IIdentityVerification extends Document {
  id: string;
  userId: string;
  provider: string; // e.g. 'hyperverge', 'digilocker', 'sandbox_mock'
  providerReferenceId: string;
  documentType: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id' | 'other';
  status: IdentityStatus;
  consentGiven: boolean;
  consentTimestamp: Date;
  submittedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
  // Non-sensitive provider payload
  verificationMetadata?: {
    confidenceScore?: number;
    checkSummary?: string;
    issuingCountry?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IdentityVerificationSchema = new Schema<IIdentityVerification>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true, default: 'sandbox_identity_service' },
    providerReferenceId: { type: String, required: true, unique: true, index: true },
    documentType: {
      type: String,
      enum: ['aadhaar', 'passport', 'driving_license', 'voter_id', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    consentGiven: { type: Boolean, required: true },
    consentTimestamp: { type: Date, required: true },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    verificationMetadata: {
      confidenceScore: { type: Number },
      checkSummary: { type: String },
      issuingCountry: { type: String, default: 'India' },
    },
  },
  {
    timestamps: true,
  }
);

IdentityVerificationSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `idv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const IdentityVerification: Model<IIdentityVerification> = mongoose.model<IIdentityVerification>(
  'IdentityVerification',
  IdentityVerificationSchema
);

