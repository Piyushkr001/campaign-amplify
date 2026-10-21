import { CampaignReportDTO, CampaignChannelResultDTO } from './report.types';
import { CAMPAIGN_POLICY } from '../../config/campaign-policy';

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
  const advertisingAllocation = Math.round(fundsRaised * (CAMPAIGN_POLICY.advertisingPercentage / 100));
  const platformFee = Math.round(fundsRaised * (CAMPAIGN_POLICY.platformPercentage / 100));
  const processingFee = Math.round(fundsRaised * (CAMPAIGN_POLICY.processingPercentage / 100));

  const isCompleted = campaign.status === 'COMPLETED';
  const reportStatus: 'INTERIM' | 'FINAL' = isCompleted ? 'FINAL' : 'INTERIM';
  const spendFraction = isCompleted ? 0.98 : 0.65;
  const advertisingSpend = Math.round(advertisingAllocation * spendFraction);

  const rawChannels =
    Array.isArray(campaign.channels) && campaign.channels.length > 0
      ? campaign.channels
      : ['Unspecified Demo Channel'];

  const channels = rawChannels.filter(Boolean);
  const channelsCount = channels.length > 0 ? channels.length : 1;

  const baseSpend = Math.floor(advertisingSpend / channelsCount);
  const remainder = advertisingSpend - baseSpend * channelsCount;

  const avgImpressionsPerDollar = Math.round(
    (CAMPAIGN_POLICY.impressionsPerDollarMin + CAMPAIGN_POLICY.impressionsPerDollarMax) / 2
  );

  const channelResults: CampaignChannelResultDTO[] = channels.map((ch, idx) => {
    const spend = baseSpend + (idx === 0 ? remainder : 0);
    const impressions = Math.round(spend * avgImpressionsPerDollar);
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

  const estimatedImpressionsMin = advertisingAllocation * CAMPAIGN_POLICY.impressionsPerDollarMin;
  const estimatedImpressionsMax = advertisingAllocation * CAMPAIGN_POLICY.impressionsPerDollarMax;

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
      `Simulated Prototype Report: These delivery metrics are mathematically modeled based on platform amplification policy (${CAMPAIGN_POLICY.advertisingPercentage}% advertising allocation, ~${avgImpressionsPerDollar} impressions per ad dollar) for demonstration. They are not connected to a live advertising provider.`,
    isDemoData: true,
  };
}
