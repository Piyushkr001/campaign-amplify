import { apiClient } from './api';
import { CampaignReport } from '@/types/campaign-report';

export const ReportService = {
  getCampaignReport: async (campaignId: string): Promise<CampaignReport> => {
    const response = await apiClient.get<{ success: boolean; data: CampaignReport }>(
      `/campaigns/${campaignId}/report`
    );
    return response.data.data;
  },
};
