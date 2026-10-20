import { apiClient } from './api';
import { Config } from '@/constants/config';
import {
  ContributionQuoteApiDTO,
  ContributionApiDTO,
  SimulatePaymentApiInput,
  SimulatePaymentApiDTO,
  ContributionSummaryApiDTO,
  ContributionDetailApiDTO,
  ContributionReceiptApiDTO,
} from '@/types/contribution-api';
import { useContributionStore } from '@/store/contribution-store';

export const ContributionService = {
  getQuote: async (campaignId: string, amount: number): Promise<ContributionQuoteApiDTO> => {
    if (Config.useApi) {
      const response = await apiClient.post<{ success: boolean; data: ContributionQuoteApiDTO }>(
        `/campaigns/${campaignId}/contributions/quote`,
        { amount }
      );
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    }

    // Local fallback calculation based on CAMPAIGN_POLICY
    const advertisingAllocation = Math.round(amount * (Config.feeStructure.advertisingPercentage / 100));
    const platformFee = Math.round(amount * (Config.feeStructure.platformFeePercentage / 100));
    const processingFee = amount - advertisingAllocation - platformFee;
    const estimatedImpressionsMin = advertisingAllocation * 20;
    const estimatedImpressionsMax = advertisingAllocation * 30;

    return {
      campaignId,
      campaignTitle: 'Campaign',
      amount,
      advertisingAllocation,
      platformFee,
      processingFee,
      estimatedImpressionsMin,
      estimatedImpressionsMax,
      currency: 'USD',
    };
  },

  createContribution: async (campaignId: string, amount: number): Promise<ContributionApiDTO> => {
    if (Config.useApi) {
      const response = await apiClient.post<{ success: boolean; data: ContributionApiDTO }>(
        `/campaigns/${campaignId}/contributions`,
        { amount }
      );
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    }

    // Local mode creation
    const quote = await ContributionService.getQuote(campaignId, amount);
    const local = useContributionStore.getState().createContribution({
      campaignId,
      amount,
      advertisingAllocation: quote.advertisingAllocation,
      platformFee: quote.platformFee,
      processingFee: quote.processingFee,
      estimatedImpressionsMin: quote.estimatedImpressionsMin,
      estimatedImpressionsMax: quote.estimatedImpressionsMax,
    });

    return {
      id: local.id,
      campaignId: local.campaignId,
      amount: local.amount,
      status: 'PENDING',
      createdAt: local.createdAt,
      quote: {
        advertisingAllocation: local.advertisingAllocation,
        platformFee: local.platformFee,
        processingFee: local.processingFee,
        estimatedImpressionsMin: local.estimatedImpressionsMin,
        estimatedImpressionsMax: local.estimatedImpressionsMax,
        currency: 'USD',
      },
    };
  },

  simulatePayment: async (input: SimulatePaymentApiInput): Promise<SimulatePaymentApiDTO> => {
    if (Config.useApi) {
      const response = await apiClient.post<{ success: boolean; data: SimulatePaymentApiDTO }>(
        '/payments/simulate',
        input
      );
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    }

    // Local fallback payment simulation
    const store = useContributionStore.getState();
    const contrib = store.getContributionById(input.contributionId);
    const amount = contrib?.amount || 100;
    const campaignId = contrib?.campaignId || '';

    const payment = store.createPayment(
      input.contributionId,
      campaignId,
      amount,
      input.cardLast4 || '4242'
    );

    if (input.outcome === 'SUCCESS') {
      store.updatePaymentStatus(payment.id, 'SUCCESS');
      store.completeContribution(input.contributionId, payment.reference);
    } else if (input.outcome === 'FAILED') {
      store.updatePaymentStatus(payment.id, 'FAILED', 'Card declined by demo processor');
      store.failContribution(input.contributionId);
    } else {
      store.updatePaymentStatus(payment.id, 'CANCELLED', 'Cancelled by backer');
      store.cancelContribution(input.contributionId);
    }

    return {
      success: input.outcome === 'SUCCESS',
      paymentId: payment.id,
      contributionId: input.contributionId,
      providerReference: payment.reference,
      status: input.outcome,
      amount,
      campaignId,
      campaignStatus: 'FUNDING',
      campaignAmountRaised: 0,
      campaignFundingGoal: 10000,
      campaignBackerCount: 1,
      goalReached: false,
      cardLast4: input.cardLast4 || '4242',
      createdAt: payment.createdAt,
      processedAt: new Date().toISOString(),
    };
  },

  getMyContributions: async (): Promise<ContributionSummaryApiDTO[]> => {
    if (Config.useApi) {
      try {
        const response = await apiClient.get<{ success: boolean; data: ContributionSummaryApiDTO[] }>(
          '/me/contributions'
        );
        if (response.data?.success && Array.isArray(response.data?.data)) {
          return response.data.data;
        }
      } catch (err) {
        if (Config.strictApi) throw err;
        console.warn('[ContributionService] getMyContributions failed, using local store:', err);
      }
    }

    // Local mode mapping
    const local = useContributionStore.getState().contributions;
    return local.map((c) => ({
      id: c.id,
      campaignId: c.campaignId,
      campaignTitle: c.campaignTitle || 'Campaign Contribution',
      amount: c.amount,
      status: c.status,
      createdAt: c.createdAt,
      confirmedAt: c.completedAt,
      receiptAvailable: c.status === 'SUCCESS' || c.status === 'CONFIRMED',
    }));
  },

  getContribution: async (id: string): Promise<ContributionDetailApiDTO | undefined> => {
    if (Config.useApi) {
      try {
        const response = await apiClient.get<{ success: boolean; data: ContributionDetailApiDTO }>(
          `/me/contributions/${id}`
        );
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
      } catch (err) {
        if (Config.strictApi) throw err;
        console.warn(`[ContributionService] getContribution(${id}) failed, using local store:`, err);
      }
    }

    const c = useContributionStore.getState().getContributionById(id);
    if (!c) return undefined;
    const p = useContributionStore.getState().payments.find((pay) => pay.contributionId === id);

    return {
      id: c.id,
      campaignId: c.campaignId,
      campaignTitle: c.campaignTitle || 'Campaign Contribution',
      amount: c.amount,
      status: c.status,
      paymentStatus: p?.status,
      paymentReference: p?.reference,
      cardLast4: p?.cardLast4,
      useOfFunds: {
        advertising: c.advertisingAllocation,
        platformFee: c.platformFee,
        paymentProcessing: c.processingFee,
      },
      impact: {
        advertisingAllocation: c.advertisingAllocation,
        estimatedImpressionsMin: c.estimatedImpressionsMin,
        estimatedImpressionsMax: c.estimatedImpressionsMax,
      },
      createdAt: c.createdAt,
      confirmedAt: c.completedAt,
    };
  },

  getReceipt: async (id: string): Promise<ContributionReceiptApiDTO | undefined> => {
    if (Config.useApi) {
      try {
        const response = await apiClient.get<{ success: boolean; data: ContributionReceiptApiDTO }>(
          `/me/contributions/${id}/receipt`
        );
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
      } catch (err) {
        if (Config.strictApi) throw err;
        console.warn(`[ContributionService] getReceipt(${id}) failed, using local fallback:`, err);
      }
    }

    const c = useContributionStore.getState().getContributionById(id);
    if (!c || (c.status !== 'SUCCESS' && c.status !== 'CONFIRMED')) return undefined;
    const p = useContributionStore.getState().payments.find((pay) => pay.contributionId === id);

    return {
      receiptReference: `RCP-${c.id.slice(-8).toUpperCase()}`,
      contributionId: c.id,
      amount: c.amount,
      currency: 'USD',
      status: 'CONFIRMED',
      campaign: {
        id: c.campaignId,
        title: c.campaignTitle || 'Community Campaign',
        creator: 'Campaign Creator',
        category: 'Advocacy',
      },
      payment: {
        provider: 'DEMO',
        reference: p?.reference || `DEMO-AMP-${c.id.slice(-6)}`,
        status: 'SUCCESS',
        cardLast4: p?.cardLast4 || '4242',
        processedAt: c.completedAt || c.createdAt,
      },
      allocation: {
        advertising: c.advertisingAllocation,
        platformFee: c.platformFee,
        paymentProcessing: c.processingFee,
        estimatedImpressionsMin: c.estimatedImpressionsMin,
        estimatedImpressionsMax: c.estimatedImpressionsMax,
      },
      createdAt: c.createdAt,
      confirmedAt: c.completedAt || c.createdAt,
      disclaimer: 'Demo payment receipt. No real payment processor was used. Contributions directly fund ad creative and distribution amplification.',
    };
  },

  cancelContribution: async (id: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/me/contributions/${id}/cancel`);
      return;
    }
    useContributionStore.getState().cancelContribution(id);
  },
};
