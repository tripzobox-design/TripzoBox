import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOAuthHandoffCode extends Document {
  codeHash: string;
  userId: string;
  redirectPath: string;
  expiresAt: Date;
  consumed: boolean;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthHandoffCodeSchema = new Schema<IOAuthHandoffCode>(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    redirectPath: { type: String, default: '/app/dashboard' },
    expiresAt: { type: Date, required: true, index: { expires: '5m' } },
    consumed: { type: Boolean, default: false, index: true },
    consumedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const OAuthHandoffCode: Model<IOAuthHandoffCode> =
  mongoose.models.OAuthHandoffCode ||
  mongoose.model<IOAuthHandoffCode>('OAuthHandoffCode', OAuthHandoffCodeSchema);

