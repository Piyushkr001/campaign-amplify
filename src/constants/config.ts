export const Config = {
  appName: 'Amplify',
  fullName: 'Campaign Amplification Platform',
  tagline: 'Help important messages travel further.',
  supportEmail: 'support@campaignamplify.org',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.campaignamplify.org/v1',
  currency: {
    symbol: '$',
    code: 'USD',
  },
  reachPerDollarEstimate: {
    min: 20, // 20 impressions per $1
    max: 30, // 30 impressions per $1
  },
  disclaimer: {
    amplification:
      'Contributions fund campaign amplification and advertising distribution. They are not direct donations to the organization or cause.',
    reach:
      'Illustrative estimate only. Actual reach depends on advertising costs, targeting, platform inventory, and campaign performance.',
  },
} as const;
