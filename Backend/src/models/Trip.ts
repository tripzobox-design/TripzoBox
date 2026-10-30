import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITripMember {
  id: string;
  name: string;
  avatarUrl: string;
  role?: string;
  city?: string;
  email?: string;
}

export interface ITripItinerary {
  day: number;
  title: string;
  desc: string;
  icon?: string;
}

export interface ITripReview {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  rating: number;
  date: string;
  comment: string;
}

export interface ITrip extends Document {
  id: string;
  name: string;
  destination: string;
  startCity: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  budgetPerPerson: number;
  tripType: string;
  preferences: string[];
  description: string;
  highlights: string[];
  leader: {
    id: string;
    name: string;
    username?: string;
    avatarUrl: string;
    city?: string;
    email?: string;
    phone?: string;
  };
  members: ITripMember[];
  maxMembers: number;
  difficulty: 'easy' | 'medium' | 'hard';
  coverImageUrl: string;
  galleryImages: string[];
  inclusions: string[];
  rules: string[];
  languages: string[];
  travelStyle: string;
  status: 'open' | 'full' | 'closed' | 'draft';
  roomType: 'public' | 'private';
  roomCode?: string;
  compatibilityScore?: number;
  itinerary: ITripItinerary[];
  reviews: ITripReview[];
  rating: number;
  reviewCount: number;
  badge?: string;
  tags: string[];
  spotsLeft?: number;
  organizerName?: string;
  savedBy: string[]; // user ids who saved this trip
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    id: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true, index: true },
    startCity: { type: String, required: true, trim: true, index: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    durationDays: { type: Number, required: true, min: 1 },
    budgetPerPerson: { type: Number, required: true, min: 0 },
    tripType: { type: String, default: 'group', index: true },
    preferences: { type: [String], default: [] },
    description: { type: String, required: true },
    highlights: { type: [String], default: [] },
    leader: {
      id: { type: String, required: true, index: true },
      name: { type: String, required: true },
      username: { type: String },
      avatarUrl: { type: String, required: true },
      city: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    members: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        avatarUrl: { type: String, required: true },
        role: { type: String, default: 'Member' },
        city: { type: String },
        email: { type: String },
      },
    ],
    maxMembers: { type: Number, required: true, min: 1 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    coverImageUrl: { type: String, required: true },
    galleryImages: { type: [String], default: [] },
    inclusions: { type: [String], default: [] },
    rules: { type: [String], default: [] },
    languages: { type: [String], default: ['English', 'Hindi'] },
    travelStyle: { type: String, default: 'Group' },
    status: {
      type: String,
      enum: ['open', 'full', 'closed', 'draft'],
      default: 'open',
      index: true,
    },
    roomType: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
      index: true,
    },
    roomCode: { type: String },
    compatibilityScore: { type: Number, default: 95 },
    itinerary: [
      {
        day: { type: Number, required: true },
        title: { type: String, required: true },
        desc: { type: String, required: true },
        icon: { type: String },
      },
    ],
    reviews: [
      {
        id: { type: String },
        author: {
          id: { type: String },
          name: { type: String },
          avatarUrl: { type: String },
        },
        rating: { type: Number },
        date: { type: String },
        comment: { type: String },
      },
    ],
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 12 },
    badge: { type: String },
    tags: { type: [String], default: [] },
    spotsLeft: { type: Number },
    organizerName: { type: String },
    savedBy: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

TripSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  // Compute remaining spots
  const confirmedCount = this.members.length;
  this.spotsLeft = Math.max(0, this.maxMembers - confirmedCount);
  if (this.spotsLeft === 0 && this.status === 'open') {
    this.status = 'full';
  } else if (this.spotsLeft > 0 && this.status === 'full') {
    this.status = 'open';
  }
  next();
});

export const Trip: Model<ITrip> = mongoose.model<ITrip>('Trip', TripSchema);

