import { MOCK_CAMPAIGNS } from '@/data/campaigns';
import { Campaign } from '@/types/campaign';
import { CategoryName } from '@/constants/categories';

export interface CampaignFilterOptions {
  category?: CategoryName;
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'most_funded' | 'ending_soon';
}

export const CampaignService = {
  getAllCampaigns: async (options?: CampaignFilterOptions): Promise<Campaign[]> => {
    let list = [...MOCK_CAMPAIGNS];

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
    return MOCK_CAMPAIGNS.find((c) => c.id === id);
  },

  getFeaturedCampaigns: async (): Promise<Campaign[]> => {
    return MOCK_CAMPAIGNS.filter((c) => c.featured);
  },
};
