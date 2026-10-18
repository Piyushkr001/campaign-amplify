export type BackendCampaignStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'FUNDING'
  | 'FUNDING_GOAL_REACHED'
  | 'FUNDING_ENDED'
  | 'DISTRIBUTION_PREPARATION'
  | 'PROMOTING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'FAILED';

export const BACKEND_PUBLIC_STATUSES: BackendCampaignStatus[] = [
  'FUNDING',
  'FUNDING_GOAL_REACHED',
  'FUNDING_ENDED',
  'DISTRIBUTION_PREPARATION',
  'PROMOTING',
  'COMPLETED',
];

export interface CampaignListDTO {
  id: string;
  title: string;
  category: string;
  creator: string;
  creatorType: string;
  creatorAvatar?: string;
  summary: string;
  status: BackendCampaignStatus;
  coverImage?: string;
  fundingGoal: number;
  raised: number;
  backerCount: number;
  fundingPercentage: number;
  estimatedReachMin: number;
  estimatedReachMax: number;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  daysRemaining: number;
  featured: boolean;
  createdAt: string;
  distributionChannels: string[];
}

export interface CampaignDetailDTO extends CampaignListDTO {
  story?: string;
  storyHeadline?: string;
  storyIntro?: string;
  storyContent?: string;
  storyImage?: string;
  storyImageCaption?: string;
  storyImageCredit?: string;
  suggestedAction?: string;
  adImage?: string;
  adHeadline?: string;
  adDescription?: string;
  adCTA?: string;
  locations: string[];
  interests: string[];
  channels: string[];
  audienceDescription?: string;
  durationDays: number;
  useOfFunds: {
    advertising: number;
    platformFee: number;
    paymentProcessing: number;
  };
  supportingSources: Array<{
    title: string;
    url: string;
    publisher?: string;
  }>;

  // Lifecycle Timestamps
  submittedAt?: string;
  reviewStartedAt?: string;
  approvedAt?: string;
  fundingStartedAt?: string;
  fundingGoalReachedAt?: string;
  fundingEndedAt?: string;
  distributionPreparationAt?: string;
  promotionStartedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  failedAt?: string;
}

// Backward compatibility alias
export type CampaignPublicDTO = CampaignDetailDTO;

/**
 * Calculates remaining days in funding lifecycle based on actual start time and duration.
 */
export function calculateDaysRemaining(options: {
  status: BackendCampaignStatus;
  fundingStartedAt?: Date | string | null;
  durationDays?: number | null;
}): number {
  if (
    options.status === 'COMPLETED' ||
    options.status === 'FUNDING_ENDED' ||
    options.status === 'FUNDING_GOAL_REACHED'
  ) {
    return 0;
  }
  if (!options.fundingStartedAt || !options.durationDays) {
    return options.durationDays ?? 14;
  }
  const started = new Date(options.fundingStartedAt).getTime();
  const durationMs = options.durationDays * 24 * 60 * 60 * 1000;
  const endsAt = started + durationMs;
  const now = Date.now();
  const diffDays = Math.ceil((endsAt - now) / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
}
