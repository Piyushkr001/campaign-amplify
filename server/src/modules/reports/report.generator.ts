import { CampaignReportDTO, CampaignChannelResultDTO } from './report.types';

export interface CampaignReportInput {
  id: string;
  title: string;
  amountRaised: number;
  fundingGoal?: number | null;
  status: string;
  durationDays?: number | null;
  promotionStartedAt?: Date | null;
  distributionPreparationAt?: Date | null;
  completedAt?: Date | null;
  channels?: string[] | null;
}

export function generateDeterministicReport(campaign: CampaignReportInput): CampaignReportDTO {
  const fundsRaised = Math.max(0, campaign.amountRaised || 0);
  const advertisingAllocation = Math.round(fundsRaised * 0.85);
  const platformFee = Math.round(fundsRaised * 0.10);
  const processingFee = Math.round(fundsRaised * 0.05);

  const isCompleted = campaign.status === 'COMPLETED';
  const reportStatus: 'INTERIM' | 'FINAL' = isCompleted ? 'FINAL' : 'INTERIM';
  const spendFraction = isCompleted ? 0.98 : 0.65;
  const advertisingSpend = Math.round(advertisingAllocation * spendFraction);

  const rawChannels =
    Array.isArray(campaign.channels) && campaign.channels.length > 0
      ? campaign.channels
      : ['Meta Targeted Ads', 'Regional News Outlets'];

  const channels = rawChannels.filter(Boolean);
  const channelsCount = channels.length > 0 ? channels.length : 1;

  const baseSpend = Math.floor(advertisingSpend / channelsCount);
  const remainder = advertisingSpend - baseSpend * channelsCount;

  const channelResults: CampaignChannelResultDTO[] = channels.map((ch, idx) => {
    const spend = baseSpend + (idx === 0 ? remainder : 0);
    // 25 impressions per advertising dollar average
    const impressions = Math.round(spend * 25);
    // reach is guaranteed <= impressions
    const reach = Math.round(impressions * 0.65);
    // ~2.5% CTR: clicks guaranteed <= impressions
    const clicks = Math.round(impressions * 0.025);
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;

    return {
      channel: ch,
      spend,
      impressions,
      reach,
      clicks,
      ctr,
    };
  });

  const measuredImpressions = channelResults.reduce((acc, c) => acc + c.impressions, 0);
  const measuredReach = channelResults.reduce((acc, c) => acc + c.reach, 0);
  const clicks = channelResults.reduce((acc, c) => acc + c.clicks, 0);
  const ctr = measuredImpressions > 0
    ? Number(((clicks / measuredImpressions) * 100).toFixed(2))
    : 0;

  const estimatedImpressionsMin = advertisingAllocation * 20;
  const estimatedImpressionsMax = advertisingAllocation * 30;

  const startedAt =
    campaign.promotionStartedAt?.toISOString() ||
    campaign.distributionPreparationAt?.toISOString() ||
    null;

  const completedAt = campaign.completedAt?.toISOString() || null;

  return {
    id: `rep-${campaign.id}`,
    campaignId: campaign.id,
    campaignTitle: campaign.title || 'Campaign Amplification',
    reportStatus,
    fundsRaised,
    advertisingAllocation,
    advertisingSpend,
    platformFee,
    processingFee,
    estimatedImpressionsMin,
    estimatedImpressionsMax,
    measuredImpressions,
    measuredReach,
    clicks,
    ctr,
    durationDays: campaign.durationDays || 14,
    channelResults,
    startedAt,
    completedAt,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Simulated Prototype Report: These delivery metrics are mathematically modeled based on platform amplification policy (85% advertising allocation, ~25 impressions per ad dollar) for demonstration. They are not connected to a live advertising provider.',
    isDemoData: true,
  };
}
