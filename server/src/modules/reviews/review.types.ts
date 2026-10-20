import { BackendCampaignStatus, CampaignDetailDTO } from '../campaigns/campaign.types';

export interface ReviewerCampaignListDTO {
  id: string;
  title: string;
  category: string;
  creator: string;
  creatorName?: string;
  creatorType: string;
  creatorAvatar?: string;
  summary: string;
  status: BackendCampaignStatus;
  coverImage?: string;
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

export interface CampaignReviewItemDTO {
  id: string;
  reviewerId?: string | null;
  decision: string;
  feedback?: string | null;
  createdAt: string;
}

export interface ReviewerCampaignDetailDTO extends CampaignDetailDTO {
  reviews: CampaignReviewItemDTO[];
}
