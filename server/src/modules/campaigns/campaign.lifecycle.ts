import { BackendCampaignStatus } from './campaign.types';

export const ALLOWED_TRANSITIONS: Record<BackendCampaignStatus, BackendCampaignStatus[]> = {
  DRAFT: ['SUBMITTED_FOR_REVIEW'],
  SUBMITTED_FOR_REVIEW: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  CHANGES_REQUESTED: ['SUBMITTED_FOR_REVIEW'],
  APPROVED: ['FUNDING'],
  FUNDING: ['FUNDING_GOAL_REACHED', 'FUNDING_ENDED', 'CANCELLED'],
  FUNDING_GOAL_REACHED: ['DISTRIBUTION_PREPARATION'],
  FUNDING_ENDED: ['DISTRIBUTION_PREPARATION', 'REFUND_PENDING'],
  DISTRIBUTION_PREPARATION: ['PROMOTING'],
  PROMOTING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  REFUND_PENDING: ['CANCELLED'],
  FAILED: [],
};

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

/**
 * Validates whether transitioning from currentStatus to nextStatus is allowed by business policy.
 */
export function isAllowedTransition(
  fromStatus: BackendCampaignStatus,
  toStatus: BackendCampaignStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  return Boolean(allowed && allowed.includes(toStatus));
}
