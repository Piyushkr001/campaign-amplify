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
  id: z.string().trim().uuid('Invalid campaign ID format. Expected a valid UUID.'),
});

export const createDraftSchema = z.object({
  title: z.string().trim().max(60).optional(),
});

export const updateBasicsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Campaign title must be at least 5 characters.')
    .max(60, 'Campaign title cannot exceed 60 characters.'),
  category: z.string().trim().min(1, 'Category is required.'),
  creatorName: z
    .string()
    .trim()
    .min(3, 'Creator or organization name must be at least 3 characters.')
    .max(80, 'Creator name cannot exceed 80 characters.'),
  summary: z
    .string()
    .trim()
    .min(20, 'Summary must be at least 20 characters.')
    .max(240, 'Summary cannot exceed 240 characters.'),
  coverImage: z.string().nullable().optional(),
});

export const updateStorySchema = z.object({
  storyHeadline: z
    .string()
    .trim()
    .min(5, 'Story headline must be at least 5 characters.')
    .max(100, 'Story headline cannot exceed 100 characters.')
    .optional(),
  storyIntro: z
    .string()
    .trim()
    .min(20, 'Story introduction must be at least 20 characters.')
    .max(500, 'Story introduction cannot exceed 500 characters.')
    .optional(),
  storyContent: z
    .string()
    .trim()
    .min(100, 'Main story must be at least 100 characters to provide sufficient context.')
    .max(5000, 'Story cannot exceed 5,000 characters.'),
  storyImage: z.string().nullable().optional(),
  storyImageCaption: z.string().trim().max(120, 'Caption cannot exceed 120 characters.').optional(),
  storyImageCredit: z.string().trim().max(80, 'Credit cannot exceed 80 characters.').optional(),
  suggestedAction: z.string().trim().max(100, 'Suggested action cannot exceed 100 characters.').optional(),
  sources: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().trim().min(1, 'Source title is required.'),
        url: z.string().trim().url('Source URL must be a valid web address.'),
        publisher: z.string().trim().max(100).optional(),
      })
    )
    .min(1, 'At least one verified supporting source citation is required.')
    .default([]),
});

export const updateVisualsSchema = z.object({
  coverImage: z.string().nullable().optional(),
  adHeadline: z
    .string()
    .trim()
    .min(5, 'Ad headline must be at least 5 characters.')
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
    .max(25, 'Ad CTA cannot exceed 25 characters.'),
  adImage: z.string().nullable().optional(),
});

export const updateReachSchema = z.object({
  locations: z.array(z.string().trim()).min(1, 'Select or enter at least one target location.'),
  interests: z.array(z.string().trim()).min(1, 'Select at least one audience interest topic.'),
  channels: z.array(z.string().trim()).min(1, 'Select at least one distribution channel preference.'),
  audienceDescription: z
    .string()
    .trim()
    .min(10, 'Please describe your audience in at least 10 characters.')
    .max(300, 'Audience description cannot exceed 300 characters.')
    .optional(),
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
    .min(100, 'Minimum amplification funding goal is $100.')
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
