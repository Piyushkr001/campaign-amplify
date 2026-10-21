import {
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
  generateSummaryInputSchema,
  generateStoryInputSchema,
  generateAdCreativeInputSchema,
  generateAudienceInputSchema,
} from './ai.schemas';
import { getAIProvider } from './ai.provider';
import { RateLimitExceededError } from '../../utils/errors';

// In-memory sliding window rate limiter: max 30 requests per 60 seconds per user
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

const userRequestTimestamps = new Map<string, number[]>();

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = userRequestTimestamps.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new RateLimitExceededError(
      'AI draft generation rate limit exceeded. Please wait a minute before requesting more drafts.'
    );
  }

  validTimestamps.push(now);
  userRequestTimestamps.set(userId, validTimestamps);
}

// Clean dangerous control characters and excess whitespace
function sanitizeString(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

export const AIService = {
  // Clear rate limits (useful for test resets)
  resetRateLimits: () => {
    userRequestTimestamps.clear();
  },

  generateSummary: async (userId: string, rawInput: unknown): Promise<GenerateSummaryOutput> => {
    checkRateLimit(userId);
    const parsed = generateSummaryInputSchema.parse(rawInput);
    const sanitizedInput: GenerateSummaryInput = {
      title: sanitizeString(parsed.title),
      category: sanitizeString(parsed.category),
      keyPoints: parsed.keyPoints?.map(sanitizeString),
      tone: parsed.tone,
    };

    const provider = getAIProvider();
    return provider.generateSummary(sanitizedInput);
  },

  generateStory: async (userId: string, rawInput: unknown): Promise<GenerateStoryOutput> => {
    checkRateLimit(userId);
    const parsed = generateStoryInputSchema.parse(rawInput);
    const sanitizedInput: GenerateStoryInput = {
      title: sanitizeString(parsed.title),
      category: sanitizeString(parsed.category),
      summary: parsed.summary ? sanitizeString(parsed.summary) : undefined,
      impactGoal: parsed.impactGoal ? sanitizeString(parsed.impactGoal) : undefined,
      tone: parsed.tone,
    };

    const provider = getAIProvider();
    return provider.generateStory(sanitizedInput);
  },

  generateAdCreative: async (userId: string, rawInput: unknown): Promise<GenerateAdCreativeOutput> => {
    checkRateLimit(userId);
    const parsed = generateAdCreativeInputSchema.parse(rawInput);
    const sanitizedInput: GenerateAdCreativeInput = {
      title: sanitizeString(parsed.title),
      summary: parsed.summary ? sanitizeString(parsed.summary) : undefined,
      targetAudience: parsed.targetAudience ? sanitizeString(parsed.targetAudience) : undefined,
      platform: parsed.platform ? sanitizeString(parsed.platform) : undefined,
    };

    const provider = getAIProvider();
    return provider.generateAdCreative(sanitizedInput);
  },

  generateAudience: async (userId: string, rawInput: unknown): Promise<GenerateAudienceOutput> => {
    checkRateLimit(userId);
    const parsed = generateAudienceInputSchema.parse(rawInput);
    const sanitizedInput: GenerateAudienceInput = {
      title: sanitizeString(parsed.title),
      category: sanitizeString(parsed.category),
      summary: parsed.summary ? sanitizeString(parsed.summary) : undefined,
    };

    const provider = getAIProvider();
    return provider.generateAudience(sanitizedInput);
  },
};
