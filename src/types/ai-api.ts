export interface GenerateSummaryRequest {
  title: string;
  category: string;
  keyPoints?: string[];
  tone?: 'inspirational' | 'urgent' | 'informative' | 'community';
}

export interface GenerateSummaryResponse {
  summary: string;
  suggestedCategory: string;
  keywords: string[];
}

export interface GenerateStoryRequest {
  title: string;
  category: string;
  summary?: string;
  impactGoal?: string;
  tone?: 'inspirational' | 'urgent' | 'informative' | 'community';
}

export interface GenerateStoryResponse {
  headline: string;
  intro: string;
  story: string;
  callToAction: string;
}

export interface GenerateAdCreativeRequest {
  title: string;
  summary?: string;
  targetAudience?: string;
  platform?: string;
}

export interface GenerateAdCreativeResponse {
  headline: string;
  description: string;
  callToAction: string;
  visualConcept: string;
}

export interface GenerateAudienceRequest {
  title: string;
  category: string;
  summary?: string;
}

export interface GenerateAudienceResponse {
  audienceDescription: string;
  interests: string[];
  suggestedChannels: string[];
  geographicFocus?: string;
}
