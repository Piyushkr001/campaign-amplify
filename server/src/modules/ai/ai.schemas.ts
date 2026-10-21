import { z } from 'zod';

export const SUPPORTED_AI_CHANNELS = [
  'Meta',
  'Google Ads',
  'YouTube',
  'TikTok',
  'LinkedIn',
  'Search',
  'Instagram',
  'X',
] as const;

// 1. Summary Schema
export const generateSummaryInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category cannot exceed 50 characters'),
  keyPoints: z
    .array(z.string().trim().min(1).max(150))
    .max(5, 'Maximum of 5 key points allowed')
    .optional(),
  tone: z.enum(['inspirational', 'urgent', 'informative', 'community']).default('inspirational'),
});

export const generateSummaryOutputSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(20, 'Summary must be at least 20 characters')
    .max(240, 'Summary cannot exceed 240 characters'),
  suggestedCategory: z.string().trim().min(2).max(50),
  keywords: z.array(z.string().trim().min(1).max(50)).min(1).max(8),
});

// 2. Story Schema
export const generateStoryInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category cannot exceed 50 characters'),
  summary: z.string().trim().max(240).optional(),
  impactGoal: z.string().trim().max(300).optional(),
  tone: z.enum(['inspirational', 'urgent', 'informative', 'community']).default('inspirational'),
});

export const generateStoryOutputSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(5, 'Headline must be at least 5 characters')
    .max(100, 'Headline cannot exceed 100 characters'),
  intro: z
    .string()
    .trim()
    .min(20, 'Intro must be at least 20 characters')
    .max(500, 'Intro cannot exceed 500 characters'),
  story: z
    .string()
    .trim()
    .min(100, 'Story must be at least 100 characters')
    .max(5000, 'Story cannot exceed 5000 characters'),
  callToAction: z
    .string()
    .trim()
    .min(5, 'Call to action must be at least 5 characters')
    .max(100, 'Call to action cannot exceed 100 characters'),
});

// 3. Ad Creative Schema
export const generateAdCreativeInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  summary: z.string().trim().max(240).optional(),
  targetAudience: z.string().trim().max(300).optional(),
  platform: z.string().trim().max(50).optional(),
});

export const generateAdCreativeOutputSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(5, 'Ad headline must be at least 5 characters')
    .max(60, 'Ad headline cannot exceed 60 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Ad description must be at least 10 characters')
    .max(150, 'Ad description cannot exceed 150 characters'),
  callToAction: z
    .string()
    .trim()
    .min(2, 'Ad CTA must be at least 2 characters')
    .max(25, 'Ad CTA cannot exceed 25 characters'),
  visualConcept: z
    .string()
    .trim()
    .min(10, 'Visual concept must be at least 10 characters')
    .max(250, 'Visual concept cannot exceed 250 characters'),
});

// 4. Audience Schema
export const generateAudienceInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category cannot exceed 50 characters'),
  summary: z.string().trim().max(240).optional(),
});

export const generateAudienceOutputSchema = z.object({
  audienceDescription: z
    .string()
    .trim()
    .min(20, 'Audience description must be at least 20 characters')
    .max(300, 'Audience description cannot exceed 300 characters'),
  interests: z
    .array(z.string().trim().min(2).max(50))
    .min(1, 'At least 1 interest required')
    .max(10, 'Maximum of 10 interests allowed'),
  suggestedChannels: z
    .array(z.enum(SUPPORTED_AI_CHANNELS))
    .min(1, 'At least 1 channel required')
    .max(8),
  geographicFocus: z.string().trim().max(100).optional(),
});
