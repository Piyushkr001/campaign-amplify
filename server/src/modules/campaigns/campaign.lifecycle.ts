import { BackendCampaignStatus } from './campaign.types';

export const EDITABLE_CAMPAIGN_STATUSES: BackendCampaignStatus[] = [
  'DRAFT',
  'CHANGES_REQUESTED',
];

export const SUBMITTABLE_CAMPAIGN_STATUSES: BackendCampaignStatus[] = [
  'DRAFT',
  'CHANGES_REQUESTED',
];

/**
 * Checks if a campaign is in a state that permits step modifications by the creator.
 * Protects FUNDING, PROMOTING, COMPLETED, etc. campaigns from being mutated.
 */
export function canEditCampaign(status: BackendCampaignStatus): boolean {
  return EDITABLE_CAMPAIGN_STATUSES.includes(status);
}

/**
 * Checks if a campaign is in a state eligible for submission into editorial review.
 */
export function canSubmitCampaign(status: BackendCampaignStatus): boolean {
  return SUBMITTABLE_CAMPAIGN_STATUSES.includes(status);
}
