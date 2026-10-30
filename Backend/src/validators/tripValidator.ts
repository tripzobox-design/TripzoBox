import { z } from 'zod';

export const createTripSchema = z.object({
  name: z.string().min(3, 'Trip name must be at least 3 characters'),
  destination: z.string().min(2, 'Destination is required'),
  startCity: z.string().min(2, 'Starting city is required'),
  startDate: z.string().min(2, 'Start date is required'),
  endDate: z.string().min(2, 'End date is required'),
  durationDays: z.number().int().min(1, 'Duration must be at least 1 day').optional(),
  budgetPerPerson: z.number().min(0, 'Budget must be a positive number'),
  tripType: z.string().default('group'),
  preferences: z.array(z.string()).default([]),
  description: z.string().min(10, 'Trip description must be at least 10 characters'),
  highlights: z.array(z.string()).default([]),
  maxMembers: z.number().int().min(1, 'Group size must be at least 1').default(6),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  coverImageUrl: z.string().url().default('https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80'),
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
        title: z.string(),
        desc: z.string(),
        icon: z.string().optional(),
      })
    )
    .default([]),
  tags: z.array(z.string()).default([]),
});

export const joinRequestSchema = z.object({
  message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
  budget: z.string().optional(),
  travelStyle: z.string().optional(),
  languages: z.string().optional(),
});

