import { useQuery } from '@tanstack/react-query';
import { ReportService } from '@/services/report.service';
import { reportKeys } from '@/constants/query-keys';

export function useCampaignReport(campaignId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: reportKeys.detail(campaignId),
    queryFn: () => ReportService.getCampaignReport(campaignId),
    enabled: Boolean(campaignId) && enabled,
    staleTime: 1000 * 30,
  });
}
