import { useQuery } from '@tanstack/react-query';
import { CampaignFilterOptions, CampaignService } from '@/services/campaign.service';
import { Campaign } from '@/types/campaign';
import { campaignKeys } from '@/constants/query-keys';

export { campaignKeys };
export const CAMPAIGNS_QUERY_KEY = 'campaigns';

export function useCampaigns(options?: CampaignFilterOptions) {
  return useQuery<Campaign[], Error>({
    queryKey: campaignKeys.list(options),
    queryFn: () => CampaignService.getAllCampaigns(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFeaturedCampaigns() {
  return useQuery<Campaign[], Error>({
    queryKey: campaignKeys.featured(),
    queryFn: () => CampaignService.getFeaturedCampaigns(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for public campaign detail (strictly public campaigns).
 */
export function useCampaign(id: string) {
  return useQuery<Campaign | undefined, Error>({
    queryKey: campaignKeys.detail(id),
    queryFn: () => CampaignService.getPublicCampaignById(id),
    staleTime: 1000 * 60 * 5,
    enabled: Boolean(id),
  });
}

/**
 * Hook for creator campaign list (Creator Dashboard).
 */
export function useCreatorCampaigns(filters?: { status?: string; category?: string; search?: string }) {
  return useQuery<Campaign[], Error>({
    queryKey: campaignKeys.creator.list(filters),
    queryFn: () => CampaignService.getMyCampaigns(filters),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for creator campaign detail (includes private drafts / under review / revision feedback).
 */
export function useCreatorCampaign(id: string) {
  return useQuery<Campaign | undefined, Error>({
    queryKey: campaignKeys.creator.detail(id),
    queryFn: () => CampaignService.getCreatorCampaignById(id),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(id),
  });
}
