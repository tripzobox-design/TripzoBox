import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConsumedResetToken extends Document {
  tokenIdentifier: string;
  userId: string;
  email: string;
  consumedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsumedResetTokenSchema = new Schema<IConsumedResetToken>(
  {
    tokenIdentifier: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    consumedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  }
);

export const ConsumedResetToken: Model<IConsumedResetToken> =
  mongoose.models.ConsumedResetToken ||
  mongoose.model<IConsumedResetToken>('ConsumedResetToken', ConsumedResetTokenSchema);

// Ensure MongoDB indexes (unique tokenIdentifier + TTL expiresAt) are initialized
ConsumedResetToken.init().catch((err: any) => {
  console.error('[ConsumedResetToken] Model index initialization error:', err?.message);
});

export default ConsumedResetToken;
