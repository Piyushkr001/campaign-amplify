import { z } from 'zod';
import { CATEGORIES } from '@/constants/categories';

export const CampaignBasicsSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  category: z.enum(CATEGORIES.filter((c) => c !== 'All') as [string, ...string[]]),
  creatorName: z
    .string()
    .min(3, 'Creator or organization name is required')
    .max(80, 'Creator name cannot exceed 80 characters'),
  summary: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(240, 'Summary cannot exceed 240 characters'),
});

export const CampaignStorySchema = z.object({
  story: z
    .string()
    .min(100, 'Story must be at least 100 characters to provide sufficient context for message review')
    .max(5000, 'Story is too long'),
});

export const CampaignReachSchema = z.object({
  targetBudget: z
    .number()
    .min(500, 'Minimum amplification budget is $500')
    .max(1000000, 'Maximum amplification budget is $1,000,000'),
  targetAudience: z
    .string()
    .min(5, 'Please specify your target audience'),
});

export type CampaignBasicsFormData = z.infer<typeof CampaignBasicsSchema>;
export type CampaignStoryFormData = z.infer<typeof CampaignStorySchema>;
export type CampaignReachFormData = z.infer<typeof CampaignReachSchema>;
