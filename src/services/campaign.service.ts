import { MOCK_CAMPAIGNS } from '@/data/campaigns';
import { Campaign } from '@/types/campaign';
import { CategoryName } from '@/constants/categories';
import { Config } from '@/constants/config';
import { apiClient } from '@/services/api';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { getEffectiveCampaign, isEffectivePublic } from '@/utils/effective-campaign';

export interface CampaignFilterOptions {
  category?: CategoryName;
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'most_funded' | 'ending_soon';
}

function mapDtoToCampaign(dto: any): Campaign {
  return {
    id: dto.id,
    title: dto.title,
    category: dto.category,
    creator: dto.creator,
    creatorType: dto.creatorType || 'Independent Creator',
    creatorAvatar: dto.creatorAvatar,
    summary: dto.summary,
    story: dto.story || dto.storyContent || '',
    storyHeadline: dto.storyHeadline,
    storyIntro: dto.storyIntro,
    storyContent: dto.storyContent,
    storyImage: dto.storyImage,
    storyImageCaption: dto.storyImageCaption,
    storyImageCredit: dto.storyImageCredit,
    suggestedAction: dto.suggestedAction,
    adImage: dto.adImage,
    adHeadline: dto.adHeadline,
    adDescription: dto.adDescription,
    adCTA: dto.adCTA,
    locations: dto.locations,
    interests: dto.interests,
    channels: dto.channels,
    audienceDescription: dto.audienceDescription,
    durationDays: dto.durationDays,
    coverImage: dto.coverImage,
    raised: dto.raised,
    goal: dto.goal,
    estimatedReachMin: dto.estimatedReachMin,
    estimatedReachMax: dto.estimatedReachMax,
    status: dto.status,
    daysRemaining: dto.daysRemaining,
    featured: !!dto.featured,
    createdAt: dto.createdAt,
    submittedAt: dto.submittedAt,
    backerCount: dto.backerCount,
    distributionChannels: dto.distributionChannels || [],
    useOfFunds: dto.useOfFunds || {
      advertising: Config.feeStructure.advertisingPercentage,
      platformFee: Config.feeStructure.platformFeePercentage,
      paymentProcessing: Config.feeStructure.paymentProcessingPercentage,
    },
    supportingSources: dto.supportingSources || [],
    approvedAt: dto.approvedAt,
    fundingGoalReachedAt: dto.fundingGoalReachedAt,
    fundingEndedAt: dto.fundingEndedAt,
    distributionPreparationAt: dto.distributionPreparationAt,
    promotionStartedAt: dto.promotionStartedAt,
    completedAt: dto.completedAt,
    cancelledAt: dto.cancelledAt,
    failedAt: dto.failedAt,
  };
}

export const CampaignService = {
  getAllCampaigns: async (options?: CampaignFilterOptions): Promise<Campaign[]> => {
    // If Config.useApi is enabled, try the backend API first
    if (Config.useApi) {
      try {
        const params: Record<string, any> = {};
        if (options?.category && options.category !== 'All') {
          params.category = options.category;
        }
        if (options?.searchQuery && options.searchQuery.trim().length > 0) {
          params.search = options.searchQuery.trim();
        }
        if (options?.sortBy) {
          params.sort = options.sortBy;
        }

        const response = await apiClient.get('/campaigns', { params });
        if (response.data?.success && Array.isArray(response.data?.data)) {
          return response.data.data.map(mapDtoToCampaign);
        }
      } catch (err) {
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
        const response = await apiClient.get(`/campaigns/${id}`);
        if (response.data?.success && response.data?.data) {
          return mapDtoToCampaign(response.data.data);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Explicitly not found or private in backend
          return undefined;
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
};
