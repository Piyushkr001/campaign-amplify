export const VALID_CAMPAIGN_CATEGORIES = [
  'Environment',
  'Health',
  'Science',
  'Education',
  'Public Policy',
  'Economic Policy',
  'Community',
  'Arts & Culture',
  'Business',
  'Other',
] as const;

export type ValidCampaignCategory = (typeof VALID_CAMPAIGN_CATEGORIES)[number];

export const CAMPAIGN_POLICY = {
  advertisingPercentage: 85,
  platformPercentage: 10,
  processingPercentage: 5,

  impressionsPerDollarMin: 20,
  impressionsPerDollarMax: 30,
} as const;
