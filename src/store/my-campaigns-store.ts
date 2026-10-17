import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Campaign,
  CampaignDraft,
  CampaignStatus,
  CampaignStatusHistoryItem,
} from '@/types/campaign';
import { calculateUseOfFunds, estimateReach } from '@/utils/reach';
import { generateId } from '@/utils/id';
import { queryClient } from '@/services/query-client';
import { campaignKeys } from '@/constants/query-keys';
import { isValidTransition } from '@/constants/campaign-status';

export interface TransitionContext {
  actor: 'CREATOR' | 'REVIEWER' | 'SYSTEM';
  note?: string;
}

export interface TransitionResult {
  success: boolean;
  error?: string;
}

export interface MyCampaignsStore {
  campaigns: Campaign[];
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;

  addFromDraft: (draft: CampaignDraft) => Campaign;
  updateFromDraft: (id: string, draft: CampaignDraft) => Campaign | undefined;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  getCampaignById: (id: string) => Campaign | undefined;

  // Centralized state-machine transition method
  transitionCampaign: (
    campaignId: string,
    nextStatus: CampaignStatus,
    context: TransitionContext
  ) => TransitionResult;

  // Reviewer & Creator lifecycle actions
  startReview: (id: string, note?: string) => TransitionResult;
  approveCampaign: (id: string, note?: string) => TransitionResult;
  requestChanges: (id: string, feedback: string) => TransitionResult;
  rejectCampaign: (id: string, reason: string) => TransitionResult;
  moveToFunding: (id: string, note?: string) => TransitionResult;
  resubmitCampaign: (id: string, note?: string) => TransitionResult;

  // Demo progression actions
  advanceToDistributionPrep: (id: string, note?: string) => TransitionResult;
  launchLivePromotion: (id: string, note?: string) => TransitionResult;
  completeCampaign: (id: string, note?: string) => TransitionResult;
  endFundingPeriod: (id: string, note?: string) => TransitionResult;
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

        // 1. Initial Draft Created history event
        const draftHistory: CampaignStatusHistoryItem = {
          id: generateId('hist'),
          toStatus: 'DRAFT',
          note: 'Campaign draft initialized by creator.',
          actor: 'CREATOR',
          createdAt: now,
        };

        // 2. Submitted for Review history event
        const submittedHistory: CampaignStatusHistoryItem = {
          id: generateId('hist'),
          fromStatus: 'DRAFT',
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
          distributionChannels:
            draft.channels.length > 0 ? draft.channels : ['Meta', 'Google Display'],
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
          statusHistory: [draftHistory, submittedHistory],
        };

