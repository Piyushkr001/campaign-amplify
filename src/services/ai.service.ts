import { apiClient } from './api';
import { Config } from '@/constants/config';
import {
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  GenerateStoryRequest,
  GenerateStoryResponse,
  GenerateAdCreativeRequest,
  GenerateAdCreativeResponse,
  GenerateAudienceRequest,
  GenerateAudienceResponse,
} from '@/types/ai-api';

// Client-side fallback generators for Local Mode or when backend is unreachable
function fallbackSummary(req: GenerateSummaryRequest): GenerateSummaryResponse {
  const title = req.title.trim();
  const category = req.category.trim() || 'Community';
  const summary = `${title}: A community initiative amplifying public awareness and supporting vital ${category.toLowerCase()} advocacy.`.slice(0, 235);
  return {
    summary,
    suggestedCategory: category,
    keywords: [category, 'Advocacy', 'Community', 'Action', 'Impact'],
  };
}

function fallbackStory(req: GenerateStoryRequest): GenerateStoryResponse {
  const title = req.title.trim();
  const category = req.category.trim() || 'Community';
  const headline = `Amplify ${title}: Driving Meaningful Impact Together`.slice(0, 95);
  const intro = `Every major positive change begins when communities unite behind a shared vision. ${title} was created to shine a spotlight on vital challenges and bring collective resources directly to the frontlines of ${category.toLowerCase()}.`.slice(0, 480);
  const story = `Throughout our communities, critical challenges often go unnoticed without dedicated amplification. When voices join together, we can overcome inertia and mobilize real support. With your backing, this campaign funds targeted message distribution across digital channels, ensuring our message reaches community leaders, stakeholders, and passionate advocates.\n\nEvery dollar contributed is directed transparently: 85% directly to media and outreach amplification, with complete post-campaign performance reporting. Join us in making this voice impossible to ignore.`;
  const callToAction = `Stand with us today. Back this campaign to amplify this vital message.`.slice(0, 95);

  return {
    headline,
    intro,
    story,
    callToAction,
  };
}

function fallbackAdCreative(req: GenerateAdCreativeRequest): GenerateAdCreativeResponse {
  const title = req.title.trim();
  const headline = `Stand with ${title}`.slice(0, 55);
  const description = `Join the community effort amplifying ${title}. Real transparency and verified impact.`.slice(0, 145);
  const callToAction = 'Amplify Now';
  const visualConcept = 'High-contrast, authentic photography showing community members collaborating with a clear advocacy headline overlay.';

  return {
    headline,
    description,
    callToAction,
    visualConcept,
  };
}

function fallbackAudience(req: GenerateAudienceRequest): GenerateAudienceResponse {
  const category = req.category.trim() || 'Community';
  const audienceDescription = `Civically engaged community members, advocates, and supporters passionate about ${category.toLowerCase()} and grassroots community impact.`.slice(0, 290);

  return {
    audienceDescription,
    interests: [category, 'Community Action', 'Civic Engagement', 'Public Awareness', 'Social Impact'],
    suggestedChannels: ['Meta', 'YouTube', 'Search', 'Instagram'],
    geographicFocus: 'National & Regional Communities',
  };
}

export const AIService = {
  generateSummary: async (req: GenerateSummaryRequest): Promise<GenerateSummaryResponse> => {
    if (!Config.useApi) {
      // Local Mode simulation
      await new Promise((r) => setTimeout(r, 600));
      return fallbackSummary(req);
    }

    try {
      const res = await apiClient.post<{ success: boolean; data: GenerateSummaryResponse }>(
        '/ai/campaign/summary',
        req
      );
      return res.data.data;
    } catch (err: any) {
      console.warn('[AIService] Remote call failed, using fallback:', err?.message || err);
      return fallbackSummary(req);
    }
  },

  generateStory: async (req: GenerateStoryRequest): Promise<GenerateStoryResponse> => {
    if (!Config.useApi) {
      await new Promise((r) => setTimeout(r, 700));
      return fallbackStory(req);
    }

    try {
      const res = await apiClient.post<{ success: boolean; data: GenerateStoryResponse }>(
        '/ai/campaign/story',
        req
      );
      return res.data.data;
    } catch (err: any) {
      console.warn('[AIService] Remote call failed, using fallback:', err?.message || err);
      return fallbackStory(req);
    }
  },

  generateAdCreative: async (req: GenerateAdCreativeRequest): Promise<GenerateAdCreativeResponse> => {
    if (!Config.useApi) {
      await new Promise((r) => setTimeout(r, 600));
      return fallbackAdCreative(req);
    }

    try {
      const res = await apiClient.post<{ success: boolean; data: GenerateAdCreativeResponse }>(
        '/ai/campaign/ad-creative',
        req
      );
      return res.data.data;
    } catch (err: any) {
      console.warn('[AIService] Remote call failed, using fallback:', err?.message || err);
      return fallbackAdCreative(req);
    }
  },

  generateAudience: async (req: GenerateAudienceRequest): Promise<GenerateAudienceResponse> => {
    if (!Config.useApi) {
      await new Promise((r) => setTimeout(r, 600));
      return fallbackAudience(req);
    }

    try {
      const res = await apiClient.post<{ success: boolean; data: GenerateAudienceResponse }>(
        '/ai/campaign/audience',
        req
      );
      return res.data.data;
    } catch (err: any) {
      console.warn('[AIService] Remote call failed, using fallback:', err?.message || err);
      return fallbackAudience(req);
    }
  },
};
