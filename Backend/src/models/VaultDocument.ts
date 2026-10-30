import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVaultDocument extends Document {
  id: string;
  userId: string;
  type: 'Passport' | 'Aadhaar' | 'DrivingLicense' | 'Insurance' | 'FlightTicket' | 'HotelBooking' | 'Other';
  name: string;
  validTill?: string;
  referenceNumber?: string;
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileMime?: string;
  visibility: 'private' | 'trusted-contacts' | 'offline-available';
  uploadedAt: string;
  isVerified: boolean;
  issuingCountry?: string;
  thumbnailUrl?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaultDocumentSchema = new Schema<IVaultDocument>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['Passport', 'Aadhaar', 'DrivingLicense', 'Insurance', 'FlightTicket', 'HotelBooking', 'Other'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    validTill: { type: String },
    referenceNumber: { type: String },
    fileUrl: { type: String },
    fileKey: { type: String },
    fileName: { type: String },
    fileMime: { type: String },
    visibility: {
      type: String,
      enum: ['private', 'trusted-contacts', 'offline-available'],
      default: 'private',
    },
    uploadedAt: { type: String, default: () => new Date().toLocaleDateString('en-GB') },
    isVerified: { type: Boolean, default: false },
    issuingCountry: { type: String, default: 'India' },
    thumbnailUrl: { type: String },
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

VaultDocumentSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const VaultDocument: Model<IVaultDocument> = mongoose.model<IVaultDocument>(
  'VaultDocument',
  VaultDocumentSchema
);

