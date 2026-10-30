import mongoose, { Schema, Document, Model } from 'mongoose';

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
  };
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  requestedAt: string;
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
      avatarUrl: { type: String, required: true },
      city: { type: String },
      location: { type: String },
      travelStyle: { type: String },
      languages: { type: String },
      budget: { type: String },
    },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
    requestedAt: { type: String, default: () => new Date().toISOString() },
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

