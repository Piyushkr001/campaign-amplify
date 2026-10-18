import { Campaign, CampaignStatus } from '@/types/campaign';
import { useCampaignFundingStore } from '@/store/campaign-funding-store';
import { useCampaignRuntimeStore } from '@/store/campaign-runtime-store';
import { canBackCampaign, isPublicCampaign } from '@/constants/campaign-status';
import { calculateFundingProgress } from '@/utils/formatters';

/**
 * Returns the unified, authoritative Effective Campaign model.
 * Reconciles base campaign data with:
 * 1. Financial contributions & backer adjustments from campaign-funding-store
 * 2. Runtime lifecycle status overrides from campaign-runtime-store
 * 3. Automatic threshold rules (e.g. status='FUNDING' and raised >= goal => FUNDING_GOAL_REACHED)
 */
export function getEffectiveCampaign(campaign: Campaign): Campaign {
  if (!campaign) return campaign;

  // 1. Financial funding adjustments
  const fundingAdj = useCampaignFundingStore.getState().getFundingAdjustment(campaign.id);
  const raisedAdjustment = fundingAdj ? fundingAdj.raisedAdjustment : 0;
  const backerAdjustment = fundingAdj ? fundingAdj.backerCountAdjustment : 0;

  const effectiveRaised = Math.max(0, campaign.raised + raisedAdjustment);
  const effectiveBackers = Math.max(0, campaign.backerCount + backerAdjustment);

  // 2. Runtime status overrides (for seeded or local runtime state)
  const runtimeOverride = useCampaignRuntimeStore.getState().getOverride(campaign.id);

  let effectiveStatus: CampaignStatus = runtimeOverride?.statusOverride || campaign.status;

  // 3. Automatic rule: if campaign is currently in FUNDING and raised >= goal,
  // it must automatically be treated as FUNDING_GOAL_REACHED across all screens.
  if (effectiveStatus === 'FUNDING' && effectiveRaised >= campaign.goal) {
    effectiveStatus = 'FUNDING_GOAL_REACHED';
  }

  return {
    ...campaign,
    raised: effectiveRaised,
    backerCount: effectiveBackers,
    status: effectiveStatus,
    fundingGoalReachedAt:
      runtimeOverride?.fundingGoalReachedAt ||
      campaign.fundingGoalReachedAt ||
      (effectiveStatus === 'FUNDING_GOAL_REACHED' ? new Date().toISOString() : undefined),
    fundingEndedAt: runtimeOverride?.fundingEndedAt || campaign.fundingEndedAt,
    distributionPreparationAt:
      runtimeOverride?.distributionPreparationAt || campaign.distributionPreparationAt,
    promotionStartedAt: runtimeOverride?.promotionStartedAt || campaign.promotionStartedAt,
    completedAt: runtimeOverride?.completedAt || campaign.completedAt,
  };
}

/**
 * Returns the effective raised amount.
 */
export function getEffectiveRaised(campaign: Campaign): number {
  return getEffectiveCampaign(campaign).raised;
}

/**
 * Returns the effective lifecycle status.
 */
export function getEffectiveStatus(campaign: Campaign): CampaignStatus {
  return getEffectiveCampaign(campaign).status;
}

/**
 * Returns the unified funding progress calculations.
 */
export function getEffectiveFundingProgress(campaign: Campaign) {
  const effective = getEffectiveCampaign(campaign);
  return calculateFundingProgress(effective.raised, effective.goal);
}

/**
 * Evaluates whether the campaign can currently receive contributions.
 * Strictly requires status === 'FUNDING' on the effective campaign.
 */
export function isEffectiveBackable(campaign: Campaign): boolean {
  const effective = getEffectiveCampaign(campaign);
  return canBackCampaign(effective);
}

/**
 * Evaluates whether the campaign is visible in public views.
 */
export function isEffectivePublic(campaign: Campaign): boolean {
  const effective = getEffectiveCampaign(campaign);
  return isPublicCampaign(effective);
}
