import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  id: string;
  tripId: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  text: string;
  timestamp: string;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, unique: true, index: true },
    tripId: { type: String, required: true, index: true },
    sender: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, default: '' },
    },
    text: { type: String, required: true },
    timestamp: { type: String, default: 'Just now' },
    readBy: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

MessageSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

