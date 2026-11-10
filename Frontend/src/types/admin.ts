import { User, Trip } from './index';

export type AdminRole = 'superadmin' | 'admin' | 'moderator' | 'support' | 'content_manager';

export interface AdminUser extends User {
  role: AdminRole;
}

export interface AdminDashboardCounts {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  verifiedUsers: number;
  verifiedEmailUsers: number;
  verifiedPhoneUsers: number;
  verifiedIdentityUsers: number;
  totalTrips: number;
  publishedTrips: number;
  openTrips: number;
  fullTrips: number;
  draftTrips: number;
  completedTrips: number;
  totalJoinRequests: number;
  pendingJoinRequests: number;
  totalParticipants: number;
  totalPackages: number;
  publishedPackages: number;
  totalReports: number;
  pendingReports: number;
  totalStories: number;
  blockedUsers: number;
  totalAdmins: number;
  newUsersInRange: number;
  newTripsInRange: number;
  newReportsInRange: number;
}

export interface AdminChartSeries {
  date?: string;
  month?: string;
  status?: string;
  count: number;
}

export interface AdminDashboardData {
  range: string;
  filterDate: string;
  endDate: string;
  counts: AdminDashboardCounts;
  charts: {
    userGrowth: Array<{ date: string; count: number }>;
    tripGrowth: Array<{ date: string; count: number }>;
    tripStatusDistribution: Array<{ status: string; count: number }>;
    verificationDistribution: Array<{ status: string; count: number }>;
    userActivity: Array<{ status: string; count: number }>;
  };
  recentUsers: User[];
  recentTrips: any[];
  recentReports: any[];
  recentAuditLogs: AdminAuditLogItem[];
}

export interface AdminAuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface CMSContent {
  key: string;
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
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    active: boolean;
    linkUrl?: string;
    createdAt: string;
  }>;
  lastUpdatedBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedAt?: string;
}

export interface PlatformSettingsData {
  key: string;
  websiteName: string;
  websiteTagline: string;
  contactEmail: string;
  supportPhone: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  tripCreationEnabled: boolean;
  publicDiaryEnabled: boolean;
  communityGuidelinesUrl?: string;
  safetyGuidelinesUrl?: string;
  emergencyHelpline?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface ServiceHealthStatus {
  emailService: {
    provider: string;
    host: string;
    user: string;
    passwordMasked: string;
    status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
    isConfigured: boolean;
  };
  smsService: {
    provider: string;
    apiKeyMasked: string;
    status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
    isConfigured: boolean;
    countrySupport: string;
  };
  security: {
    jwtAlgorithm: string;
    tokenExpiry: string;
    passwordHashing: string;
  };
}

export interface IdentityVerificationItem {
  id: string;
  userId: string;
  provider: string;
  providerReferenceId: string;
  documentType: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id' | 'other';
  status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'FAILED';
  consentGiven: boolean;
  consentTimestamp: string;
  submittedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  verificationMetadata?: {
    confidenceScore?: number;
    checkSummary?: string;
    issuingCountry?: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    identityVerificationStatus?: string;
  };
  createdAt: string;
}

export interface MediaFileItem {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface RoleDefinitionItem {
  role: AdminRole;
  name: string;
  description: string;
  permissions: string[];
  badgeColor: string;
}

