export interface ContributionQuoteApiDTO {
  campaignId: string;
  campaignTitle: string;
  amount: number;
  advertisingAllocation: number;
  platformFee: number;
  processingFee: number;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  currency: string;
}

export interface ContributionApiDTO {
  id: string;
  campaignId: string;
  userId?: string | null;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
  createdAt: string;
  confirmedAt?: string | null;
  quote?: {
    advertisingAllocation: number;
    platformFee: number;
    processingFee: number;
    estimatedImpressionsMin: number;
    estimatedImpressionsMax: number;
    currency: string;
  };
}

export interface ContributionSummaryApiDTO {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignCoverImage?: string;
  amount: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  confirmedAt?: string | null;
  receiptAvailable: boolean;
}

export interface ContributionDetailApiDTO {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignCoverImage?: string;
  creatorName?: string;
  amount: number;
  status: string;
  paymentStatus?: string;
  paymentReference?: string;
  cardLast4?: string;
  useOfFunds: {
    advertising: number;
    platformFee: number;
    paymentProcessing: number;
  };
  impact: {
    advertisingAllocation: number;
    estimatedImpressionsMin: number;
    estimatedImpressionsMax: number;
  };
  createdAt: string;
  confirmedAt?: string | null;
}

export interface ContributionReceiptApiDTO {
  receiptReference: string;
  contributionId: string;
  amount: number;
  currency: string;
  status: string;
  campaign: {
    id: string;
    title: string;
    creator: string;
    category: string;
    coverImage?: string;
  };
  payment: {
    provider: string;
    reference: string;
    status: string;
    cardLast4?: string;
    processedAt?: string;
  };
  allocation: {
    advertising: number;
    platformFee: number;
    paymentProcessing: number;
    estimatedImpressionsMin: number;
    estimatedImpressionsMax: number;
  };
  createdAt: string;
  confirmedAt: string;
  disclaimer: string;
}

export interface SimulatePaymentApiInput {
  contributionId: string;
  outcome: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  cardLast4?: string;
}

export interface SimulatePaymentApiDTO {
  success: boolean;
  paymentId: string;
  contributionId: string;
  providerReference: string;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  campaignId: string;
  campaignStatus: string;
  campaignAmountRaised: number;
  campaignFundingGoal: number;
  campaignBackerCount: number;
  goalReached: boolean;
  cardLast4?: string;
  message?: string;
  createdAt: string;
  processedAt?: string;
}
