import { useQuery } from '@tanstack/react-query';
import { ReviewerService } from '@/services/reviewer.service';
import { Campaign } from '@/types/campaign';
import { reviewKeys } from '@/constants/query-keys';

export function useReviewQueue(filters?: { status?: string; category?: string; search?: string }) {
  return useQuery<Campaign[], Error>({
    queryKey: reviewKeys.queue(filters),
    queryFn: () => ReviewerService.getReviewQueue(filters),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useReviewCampaign(id: string) {
  return useQuery<Campaign | undefined, Error>({
    queryKey: reviewKeys.detail(id),
    queryFn: () => ReviewerService.getReviewCampaign(id),
    staleTime: 1000 * 30,
    enabled: Boolean(id),
  });
}
