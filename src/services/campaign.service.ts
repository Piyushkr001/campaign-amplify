import { MOCK_CAMPAIGNS } from '@/data/campaigns';
import { Campaign, CampaignDraft } from '@/types/campaign';
import { CategoryName } from '@/constants/categories';
import { Config } from '@/constants/config';
import { apiClient } from '@/services/api';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { getEffectiveCampaign, isEffectivePublic } from '@/utils/effective-campaign';
import { sanitizeRemoteImageUrl } from '@/utils/assets';
import {
  CampaignListApiDTO,
  CampaignDetailApiDTO,
  CampaignDraftApiDTO,
  CampaignSubmitApiDTO,
} from '@/types/campaign-api';

export interface CampaignFilterOptions {
  category?: CategoryName;
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'most_funded' | 'ending_soon';
}

function mapDtoToCampaign(dto: CampaignDetailApiDTO | CampaignListApiDTO): Campaign {
  const detail = dto as CampaignDetailApiDTO;
  return {
    id: dto.id,
    title: dto.title,
    category: dto.category as any,
    creator: dto.creator,
    creatorType: (dto.creatorType as any) || 'Independent Creator',
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
    backerCount: dto.backerCount,
    distributionChannels: dto.distributionChannels || [],
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
    approvedAt: detail.approvedAt,
    fundingGoalReachedAt: detail.fundingGoalReachedAt,
    fundingEndedAt: detail.fundingEndedAt,
    distributionPreparationAt: detail.distributionPreparationAt,
    promotionStartedAt: detail.promotionStartedAt,
    completedAt: detail.completedAt,
    cancelledAt: detail.cancelledAt,
    failedAt: detail.failedAt,
  };
}

