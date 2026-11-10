import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITravellerReview extends Document {
  id: string;
  tripId: string;
  tripName: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  revieweeId: string;
  revieweeName: string;
  ratings: {
    overall: number;
    friendliness: number;
    communication: number;
    punctuality: number;
    cooperation: number;
    responsibility: number;
    respectfulBehaviour?: number;
  };
  tags: string[];
  comment: string;
  isReported: boolean;
  status: 'active' | 'hidden' | 'flagged';
  reportReason?: string;
  reportedBy?: string;
  moderationNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TravellerReviewSchema = new Schema<ITravellerReview>(
  {
    id: { type: String, unique: true, index: true },
    tripId: { type: String, required: true, index: true },
    tripName: { type: String, required: true },
    reviewerId: { type: String, required: true, index: true },
    reviewerName: { type: String, required: true },
    reviewerAvatar: { type: String, default: '' },
    revieweeId: { type: String, required: true, index: true },
    revieweeName: { type: String, required: true },
    ratings: {
      overall: { type: Number, required: true, min: 1, max: 5 },
      friendliness: { type: Number, default: 5, min: 1, max: 5 },
      communication: { type: Number, required: true, min: 1, max: 5 },
      punctuality: { type: Number, required: true, min: 1, max: 5 },
      cooperation: { type: Number, required: true, min: 1, max: 5 },
      responsibility: { type: Number, default: 5, min: 1, max: 5 },
      respectfulBehaviour: { type: Number, min: 1, max: 5 },
    },
    tags: { type: [String], default: [] },
    comment: { type: String, default: '', maxlength: 1000, trim: true },
    isReported: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['active', 'hidden', 'flagged'],
      default: 'active',
      index: true,
    },
    reportReason: { type: String },
    reportedBy: { type: String },
    moderationNote: { type: String },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate review for the same traveller on the same trip
TravellerReviewSchema.index({ tripId: 1, reviewerId: 1, revieweeId: 1 }, { unique: true });

TravellerReviewSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const TravellerReview: Model<ITravellerReview> = mongoose.model<ITravellerReview>(
  'TravellerReview',
  TravellerReviewSchema
);
