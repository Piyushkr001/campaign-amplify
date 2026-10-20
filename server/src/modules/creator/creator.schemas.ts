import { z } from 'zod';
import { BackendCampaignStatus } from '../campaigns/campaign.types';

const VALID_STATUSES: BackendCampaignStatus[] = [
  'DRAFT',
  'SUBMITTED_FOR_REVIEW',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'FUNDING',
  'FUNDING_GOAL_REACHED',
  'FUNDING_ENDED',
  'DISTRIBUTION_PREPARATION',
  'PROMOTING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'REFUND_PENDING',
  'FAILED',
];

export const creatorCampaignsQuerySchema = z.object({
  status: z
    .string()
    .trim()
    .refine((val) => val === 'ALL' || (VALID_STATUSES as string[]).includes(val), {
      message: 'Status must be a valid campaign status or ALL.',
    })
    .optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export const creatorCampaignIdParamSchema = z.object({
  id: z.string().trim().uuid('Invalid campaign ID format. Expected a valid UUID.'),
});

export type CreatorCampaignsQuery = z.infer<typeof creatorCampaignsQuerySchema>;
export type CreatorCampaignIdParam = z.infer<typeof creatorCampaignIdParamSchema>;
