import { z } from 'zod';
import { BACKEND_PUBLIC_STATUSES } from './campaign.types';

export const listCampaignsQuerySchema = z.object({
  category: z.string().optional(),
  searchQuery: z.string().optional(),
  sortBy: z.enum(['featured', 'newest', 'most_funded', 'ending_soon']).optional(),
  status: z
    .string()
    .refine((val) => (BACKEND_PUBLIC_STATUSES as string[]).includes(val), {
      message: 'Status must be an active public status.',
    })
    .optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const campaignIdParamSchema = z.object({
  id: z.string().min(1, 'Campaign ID is required.'),
});

export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
export type CampaignIdParam = z.infer<typeof campaignIdParamSchema>;
