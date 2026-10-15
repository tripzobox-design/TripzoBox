export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  coverUrl?: string;
  city: string;
  country?: string;
  languages: string[];
  bio: string;
  travelInterests: string[];
  budgetStyle: 'budget' | 'mid-range' | 'comfort';
  travelPace?: 'Relaxed' | 'Balanced' | 'Action-packed' | string;
  preferredGroupSize?: string;
  dreamDestination?: string;
  stats: {
    trips: number;
    stories: number;
    followers: number;
    following: number;
  };
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startCity: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  budgetPerPerson: number;
  tripType: 'solo' | 'group' | 'couple';
  preferences: string[]; // Hiking, Nature, Food, Photography, Culture, Beaches
  description: string;
  highlights: string[];
  leader: User;
  members: User[];
  maxMembers: number;
  difficulty: 'easy' | 'medium' | 'hard';
  coverImageUrl: string;
  galleryImages?: string[];
  contactInformation?: { email?: string; phone?: string };
  status: 'open' | 'full' | 'closed';
  roomType?: 'public' | 'private';
  roomCode?: string;
  pendingJoinRequests?: { id: string; user: User; message?: string; requestedAt: string }[];
  compatibilityScore?: number;
  itinerary?: { day: number; title: string; desc: string; icon?: string }[];
  chatMessages?: { id: string; sender: User; text: string; time: string }[];
  reviews?: { id: string; author: User; rating: number; date: string; comment: string }[];
}

export interface JoinRequest {
  id: string;
  tripId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'declined';
  requestedAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  place: string;
  date: string;
  category: 'Nature' | 'Food' | 'Culture' | 'Beach' | 'Adventure' | 'Other';
  text: string;
  photos: string[];
  price?: number;
  rating?: number;
  tips?: string;
  isPublished: boolean;
  storyId?: string;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  destination: string;
  dates: string;
  summary: string;
  fullContent?: string[];
  coverImageUrl: string;
  galleryImages?: string[];
  author: User;
  entries?: DiaryEntry[];
  likes: number;
  comments: number;
  views: number;
  readTimeMins: number;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  state: string;
  category: 'Mountains' | 'Beaches' | 'Cities' | 'Culture' | 'Nature' | 'Hidden Spots';
  imageUrl: string;
  galleryImages?: string[];
  shortDescription: string;
  longDescription?: string;
  bestTimeToVisit?: string;
  topAttractions?: string[];
  isHiddenSpot?: boolean;
  isPublic?: boolean;
  createdBy?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  locationDetails?: string;
}

export interface VaultDocument {
  id: string;
  type: 'Passport' | 'Aadhaar' | 'DrivingLicense' | 'Insurance' | 'FlightTicket' | 'HotelBooking' | 'Other';
  name: string;
  validTill?: string;
  referenceNumber?: string;
  fileUrl?: string;
  visibility: 'private' | 'trusted-contacts' | 'offline-available';
  uploadedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'trip_invite' | 'join_request' | 'trip_update' | 'story_like' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  sender: User;
  text: string;
  timestamp: string;
}
