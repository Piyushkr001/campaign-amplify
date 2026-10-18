import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CampaignStatus } from '@/types/campaign';
import { queryClient } from '@/services/query-client';
import { campaignKeys } from '@/constants/query-keys';

export interface CampaignRuntimeOverride {
  campaignId: string;
  statusOverride?: CampaignStatus;
  fundingGoalReachedAt?: string;
  fundingEndedAt?: string;
  distributionPreparationAt?: string;
  promotionStartedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface CampaignRuntimeStore {
  overrides: Record<string, CampaignRuntimeOverride>;
  setOverride: (campaignId: string, override: Partial<CampaignRuntimeOverride>) => void;
  getOverride: (campaignId: string) => CampaignRuntimeOverride | undefined;
  clearOverride: (campaignId: string) => void;
  resetAllOverrides: () => void;
}

export const useCampaignRuntimeStore = create<CampaignRuntimeStore>()(
  persist(
    (set, get) => ({
      overrides: {},

      setOverride: (campaignId: string, override: Partial<CampaignRuntimeOverride>) => {
        const now = new Date().toISOString();
        set((state) => {
          const existing = state.overrides[campaignId] || {
            campaignId,
            updatedAt: now,
          };

          return {
            overrides: {
              ...state.overrides,
              [campaignId]: {
                ...existing,
                ...override,
                campaignId,
                updatedAt: now,
              },
            },
          };
        });

        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      },

      getOverride: (campaignId: string) => {
        return get().overrides[campaignId];
      },

      clearOverride: (campaignId: string) => {
        set((state) => {
          const next = { ...state.overrides };
          delete next[campaignId];
          return { overrides: next };
        });

        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      },

      resetAllOverrides: () => {
        set({ overrides: {} });
        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      },
    }),
    {
      name: 'campaign-amplify-runtime-overrides',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      },
    }
  )
);
