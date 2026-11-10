import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReportCategory =
  | 'harassment'
  | 'inappropriate_behaviour'
  | 'suspicious_account'
  | 'scam_fraud'
  | 'fake_identity'
  | 'threatening_behaviour'
  | 'inappropriate_messages'
  | 'safety_concern'
  | 'other';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface IUserReport extends Document {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'trip' | 'message';
  targetId: string;
  targetName?: string;
  category: ReportCategory;
  description: string;
  evidenceUrl?: string;
  status: ReportStatus;
  moderatorNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserReportSchema = new Schema<IUserReport>(
  {
    id: { type: String, unique: true, index: true },
    reporterId: { type: String, required: true, index: true },
    reporterName: { type: String, required: true },
    targetType: { type: String, enum: ['user', 'trip', 'message'], required: true, index: true },
    targetId: { type: String, required: true, index: true },
    targetName: { type: String },
    category: {
      type: String,
      enum: [
        'harassment',
        'inappropriate_behaviour',
        'suspicious_account',
        'scam_fraud',
        'fake_identity',
        'threatening_behaviour',
        'inappropriate_messages',
        'safety_concern',
        'other',
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true, minlength: 10, maxlength: 2000, trim: true },
    evidenceUrl: { type: String },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true,
    },
    moderatorNotes: { type: String },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserReportSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const UserReport: Model<IUserReport> = mongoose.model<IUserReport>(
  'UserReport',
  UserReportSchema
);

