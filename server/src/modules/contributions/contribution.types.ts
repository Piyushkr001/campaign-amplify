export interface ContributionQuoteDTO {
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

export interface ContributionDTO {
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

export interface ContributionSummaryDTO {
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

export interface ContributionDetailDTO {
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

export interface ContributionReceiptDTO {
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
