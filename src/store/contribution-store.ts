import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Contribution,
  ContributionStatus,
  Payment,
  PaymentStatus,
} from '@/types/contribution';
import { generateId } from '@/utils/id';

export interface CreateContributionParams {
  campaignId: string;
  campaignTitle?: string;
  amount: number;
  platformFee: number;
  processingFee: number;
  advertisingAllocation: number;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
}

export interface ContributionStore {
  contributions: Contribution[];
  payments: Payment[];
  currentContribution: Contribution | null;
  currentPayment: Payment | null;

  // Actions
  createContribution: (params: CreateContributionParams) => Contribution;
  setCurrentContribution: (contribution: Contribution | null) => void;
  createPayment: (
    contributionId: string,
    campaignId: string,
    amount: number,
    cardLast4?: string
  ) => Payment;
  updatePaymentStatus: (
    paymentId: string,
    status: PaymentStatus,
    errorMessage?: string
  ) => void;
  completeContribution: (contributionId: string, paymentReference: string) => void;
  failContribution: (contributionId: string) => void;
  cancelContribution: (contributionId: string) => void;
  getContributionById: (id: string) => Contribution | undefined;
  getPaymentById: (id: string) => Payment | undefined;
  getCampaignContributions: (campaignId: string) => Contribution[];
  resetCurrentContribution: () => void;
}

export const useContributionStore = create<ContributionStore>()(
  persist(
    (set, get) => ({
      contributions: [],
      payments: [],
      currentContribution: null,
      currentPayment: null,

      createContribution: (params: CreateContributionParams) => {
        const id = generateId('cntr');
        const now = new Date().toISOString();

        const newContribution: Contribution = {
          id,
          campaignId: params.campaignId,
          campaignTitle: params.campaignTitle,
          amount: params.amount,
          platformFee: params.platformFee,
          processingFee: params.processingFee,
          advertisingAllocation: params.advertisingAllocation,
          estimatedImpressionsMin: params.estimatedImpressionsMin,
          estimatedImpressionsMax: params.estimatedImpressionsMax,
          status: 'PENDING',
          createdAt: now,
        };

        set((state) => ({
          contributions: [newContribution, ...state.contributions],
          currentContribution: newContribution,
        }));

        return newContribution;
      },

      setCurrentContribution: (contribution: Contribution | null) => {
        set({ currentContribution: contribution });
      },

      createPayment: (
        contributionId: string,
        campaignId: string,
        amount: number,
        cardLast4 = '4242'
      ) => {
        const id = generateId('pay');
        const reference = `DEMO-AMP-${Math.floor(100000 + Math.random() * 900000)}`;
        const now = new Date().toISOString();

        const newPayment: Payment = {
          id,
          contributionId,
          campaignId,
          provider: 'SIMULATED',
          reference,
          status: 'PENDING',
          amount,
          createdAt: now,
          cardLast4,
        };

        set((state) => ({
          payments: [newPayment, ...state.payments],
          currentPayment: newPayment,
        }));

        return newPayment;
      },

      updatePaymentStatus: (paymentId, status, errorMessage) => {
        const now = new Date().toISOString();
        set((state) => {
          const updatedPayments = state.payments.map((p) => {
            if (p.id === paymentId) {
              return {
                ...p,
                status,
                completedAt: status === 'SUCCESS' || status === 'FAILED' || status === 'CANCELLED' ? now : p.completedAt,
                errorMessage,
              };
            }
            return p;
          });

          const currentPayment =
            state.currentPayment?.id === paymentId
              ? {
                  ...state.currentPayment,
                  status,
                  completedAt: status === 'SUCCESS' || status === 'FAILED' || status === 'CANCELLED' ? now : state.currentPayment.completedAt,
                  errorMessage,
                }
              : state.currentPayment;

          return {
            payments: updatedPayments,
            currentPayment,
          };
        });
      },

      completeContribution: (contributionId, paymentReference) => {
        const now = new Date().toISOString();
        set((state) => {
          const updatedContributions = state.contributions.map((c) => {
            if (c.id === contributionId) {
              return {
                ...c,
                status: 'SUCCESS' as ContributionStatus,
                completedAt: now,
                paymentReference,
              };
            }
            return c;
          });

          const currentContribution =
            state.currentContribution?.id === contributionId
              ? {
                  ...state.currentContribution,
                  status: 'SUCCESS' as ContributionStatus,
                  completedAt: now,
                  paymentReference,
                }
              : state.currentContribution;

          return {
            contributions: updatedContributions,
            currentContribution,
          };
        });
      },

      failContribution: (contributionId) => {
        const now = new Date().toISOString();
        set((state) => ({
          contributions: state.contributions.map((c) =>
            c.id === contributionId
              ? { ...c, status: 'FAILED' as ContributionStatus, completedAt: now }
              : c
          ),
          currentContribution:
            state.currentContribution?.id === contributionId
              ? { ...state.currentContribution, status: 'FAILED' as ContributionStatus, completedAt: now }
              : state.currentContribution,
        }));
      },

      cancelContribution: (contributionId) => {
        const now = new Date().toISOString();
        set((state) => ({
          contributions: state.contributions.map((c) =>
            c.id === contributionId
              ? { ...c, status: 'CANCELLED' as ContributionStatus, completedAt: now }
              : c
          ),
          currentContribution:
            state.currentContribution?.id === contributionId
              ? { ...state.currentContribution, status: 'CANCELLED' as ContributionStatus, completedAt: now }
              : state.currentContribution,
        }));
      },

      getContributionById: (id) => {
        return get().contributions.find((c) => c.id === id);
      },

      getPaymentById: (id) => {
        return get().payments.find((p) => p.id === id);
      },

      getCampaignContributions: (campaignId) => {
        return get().contributions.filter((c) => c.campaignId === campaignId);
      },

      resetCurrentContribution: () => {
        set({ currentContribution: null, currentPayment: null });
      },
    }),
    {
      name: 'campaign-amplify-contributions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        contributions: state.contributions,
        payments: state.payments,
      }),
    }
  )
);
