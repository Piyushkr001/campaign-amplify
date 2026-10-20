import { z } from 'zod';

export const reviewQueueQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const reviewCampaignIdParamSchema = z.object({
  id: z.string().trim().uuid('Invalid campaign ID format. Expected a valid UUID.'),
});

export const requestChangesSchema = z.object({
  feedback: z
    .string()
    .trim()
    .min(5, 'Reviewer feedback must be at least 5 characters.')
    .max(2000, 'Feedback cannot exceed 2,000 characters.'),
});

export const rejectCampaignSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Rejection reason must be at least 5 characters.')
    .max(1000, 'Rejection reason cannot exceed 1,000 characters.'),
});

export const approveCampaignSchema = z
  .object({
    note: z.string().trim().max(500).optional(),
  })
  .optional();

export const startFundingSchema = z
  .object({
    note: z.string().trim().max(500).optional(),
  })
  .optional();

export type ReviewQueueQuery = z.infer<typeof reviewQueueQuerySchema>;
export type ReviewCampaignIdParam = z.infer<typeof reviewCampaignIdParamSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type RejectCampaignInput = z.infer<typeof rejectCampaignSchema>;
export type ApproveCampaignInput = z.infer<typeof approveCampaignSchema>;
export type StartFundingInput = z.infer<typeof startFundingSchema>;
