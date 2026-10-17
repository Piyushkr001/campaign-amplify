import { CampaignStatus } from '@/types/campaign';

/**
 * Centrally defines which campaign statuses are allowed to appear in public feeds
 * (Home, Explore, Search, Featured lists).
 *
 * NOTE: APPROVED campaigns are NOT yet public until a reviewer or creator
 * makes them available for funding (transitioning to FUNDING).
 */
export const PUBLIC_CAMPAIGN_STATUSES: CampaignStatus[] = [
  'FUNDING',
  'PROMOTING',
  'COMPLETED',
];

/**
 * Centrally defines which campaign statuses can accept backer contributions.
 * Only active FUNDING campaigns accept money toward amplification.
 */
export const BACKABLE_CAMPAIGN_STATUSES: CampaignStatus[] = [
  'FUNDING',
];

/**
 * Checks if a campaign is eligible for public discovery.
 */
export function isPublicCampaign(campaign?: { status: CampaignStatus } | null): boolean {
  if (!campaign) return false;
  return PUBLIC_CAMPAIGN_STATUSES.includes(campaign.status);
}

/**
 * Checks if a campaign is eligible for receiving financial contributions.
 */
export function canBackCampaign(campaign?: { status: CampaignStatus } | null): boolean {
  if (!campaign) return false;
  return BACKABLE_CAMPAIGN_STATUSES.includes(campaign.status);
}

export type StatusBadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'neutral';

export interface CampaignStatusConfigItem {
  label: string;
  description: string;
  badgeVariant: StatusBadgeVariant;
  creatorAction: string;
  isPublic: boolean;
  isBackable: boolean;
}

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, CampaignStatusConfigItem> = {
  DRAFT: {
    label: 'Draft',
    description: 'Work in progress. Not yet submitted for review.',
    badgeVariant: 'neutral',
    creatorAction: 'Continue Editing',
    isPublic: false,
    isBackable: false,
  },
  SUBMITTED_FOR_REVIEW: {
    label: 'Submitted for Review',
    description: 'Your campaign was submitted and is in the editorial queue.',
    badgeVariant: 'info',
    creatorAction: 'View Status',
    isPublic: false,
    isBackable: false,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    description: 'Our verification team is reviewing message claims and citations.',
    badgeVariant: 'info',
    creatorAction: 'View Status',
    isPublic: false,
    isBackable: false,
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    description: 'Reviewer feedback requires clarification or source adjustments.',
    badgeVariant: 'warning',
    creatorAction: 'Review Changes',
    isPublic: false,
    isBackable: false,
  },
  APPROVED: {
    label: 'Approved',
    description: 'Campaign passed editorial checks and is ready to launch into funding.',
    badgeVariant: 'success',
    creatorAction: 'Prepare Launch',
    isPublic: false,
    isBackable: false,
  },
  FUNDING: {
    label: 'Funding Active',
    description: 'Open for backer contributions to sponsor ad placement.',
    badgeVariant: 'success',
    creatorAction: 'View Campaign',
    isPublic: true,
    isBackable: true,
  },
  FUNDING_GOAL_REACHED: {
    label: 'Goal Reached',
    description: 'Funding goal reached! Preparing advertising allocations.',
    badgeVariant: 'purple',
    creatorAction: 'View Distribution',
    isPublic: true,
    isBackable: false,
  },
  FUNDING_ENDED: {
    label: 'Funding Concluded',
    description: 'Funding period ended. Distribution setup in progress.',
    badgeVariant: 'neutral',
    creatorAction: 'View Summary',
    isPublic: true,
    isBackable: false,
  },
  DISTRIBUTION_PREPARATION: {
    label: 'Distribution Prep',
    description: 'Ad creative and targeting parameters being deployed to ad networks.',
    badgeVariant: 'purple',
    creatorAction: 'View Pipeline',
    isPublic: true,
    isBackable: false,
  },
  PROMOTING: {
    label: 'Promoting',
    description: 'Live advertising distribution actively running across channels.',
    badgeVariant: 'purple',
    creatorAction: 'View Progress',
    isPublic: true,
    isBackable: false,
  },
  COMPLETED: {
    label: 'Completed',
    description: 'Distribution run finished with verified impression metrics.',
    badgeVariant: 'default',
    creatorAction: 'View Report',
    isPublic: true,
    isBackable: false,
  },
  REJECTED: {
    label: 'Not Approved',
    description: 'Campaign does not meet platform editorial standards.',
    badgeVariant: 'error',
    creatorAction: 'Review Decision',
    isPublic: false,
    isBackable: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'This campaign was cancelled by the creator.',
    badgeVariant: 'neutral',
    creatorAction: 'View Archived',
    isPublic: false,
    isBackable: false,
  },
  REFUND_PENDING: {
    label: 'Refund Pending',
    description: 'Reversing backer contributions per policy.',
    badgeVariant: 'warning',
    creatorAction: 'View Details',
    isPublic: false,
    isBackable: false,
  },
  FAILED: {
    label: 'Distribution Failed',
    description: 'Ad network delivery encountered issues.',
    badgeVariant: 'error',
    creatorAction: 'View Incident',
    isPublic: false,
    isBackable: false,
  },
};

/**
 * Tab mappings for the Creator Dashboard.
 */
export type CreatorDashboardTab =
  | 'ALL'
  | 'DRAFTS'
  | 'UNDER_REVIEW'
  | 'REQUIRES_ACTION'
  | 'FUNDING'
  | 'PROMOTING'
  | 'COMPLETED';

export const CREATOR_DASHBOARD_TABS: { key: CreatorDashboardTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFTS', label: 'Drafts' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'REQUIRES_ACTION', label: 'Requires Action' },
  { key: 'FUNDING', label: 'Funding' },
  { key: 'PROMOTING', label: 'Promoting' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const CREATOR_TAB_STATUS_MAPPING: Record<CreatorDashboardTab, CampaignStatus[] | null> = {
  ALL: null, // show all
  DRAFTS: ['DRAFT'],
  UNDER_REVIEW: ['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW'],
  REQUIRES_ACTION: ['CHANGES_REQUESTED', 'REJECTED'],
  FUNDING: [
    'APPROVED',
    'FUNDING',
    'FUNDING_GOAL_REACHED',
    'FUNDING_ENDED',
    'DISTRIBUTION_PREPARATION',
  ],
  PROMOTING: ['PROMOTING'],
  COMPLETED: ['COMPLETED'],
};
