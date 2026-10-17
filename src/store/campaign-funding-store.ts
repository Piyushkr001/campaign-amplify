import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CampaignFundingAdjustment {
  raisedAdjustment: number;
  backerCountAdjustment: number;
}

export interface CampaignFundingStore {
  adjustments: Record<string, CampaignFundingAdjustment>;
  addFunding: (campaignId: string, amount: number) => void;
  getFundingAdjustment: (campaignId: string) => CampaignFundingAdjustment;
  resetAdjustments: () => void;
}

export const useCampaignFundingStore = create<CampaignFundingStore>()(
  persist(
    (set, get) => ({
      adjustments: {},

      addFunding: (campaignId: string, amount: number) => {
        set((state) => {
          const current = state.adjustments[campaignId] || {
            raisedAdjustment: 0,
            backerCountAdjustment: 0,
          };

          return {
            adjustments: {
              ...state.adjustments,
              [campaignId]: {
                raisedAdjustment: current.raisedAdjustment + amount,
                backerCountAdjustment: current.backerCountAdjustment + 1,
              },
            },
          };
        });
      },

      getFundingAdjustment: (campaignId: string) => {
        return (
          get().adjustments[campaignId] || {
            raisedAdjustment: 0,
            backerCountAdjustment: 0,
          }
        );
      },

      resetAdjustments: () => {
        set({ adjustments: {} });
      },
    }),
    {
      name: 'campaign-amplify-funding-adjustments',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
