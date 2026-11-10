import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebsiteContent extends Document {
  key: string; // 'homepage' | 'about' | 'contact' | 'faqs' | 'terms' | 'privacy' | 'general'
  hero: {
    badgeText: string;
    headingLine1: string;
    headingLine2: string;
    headingHighlight: string;
    description: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    bgImageUrl: string;
  };
  promotionalBanner: {
    enabled: boolean;
    text: string;
    linkText?: string;
    linkUrl?: string;
    badge?: string;
  };
  sectionVisibility: {
    hero: boolean;
    quickStats: boolean;
    featuredDestinations: boolean;
    trendingTrips: boolean;
    safetyVault: boolean;
    diaryStories: boolean;
    reviews: boolean;
  };
  aboutUs: {
    title: string;
    subtitle: string;
    mission: string;
    story: string;
    heroImage: string;
    values: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
  contactInfo: {
    email: string;
    supportEmail: string;
    phone: string;
    address: string;
    supportHours: string;
    socialLinks: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
    };
  };
  faqs: Array<{
    id: string;
    category: string;
    question: string;
    answer: string;
    displayOrder: number;
  }>;
  termsAndConditions: string;
  privacyPolicy: string;
  communityGuidelines: string;
  safetyGuidelines: string;
  helpSupport: string;
  featuredDestinations: string[];
  featuredTrips: string[];
  draftContent?: Record<string, any>;
  isDraftMode?: boolean;
  version?: number;
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    active: boolean;
    linkUrl?: string;
    createdAt: Date;
  }>;
  lastUpdatedBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedAt: Date;
  createdAt: Date;
}

