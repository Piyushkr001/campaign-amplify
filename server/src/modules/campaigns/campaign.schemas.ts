import { z } from 'zod';
import { BACKEND_PUBLIC_STATUSES } from './campaign.types';

export const listCampaignsQuerySchema = z
  .object({
    category: z.string().trim().optional(),
    search: z.string().trim().max(120).optional(),
    searchQuery: z.string().trim().max(120).optional(), // compatibility alias
    sort: z.enum(['featured', 'newest', 'most_funded', 'ending_soon']).optional(),
    sortBy: z.enum(['featured', 'newest', 'most_funded', 'ending_soon']).optional(), // compatibility alias
    status: z
      .string()
      .refine((val) => (BACKEND_PUBLIC_STATUSES as string[]).includes(val as any), {
        message: 'Status must be an active public status.',
      })
      .optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .transform((data) => ({
    category: data.category,
    search: data.search || data.searchQuery,
    sort: data.sort || data.sortBy || 'featured',
    status: data.status,
    limit: data.limit,
    offset: data.offset,
  }));

export const campaignIdParamSchema = z.object({
  id: z.string().min(1, 'Campaign ID is required.'),
});

export const createDraftSchema = z.object({
  title: z.string().trim().max(60).optional(),
});

export const updateBasicsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(60, 'Title cannot exceed 60 characters.'),
  category: z.string().trim().min(1, 'Category is required.'),
  creatorName: z
    .string()
    .trim()
    .min(2, 'Creator name must be at least 2 characters.')
    .max(100, 'Creator name cannot exceed 100 characters.'),
  summary: z
    .string()
    .trim()
    .min(10, 'Summary must be at least 10 characters.')
    .max(200, 'Summary cannot exceed 200 characters.'),
  coverImage: z.string().optional(),
});

export const updateStorySchema = z.object({
  storyHeadline: z.string().trim().max(120).optional(),
  storyIntro: z.string().trim().max(250).optional(),
  storyContent: z
    .string()
    .trim()
    .min(20, 'Story narrative must be at least 20 characters.'),
  storyImage: z.string().optional(),
  storyImageCaption: z.string().trim().max(150).optional(),
  storyImageCredit: z.string().trim().max(100).optional(),
  suggestedAction: z.string().trim().max(200).optional(),
  sources: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Source title is required.'),
        url: z.string().trim().url('Source URL must be a valid web address.'),
        publisher: z.string().trim().max(100).optional(),
      })
    )
    .default([]),
});

export const updateVisualsSchema = z.object({
  coverImage: z.string().optional(),
  adHeadline: z
    .string()
    .trim()
    .min(3, 'Ad headline must be at least 3 characters.')
    .max(60, 'Ad headline cannot exceed 60 characters.'),
  adDescription: z
    .string()
    .trim()
    .min(10, 'Ad description must be at least 10 characters.')
    .max(150, 'Ad description cannot exceed 150 characters.'),
  adCTA: z
    .string()
    .trim()
    .min(2, 'Ad CTA must be at least 2 characters.')
    .max(30, 'Ad CTA cannot exceed 30 characters.'),
  adImage: z.string().optional(),
});

export const updateReachSchema = z.object({
  locations: z.array(z.string().trim()).default([]),
  interests: z.array(z.string().trim()).default([]),
  channels: z.array(z.string().trim()).default([]),
  audienceDescription: z.string().trim().max(300).optional(),
  durationDays: z.coerce
    .number()
    .int()
    .min(7, 'Minimum campaign duration is 7 days.')
    .max(60, 'Maximum campaign duration is 60 days.')
    .default(14),
});

export const submitCampaignSchema = z.object({
  fundingGoal: z.coerce
    .number()
    .int()
    .min(500, 'Minimum amplification funding goal is $500.')
    .max(1000000, 'Maximum amplification funding goal is $1,000,000.'),
});

export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
export type CampaignIdParam = z.infer<typeof campaignIdParamSchema>;
export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type UpdateBasicsInput = z.infer<typeof updateBasicsSchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type UpdateVisualsInput = z.infer<typeof updateVisualsSchema>;
export type UpdateReachInput = z.infer<typeof updateReachSchema>;
export type SubmitCampaignInput = z.infer<typeof submitCampaignSchema>;
