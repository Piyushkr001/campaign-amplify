import { CategoryName } from '@/constants/categories';

export type CampaignStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'UNDER_REVIEW'
  | 'FUNDING'
  | 'PROMOTING'
  | 'COMPLETED';

export interface CampaignSource {
  id: string;
  title: string;
  url: string;
  publisher?: string;
}

export interface CampaignDraft {
  id?: string;
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

export interface Campaign {
  id: string;
  title: string;
  category: Exclude<CategoryName, 'All'>;
  creator: string;
  creatorType: CreatorType;
  creatorAvatar?: string;
  summary: string;
  story: string;
  coverImage: string;
  raised: number;
  goal: number;
  estimatedReachMin: number;
  estimatedReachMax: number;
  status: CampaignStatus;
  daysRemaining: number;
  featured: boolean;
  createdAt: string;
  backerCount: number;
  distributionChannels: string[];
  useOfFunds: UseOfFundsBreakdown;
  supportingSources: SupportingSource[];
}
