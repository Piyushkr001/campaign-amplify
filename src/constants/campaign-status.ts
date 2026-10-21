import { CampaignStatus } from '@/types/campaign';

export type StatusBadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
  | 'neutral';

export interface CampaignStatusConfigItem {
  label: string;
  creatorDescription: string;
  publicDescription: string;
  badgeVariant: StatusBadgeVariant;
  creatorAction: string;
  isPublic: boolean;
  isBackable: boolean;
  creatorTab: CreatorDashboardTab;
}

/**
 * Single source of truth for campaign lifecycle state metadata,
 * public visibility, backability, and UI badge presentations.
 */
export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, CampaignStatusConfigItem> = {
  DRAFT: {
    label: 'Draft',
    creatorDescription: 'Work in progress. Not yet submitted for editorial review.',
    publicDescription: 'Private draft message.',
    badgeVariant: 'neutral',
    creatorAction: 'Continue Editing',
    isPublic: false,
    isBackable: false,
    creatorTab: 'DRAFTS',
  },
  SUBMITTED_FOR_REVIEW: {
    label: 'Submitted for Review',
    creatorDescription: 'Your campaign was submitted and is in the editorial verification queue.',
    publicDescription: 'Campaign submitted for review.',
    badgeVariant: 'info',
    creatorAction: 'View Status',
    isPublic: false,
    isBackable: false,
    creatorTab: 'UNDER_REVIEW',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    creatorDescription: 'Our verification team is reviewing message claims and citations.',
    publicDescription: 'Campaign is currently under review.',
    badgeVariant: 'info',
    creatorAction: 'View Status',
    isPublic: false,
    isBackable: false,
    creatorTab: 'UNDER_REVIEW',
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    creatorDescription: 'Reviewer feedback requires source adjustments or citation updates.',
    publicDescription: 'Creator action required.',
    badgeVariant: 'warning',
    creatorAction: 'Edit Requested Changes',
    isPublic: false,
    isBackable: false,
    creatorTab: 'REQUIRES_ACTION',
  },
  APPROVED: {
    label: 'Approved',
    creatorDescription: 'Campaign passed editorial verification and is staged for funding launch.',
    publicDescription: 'Campaign approved and preparing for funding.',
    badgeVariant: 'success',
    creatorAction: 'Prepare Launch',
    isPublic: false,
    isBackable: false,
    creatorTab: 'FUNDING',
  },
  FUNDING: {
    label: 'Funding Active',
    creatorDescription: 'Open for community backer contributions to fund public ad placement.',
    publicDescription: 'Accepting contributions toward digital message amplification.',
    badgeVariant: 'success',
    creatorAction: 'View Campaign',
    isPublic: true,
    isBackable: true,
    creatorTab: 'FUNDING',
  },
  FUNDING_GOAL_REACHED: {
    label: 'Goal Reached',
    creatorDescription: '100% of amplification funding goal reached! Preparing distribution setup.',
    publicDescription: 'Funding goal reached! Preparing targeted advertising distribution.',
    badgeVariant: 'purple',
    creatorAction: 'View Distribution',
    isPublic: true,
    isBackable: false,
    creatorTab: 'FUNDING',
  },
  FUNDING_ENDED: {
    label: 'Funding Concluded',
    creatorDescription: 'Funding period concluded. Distribution setup in progress.',
    publicDescription: 'Funding concluded. Message distribution being deployed.',
    badgeVariant: 'neutral',
    creatorAction: 'View Summary',
    isPublic: true,
    isBackable: false,
    creatorTab: 'FUNDING',
  },
  DISTRIBUTION_PREPARATION: {
    label: 'Distribution Prep',
    creatorDescription: 'Ad creative and audience targeting parameters being deployed to ad networks.',
    publicDescription: 'Configuring ad placements across digital distribution channels.',
    badgeVariant: 'purple',
    creatorAction: 'View Pipeline',
    isPublic: true,
    isBackable: false,
    creatorTab: 'FUNDING',
  },
  PROMOTING: {
    label: 'Promoting',
    creatorDescription: 'Promotion simulation active across target channels.',
    publicDescription: 'Campaign promotion simulation is currently active.',
    badgeVariant: 'purple',
    creatorAction: 'View Progress',
    isPublic: true,
    isBackable: false,
    creatorTab: 'PROMOTING',
  },
  COMPLETED: {
    label: 'Completed',
    creatorDescription: 'Distribution run finished with delivery report and impression metrics.',
    publicDescription: 'Campaign completed.',
    badgeVariant: 'default',
    creatorAction: 'View Final Report',
    isPublic: true,
    isBackable: false,
    creatorTab: 'COMPLETED',
  },
  REJECTED: {
    label: 'Not Approved',
    creatorDescription: 'Campaign does not meet platform editorial guidelines or sourcing standards.',
    publicDescription: 'Campaign was not approved.',
    badgeVariant: 'error',
    creatorAction: 'Review Decision',
    isPublic: false,
    isBackable: false,
    creatorTab: 'REQUIRES_ACTION',
  },
  CANCELLED: {
    label: 'Cancelled',
    creatorDescription: 'This campaign was cancelled and archived.',
    publicDescription: 'Campaign cancelled.',
    badgeVariant: 'neutral',
    creatorAction: 'View Archived',
    isPublic: false,
    isBackable: false,
    creatorTab: 'REQUIRES_ACTION',
  },
  REFUND_PENDING: {
    label: 'Refund Pending',
    creatorDescription: 'Representing refund handling in the lifecycle model.',
    publicDescription: 'Refund represented in prototype lifecycle.',
    badgeVariant: 'warning',
    creatorAction: 'View Details',
    isPublic: false,
    isBackable: false,
    creatorTab: 'REQUIRES_ACTION',
  },
  FAILED: {
    label: 'Distribution Failed',
    creatorDescription: 'Ad network delivery encountered delivery failure.',
    publicDescription: 'Distribution halted.',
    badgeVariant: 'error',
    creatorAction: 'View Incident',
    isPublic: false,
    isBackable: false,
    creatorTab: 'REQUIRES_ACTION',
  },
};

