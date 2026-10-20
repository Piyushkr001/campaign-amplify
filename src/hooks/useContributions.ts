import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contributionKeys, campaignKeys } from '@/constants/query-keys';
import { ContributionService } from '@/services/contribution.service';
import { SimulatePaymentApiInput } from '@/types/contribution-api';

export function useContributionQuote(campaignId: string, amount: number, enabled: boolean = true) {
  return useQuery({
    queryKey: contributionKeys.quote(campaignId, amount),
    queryFn: () => ContributionService.getQuote(campaignId, amount),
    enabled: enabled && !!campaignId && amount > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useMyContributions() {
  return useQuery({
    queryKey: contributionKeys.me(),
    queryFn: () => ContributionService.getMyContributions(),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useContributionDetail(id: string) {
  return useQuery({
    queryKey: contributionKeys.detail(id),
    queryFn: () => ContributionService.getContribution(id),
    enabled: !!id,
  });
}

export function useContributionReceipt(id: string) {
  return useQuery({
    queryKey: contributionKeys.receipt(id),
    queryFn: () => ContributionService.getReceipt(id),
    enabled: !!id,
  });
}

export function useSimulatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SimulatePaymentApiInput) => ContributionService.simulatePayment(input),
    onSuccess: (data) => {
      // Invalidate public campaign queries so detail and feed immediately reflect new amountRaised and backerCount
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      queryClient.invalidateQueries({ queryKey: campaignKeys.public.all });
      if (data.campaignId) {
        queryClient.invalidateQueries({ queryKey: campaignKeys.public.detail(data.campaignId) });
        queryClient.invalidateQueries({ queryKey: campaignKeys.creator.detail(data.campaignId) });
      }
      queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });

      // Invalidate contribution queries
      queryClient.invalidateQueries({ queryKey: contributionKeys.all });
      queryClient.invalidateQueries({ queryKey: contributionKeys.me() });
      if (data.contributionId) {
        queryClient.invalidateQueries({ queryKey: contributionKeys.detail(data.contributionId) });
        queryClient.invalidateQueries({ queryKey: contributionKeys.receipt(data.contributionId) });
      }
    },
  });
}
