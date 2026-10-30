import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDestination extends Document {
  id: string;
  slug: string;
  name: string;
  state: string;
  category: 'Mountains' | 'Beaches' | 'Cities' | 'Culture' | 'Nature' | 'Hidden Spots';
  imageUrl: string;
  galleryImages: string[];
  shortDescription: string;
  longDescription?: string;
  bestTimeToVisit?: string;
  topAttractions: string[];
  isHiddenSpot: boolean;
  isPublic: boolean;
  createdBy?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  rating: number;
  reviewCount: string | number;
  estimatedCostPerDay?: string;
  badge?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<IDestination>(
  {
    id: { type: String, unique: true, index: true },
    slug: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Mountains', 'Beaches', 'Cities', 'Culture', 'Nature', 'Hidden Spots'],
      required: true,
      index: true,
    },
    imageUrl: { type: String, required: true },
    galleryImages: { type: [String], default: [] },
    shortDescription: { type: String, required: true },
    longDescription: { type: String },
    bestTimeToVisit: { type: String },
    topAttractions: { type: [String], default: [] },
    isHiddenSpot: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    createdBy: {
      id: { type: String },
      name: { type: String },
      avatarUrl: { type: String },
    },
    rating: { type: Number, default: 4.7 },
    reviewCount: { type: Schema.Types.Mixed, default: '1.2k' },
    estimatedCostPerDay: { type: String },
    badge: { type: String },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

DestinationSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `dest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

export const Destination: Model<IDestination> = mongoose.model<IDestination>(
  'Destination',
  DestinationSchema
);

