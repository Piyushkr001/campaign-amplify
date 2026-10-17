import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Campaign, CampaignDraft } from '@/types/campaign';
import { calculateUseOfFunds, estimateReach } from '@/utils/reach';
import { generateId } from '@/utils/id';

export interface MyCampaignsStore {
  campaigns: Campaign[];
  addFromDraft: (draft: CampaignDraft) => Campaign;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  getCampaignById: (id: string) => Campaign | undefined;
}

export const useMyCampaignsStore = create<MyCampaignsStore>()(
  persist(
    (set, get) => ({
      campaigns: [],

      addFromDraft: (draft: CampaignDraft) => {
        const id = generateId('camp');
        const goal = draft.fundingGoal || 2500;
        const { min: estimatedReachMin, max: estimatedReachMax } = estimateReach(goal);
        const useOfFundsBreakdown = calculateUseOfFunds(goal);

        const newCampaign: Campaign = {
          id,
          title: draft.title || 'Untitled Amplification Campaign',
          category: draft.category === 'All' ? 'Environment' : draft.category,
          creator: draft.creatorName || 'Community Campaigner',
          creatorType: 'Community Group',
          summary: draft.summary || '',
          story: `${draft.storyHeadline ? `### ${draft.storyHeadline}\n\n` : ''}${draft.storyIntro ? `${draft.storyIntro}\n\n` : ''}${draft.storyContent || ''}`,
          coverImage:
            draft.coverImage ||
            draft.adImage ||
            'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=800&q=80',
          raised: 0,
          goal,
          estimatedReachMin,
          estimatedReachMax,
          status: 'SUBMITTED_FOR_REVIEW',
          daysRemaining: draft.durationDays || 14,
          featured: false,
          createdAt: new Date().toISOString(),
          backerCount: 0,
          distributionChannels: draft.channels.length > 0 ? draft.channels : ['Meta Ads', 'Google Display'],
          useOfFunds: {
            advertising: 85,
            platformFee: 10,
            paymentProcessing: 5,
          },
          supportingSources: draft.sources.map((s) => ({
            title: s.title,
            url: s.url,
            publisher: s.publisher,
          })),
        };

        set((state) => ({
          campaigns: [newCampaign, ...state.campaigns],
        }));

        return newCampaign;
      },

      addCampaign: (campaign) => {
        set((state) => ({
          campaigns: [campaign, ...state.campaigns],
        }));
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      getCampaignById: (id) => {
        return get().campaigns.find((c) => c.id === id);
      },
    }),
    {
      name: 'campaign-amplify-submitted-campaigns',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
