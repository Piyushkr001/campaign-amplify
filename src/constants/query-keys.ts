export interface CampaignFilterOptions {
  category?: string;
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'most_funded' | 'ending_soon';
}

/**
 * Standardized query keys for TanStack Query across the application.
 * Provides hierarchical prefix invalidation for public campaigns, creator campaigns,
 * and reviewer workflows.
 */
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (options?: CampaignFilterOptions) => [...campaignKeys.lists(), options] as const,
  featured: () => [...campaignKeys.all, 'featured'] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,

  public: {
    all: ['campaigns', 'public'] as const,
    list: (options?: CampaignFilterOptions) => ['campaigns', 'public', 'list', options] as const,
    detail: (id: string) => ['campaigns', 'public', 'detail', id] as const,
  },
  creator: {
    all: ['campaigns', 'creator'] as const,
    list: (filters?: { status?: string; category?: string; search?: string }) =>
      ['campaigns', 'creator', 'list', filters] as const,
    detail: (id: string) => ['campaigns', 'creator', 'detail', id] as const,
  },
};

export const reviewKeys = {
  all: ['reviews'] as const,
  queue: (filters?: { status?: string; category?: string; search?: string }) =>
    ['reviews', 'queue', filters] as const,
  detail: (id: string) => ['reviews', 'detail', id] as const,
};
