import { z } from 'zod';

export const creatorCampaignsQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const creatorCampaignIdParamSchema = z.object({
  id: z.string().trim().uuid('Invalid campaign ID format. Expected a valid UUID.'),
});

export type CreatorCampaignsQuery = z.infer<typeof creatorCampaignsQuerySchema>;
export type CreatorCampaignIdParam = z.infer<typeof creatorCampaignIdParamSchema>;
