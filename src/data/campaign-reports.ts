import { Campaign } from '@/types/campaign';
import { CampaignReport } from '@/types/campaign-report';
import { Config } from '@/constants/config';
import { estimateReach } from '@/utils/reach';

/**
 * Seeded prototype reports for demonstration.
 * Values are internally consistent and strictly calculated from platform fee policy:
 * Advertising Allocation (85%), Platform Fee (10%), Processing Fee (5%).
 */
export const MOCK_CAMPAIGN_REPORTS: Record<string, CampaignReport> = {
  'camp-8': {
    id: 'rep-camp-8',
    campaignId: 'camp-8',
    campaignTitle: 'Financial Literacy for Early Careers',
    fundsRaised: 18400,
    advertisingAllocation: 15640, // 85%
    advertisingSpend: 15420,
    platformFee: 1840, // 10%
    processingFee: 920, // 5%
    estimatedImpressionsMin: 312800,
    estimatedImpressionsMax: 469200,
    measuredImpressions: 382450,
    measuredReach: 249120,
    clicks: 9560,
    ctr: 2.5, // 9560 / 382450 * 100
    durationDays: 21,
    channelResults: [
      {
        channel: 'Meta (Instagram & Facebook)',
        spend: 8200,
        impressions: 205000,
        reach: 135000,
        clicks: 5330,
        ctr: 2.6,
      },
      {
        channel: 'Google Display Network',
        spend: 5220,
        impressions: 127450,
        reach: 84120,
        clicks: 2980,
        ctr: 2.34,
      },
      {
        channel: 'Educational Newsletters',
        spend: 2000,
        impressions: 50000,
        reach: 30000,
        clicks: 1250,
        ctr: 2.5,
      },
    ],
    startedAt: '2026-09-20T08:00:00Z',
    completedAt: '2026-10-11T18:00:00Z',
    isDemoData: true,
  },

  'camp-9': {
    id: 'rep-camp-9',
    campaignId: 'camp-9',
    campaignTitle: 'Civic Participation: Local Council Open Data',
    fundsRaised: 10500,
    advertisingAllocation: 8925,
    advertisingSpend: 8850,
    platformFee: 1050,
    processingFee: 525,
    estimatedImpressionsMin: 178500,
    estimatedImpressionsMax: 267750,
    measuredImpressions: 218400,
    measuredReach: 142300,
    clicks: 5460,
    ctr: 2.5,
    durationDays: 14,
    channelResults: [
      {
        channel: 'Meta News Feeds',
        spend: 5500,
        impressions: 138000,
        reach: 91000,
        clicks: 3590,
        ctr: 2.6,
      },
      {
        channel: 'Regional Civic Portals',
        spend: 3350,
        impressions: 80400,
        reach: 51300,
        clicks: 1870,
        ctr: 2.33,
      },
    ],
    startedAt: '2026-09-15T09:00:00Z',
    completedAt: '2026-09-29T21:00:00Z',
    isDemoData: true,
  },

  'camp-6': {
    id: 'rep-camp-6',
    campaignId: 'camp-6',
    campaignTitle: 'Understanding Renewable Energy Grid Economics',
    fundsRaised: 24800,
    advertisingAllocation: 21080,
    advertisingSpend: 14200, // Interim progress
    platformFee: 2480,
    processingFee: 1240,
    estimatedImpressionsMin: 421600,
    estimatedImpressionsMax: 632400,
    measuredImpressions: 284000, // In progress
    measuredReach: 186000,
    clicks: 7100,
    ctr: 2.5,
    durationDays: 30,
    channelResults: [
      {
        channel: 'YouTube Tech Explainer Inventory',
        spend: 8500,
        impressions: 170000,
        reach: 112000,
        clicks: 4420,
        ctr: 2.6,
      },
      {
        channel: 'Clean Energy Publishers & Meta',
        spend: 5700,
        impressions: 114000,
        reach: 74000,
        clicks: 2680,
        ctr: 2.35,
      },
    ],
    startedAt: '2026-10-01T10:00:00Z',
    isDemoData: true,
  },
};

/**
 * Returns a campaign report if seeded, or generates a mathematically sound report
 * for any newly completed or promoting user-created campaign.
 */
export function getOrGenerateCampaignReport(campaign: Campaign): CampaignReport {
  if (MOCK_CAMPAIGN_REPORTS[campaign.id]) {
    return MOCK_CAMPAIGN_REPORTS[campaign.id];
  }

  const fundsRaised = typeof campaign.raised === 'number' ? campaign.raised : 0;
  const adRate = Config.feeStructure.advertisingPercentage / 100;
  const platformRate = Config.feeStructure.platformFeePercentage / 100;
  const processingRate = Config.feeStructure.paymentProcessingPercentage / 100;

  const advertisingAllocation = Math.round(fundsRaised * adRate);
  const platformFee = Math.round(fundsRaised * platformRate);
  const processingFee = Math.round(fundsRaised * processingRate);

  const isCompleted = campaign.status === 'COMPLETED';
  const spendFraction = isCompleted ? 0.98 : 0.65;
  const advertisingSpend = Math.round(advertisingAllocation * spendFraction);

  const { min: estimatedImpressionsMin, max: estimatedImpressionsMax } = estimateReach(fundsRaised);

  // Derive measured demo impressions proportional to spend
  const avgImpressionsPerDollar =
    (Config.reachPerDollarEstimate.min + Config.reachPerDollarEstimate.max) / 2;

  const channels =
    campaign.distributionChannels.length > 0
      ? campaign.distributionChannels
      : ['Meta (Instagram/FB)', 'Google Display'];

  const channelsCount = channels.length || 1;
  const baseChannelSpend = Math.floor(advertisingSpend / channelsCount);
  const remainderSpend = advertisingSpend - baseChannelSpend * channelsCount;

  const channelResults = channels.map((ch, idx) => {
    const spend = baseChannelSpend + (idx === 0 ? remainderSpend : 0);
    const chImp = Math.round(spend * avgImpressionsPerDollar);
    const chClicks = Math.round(chImp * 0.024);
    const chCtr = Number(((chClicks / (chImp || 1)) * 100).toFixed(2));
    return {
      channel: ch,
      spend,
      impressions: chImp,
      reach: Math.round(chImp * 0.65),
      clicks: chClicks,
      ctr: chCtr,
    };
  });

  const measuredImpressions = channelResults.reduce((acc, c) => acc + c.impressions, 0);
  const measuredReach = Math.round(measuredImpressions * 0.65);
  const clicks = channelResults.reduce((acc, c) => acc + c.clicks, 0);
  const ctr = Number(((clicks / (measuredImpressions || 1)) * 100).toFixed(2));

  return {
    id: `rep-${campaign.id}`,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
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
    startedAt: campaign.promotionStartedAt || campaign.distributionPreparationAt,
    completedAt: campaign.completedAt,
    isDemoData: true,
  };
}
