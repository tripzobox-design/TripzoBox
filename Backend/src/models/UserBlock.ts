import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserBlock extends Document {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserBlockSchema = new Schema<IUserBlock>(
  {
    id: { type: String, unique: true, index: true },
    blockerId: { type: String, required: true, index: true },
    blockedUserId: { type: String, required: true, index: true },
    blockedUserName: { type: String, required: true },
    reason: { type: String, maxlength: 250 },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate blocks
UserBlockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

UserBlockSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const UserBlock: Model<IUserBlock> = mongoose.model<IUserBlock>(
  'UserBlock',
  UserBlockSchema
);

