export interface CampaignChannelResultDTO {
  id?: string;
  channel: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
}

export interface CampaignReportDTO {
  id: string;
  campaignId: string;
  campaignTitle: string;
  reportStatus: 'INTERIM' | 'FINAL';
  fundsRaised: number;
  advertisingAllocation: number; // 85% of raised funds
  advertisingSpend: number;
  platformFee: number; // 10%
  processingFee: number; // 5%
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  measuredImpressions: number;
  measuredReach: number;
  clicks: number;
  ctr: number;
  durationDays: number;
  channelResults: CampaignChannelResultDTO[];
  startedAt?: string | null;
  completedAt?: string | null;
  generatedAt: string;
  disclaimer: string;
  isDemoData: boolean;
}
