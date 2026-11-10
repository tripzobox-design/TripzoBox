import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoryAuthor {
  id: string;
  name: string;
  avatarUrl: string;
  city?: string;
}

export interface IStory extends Document {
  id: string;
  slug: string;
  title: string;
  destination: string;
  dates: string;
  summary: string;
  fullContent?: string[];
  coverImageUrl: string;
  galleryImages: string[];
  author: IStoryAuthor;
  entries?: any[];
  likes: number;
  likedBy: string[];
  comments: number;
  views: number;
  readTimeMins: number;
  visibility: 'public' | 'private';
  status: 'draft' | 'published';
  badge?: string;
  days?: number;
  photosCount?: number;
  placesCount?: number;
  timeAgo?: string;
  rating?: number;
  reviewCount?: number;
  tripType?: string;
  travelStyle: string[];
  languages: string[];
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    id: { type: String, unique: true, index: true },
    slug: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true, index: true },
    dates: { type: String, required: true },
    summary: { type: String, required: true },
    fullContent: { type: [String], default: [] },
    coverImageUrl: { type: String, required: true },
    galleryImages: { type: [String], default: [] },
    author: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, default: '' },
      city: { type: String },
    },
    entries: { type: [Schema.Types.Mixed], default: [] },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    readTimeMins: { type: Number, default: 4 },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    badge: { type: String },
    days: { type: Number, default: 3 },
    photosCount: { type: Number, default: 0 },
    placesCount: { type: Number, default: 0 },
    timeAgo: { type: String },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 15 },
    tripType: { type: String, default: 'Solo' },
    travelStyle: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

StorySchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (!this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      `-${Date.now().toString().slice(-4)}`;
  }
  next();
});

export const Story: Model<IStory> = mongoose.model<IStory>('Story', StorySchema);