/**
 * Public discovery statuses: derived from the centralized configuration.
 * Only these appear in public feeds (Home, Explore, Search).
 */
export const PUBLIC_CAMPAIGN_STATUSES: CampaignStatus[] = (
  Object.keys(CAMPAIGN_STATUS_CONFIG) as CampaignStatus[]
).filter((status) => CAMPAIGN_STATUS_CONFIG[status].isPublic);

/**
 * Backable statuses: derived from centralized configuration.
 * Only active FUNDING campaigns accept financial contributions.
 */
export const BACKABLE_CAMPAIGN_STATUSES: CampaignStatus[] = (
  Object.keys(CAMPAIGN_STATUS_CONFIG) as CampaignStatus[]
).filter((status) => CAMPAIGN_STATUS_CONFIG[status].isBackable);

/**
 * Checks if a campaign is eligible for public discovery.
 */
export function isPublicCampaign(campaign?: { status: CampaignStatus } | null): boolean {
  if (!campaign) return false;
  return CAMPAIGN_STATUS_CONFIG[campaign.status]?.isPublic ?? false;
}

/**
 * Checks if a campaign is eligible for receiving financial contributions.
 */
export function canBackCampaign(campaign?: { status: CampaignStatus } | null): boolean {
  if (!campaign) return false;
  return CAMPAIGN_STATUS_CONFIG[campaign.status]?.isBackable ?? false;
}

/**
 * Centralized state transition graph.
 * Enforces valid lifecycle progression without allowing arbitrary or invalid status jumps.
 */
export const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ['SUBMITTED_FOR_REVIEW', 'CANCELLED'],
  SUBMITTED_FOR_REVIEW: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  CHANGES_REQUESTED: ['SUBMITTED_FOR_REVIEW', 'CANCELLED'],
  APPROVED: ['FUNDING', 'CANCELLED'],
  FUNDING: ['FUNDING_GOAL_REACHED', 'FUNDING_ENDED', 'CANCELLED'],
  FUNDING_GOAL_REACHED: ['DISTRIBUTION_PREPARATION', 'CANCELLED'],
  FUNDING_ENDED: ['DISTRIBUTION_PREPARATION', 'REFUND_PENDING', 'CANCELLED'],
  DISTRIBUTION_PREPARATION: ['PROMOTING', 'FAILED', 'CANCELLED'],
  PROMOTING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  REFUND_PENDING: ['CANCELLED'],
  FAILED: [],
};

/**
 * Validates whether a state transition from `from` to `to` is permitted by the state machine.
 */
export function isValidTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  if (from === to) return false;
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

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
  ALL: null,
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
