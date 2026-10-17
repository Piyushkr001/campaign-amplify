import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Campaign, CampaignDraft, CampaignStatusHistoryItem } from '@/types/campaign';
import { calculateUseOfFunds, estimateReach } from '@/utils/reach';
import { generateId } from '@/utils/id';
import { queryClient } from '@/services/query-client';

export interface MyCampaignsStore {
  campaigns: Campaign[];
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;

  addFromDraft: (draft: CampaignDraft) => Campaign;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  getCampaignById: (id: string) => Campaign | undefined;

  // Reviewer & Creator lifecycle actions
  startReview: (id: string, note?: string) => void;
  approveCampaign: (id: string, note?: string) => void;
  requestChanges: (id: string, feedback: string) => void;
  rejectCampaign: (id: string, reason: string) => void;
  moveToFunding: (id: string, note?: string) => void;
  resubmitCampaign: (id: string, note?: string) => void;
}

export const useMyCampaignsStore = create<MyCampaignsStore>()(
  persist(
    (set, get) => ({
      campaigns: [],
      hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated });
      },

      addFromDraft: (draft: CampaignDraft) => {
        const id = generateId('camp');
        const goal = draft.fundingGoal || 2500;
        const { min: estimatedReachMin, max: estimatedReachMax } = estimateReach(goal);
        const useOfFundsBreakdown = calculateUseOfFunds(goal);
        const now = new Date().toISOString();

        const initialHistory: CampaignStatusHistoryItem = {
          id: generateId('hist'),
          toStatus: 'SUBMITTED_FOR_REVIEW',
          note: 'Campaign created and submitted for verification and policy review.',
          actor: 'CREATOR',
          createdAt: now,
        };

        const newCampaign: Campaign = {
          id,
          title: draft.title || 'Untitled Amplification Campaign',
          category: draft.category === 'All' ? 'Environment' : draft.category,
          creator: draft.creatorName || 'Community Campaigner',
          creatorType: 'Community Group',
          summary: draft.summary || '',
          story: draft.storyContent || draft.summary || '',
          storyDetails: {
            headline: draft.storyHeadline,
            intro: draft.storyIntro,
            content: draft.storyContent,
            image: draft.storyImage,
            caption: draft.storyImageCaption,
            credit: draft.storyImageCredit,
          },
          storyHeadline: draft.storyHeadline,
          storyIntro: draft.storyIntro,
          storyContent: draft.storyContent,
          storyImage: draft.storyImage,
          storyImageCaption: draft.storyImageCaption,
          storyImageCredit: draft.storyImageCredit,
          suggestedAction: draft.suggestedAction,
          adImage: draft.adImage,
          adHeadline: draft.adHeadline,
          adDescription: draft.adDescription,
          adCTA: draft.adCTA,
          locations: draft.locations,
          interests: draft.interests,
          channels: draft.channels,
          audienceDescription: draft.audienceDescription,
          durationDays: draft.durationDays || 14,
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
          createdAt: now,
          submittedAt: now,
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
          statusHistory: [initialHistory],
        };

        set((state) => ({
          campaigns: [newCampaign, ...state.campaigns],
        }));

        // Invalidate queries so any components listening for updates see it
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });

        return newCampaign;
      },

      addCampaign: (campaign) => {
        set((state) => ({
          campaigns: [campaign, ...state.campaigns],
        }));
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      },

      getCampaignById: (id) => {
        return get().campaigns.find((c) => c.id === id);
      },

      startReview: (id: string, note?: string) => {
        const now = new Date().toISOString();
        set((state) => {
          return {
            campaigns: state.campaigns.map((c) => {
              if (c.id !== id) return c;
              const historyItem: CampaignStatusHistoryItem = {
                id: generateId('hist'),
                fromStatus: c.status,
                toStatus: 'UNDER_REVIEW',
                note: note || 'Editorial review started by verification team.',
                actor: 'REVIEWER',
                createdAt: now,
              };
              return {
                ...c,
                status: 'UNDER_REVIEW',
                reviewStartedAt: now,
                statusHistory: [...(c.statusHistory || []), historyItem],
              };
            }),
          };
        });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      },

      approveCampaign: (id: string, note?: string) => {
        const now = new Date().toISOString();
        set((state) => {
          return {
            campaigns: state.campaigns.map((c) => {
              if (c.id !== id) return c;
              const historyItem: CampaignStatusHistoryItem = {
                id: generateId('hist'),
                fromStatus: c.status,
                toStatus: 'APPROVED',
                note: note || 'Campaign passed source verification and policy compliance checks.',
                actor: 'REVIEWER',
                createdAt: now,
              };
              return {
                ...c,
                status: 'APPROVED',
                approvedAt: now,
                reviewFeedback: undefined, // Clear feedback on approval
                statusHistory: [...(c.statusHistory || []), historyItem],
              };
            }),
          };
        });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      },

      requestChanges: (id: string, feedback: string) => {
        const now = new Date().toISOString();
        set((state) => {
          return {
            campaigns: state.campaigns.map((c) => {
              if (c.id !== id) return c;
              const historyItem: CampaignStatusHistoryItem = {
                id: generateId('hist'),
                fromStatus: c.status,
                toStatus: 'CHANGES_REQUESTED',
                note: feedback,
                actor: 'REVIEWER',
                createdAt: now,
              };
              return {
                ...c,
                status: 'CHANGES_REQUESTED',
                reviewFeedback: feedback,
                requestedChangesAt: now,
                statusHistory: [...(c.statusHistory || []), historyItem],
              };
            }),
          };
        });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      },

      rejectCampaign: (id: string, reason: string) => {
        const now = new Date().toISOString();
        set((state) => {
          return {
            campaigns: state.campaigns.map((c) => {
              if (c.id !== id) return c;
              const historyItem: CampaignStatusHistoryItem = {
                id: generateId('hist'),
                fromStatus: c.status,
                toStatus: 'REJECTED',
                note: reason,
                actor: 'REVIEWER',
                createdAt: now,
              };
              return {
                ...c,
                status: 'REJECTED',
                rejectionReason: reason,
                rejectedAt: now,
                statusHistory: [...(c.statusHistory || []), historyItem],
              };
            }),
          };
        });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      },

      moveToFunding: (id: string, note?: string) => {
        const now = new Date().toISOString();
        set((state) => {
          return {
            campaigns: state.campaigns.map((c) => {
              if (c.id !== id) return c;
              const historyItem: CampaignStatusHistoryItem = {
                id: generateId('hist'),
                fromStatus: c.status,
                toStatus: 'FUNDING',
                note: note || 'Campaign published and opened for backer funding.',
                actor: 'REVIEWER',
                createdAt: now,
              };
              return {
                ...c,
                status: 'FUNDING',
                fundedAt: now,
                statusHistory: [...(c.statusHistory || []), historyItem],
              };
            }),
          };
        });
        // Invalidate queries so campaign becomes discoverable publicly in Explore and Home!
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      },

      resubmitCampaign: (id: string, note?: string) => {
        const now = new Date().toISOString();
        set((state) => {
          return {
            campaigns: state.campaigns.map((c) => {
              if (c.id !== id) return c;
              const historyItem: CampaignStatusHistoryItem = {
                id: generateId('hist'),
                fromStatus: c.status,
                toStatus: 'SUBMITTED_FOR_REVIEW',
                note: note || 'Campaign updated by creator and resubmitted for review.',
                actor: 'CREATOR',
                createdAt: now,
              };
              return {
                ...c,
                status: 'SUBMITTED_FOR_REVIEW',
                submittedAt: now,
                statusHistory: [...(c.statusHistory || []), historyItem],
              };
            }),
          };
        });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      },
    }),
    {
      name: 'campaign-amplify-submitted-campaigns',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      },
    }
  )
);