const WebsiteContentSchema = new Schema<IWebsiteContent>(
  {
    key: { type: String, required: true, unique: true, index: true, default: 'main_cms' },
    hero: {
      badgeText: { type: String, default: 'Next-Gen Travel Community' },
      headingLine1: { type: String, default: 'Your Journey.' },
      headingLine2: { type: String, default: 'Your People.' },
      headingHighlight: { type: String, default: 'Your Story.' },
      description: {
        type: String,
        default:
          'Plan your trip, connect with compatible travellers, keep important documents safe offline, and discover untouched secret spots with an authentic community.',
      },
      primaryCtaText: { type: String, default: 'Start Exploring' },
      primaryCtaLink: { type: String, default: '/explore' },
      secondaryCtaText: { type: String, default: 'How It Works' },
      secondaryCtaLink: { type: String, default: '/how-it-works' },
      bgImageUrl: {
        type: String,
        default:
          'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=2400&q=90',
      },
    },
    promotionalBanner: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: 'Discover monsoon & winter mountain escapes across the Western Ghats!' },
      linkText: { type: String, default: 'Explore Now' },
      linkUrl: { type: String, default: '/explore' },
      badge: { type: String, default: 'New Escapes' },
    },
    sectionVisibility: {
      hero: { type: Boolean, default: true },
      quickStats: { type: Boolean, default: true },
      featuredDestinations: { type: Boolean, default: true },
      trendingTrips: { type: Boolean, default: true },
      safetyVault: { type: Boolean, default: true },
      diaryStories: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true },
    },
    aboutUs: {
      title: { type: String, default: 'About Tripzobox' },
      subtitle: { type: String, default: 'A place to find your people and your next adventure.' },
      mission: {
        type: String,
        default:
          'We believe the people you meet can become as memorable as the places you visit. Tripzobox brings discovery, shared travel plans, and personal stories together so you can spend more time looking forward to the journey.',
      },
      story: {
        type: String,
        default:
          'A weekend in Munnar, a coastal escape to Varkala, or a first trip with new companions can start with a simple conversation. Our mission is to make it easier to turn that spark into a shared plan.',
      },
      heroImage: {
        type: String,
        default:
          'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1000&q=85',
      },
      values: [
        {
          title: { type: String, default: 'Good company matters' },
          description: {
            type: String,
            default:
              'Talk about your interests, budget, and travel pace before you set out. Shared expectations make space for better experiences together.',
          },
          icon: { type: String, default: 'Users' },
        },
        {
          title: { type: String, default: 'Respect comes along' },
          description: {
            type: String,
            default:
              'Be considerate of personal boundaries, local cultures, and the places you visit. Ask before sharing someone else’s photo or story.',
          },
          icon: { type: String, default: 'Heart' },
        },
        {
          title: { type: String, default: 'Stay curious' },
          description: {
            type: String,
            default:
              'Take the quieter trail, learn from local perspectives, and share the practical details that help the next traveller explore thoughtfully.',
          },
          icon: { type: String, default: 'Compass' },
        },
      ],
    },
    contactInfo: {
      email: { type: String, default: 'contact@tripzobox.com' },
      supportEmail: { type: String, default: 'support@tripzobox.com' },
      phone: { type: String, default: '+91 98765 43210' },
      address: { type: String, default: 'TripzoBox HQ, Tech Park, Bengaluru, Karnataka, India' },
      supportHours: { type: String, default: 'Monday – Saturday: 9:00 AM – 8:00 PM IST' },
      socialLinks: {
        twitter: { type: String, default: 'https://twitter.com/tripzobox' },
        instagram: { type: String, default: 'https://instagram.com/tripzobox' },
        facebook: { type: String, default: 'https://facebook.com/tripzobox' },
        linkedin: { type: String, default: 'https://linkedin.com/company/tripzobox' },
      },
    },
    faqs: [
      {
        id: { type: String, default: 'faq_1' },
        category: { type: String, default: 'Getting Started' },
        question: { type: String, default: 'How do I join a travel trip on TripzoBox?' },
        answer: {
          type: String,
          default:
            'Explore the Find a Trip page, filter by destination and dates, and click Join Trip. The trip leader reviews your profile and approves your request.',
        },
        displayOrder: { type: Number, default: 1 },
      },
      {
        id: { type: String, default: 'faq_2' },
        category: { type: String, default: 'Safety & Trust' },
        question: { type: String, default: 'How does TripzoBox verify travellers?' },
        answer: {
          type: String,
          default:
            'We provide multi-tier verification including verified email tokens, mobile SMS OTP confirmation, and community reputation ratings.',
        },
        displayOrder: { type: Number, default: 2 },
      },
      {
        id: { type: String, default: 'faq_3' },
        category: { type: String, default: 'Travel Vault' },
        question: { type: String, default: 'What is the Travel Vault and is it safe?' },
        answer: {
          type: String,
          default:
            'Travel Vault is your private offline document locker encrypted with 256-bit encryption for hotel bookings, IDs, and tickets.',
        },
        displayOrder: { type: Number, default: 3 },
      },
    ],
    termsAndConditions: {
      type: String,
      default:
        '# TripzoBox Terms of Service\n\nWelcome to TripzoBox. By accessing or using our travel community platform, you agree to comply with our community standards, travel safety rules, and terms of service.',
    },
    privacyPolicy: {
      type: String,
      default:
        '# TripzoBox Privacy Policy\n\nYour privacy is paramount. We do not sell your personal data. Documents stored in Travel Vault are encrypted and accessible only with your explicit permission.',
    },
    communityGuidelines: {
      type: String,
      default:
        '# TripzoBox Community Guidelines\n\n1. Be respectful to fellow travellers.\n2. No harassment, discrimination, or hate speech.\n3. Communicate honestly and keep emergency contacts updated.\n4. Protect your identity and never share financial credentials.',
    },
    safetyGuidelines: {
      type: String,
      default:
        '# TripzoBox Travel Safety Guidelines\n\n1. Always verify travellers before embarking on journeys.\n2. Store your emergency documents in the Travel Vault.\n3. Share your live itinerary with trusted family members.\n4. Report suspicious behavior immediately to TripzoBox Safety.',
    },
    helpSupport: {
      type: String,
      default:
        '# TripzoBox Help & Support\n\nNeed assistance? Our support team is here 24/7 to help with trip coordination, vault document recovery, and safety inquiries.',
    },
    featuredDestinations: { type: [String], default: [] },
    featuredTrips: { type: [String], default: [] },
    draftContent: { type: Schema.Types.Mixed },
    isDraftMode: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    announcements: [
      {
        id: { type: String, default: 'ann_welcome' },
        title: { type: String, default: 'Welcome to TripzoBox Platform' },
        message: {
          type: String,
          default: 'Discover trips, connect with verified travellers, and safeguard your journey credentials.',
        },
        type: { type: String, default: 'info' },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastUpdatedBy: {
      id: { type: String },
      name: { type: String },
      email: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const WebsiteContent: Model<IWebsiteContent> = mongoose.model<IWebsiteContent>(
  'WebsiteContent',
  WebsiteContentSchema
);

