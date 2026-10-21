export type CampaignTone = 'inspirational' | 'urgent' | 'informative' | 'community';

export interface GenerateSummaryInput {
  title: string;
  category: string;
  keyPoints?: string[];
  tone?: CampaignTone;
}

export interface GenerateSummaryOutput {
  summary: string;
  suggestedCategory: string;
  keywords: string[];
}

export interface GenerateStoryInput {
  title: string;
  category: string;
  summary?: string;
  impactGoal?: string;
  tone?: CampaignTone;
}

export interface GenerateStoryOutput {
  headline: string;
  intro: string;
  story: string;
  callToAction: string;
}

export interface GenerateAdCreativeInput {
  title: string;
  summary?: string;
  targetAudience?: string;
  platform?: string;
}

export interface GenerateAdCreativeOutput {
  headline: string;
  description: string;
  callToAction: string;
  visualConcept: string;
}

export interface GenerateAudienceInput {
  title: string;
  category: string;
  summary?: string;
}

export interface GenerateAudienceOutput {
  audienceDescription: string;
  interests: string[];
  suggestedChannels: string[];
  geographicFocus?: string;
}

export interface AIProvider {
  generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryOutput>;
  generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput>;
  generateAdCreative(input: GenerateAdCreativeInput): Promise<GenerateAdCreativeOutput>;
  generateAudience(input: GenerateAudienceInput): Promise<GenerateAudienceOutput>;
}
