import {
  AIProvider,
  GenerateSummaryInput,
  GenerateSummaryOutput,
  GenerateStoryInput,
  GenerateStoryOutput,
  GenerateAdCreativeInput,
  GenerateAdCreativeOutput,
  GenerateAudienceInput,
  GenerateAudienceOutput,
} from './ai.types';
import {
  AI_SYSTEM_PROMPT,
  buildSummaryPrompt,
  buildStoryPrompt,
  buildAdCreativePrompt,
  buildAudiencePrompt,
} from './ai.prompts';
import {
  generateSummaryOutputSchema,
  generateStoryOutputSchema,
  generateAdCreativeOutputSchema,
  generateAudienceOutputSchema,
  SUPPORTED_AI_CHANNELS,
} from './ai.schemas';
import { env } from '../../config/env';

/**
 * Deterministic Mock AI Provider
 * Ensures test suites, offline runs, and environments without API keys run reliably
 * and always produce 100% schema-compliant, bounds-checked output.
 */
export class MockAIProvider implements AIProvider {
  async generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryOutput> {
    const title = input.title.trim();
    const category = input.category.trim();
    const keyPointText = input.keyPoints && input.keyPoints.length > 0
      ? ` Focusing on ${input.keyPoints[0]}.`
      : '';

    const summary = `${title}: A community initiative amplifying public awareness and supporting vital ${category.toLowerCase()} advocacy.${keyPointText}`.slice(0, 235);

    return generateSummaryOutputSchema.parse({
      summary,
      suggestedCategory: category || 'Community',
      keywords: [category, 'Advocacy', 'Community', 'Action', 'Impact'].filter(Boolean),
    });
  }

  async generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
    const title = input.title.trim();
    const category = input.category.trim();

    const headline = `Amplify ${title}: Driving Meaningful Impact Together`.slice(0, 95);
    const intro = `Every major positive change begins when communities unite behind a shared vision. ${title} was created to shine a spotlight on vital challenges and bring collective resources directly to the frontlines of ${category.toLowerCase()}.`.slice(0, 480);
    const story = `Throughout our communities, critical challenges often go unnoticed without dedicated amplification. When voices join together, we can overcome inertia and mobilize real support. With your backing, this campaign funds targeted message distribution across digital channels, ensuring our message reaches community leaders, stakeholders, and passionate advocates.\n\nEvery dollar contributed is directed transparently: 85% directly to media and outreach amplification, with complete post-campaign performance reporting. Join us in making this voice impossible to ignore.`;
    const callToAction = `Stand with us today. Back this campaign to amplify this vital message.`.slice(0, 95);

    return generateStoryOutputSchema.parse({
      headline,
      intro,
      story,
      callToAction,
    });
  }

  async generateAdCreative(input: GenerateAdCreativeInput): Promise<GenerateAdCreativeOutput> {
    const title = input.title.trim();
    const headline = `Stand with ${title}`.slice(0, 55);
    const description = `Join the community effort amplifying ${title}. Real transparency and verified impact.`.slice(0, 145);
    const callToAction = 'Amplify Now';
    const visualConcept = 'High-contrast, authentic photography showing community members collaborating with a clear advocacy headline overlay.';

    return generateAdCreativeOutputSchema.parse({
      headline,
      description,
      callToAction,
      visualConcept,
    });
  }

  async generateAudience(input: GenerateAudienceInput): Promise<GenerateAudienceOutput> {
    const category = input.category.trim();
    const audienceDescription = `Civically engaged community members, advocates, and supporters passionate about ${category.toLowerCase()} and grassroots community impact.`.slice(0, 290);

    return generateAudienceOutputSchema.parse({
      audienceDescription,
      interests: [category, 'Community Action', 'Civic Engagement', 'Public Awareness', 'Social Impact'],
      suggestedChannels: ['Meta', 'YouTube', 'Search', 'Instagram'],
      geographicFocus: 'National & Regional Communities',
    });
  }
}

/**
 * Live Google Gemini AI Provider
 * Connects to Gemini API when AI_API_KEY is configured. Falls back to MockAIProvider if error occurs.
 */
export class GeminiAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private fallback: MockAIProvider;

  constructor(apiKey: string, model = 'gemini-3.8-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.fallback = new MockAIProvider();
  }

  private async callGemini(promptText: string): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: AI_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }

    const json = (await response.json()) as any;
    const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Gemini API returned empty response');
    }

    return JSON.parse(rawContent);
  }

  async generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryOutput> {
    try {
      const prompt = buildSummaryPrompt(input);
      const raw = await this.callGemini(prompt);
      return generateSummaryOutputSchema.parse(raw);
    } catch (err) {
      console.warn('[GeminiAIProvider] Failed, falling back to deterministic draft:', err);
      return this.fallback.generateSummary(input);
    }
  }

  async generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
    try {
      const prompt = buildStoryPrompt(input);
      const raw = await this.callGemini(prompt);
      return generateStoryOutputSchema.parse(raw);
    } catch (err) {
      console.warn('[GeminiAIProvider] Failed, falling back to deterministic draft:', err);
      return this.fallback.generateStory(input);
    }
  }

  async generateAdCreative(input: GenerateAdCreativeInput): Promise<GenerateAdCreativeOutput> {
    try {
      const prompt = buildAdCreativePrompt(input);
      const raw = await this.callGemini(prompt);
      return generateAdCreativeOutputSchema.parse(raw);
    } catch (err) {
      console.warn('[GeminiAIProvider] Failed, falling back to deterministic draft:', err);
      return this.fallback.generateAdCreative(input);
    }
  }

  async generateAudience(input: GenerateAudienceInput): Promise<GenerateAudienceOutput> {
    try {
      const prompt = buildAudiencePrompt(input);
      const raw = await this.callGemini(prompt);
      // Ensure suggestedChannels are valid enums
      if (Array.isArray(raw.suggestedChannels)) {
        raw.suggestedChannels = raw.suggestedChannels.filter((c: string) =>
          (SUPPORTED_AI_CHANNELS as readonly string[]).includes(c)
        );
        if (raw.suggestedChannels.length === 0) {
          raw.suggestedChannels = ['Meta', 'YouTube', 'Search'];
        }
      }
      return generateAudienceOutputSchema.parse(raw);
    } catch (err) {
      console.warn('[GeminiAIProvider] Failed, falling back to deterministic draft:', err);
      return this.fallback.generateAudience(input);
    }
  }
}

/**
 * Singleton factory for AI Provider
 */
let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    const apiKey = (env as any).AI_API_KEY || process.env.AI_API_KEY;
    const model = (env as any).AI_MODEL || process.env.AI_MODEL;

    if (apiKey && apiKey.trim().length > 0) {
      providerInstance = new GeminiAIProvider(apiKey.trim(), model);
    } else {
      providerInstance = new MockAIProvider();
    }
  }
  return providerInstance;
}

export function setAIProvider(provider: AIProvider): void {
  providerInstance = provider;
}