export const CampaignService = {
  getAllCampaigns: async (options?: CampaignFilterOptions): Promise<Campaign[]> => {
    // If Config.useApi is enabled, try the backend API first
    if (Config.useApi) {
      try {
        const params: Record<string, string | number> = {};
        if (options?.category && options.category !== 'All') {
          params.category = options.category;
        }
        if (options?.searchQuery && options.searchQuery.trim().length > 0) {
          params.search = options.searchQuery.trim();
        }
        if (options?.sortBy) {
          params.sort = options.sortBy;
        }

        const response = await apiClient.get<{ success: boolean; data: CampaignListApiDTO[] }>(
          '/campaigns',
          { params }
        );
        if (response.data?.success && Array.isArray(response.data?.data)) {
          return response.data.data.map(mapDtoToCampaign);
        }
      } catch (err) {
        if (Config.strictApi) {
          throw err;
        }
        console.warn('[CampaignService] Backend API request failed, falling back to local source:', err);
      }
    }

    const userCampaigns = useMyCampaignsStore.getState().campaigns;

    // Combine user-created campaigns and mock campaigns, prioritizing user campaigns
    const combinedMap = new Map<string, Campaign>();
    userCampaigns.forEach((c) => combinedMap.set(c.id, c));
    MOCK_CAMPAIGNS.forEach((c) => {
      if (!combinedMap.has(c.id)) {
        combinedMap.set(c.id, c);
      }
    });

    // CRITICAL: Calculate effective state and filter for public campaign statuses only
    let list = Array.from(combinedMap.values())
      .map(getEffectiveCampaign)
      .filter(isEffectivePublic);

    if (options?.category && options.category !== 'All') {
      list = list.filter((c) => c.category === options.category);
    }

    if (options?.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.creator.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'newest':
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'most_funded':
          list.sort((a, b) => b.raised / b.goal - a.raised / a.goal);
          break;
        case 'ending_soon':
          list.sort((a, b) => a.daysRemaining - b.daysRemaining);
          break;
        case 'featured':
        default:
          list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
          break;
      }
    }

    return list;
  },

  /**
   * Fetches a campaign by ID for public views.
   * Strictly verifies that the effective campaign has a public lifecycle status.
   * Private campaigns return undefined.
   */
  getPublicCampaignById: async (id: string): Promise<Campaign | undefined> => {
    // If Config.useApi is enabled, attempt fetching from backend API
    if (Config.useApi) {
      try {
        const response = await apiClient.get<{ success: boolean; data: CampaignDetailApiDTO }>(
          `/campaigns/${id}`
        );
        if (response.data?.success && response.data?.data) {
          return mapDtoToCampaign(response.data.data);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Explicitly not found or private in backend
          return undefined;
        }
        if (Config.strictApi) {
          throw err;
        }
        console.warn('[CampaignService] Backend API lookup failed, falling back to local source:', err);
      }
    }

    const userCampaigns = useMyCampaignsStore.getState().campaigns;
    const foundInUser = userCampaigns.find((c) => c.id === id);
    if (foundInUser) {
      const effective = getEffectiveCampaign(foundInUser);
      if (!isEffectivePublic(effective)) {
        return undefined;
      }
      return effective;
    }

    const foundInMock = MOCK_CAMPAIGNS.find((c) => c.id === id);
    if (foundInMock) {
      const effective = getEffectiveCampaign(foundInMock);
      if (!isEffectivePublic(effective)) {
        return undefined;
      }
      return effective;
    }

    return undefined;
  },

  /**
   * Fetches a campaign by ID for the creator who owns it (accessible regardless of public status).
   */
  getCreatorCampaignById: async (id: string): Promise<Campaign | undefined> => {
    const userCampaigns = useMyCampaignsStore.getState().campaigns;
    const foundInUser = userCampaigns.find((c) => c.id === id);
    if (foundInUser) {
      return getEffectiveCampaign(foundInUser);
    }

    const foundInMock = MOCK_CAMPAIGNS.find((c) => c.id === id);
    if (foundInMock) {
      return getEffectiveCampaign(foundInMock);
    }

    return undefined;
  },

  /**
   * Fetches a candidate campaign by ID for reviewer inspection.
   */
  getReviewerCampaignById: async (id: string): Promise<Campaign | undefined> => {
    const userCampaigns = useMyCampaignsStore.getState().campaigns;
    const foundInUser = userCampaigns.find((c) => c.id === id);
    if (foundInUser) {
      return getEffectiveCampaign(foundInUser);
    }

    const foundInMock = MOCK_CAMPAIGNS.find((c) => c.id === id);
    if (foundInMock) {
      return getEffectiveCampaign(foundInMock);
    }

    return undefined;
  },

  /**
   * Default public detail lookup.
   */
  getCampaignById: async (id: string): Promise<Campaign | undefined> => {
    return CampaignService.getPublicCampaignById(id);
  },

  getFeaturedCampaigns: async (): Promise<Campaign[]> => {
    const all = await CampaignService.getAllCampaigns();
    return all.filter((c) => c.featured);
  },

  /**
   * Initializes a new campaign draft in backend database.
   */
  createDraft: async (title?: string): Promise<CampaignDraftApiDTO> => {
    const response = await apiClient.post<{ success: boolean; data: CampaignDraftApiDTO }>(
      '/campaigns',
      { title }
    );
    if (!response.data?.success || !response.data?.data) {
      throw new Error(
        (response.data as any)?.error?.message || 'Failed to create campaign draft on server.'
      );
    }
    return response.data.data;
  },

  /**
   * Syncs Step 1: Basics to backend database.
   */
  saveBasics: async (
    id: string,
    data: {
      title: string;
      category: string;
      creatorName: string;
      summary: string;
      coverImage?: string | null;
    }
  ) => {
    const payload = {
      title: data.title,
      category: data.category,
      creatorName: data.creatorName,
      summary: data.summary,
      coverImage: sanitizeRemoteImageUrl(data.coverImage) || null,
    };
    const response = await apiClient.patch(`/campaigns/${id}/basics`, payload);
    return response.data?.data;
  },

  /**
   * Syncs Step 2: Story and sources to backend database.
   */
  saveStory: async (
    id: string,
    data: {
      storyHeadline?: string;
      storyIntro?: string;
      storyContent: string;
      storyImage?: string | null;
      storyImageCaption?: string;
      storyImageCredit?: string;
      suggestedAction?: string;
      sources: Array<{ id?: string; title: string; url: string; publisher?: string }>;
    }
  ) => {
    const payload = {
      storyHeadline: data.storyHeadline || undefined,
      storyIntro: data.storyIntro || undefined,
      storyContent: data.storyContent,
      storyImage: sanitizeRemoteImageUrl(data.storyImage) || null,
      storyImageCaption: data.storyImageCaption || undefined,
      storyImageCredit: data.storyImageCredit || undefined,
      suggestedAction: data.suggestedAction || undefined,
      sources: (data.sources || []).map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        publisher: s.publisher || undefined,
      })),
    };
    const response = await apiClient.patch(`/campaigns/${id}/story`, payload);
    return response.data?.data;
  },

  /**
   * Syncs Step 3: Visuals & Ad Creative to backend database.
   */
  saveVisuals: async (
    id: string,
    data: {
      coverImage?: string | null;
      adHeadline: string;
      adDescription: string;
      adCTA: string;
      adImage?: string | null;
    }
  ) => {
    const payload = {
      coverImage: sanitizeRemoteImageUrl(data.coverImage) || null,
      adHeadline: data.adHeadline,
      adDescription: data.adDescription,
      adCTA: data.adCTA,
      adImage: sanitizeRemoteImageUrl(data.adImage) || null,
    };
    const response = await apiClient.patch(`/campaigns/${id}/visuals`, payload);
    return response.data?.data;
  },

  /**
   * Syncs Step 4: Reach & Distribution Preferences to backend database.
   */
  saveReach: async (
    id: string,
    data: {
      locations: string[];
      interests: string[];
      channels: string[];
      audienceDescription?: string;
      durationDays: number;
    }
  ) => {
    const payload = {
      locations: data.locations,
      interests: data.interests,
      channels: data.channels,
      audienceDescription: data.audienceDescription || undefined,
      durationDays: data.durationDays,
    };
    const response = await apiClient.patch(`/campaigns/${id}/reach`, payload);
    return response.data?.data;
  },

  /**
   * Submits campaign for editorial review in backend database.
   */
  submitCampaign: async (id: string, data: { fundingGoal: number }): Promise<CampaignSubmitApiDTO> => {
    const response = await apiClient.post<{ success: boolean; data: CampaignSubmitApiDTO }>(
      `/campaigns/${id}/submit`,
      data
    );
    if (!response.data?.success) {
      throw (response.data as any)?.error || new Error('Failed to submit campaign for review.');
    }
    return response.data.data;
  },

  /**
   * Flushes all 4 setup steps of a CampaignDraft sequentially to the backend server.
   * Ensures that:
   * 1. A backend draft row exists (creates one via POST /campaigns if draft.id is missing).
   * 2. Step 1 (Basics), Step 2 (Story), Step 3 (Visuals), and Step 4 (Reach) are all fully up to date.
   * 3. Device-local images are sanitized so only remote HTTPS URLs reach PostgreSQL.
   * Returns the confirmed server UUID.
   */
  syncFullDraftToServer: async (draft: CampaignDraft): Promise<string> => {
    let serverId = draft.id;
    if (!serverId) {
      const created = await CampaignService.createDraft(draft.title || 'Untitled Draft');
      serverId = created.id;
    }

    // Step 1: Basics
    await CampaignService.saveBasics(serverId, {
      title: draft.title || 'Untitled Draft',
      category: draft.category === 'All' ? 'Environment' : draft.category,
      creatorName: draft.creatorName || 'Community Campaigner',
      summary: draft.summary || 'Campaign amplification message summary.',
      coverImage: draft.coverImage,
    });

    // Step 2: Story
    await CampaignService.saveStory(serverId, {
      storyHeadline: draft.storyHeadline || undefined,
      storyIntro: draft.storyIntro || undefined,
      storyContent: draft.storyContent || draft.summary || 'Campaign story narrative in progress.',
      storyImage: draft.storyImage,
      storyImageCaption: draft.storyImageCaption || undefined,
      storyImageCredit: draft.storyImageCredit || undefined,
      suggestedAction: draft.suggestedAction || undefined,
      sources: (draft.sources || []).map((s) => ({
        id: s.id,
        title: s.title,
        url: s.url,
        publisher: s.publisher,
      })),
    });

    // Step 3: Visuals
    await CampaignService.saveVisuals(serverId, {
      coverImage: draft.coverImage,
      adImage: draft.adImage,
      adHeadline: draft.adHeadline || draft.title || 'Campaign Message',
      adDescription: draft.adDescription || draft.summary || 'Help amplify this message.',
      adCTA: draft.adCTA || 'Learn More',
    });

    // Step 4: Reach
    await CampaignService.saveReach(serverId, {
      locations: draft.locations && draft.locations.length > 0 ? draft.locations : ['National'],
      interests:
        draft.interests && draft.interests.length > 0 ? draft.interests : ['General Public'],
      channels:
        draft.channels && draft.channels.length > 0 ? draft.channels : ['Meta Targeted Ads'],
      audienceDescription:
        draft.audienceDescription && draft.audienceDescription.trim().length >= 10
          ? draft.audienceDescription
          : 'Civic-minded community members and stakeholders',
      durationDays: draft.durationDays || 14,
    });

    return serverId;
  },
};
