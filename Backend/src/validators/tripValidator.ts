import { z } from 'zod';

export const createTripSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Trip name is required'),
  destination: z.string().min(1, 'Destination is required'),
  startCity: z.string().min(1, 'Starting city is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  durationDays: z.number().int().min(1, 'Duration must be at least 1 day').optional(),
  budgetPerPerson: z.number().min(0, 'Budget must be a positive number').optional().default(0),
  tripType: z.string().default('group'),
  preferences: z.array(z.string()).default([]),
  description: z
    .string()
    .optional()
    .default('An unforgettable journey with fellow travellers.'),
  highlights: z.array(z.string()).default([]),
  maxMembers: z.number().int().min(1, 'Group size must be at least 1').default(6),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  coverImageUrl: z
    .string()
    .optional()
    .default('https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80'),
  galleryImages: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  languages: z.array(z.string()).default(['English', 'Hindi']),
  travelStyle: z.string().default('Group'),
  status: z.enum(['open', 'full', 'closed', 'draft']).default('open'),
  roomType: z.enum(['public', 'private']).default('public'),
  roomCode: z.string().optional(),
  itinerary: z
    .array(
      z.object({
        day: z.number().int(),
        title: z.string().optional().default(''),
        desc: z.string().optional().default(''),
        icon: z.string().optional(),
      })
    )
    .default([]),
  tags: z.array(z.string()).default([]),
  chatMessages: z.array(z.any()).optional(),
  pendingJoinRequests: z.array(z.any()).optional(),
  compatibilityScore: z.number().optional(),
});

export const joinRequestSchema = z.object({
  message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
  budget: z.string().optional(),
  travelStyle: z.string().optional(),
  languages: z.string().optional(),
});

