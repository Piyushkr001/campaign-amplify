export interface CampaignFilterOptions {
  category?: string;
  searchQuery?: string;
  sortBy?: 'featured' | 'newest' | 'most_funded' | 'ending_soon';
}

/**
 * Standardized query keys for TanStack Query across the application.
 * Prevents invalidation mismatches (e.g. ['campaigns'] vs ['campaign', id]).
 */
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (options?: CampaignFilterOptions) => [...campaignKeys.lists(), options] as const,
  featured: () => [...campaignKeys.all, 'featured'] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};
