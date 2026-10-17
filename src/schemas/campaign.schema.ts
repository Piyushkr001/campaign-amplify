import { z } from 'zod';
import { CATEGORIES } from '@/constants/categories';

const validCategories = CATEGORIES.filter((c) => c !== 'All') as [string, ...string[]];

export const CampaignBasicsSchema = z.object({
  title: z
    .string()
    .min(5, 'Campaign title must be at least 5 characters')
    .max(60, 'Campaign title cannot exceed 60 characters'),
  category: z.string().refine((val) => (validCategories as string[]).includes(val), {
    message: 'Please select a campaign category',
  }),
  creatorName: z
    .string()
    .min(3, 'Creator or organization name is required')
    .max(80, 'Creator name cannot exceed 80 characters'),
  summary: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(240, 'Summary cannot exceed 240 characters'),
  coverImage: z.string().optional(),
});

export const CampaignSourceSchema = z.object({
  id: z.string(),
  title: z.string().min(3, 'Source title is required'),
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Must be a valid URL including http:// or https://'),
  publisher: z.string().optional(),
});

export const CampaignStorySchema = z.object({
  storyHeadline: z
    .string()
    .min(5, 'Story headline must be at least 5 characters')
    .max(100, 'Story headline cannot exceed 100 characters'),
  storyIntro: z
    .string()
    .min(20, 'Introduction must be at least 20 characters')
    .max(500, 'Introduction cannot exceed 500 characters'),
  storyContent: z
    .string()
    .min(100, 'Main story must be at least 100 characters to provide sufficient context')
    .max(5000, 'Story cannot exceed 5,000 characters'),
  sources: z.array(CampaignSourceSchema).default([]),
  storyImage: z.string().optional(),
  storyImageCaption: z.string().max(120, 'Caption cannot exceed 120 characters').optional(),
  storyImageCredit: z.string().max(80, 'Credit cannot exceed 80 characters').optional(),
  suggestedAction: z.string().max(100, 'Suggested action cannot exceed 100 characters').optional(),
});

export const CampaignVisualsSchema = z.object({
  coverImage: z.string().optional(),
  adImage: z.string().optional(),
  adHeadline: z
    .string()
    .min(5, 'Ad headline must be at least 5 characters')
    .max(60, 'Ad headline cannot exceed 60 characters'),
  adDescription: z
    .string()
    .min(10, 'Ad description must be at least 10 characters')
    .max(150, 'Ad description cannot exceed 150 characters'),
  adCTA: z
    .string()
    .min(2, 'Call-to-action text is required')
    .max(25, 'Call-to-action cannot exceed 25 characters'),
});

export const CampaignReachSchema = z.object({
  locations: z.array(z.string()).min(1, 'Select or enter at least one target location'),
  interests: z.array(z.string()).min(1, 'Select at least one audience interest topic'),
  channels: z.array(z.string()).min(1, 'Select at least one distribution channel preference'),
  audienceDescription: z
    .string()
    .min(10, 'Please describe your audience in at least 10 characters')
    .max(300, 'Audience description cannot exceed 300 characters'),
  durationDays: z
    .number()
    .min(7, 'Minimum campaign duration is 7 days')
    .max(60, 'Maximum campaign duration is 60 days'),
});

export const CampaignSubmitSchema = z.object({
  fundingGoal: z
    .number()
    .min(100, 'Minimum amplification funding goal is $100')
    .max(1000000, 'Maximum amplification funding goal is $1,000,000'),
  agreePolicies: z.boolean().refine((val) => val === true, {
    message: 'You must confirm information accuracy and agree to distribution policies.',
  }),
});

export type CampaignBasicsFormData = z.infer<typeof CampaignBasicsSchema>;
export type CampaignSourceFormData = z.infer<typeof CampaignSourceSchema>;
export type CampaignStoryFormData = z.infer<typeof CampaignStorySchema>;
export type CampaignVisualsFormData = z.infer<typeof CampaignVisualsSchema>;
export type CampaignReachFormData = z.infer<typeof CampaignReachSchema>;
export type CampaignSubmitFormData = z.infer<typeof CampaignSubmitSchema>;
