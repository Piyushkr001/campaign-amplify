import { z } from 'zod';

export const reportCampaignIdParamSchema = z.object({
  id: z.string().trim().uuid('Invalid campaign ID format. Expected a valid UUID.'),
});

export type ReportCampaignIdParam = z.infer<typeof reportCampaignIdParamSchema>;
