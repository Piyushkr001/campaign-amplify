export const Config = {
  appName: 'Amplify',
  fullName: 'Campaign Amplification Platform',
  tagline: 'Help important messages travel further.',
  supportEmail: 'support@campaignamplify.org',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
  useApi: process.env.EXPO_PUBLIC_USE_API === 'true',
  currency: {
    symbol: '$',
    code: 'USD',
  },
  reachPerDollarEstimate: {
    min: 20, // 20 impressions per $1 of advertising budget
    max: 30, // 30 impressions per $1 of advertising budget
  },
  feeStructure: {
    advertisingPercentage: 85,
    platformFeePercentage: 10,
    paymentProcessingPercentage: 5,
  },
  disclaimer: {
    amplification:
      'Contributions fund campaign amplification and advertising distribution. They are not direct donations to the organization or cause.',
    reach:
      'Audience size and final delivery depend on advertising costs, inventory, targeting, and campaign performance.',
    feeExplanation:
      'Contributions support campaign amplification, including advertising distribution and applicable platform/payment processing costs.',
    channelsPreference:
      'Final distribution settings may be adjusted during campaign review.',
  },
} as const;
