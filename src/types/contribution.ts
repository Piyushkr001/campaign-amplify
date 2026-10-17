export interface ContributionTier {
  id: string;
  amount: number;
  label: string;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  popular?: boolean;
}

export interface Contribution {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  estimatedImpressions: number;
  date: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISTRIBUTING';
}
