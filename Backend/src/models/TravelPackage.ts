import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPackageItinerary {
  day: number;
  title: string;
  description: string;
  meals?: string;
  hotel?: string;
}

export interface ITravelPackage extends Document {
  id: string;
  title: string;
  slug: string;
  destination: string;
  state?: string;
  country: string;
  durationDays: number;
  durationNights: number;
  price: number;
  discountPrice?: number;
  coverImageUrl: string;
  galleryImages: string[];
  description: string;
  highlights: string[];
  itinerary: IPackageItinerary[];
  inclusions: string[];
  exclusions: string[];
  maxBookings: number;
  currentBookings: number;
  availableDates: string[];
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TravelPackageSchema = new Schema<ITravelPackage>(
  {
    id: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    destination: { type: String, required: true, trim: true, index: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'India' },
    durationDays: { type: Number, required: true, min: 1 },
    durationNights: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    coverImageUrl: { type: String, required: true },
    galleryImages: { type: [String], default: [] },
    description: { type: String, required: true },
    highlights: { type: [String], default: [] },
    itinerary: [
      {
        day: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        meals: { type: String },
        hotel: { type: String },
      },
    ],
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    maxBookings: { type: Number, default: 20 },
    currentBookings: { type: Number, default: 0 },
    availableDates: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'draft',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

TravelPackageSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;
  }
  next();
});

export const TravelPackage: Model<ITravelPackage> = mongoose.model<ITravelPackage>(
  'TravelPackage',
  TravelPackageSchema
);

