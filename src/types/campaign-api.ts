import { BackendCampaignStatus } from '@/types/campaign';

export interface CampaignListApiDTO {
  id: string;
  title: string;
  category: string;
  creator: string;
  creatorType: string;
  creatorAvatar?: string;
  summary: string;
  status: BackendCampaignStatus;
  coverImage?: string;
  coverImageUrl?: string;
  fundingGoal: number;
  raised: number;
  amountRaised?: number;
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
  draftStep?: number;
  latestReviewFeedback?: string;
}

export interface ReviewerCampaignListApiDTO {
  id: string;
  title: string;
  category: string;
  creator: string;
  creatorName?: string;
  creatorType?: string;
  creatorAvatar?: string;
  summary: string;
  status: BackendCampaignStatus;
  coverImage?: string;
  coverImageUrl?: string;
  fundingGoal: number;
  submittedAt?: string;
  reviewStartedAt?: string;
  requestedChangesAt?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt: string;
  sourcesCount: number;
  lastReviewFeedback?: string;
  latestReviewFeedback?: string;
  estimatedReachMin?: number;
  estimatedReachMax?: number;
}

export interface ReviewerCampaignDetailApiDTO extends CampaignDetailApiDTO {
  reviews: Array<{
    id: string;
    reviewerId?: string | null;
    decision: string;
    feedback?: string | null;
    createdAt: string;
  }>;
}

export interface CampaignDetailApiDTO extends CampaignListApiDTO {
  story?: string;
  storyHeadline?: string;
  storyIntro?: string;
  storyContent?: string;
  storyImage?: string;
  storyImageUrl?: string;
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
  submittedAt?: string;
  reviewStartedAt?: string;
  requestedChangesAt?: string;
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
  reviewFeedback?: string;
  rejectionReason?: string;
  statusHistory?: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: any;
    actor?: any;
    actorType?: any;
    note?: string | null;
    createdAt: string;
  }>;
}

export interface CampaignDraftApiDTO {
  id: string;
  status: string;
}

export interface CampaignSubmitApiDTO {
  id: string;
  status: string;
  fundingGoal: number;
  submittedAt: string;
}

export interface CampaignStepSyncResponse {
  success: boolean;
  step?: string;
  id?: string;
  updatedAt?: string;
}

export type CampaignApiErrorCode =
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_INCOMPLETE'
  | 'INVALID_CAMPAIGN_ID'
  | 'INVALID_CAMPAIGN_STATUS'
  | 'CAMPAIGN_SYNC_FAILED'
  | 'VALIDATION_ERROR'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CLIENT_ERROR'
  | 'UNKNOWN_ERROR';

export interface CampaignApiError {
  code: CampaignApiErrorCode | string;
  message: string;
  details?: unknown;
}
