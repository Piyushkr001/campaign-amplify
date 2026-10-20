import { z } from 'zod';

export const contributionQuoteSchema = z.object({
  amount: z.coerce
    .number()
    .int('Contribution amount must be an integer.')
    .min(5, 'Minimum contribution amount is $5.')
    .max(50000, 'Maximum contribution amount is $50,000.'),
});

export const createContributionSchema = z.object({
  amount: z.coerce
    .number()
    .int('Contribution amount must be an integer.')
    .min(5, 'Minimum contribution amount is $5.')
    .max(50000, 'Maximum contribution amount is $50,000.'),
});

export const campaignContributionParamSchema = z.object({
  id: z.string().trim().uuid('Invalid campaign ID format. Expected a valid UUID.'),
});

export const contributionIdParamSchema = z.object({
  id: z.string().trim().uuid('Invalid contribution ID format. Expected a valid UUID.'),
});

export type ContributionQuoteInput = z.infer<typeof contributionQuoteSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type CampaignContributionParam = z.infer<typeof campaignContributionParamSchema>;
export type ContributionIdParam = z.infer<typeof contributionIdParamSchema>;
