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

export interface CampaignPublicDTO {
  id: string;
  title: string;
  category: string;
  creator: string;
  creatorType: string;
  creatorAvatar?: string;
  summary: string;
  story: string;
  storyHeadline?: string;
  storyIntro?: string;
  storyContent: string;
  storyImage?: string;
  storyImageCaption?: string;
  storyImageCredit?: string;
  suggestedAction?: string;
  adImage?: string;
  adHeadline?: string;
  adDescription?: string;
  adCTA?: string;
  locations?: string[];
  interests?: string[];
  channels?: string[];
  audienceDescription?: string;
  durationDays: number;
  coverImage: string;
  raised: number;
  goal: number;
  estimatedReachMin: number;
  estimatedReachMax: number;
  status: BackendCampaignStatus;
  daysRemaining: number;
  featured: boolean;
  createdAt: string;
  submittedAt?: string;
  backerCount: number;
  distributionChannels: string[];
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

  // Lifecycle timestamps
  approvedAt?: string;
  fundingStartedAt?: string;
  fundingGoalReachedAt?: string;
  fundingEndedAt?: string;
  distributionPreparationAt?: string;
  promotionStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  failedAt?: string;
}
