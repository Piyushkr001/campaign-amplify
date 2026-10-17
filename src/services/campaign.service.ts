import { MOCK_CAMPAIGNS } from '@/data/campaigns';
import { Campaign } from '@/types/campaign';
import { CategoryName } from '@/constants/categories';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useCampaignFundingStore } from '@/store/campaign-funding-store';
import { isPublicCampaign } from '@/constants/campaign-status';

export interface CampaignFilterOptions {
  category?: CategoryName;
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'most_funded' | 'ending_soon';
}

function applyFundingAdjustments(campaign: Campaign): Campaign {
  const adjustment = useCampaignFundingStore.getState().getFundingAdjustment(campaign.id);
  if (!adjustment || (adjustment.raisedAdjustment === 0 && adjustment.backerCountAdjustment === 0)) {
    return campaign;
  }

  return {
    ...campaign,
    raised: campaign.raised + adjustment.raisedAdjustment,
    backerCount: campaign.backerCount + adjustment.backerCountAdjustment,
  };
}

export const CampaignService = {
  getAllCampaigns: async (options?: CampaignFilterOptions): Promise<Campaign[]> => {
    const userCampaigns = useMyCampaignsStore.getState().campaigns;

    // Combine user-created campaigns and mock campaigns, prioritizing user campaigns
    const combinedMap = new Map<string, Campaign>();
    userCampaigns.forEach((c) => combinedMap.set(c.id, c));
    MOCK_CAMPAIGNS.forEach((c) => {
      if (!combinedMap.has(c.id)) {
        combinedMap.set(c.id, c);
      }
    });

    // CRITICAL: Filter for public campaign statuses only (FUNDING, PROMOTING, COMPLETED)
    let list = Array.from(combinedMap.values())
      .filter(isPublicCampaign)
      .map(applyFundingAdjustments);

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

  getCampaignById: async (id: string): Promise<Campaign | undefined> => {
    const userCampaigns = useMyCampaignsStore.getState().campaigns;
    const foundInUser = userCampaigns.find((c) => c.id === id);
    if (foundInUser) {
      return applyFundingAdjustments(foundInUser);
    }

    const foundInMock = MOCK_CAMPAIGNS.find((c) => c.id === id);
    if (foundInMock) {
      return applyFundingAdjustments(foundInMock);
    }

    return undefined;
  },

  getFeaturedCampaigns: async (): Promise<Campaign[]> => {
    const all = await CampaignService.getAllCampaigns();
    return all.filter((c) => c.featured);
  },
};
