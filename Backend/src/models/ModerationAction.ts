import mongoose, { Schema, Document, Model } from 'mongoose';

export type ModerationActionType =
  | 'SUSPEND_USER'
  | 'RESTORE_USER'
  | 'DISMISS_REPORT'
  | 'RESOLVE_REPORT'
  | 'UNDER_REVIEW'
  | 'ISSUE_WARNING';

export interface IModerationAction extends Document {
  id: string;
  adminId: string;
  adminName: string;
  reportId?: string;
  targetUserId?: string;
  action: ModerationActionType;
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModerationActionSchema = new Schema<IModerationAction>(
  {
    id: { type: String, unique: true, index: true },
    adminId: { type: String, required: true, index: true },
    adminName: { type: String, required: true },
    reportId: { type: String, index: true },
    targetUserId: { type: String, index: true },
    action: {
      type: String,
      enum: ['SUSPEND_USER', 'RESTORE_USER', 'DISMISS_REPORT', 'RESOLVE_REPORT', 'UNDER_REVIEW', 'ISSUE_WARNING'],
      required: true,
      index: true,
    },
    reason: { type: String, required: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

ModerationActionSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const ModerationAction: Model<IModerationAction> = mongoose.model<IModerationAction>(
  'ModerationAction',
  ModerationActionSchema
);

