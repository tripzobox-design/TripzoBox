import mongoose, { Schema, Document, Model } from 'mongoose';

export type JoinRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'withdrawn'
  | 'accepted'
  | 'declined';

export interface IModerationHistoryItem {
  adminId: string;
  adminName: string;
  action: string;
  reason: string;
  fromStatus: string;
  toStatus: string;
  timestamp: Date;
}

export interface IModeratorOverride {
  adminId: string;
  adminName: string;
  action: string;
  reason: string;
  previousStatus: string;
  timestamp: Date;
}

export interface IJoinRequest extends Document {
  id: string;
  tripId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
    city?: string;
    location?: string;
    travelStyle?: string;
    languages?: string;
    budget?: string;
    email?: string;
  };
  message: string;
  status: JoinRequestStatus;
  requestedAt: string;
  moderatorOverride?: IModeratorOverride;
  moderationHistory?: IModerationHistoryItem[];
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JoinRequestSchema = new Schema<IJoinRequest>(
  {
    id: { type: String, unique: true, index: true },
    tripId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    user: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, default: '' },
      city: { type: String },
      location: { type: String },
      travelStyle: { type: String },
      languages: { type: String },
      budget: { type: String },
      email: { type: String },
    },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'withdrawn', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
    requestedAt: { type: String, default: () => new Date().toISOString() },
    moderatorOverride: {
      adminId: { type: String },
      adminName: { type: String },
      action: { type: String },
      reason: { type: String },
      previousStatus: { type: String },
      timestamp: { type: Date },
    },
    moderationHistory: [
      {
        adminId: { type: String, required: true },
        adminName: { type: String, required: true },
        action: { type: String, required: true },
        reason: { type: String, required: true },
        fromStatus: { type: String, required: true },
        toStatus: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: { type: String },
    cancellationReason: { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending requests for the same user and trip
JoinRequestSchema.index({ tripId: 1, userId: 1, status: 1 });

JoinRequestSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const JoinRequest: Model<IJoinRequest> = mongoose.model<IJoinRequest>(
  'JoinRequest',
  JoinRequestSchema
);

