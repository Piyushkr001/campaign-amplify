import { apiClient } from './api';
import { Config } from '@/constants/config';
import { Campaign } from '@/types/campaign';
import {
  CampaignListApiDTO,
  CampaignDetailApiDTO,
  ReviewerCampaignListApiDTO,
  ReviewerCampaignDetailApiDTO,
} from '@/types/campaign-api';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { getEffectiveCampaign } from '@/utils/effective-campaign';
import { queryClient } from './query-client';
import { campaignKeys, reviewKeys, activityKeys, reportKeys } from '@/constants/query-keys';

function mapReviewerQueueDtoToCampaign(dto: ReviewerCampaignListApiDTO): Campaign {
  const estimatedReachMin = dto.estimatedReachMin ?? Math.round((dto.fundingGoal || 0) * 0.85 * 20);
  const estimatedReachMax = dto.estimatedReachMax ?? Math.round((dto.fundingGoal || 0) * 0.85 * 30);
  
  // Real count of sources from backend DTO
  const sources = Array.from({ length: dto.sourcesCount || 0 }, (_, i) => ({
    title: `Supporting Source ${i + 1}`,
    url: '',
    publisher: 'Verified Source',
  }));

  return {
    id: dto.id,
    title: dto.title,
    category: dto.category as any,
    creator: dto.creatorName || dto.creator || 'Community Campaigner',
    creatorType: (dto.creatorType as any) || 'Community Campaigner',
    creatorAvatar: dto.creatorAvatar,
    summary: dto.summary,
    story: '',
    durationDays: 14,
    coverImage: dto.coverImage || dto.coverImageUrl || '',
    raised: 0,
    goal: dto.fundingGoal ?? 0,
    estimatedReachMin,
    estimatedReachMax,
    status: dto.status,
    featured: false,
    createdAt: dto.createdAt || dto.updatedAt,
    submittedAt: dto.submittedAt,
    reviewStartedAt: dto.reviewStartedAt,
    requestedChangesAt: dto.requestedChangesAt,
    approvedAt: dto.approvedAt,
    distributionChannels: [],
    daysRemaining: 14,
    backerCount: 0,
    useOfFunds: {
      advertising: Config.feeStructure.advertisingPercentage,
      platformFee: Config.feeStructure.platformFeePercentage,
      paymentProcessing: Config.feeStructure.paymentProcessingPercentage,
    },
    supportingSources: sources,
    reviewFeedback: dto.latestReviewFeedback || dto.lastReviewFeedback,
  };
}

function mapApiDtoToCampaign(dto: CampaignDetailApiDTO | CampaignListApiDTO): Campaign {
  const detail = dto as CampaignDetailApiDTO;
  return {
    id: dto.id,
    title: dto.title,
    category: dto.category as any,
    creator: dto.creator,
    creatorType: (dto.creatorType as any) || 'Community Campaigner',
    creatorAvatar: dto.creatorAvatar,
    summary: dto.summary,
    story: detail.story || detail.storyContent || '',
    storyHeadline: detail.storyHeadline,
    storyIntro: detail.storyIntro,
    storyContent: detail.storyContent,
    storyImage: detail.storyImage || detail.storyImageUrl,
    storyImageCaption: detail.storyImageCaption,
    storyImageCredit: detail.storyImageCredit,
    suggestedAction: detail.suggestedAction,
    adImage: detail.adImage,
    adHeadline: detail.adHeadline,
    adDescription: detail.adDescription,
    adCTA: detail.adCTA,
    locations: detail.locations,
    interests: detail.interests,
    channels: detail.channels,
    audienceDescription: detail.audienceDescription,
    durationDays: detail.durationDays || dto.daysRemaining || 14,
    coverImage: dto.coverImage || dto.coverImageUrl || '',
    raised: dto.raised ?? dto.amountRaised ?? 0,
    goal: dto.fundingGoal ?? 0,
    estimatedReachMin: dto.estimatedReachMin ?? dto.estimatedImpressionsMin ?? 0,
    estimatedReachMax: dto.estimatedReachMax ?? dto.estimatedImpressionsMax ?? 0,
    status: dto.status,
    daysRemaining: dto.daysRemaining,
    featured: Boolean(dto.featured),
    createdAt: dto.createdAt,
    submittedAt: detail.submittedAt,
    reviewStartedAt: detail.reviewStartedAt,
    requestedChangesAt: detail.requestedChangesAt,
    approvedAt: detail.approvedAt,
    fundingStartedAt: detail.fundingStartedAt,
    fundedAt: detail.fundingStartedAt || (detail as any).fundedAt,
    fundingGoalReachedAt: detail.fundingGoalReachedAt,
    fundingEndedAt: detail.fundingEndedAt,
    distributionPreparationAt: detail.distributionPreparationAt,
    promotionStartedAt: detail.promotionStartedAt,
    completedAt: detail.completedAt,
    rejectedAt: detail.rejectedAt,
    cancelledAt: detail.cancelledAt,
    failedAt: detail.failedAt,
    backerCount: dto.backerCount,
    distributionChannels: dto.distributionChannels || [],
    draftStep: (dto as any).draftStep ?? (detail as any).draftStep ?? 1,
    useOfFunds: detail.useOfFunds || {
      advertising: Config.feeStructure.advertisingPercentage,
      platformFee: Config.feeStructure.platformFeePercentage,
      paymentProcessing: Config.feeStructure.paymentProcessingPercentage,
    },
    supportingSources: (detail.supportingSources || []).map((s) => ({
      title: s.title,
      url: s.url,
      publisher: s.publisher,
    })),
    reviewFeedback: detail.reviewFeedback || (dto as any).latestReviewFeedback,
    rejectionReason: detail.rejectionReason,
    statusHistory: (detail.statusHistory || []).map((h) => ({
      id: h.id,
      fromStatus: (h.fromStatus as any) || undefined,
      toStatus: h.toStatus,
      actor: h.actorType || h.actor || 'SYSTEM',
      note: h.note || undefined,
      createdAt: h.createdAt,
    })),
  };
}

