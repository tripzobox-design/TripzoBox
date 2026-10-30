import mongoose, { Schema, Document, Model } from 'mongoose';

// Emergency Contact
export interface IEmergencyContact extends Document {
  id: string;
  userId: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    relation: { type: String, required: true },
    phone: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EmergencyContactSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `em_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const EmergencyContact: Model<IEmergencyContact> = mongoose.model<IEmergencyContact>(
  'EmergencyContact',
  EmergencyContactSchema
);

// Trusted Contact
export interface ITrustedContact extends Document {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  hasVaultAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrustedContactSchema = new Schema<ITrustedContact>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    hasVaultAccess: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TrustedContactSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const TrustedContact: Model<ITrustedContact> = mongoose.model<ITrustedContact>(
  'TrustedContact',
  TrustedContactSchema
);

// Shared Access Record
export interface ISharedAccessRecord extends Document {
  id: string;
  userId: string;
  documentId: string;
  documentName: string;
  documentType: string;
  sharedWithName: string;
  sharedWithRole?: string;
  sharedWithAvatar?: string;
  permission: 'View' | 'View • Download';
  expires: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SharedAccessRecordSchema = new Schema<ISharedAccessRecord>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    documentId: { type: String, required: true },
    documentName: { type: String, required: true },
    documentType: { type: String, required: true },
    sharedWithName: { type: String, required: true },
    sharedWithRole: { type: String },
    sharedWithAvatar: { type: String },
    permission: { type: String, enum: ['View', 'View • Download'], default: 'View' },
    expires: { type: String, default: 'Until trip end' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SharedAccessRecordSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `share_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const SharedAccessRecord: Model<ISharedAccessRecord> = mongoose.model<ISharedAccessRecord>(
  'SharedAccessRecord',
  SharedAccessRecordSchema
);

// Vault Preferences / Settings
export interface IVaultSettings extends Document {
  userId: string;
  emergencyConfig: {
    includedDocTypes: string[];
    primaryContact: string;
    secondaryContact: string;
  };
  securitySettings: {
    twoFactorEnabled: boolean;
    autoLockTime: string;
  };
  offlineAccessSettings: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const VaultSettingsSchema = new Schema<IVaultSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    emergencyConfig: {
      includedDocTypes: { type: [String], default: ['Passport', 'Insurance'] },
      primaryContact: { type: String, default: '+91 98765 43210' },
      secondaryContact: { type: String, default: '+91 98765 43211' },
    },
    securitySettings: {
      twoFactorEnabled: { type: Boolean, default: true },
      autoLockTime: { type: String, default: '15 minutes' },
    },
    offlineAccessSettings: { type: Map, of: Boolean, default: {} },
  },
  { timestamps: true }
);

export const VaultSettings: Model<IVaultSettings> = mongoose.model<IVaultSettings>(
  'VaultSettings',
  VaultSettingsSchema
);