        set((state) => ({
          campaigns: [newCampaign, ...state.campaigns],
        }));

        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        return newCampaign;
      },

      /**
       * Updates an existing campaign record with changes made during draft revision editing.
       * Prevents duplicate campaigns when addressing CHANGES_REQUESTED.
       */
      updateFromDraft: (id: string, draft: CampaignDraft) => {
        const campaign = get().campaigns.find((c) => c.id === id);
        if (!campaign) {
          console.warn(`[MyCampaignsStore] Cannot update campaign: ${id} not found.`);
          return undefined;
        }

        const goal = draft.fundingGoal || campaign.goal;
        const { min: estimatedReachMin, max: estimatedReachMax } = estimateReach(goal);
        const useOfFundsBreakdown = calculateUseOfFunds(goal);

        const updatedCampaign: Campaign = {
          ...campaign,
          title: draft.title || campaign.title,
          category: draft.category === 'All' ? campaign.category : draft.category,
          creator: draft.creatorName || campaign.creator,
          summary: draft.summary || campaign.summary,
          story: draft.storyContent || campaign.story,
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
          adImage: draft.adImage || campaign.adImage,
          adHeadline: draft.adHeadline || campaign.adHeadline,
          adDescription: draft.adDescription || campaign.adDescription,
          adCTA: draft.adCTA || campaign.adCTA,
          locations: draft.locations || campaign.locations,
          interests: draft.interests || campaign.interests,
          channels: draft.channels || campaign.channels,
          audienceDescription: draft.audienceDescription || campaign.audienceDescription,
          durationDays: draft.durationDays || campaign.durationDays,
          coverImage: draft.coverImage || campaign.coverImage,
          goal,
          estimatedReachMin,
          estimatedReachMax,
          distributionChannels:
            draft.channels && draft.channels.length > 0
              ? draft.channels
              : campaign.distributionChannels,
          supportingSources: (draft.sources || []).map((s) => ({
            title: s.title,
            url: s.url,
            publisher: s.publisher,
          })),
        };

        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? updatedCampaign : c)),
        }));

        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });

        return updatedCampaign;
      },

      addCampaign: (campaign) => {
        set((state) => ({
          campaigns: [campaign, ...state.campaigns],
        }));
        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      },

      getCampaignById: (id) => {
        return get().campaigns.find((c) => c.id === id);
      },

      /**
       * Primary state-machine transition executor.
       * Strictly validates the requested transition against ALLOWED_TRANSITIONS,
       * appends an audit history entry, sets relevant timestamps, and invalidates queries.
       */
      transitionCampaign: (campaignId, nextStatus, context) => {
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        if (!campaign) {
          const errMsg = `[CampaignLifecycle] Campaign ${campaignId} not found.`;
          console.error(errMsg);
          return { success: false, error: errMsg };
        }

        const currentStatus = campaign.status;

        // Validate transition
        if (!isValidTransition(currentStatus, nextStatus)) {
          const errMsg = `[CampaignLifecycle] Invalid transition: cannot transition campaign ${campaignId} from ${currentStatus} to ${nextStatus}.`;
          console.warn(errMsg);
          return { success: false, error: errMsg };
        }

        const now = new Date().toISOString();
        const historyItem: CampaignStatusHistoryItem = {
          id: generateId('hist'),
          fromStatus: currentStatus,
          toStatus: nextStatus,
          note: context.note,
          actor: context.actor,
          createdAt: now,
        };

        // Compute updated fields based on the destination status
        const timestampUpdates: Partial<Campaign> = {};
        if (nextStatus === 'SUBMITTED_FOR_REVIEW') {
          timestampUpdates.submittedAt = now;
        } else if (nextStatus === 'UNDER_REVIEW') {
          timestampUpdates.reviewStartedAt = now;
        } else if (nextStatus === 'APPROVED') {
          timestampUpdates.approvedAt = now;
          timestampUpdates.reviewFeedback = undefined; // clear revision feedback on approval
        } else if (nextStatus === 'CHANGES_REQUESTED') {
          timestampUpdates.requestedChangesAt = now;
          timestampUpdates.reviewFeedback = context.note;
        } else if (nextStatus === 'REJECTED') {
          timestampUpdates.rejectedAt = now;
          timestampUpdates.rejectionReason = context.note;
        } else if (nextStatus === 'FUNDING') {
          timestampUpdates.fundedAt = now;
        } else if (nextStatus === 'COMPLETED') {
          timestampUpdates.status = 'COMPLETED';
        }

        set((state) => ({
          campaigns: state.campaigns.map((c) => {
            if (c.id !== campaignId) return c;
            return {
              ...c,
              status: nextStatus,
              ...timestampUpdates,
              statusHistory: [...(c.statusHistory || []), historyItem],
            };
          }),
        }));

        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });

        return { success: true };
      },

      startReview: (id, note) => {
        return get().transitionCampaign(id, 'UNDER_REVIEW', {
          actor: 'REVIEWER',
          note: note || 'Editorial review started by verification team.',
        });
      },

      approveCampaign: (id, note) => {
        return get().transitionCampaign(id, 'APPROVED', {
          actor: 'REVIEWER',
          note: note || 'Campaign passed source verification and policy compliance checks.',
        });
      },

      requestChanges: (id, feedback) => {
        return get().transitionCampaign(id, 'CHANGES_REQUESTED', {
          actor: 'REVIEWER',
          note: feedback,
        });
      },

      rejectCampaign: (id, reason) => {
        return get().transitionCampaign(id, 'REJECTED', {
          actor: 'REVIEWER',
          note: reason,
        });
      },

      moveToFunding: (id, note) => {
        return get().transitionCampaign(id, 'FUNDING', {
          actor: 'REVIEWER',
          note: note || 'Campaign published and opened for community backing.',
        });
      },

      resubmitCampaign: (id, note) => {
        return get().transitionCampaign(id, 'SUBMITTED_FOR_REVIEW', {
          actor: 'CREATOR',
          note: note || 'Campaign updated by creator and resubmitted for review.',
        });
      },

      advanceToDistributionPrep: (id, note) => {
        return get().transitionCampaign(id, 'DISTRIBUTION_PREPARATION', {
          actor: 'REVIEWER',
          note: note || 'Funding completed. Distribution preparation and channel setup initiated.',
        });
      },

      launchLivePromotion: (id, note) => {
        return get().transitionCampaign(id, 'PROMOTING', {
          actor: 'REVIEWER',
          note: note || 'Advertising campaigns deployed to live digital channels.',
        });
      },

      completeCampaign: (id, note) => {
        return get().transitionCampaign(id, 'COMPLETED', {
          actor: 'REVIEWER',
          note: note || 'Distribution cycle concluded and final impact metrics generated.',
        });
      },

      endFundingPeriod: (id, note) => {
        return get().transitionCampaign(id, 'FUNDING_ENDED', {
          actor: 'REVIEWER',
          note: note || 'Funding period concluded by platform review.',
        });
      },
    }),
    {
      name: 'campaign-amplify-submitted-campaigns',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      },
    }
  )
);
