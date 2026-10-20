export interface ContributionTier {
  id: string;
  amount: number;
  label: string;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  popular?: boolean;
}

export type ContributionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface Contribution {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  amount: number;
  platformFee: number;
  processingFee: number;
  advertisingAllocation: number;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  status: ContributionStatus;
  createdAt: string;
  completedAt?: string;
  paymentReference?: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface Payment {
  id: string;
  contributionId: string;
  campaignId: string;
  provider: 'SIMULATED';
  reference: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
  completedAt?: string;
  cardLast4?: string;
  errorMessage?: string;
}
