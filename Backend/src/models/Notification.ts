import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  id: string;
  userId: string;
  type: 'trip_invite' | 'join_request' | 'trip_update' | 'story_like' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['trip_invite', 'join_request', 'trip_update', 'story_like', 'system'],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: String, default: 'Just now' },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);

