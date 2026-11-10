import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformSettings extends Document {
  key: string;
  websiteName: string;
  websiteTagline: string;
  contactEmail: string;
  supportPhone: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  tripCreationEnabled: boolean;
  publicDiaryEnabled: boolean;
  communityGuidelinesUrl?: string;
  safetyGuidelinesUrl?: string;
  emergencyHelpline?: string;
  updatedBy?: string;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global_settings' },
    websiteName: { type: String, default: 'TripzoBox' },
    websiteTagline: { type: String, default: 'Explore The World Without Limits' },
    contactEmail: { type: String, default: 'contact@tripzobox.com' },
    supportPhone: { type: String, default: '+91 98765 00000' },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com/tripzobox' },
      twitter: { type: String, default: 'https://twitter.com/tripzobox' },
      facebook: { type: String, default: 'https://facebook.com/tripzobox' },
      linkedin: { type: String, default: 'https://linkedin.com/company/tripzobox' },
      youtube: { type: String, default: 'https://youtube.com/@tripzobox' },
    },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    tripCreationEnabled: { type: Boolean, default: true },
    publicDiaryEnabled: { type: Boolean, default: true },
    communityGuidelinesUrl: { type: String, default: '/community-rules' },
    safetyGuidelinesUrl: { type: String, default: '/safety' },
    emergencyHelpline: { type: String, default: '112 / 100' },
    updatedBy: { type: String, default: 'system' },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>('PlatformSettings', PlatformSettingsSchema);

