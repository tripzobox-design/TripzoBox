import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  emailOrPhone: z.string().min(3, 'Email or phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['female', 'male', 'non-binary', 'prefer-not-to-say']).optional(),
  country: z.string().optional(),
  travelStyle: z.string().optional(),
  travelInterests: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or phone number is required'),
  password: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  languages: z.array(z.string()).optional(),
  travelStyle: z.string().optional(),
  travelInterests: z.array(z.string()).optional(),
  budgetStyle: z.enum(['budget', 'mid-range', 'comfort']).optional(),
  travelPace: z.string().optional(),
  preferredGroupSize: z.string().optional(),
  dreamDestination: z.string().optional(),
  avatarUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  emailVerified: z.never({ message: 'Manual email verification is forbidden' }).optional(),
  phoneVerified: z.never({ message: 'Manual phone verification is forbidden' }).optional(),
  identityVerificationStatus: z.never({ message: 'Manual identity status modification is forbidden' }).optional(),
  role: z.never({ message: 'Manual role modification is forbidden' }).optional(),
});

export const securityQuestionSchema = z.object({
  question: z.string().min(5, 'Question is required'),
  answer: z.string().min(2, 'Answer must be at least 2 characters'),
});

export const forgotPasswordSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or phone is required'),
  method: z.enum(['email', 'phone', 'security-question']).default('email'),
});

export const verifyOtpSchema = z.object({
  emailOrPhone: z.string().min(3),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  emailOrPhone: z.string().min(3),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  token: z.string().optional(),
});

