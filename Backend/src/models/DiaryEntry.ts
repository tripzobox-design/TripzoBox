import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDiaryEntry extends Document {
  id: string;
  userId: string;
  place: string;
  date: string;
  category: 'Nature' | 'Food' | 'Culture' | 'Beach' | 'Adventure' | 'City' | 'Wildlife' | 'Other';
  text: string;
  photos: string[];
  price?: number;
  rating?: number;
  tips?: string;
  isPublished: boolean;
  storyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiaryEntrySchema = new Schema<IDiaryEntry>(
  {
    id: { type: String, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    place: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    category: {
      type: String,
      enum: ['Nature', 'Food', 'Culture', 'Beach', 'Adventure', 'City', 'Wildlife', 'Other'],
      default: 'Nature',
      index: true,
    },
    text: { type: String, required: true },
    photos: { type: [String], default: [] },
    price: { type: Number },
    rating: { type: Number, min: 1, max: 5 },
    tips: { type: String },
    isPublished: { type: Boolean, default: false },
    storyId: { type: String },
  },
  {
    timestamps: true,
  }
);

DiaryEntrySchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `diary_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const DiaryEntry: Model<IDiaryEntry> = mongoose.model<IDiaryEntry>(
  'DiaryEntry',
  DiaryEntrySchema
);

