export type ActivityEventType =
  | 'CAMPAIGN_DRAFT_CREATED'
  | 'CAMPAIGN_SUBMITTED'
  | 'REVIEW_STARTED'
  | 'CHANGES_REQUESTED'
  | 'CAMPAIGN_APPROVED'
  | 'CAMPAIGN_REJECTED'
  | 'FUNDING_STARTED'
  | 'CONTRIBUTION_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'FUNDING_GOAL_REACHED'
  | 'FUNDING_ENDED'
  | 'DISTRIBUTION_PREPARATION_STARTED'
  | 'PROMOTION_STARTED'
  | 'CAMPAIGN_COMPLETED'
  | 'CAMPAIGN_FAILED';

export interface ActivityEventDTO {
  id: string;
  type: ActivityEventType;
  campaignId?: string;
  campaignTitle?: string;
  contributionId?: string;
  title: string;
  description?: string;
  status?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFeedResponseDTO {
  events: ActivityEventDTO[];
  total: number;
  limit: number;
  offset: number;
}