export const ReviewerService = {
  getReviewQueue: async (filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<Campaign[]> => {
    if (Config.useApi) {
      try {
        const response = await apiClient.get<{ success: boolean; data: ReviewerCampaignListApiDTO[] }>(
          '/review/campaigns',
          { params: filters }
        );
        if (response.data?.success && Array.isArray(response.data?.data)) {
          return response.data.data.map(mapReviewerQueueDtoToCampaign);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (Config.strictApi || status === 401 || status === 403) {
          throw err;
        }
        console.warn('[ReviewerService] Failed to load /review/campaigns, using local fallback:', err);
      }
    }

    // Local mode fallback
    const all = useMyCampaignsStore.getState().campaigns.map(getEffectiveCampaign);
    return all.filter(
      (c) =>
        c.status === 'SUBMITTED_FOR_REVIEW' ||
        c.status === 'UNDER_REVIEW' ||
        c.status === 'CHANGES_REQUESTED' ||
        c.status === 'APPROVED'
    );
  },

  getReviewCampaign: async (id: string): Promise<Campaign | undefined> => {
    if (Config.useApi) {
      try {
        const response = await apiClient.get<{ success: boolean; data: ReviewerCampaignDetailApiDTO }>(
          `/review/campaigns/${id}`
        );
        if (response.data?.success && response.data?.data) {
          return mapApiDtoToCampaign(response.data.data);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (Config.strictApi || status === 401 || status === 403) {
          throw err;
        }
        console.warn(`[ReviewerService] Failed to load /review/campaigns/${id}, using local fallback:`, err);
      }
    }

    const localCamp = useMyCampaignsStore.getState().getCampaignById(id);
    return localCamp ? getEffectiveCampaign(localCamp) : undefined;
  },

  startReview: async (id: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/review/campaigns/${id}/start`);
    } else {
      useMyCampaignsStore.getState().startReview(id, 'Reviewer assigned and began factual verification.');
    }
    // Invalidate reviewer, creator, and public queries
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
  },

  requestChanges: async (id: string, feedback: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/review/campaigns/${id}/request-changes`, { feedback });
    } else {
      useMyCampaignsStore.getState().requestChanges(id, feedback);
    }
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
  },

  approve: async (id: string, note?: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/review/campaigns/${id}/approve`, { note });
    } else {
      useMyCampaignsStore.getState().approveCampaign(id, note || 'Passed source verification and policy compliance checks.');
    }
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
  },

  reject: async (id: string, reason: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/review/campaigns/${id}/reject`, { reason });
    } else {
      useMyCampaignsStore.getState().rejectCampaign(id, reason);
    }
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
  },

  startFunding: async (id: string, note?: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/review/campaigns/${id}/start-funding`, { note });
    } else {
      useMyCampaignsStore.getState().moveToFunding(id, note || 'Published and opened for community backing.');
    }
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.public.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
  },

  endFunding: async (id: string, note?: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/campaigns/${id}/end-funding`, { note });
    } else {
      useMyCampaignsStore.getState().endFundingPeriod(id);
    }
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.public.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
  },

  prepareDistribution: async (id: string, note?: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/campaigns/${id}/prepare-distribution`, { note });
    } else {
      useMyCampaignsStore.getState().advanceToDistributionPrep(id);
    }
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.public.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
  },

  startPromotion: async (id: string, note?: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/campaigns/${id}/start-promotion`, { note });
    } else {
      useMyCampaignsStore.getState().launchLivePromotion(id);
    }
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.public.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
    queryClient.invalidateQueries({ queryKey: reportKeys.all });
    queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
  },

  completePromotion: async (id: string, note?: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/campaigns/${id}/complete`, { note });
    } else {
      useMyCampaignsStore.getState().completeCampaign(id);
    }
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.public.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
    queryClient.invalidateQueries({ queryKey: reportKeys.all });
    queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
  },

  failPromotion: async (id: string, reason: string): Promise<void> => {
    if (Config.useApi) {
      await apiClient.post(`/campaigns/${id}/fail`, { reason });
    } else {
      useMyCampaignsStore.getState().rejectCampaign(id, reason);
    }
    queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.public.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
    queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    queryClient.invalidateQueries({ queryKey: reviewKeys.detail(id) });
    queryClient.invalidateQueries({ queryKey: activityKeys.all });
  },
};

