export type PaymentOutcome = 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface PaymentSimulateInput {
  contributionId: string;
  outcome: PaymentOutcome;
  cardLast4?: string;
}

export interface PaymentResultDTO {
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
