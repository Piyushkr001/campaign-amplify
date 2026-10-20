import { CategoryName } from '@/constants/categories';

export type CampaignStatus =
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

export type BackendCampaignStatus = CampaignStatus;

export type CampaignDraftMode = 'NEW' | 'REVISION';

export type CampaignSyncStatus = 'LOCAL_ONLY' | 'PENDING' | 'SYNCED' | 'ERROR';

export interface CampaignSource {
  id: string;
  title: string;
  url: string;
  publisher?: string;
}

export interface CampaignDraft {
  id?: string;
  mode: CampaignDraftMode;
  syncStatus: CampaignSyncStatus;
  lastSyncError?: string;
  lastSyncedAt?: string;
  currentStep: 1 | 2 | 3 | 4 | 5;

  title: string;
  category: CategoryName;
  creatorName: string;
  summary: string;
  coverImage?: string;

  storyHeadline: string;
  storyIntro: string;
  storyContent: string;

  sources: CampaignSource[];

  storyImage?: string;
  storyImageCaption?: string;
  storyImageCredit?: string;
  suggestedAction?: string;

  adImage?: string;
  adHeadline: string;
  adDescription: string;
  adCTA: string;

  locations: string[];
  interests: string[];
  channels: string[];
  audienceDescription: string;
  durationDays: number;

  fundingGoal?: number;

  lastSavedAt?: string;
}

export type CreatorType =
  | 'Nonprofit Organization'
  | 'Civic Initiative'
  | 'Research Collective'
  | 'Independent Creator'
  | 'Community Group';

export interface UseOfFundsBreakdown {
  advertising: number; // e.g. 85%
  platformFee: number; // e.g. 10%
  paymentProcessing: number; // e.g. 5%
}

export interface SupportingSource {
  title: string;
  url: string;
  publisher?: string;
}

export interface DistributionTarget {
  channel: string;
  percentage: number;
}

export interface CampaignStoryDetails {
  headline?: string;
  intro?: string;
  content: string;
  image?: string;
  caption?: string;
  credit?: string;
}

export interface CampaignStatusHistoryItem {
  id: string;
  fromStatus?: CampaignStatus;
  toStatus: CampaignStatus;
  note?: string;
  actor: 'CREATOR' | 'REVIEWER' | 'SYSTEM';
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  category: Exclude<CategoryName, 'All'>;
  creator: string;
  creatorType: CreatorType;
  creatorAvatar?: string;
  summary: string;
  story: string; // Plaintext narrative or overview
  storyDetails?: CampaignStoryDetails; // Structured editorial story
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
  locations?: string[];
  interests?: string[];
  channels?: string[];
  audienceDescription?: string;
  durationDays?: number;
  coverImage: string;
  raised: number;
  goal: number;
  estimatedReachMin: number;
  estimatedReachMax: number;
  status: CampaignStatus;
  daysRemaining: number;
  featured: boolean;
  createdAt: string;
  submittedAt?: string;
  backerCount: number;
  distributionChannels: string[];
  useOfFunds: UseOfFundsBreakdown;
  supportingSources: SupportingSource[];

  // Lifecycle audit & review fields
  statusHistory?: CampaignStatusHistoryItem[];
  reviewFeedback?: string;
  rejectionReason?: string;
  reviewStartedAt?: string;
  approvedAt?: string;
  requestedChangesAt?: string;
  rejectedAt?: string;
  fundingStartedAt?: string;
  /** @deprecated Canonical property is fundingStartedAt */
  fundedAt?: string;
  fundingGoalReachedAt?: string;
  fundingEndedAt?: string;
  distributionPreparationAt?: string;
  promotionStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  failedAt?: string;
}
