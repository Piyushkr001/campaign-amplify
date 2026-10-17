import { useQuery } from '@tanstack/react-query';
import { CampaignFilterOptions, CampaignService } from '@/services/campaign.service';
import { Campaign } from '@/types/campaign';

export const CAMPAIGNS_QUERY_KEY = 'campaigns';

export function useCampaigns(options?: CampaignFilterOptions) {
  return useQuery<Campaign[], Error>({
    queryKey: [CAMPAIGNS_QUERY_KEY, options],
    queryFn: () => CampaignService.getAllCampaigns(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFeaturedCampaigns() {
  return useQuery<Campaign[], Error>({
    queryKey: [CAMPAIGNS_QUERY_KEY, 'featured'],
    queryFn: () => CampaignService.getFeaturedCampaigns(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCampaign(id: string) {
  return useQuery<Campaign | undefined, Error>({
    queryKey: [CAMPAIGNS_QUERY_KEY, 'detail', id],
    queryFn: () => CampaignService.getCampaignById(id),
    staleTime: 1000 * 60 * 5,
  });
}
