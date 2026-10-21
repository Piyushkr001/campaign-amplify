import assert from 'node:assert/strict';
import { createApp } from './src/app';
import type { Server } from 'http';
import { AuthService } from './src/modules/auth/auth.service';
import { AIService } from './src/modules/ai/ai.service';

async function runAITestSuite() {
  console.log('========================================================');
  console.log('STARTING AI DRAFTING INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5098;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  try {
    const userToken = AuthService.signToken({
      sub: '00000000-0000-4000-8000-000000000099',
      email: 'creator@ai-test.org',
      role: 'USER',
    });

    const userHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    };

    // [TEST 1] Auth Guard
    console.log('[TEST 1] Verifying Auth Guard on AI Endpoints (401 without Bearer)...');
    const noAuthRes = await fetch(`${BASE_URL}/ai/campaign/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Clean Water Everywhere', category: 'Environment' }),
    });
    assert.equal(noAuthRes.status, 401, 'Unauthenticated AI request must be rejected with 401');
    console.log('  Auth guard verified: 401 returned for unauthenticated request.');

    // [TEST 2] Input Validation (Title too short)
    console.log('\n[TEST 2] Verifying Input Validation (Title < 5 chars rejected with 400)...');
    const invalidInputRes = await fetch(`${BASE_URL}/ai/campaign/summary`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({ title: 'Tiny', category: 'Environment' }),
    });
    assert.equal(invalidInputRes.status, 400, 'Invalid title length must return 400');
    console.log('  Validation verified: short title rejected with 400.');

    // [TEST 3] Summary Generation (/campaign/summary & /summary)
    console.log('\n[TEST 3] Testing POST /ai/campaign/summary...');
    const summaryRes = await fetch(`${BASE_URL}/ai/campaign/summary`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        title: 'Restore Urban Green Spaces',
        category: 'Environment',
        keyPoints: ['Plant 5,000 trees', 'Create community gardens'],
        tone: 'inspirational',
      }),
    });
    assert.equal(summaryRes.status, 200, 'Summary endpoint must return 200');
    const summaryJson = await summaryRes.json();
    assert.ok(summaryJson.success, 'Response success must be true');
    assert.ok(summaryJson.data.summary, 'Summary text must be present');
    assert.ok(
      summaryJson.data.summary.length >= 20 && summaryJson.data.summary.length <= 240,
      `Summary length (${summaryJson.data.summary.length}) must be between 20 and 240 chars`
    );
    assert.ok(Array.isArray(summaryJson.data.keywords), 'Keywords array must be present');
    assert.ok(summaryJson.data.keywords.length >= 1, 'At least 1 keyword must be returned');
    console.log('  Summary generation verified:', {
      length: summaryJson.data.summary.length,
      sample: summaryJson.data.summary.slice(0, 60) + '...',
      keywords: summaryJson.data.keywords,
    });

    // Test alias route /ai/summary
    const summaryAliasRes = await fetch(`${BASE_URL}/ai/summary`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        title: 'Restore Urban Green Spaces',
        category: 'Environment',
      }),
    });
    assert.equal(summaryAliasRes.status, 200, 'Alias /ai/summary must return 200');
    console.log('  Alias /ai/summary route verified.');

    // [TEST 4] Story Generation (/campaign/story)
    console.log('\n[TEST 4] Testing POST /ai/campaign/story...');
    const storyRes = await fetch(`${BASE_URL}/ai/campaign/story`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        title: 'Protect Local Pollinators',
        category: 'Environment',
        summary: 'Help fund pollinator corridors across suburban communities.',
        impactGoal: 'Protect 100 acres of bee habitats.',
        tone: 'inspirational',
      }),
    });
    assert.equal(storyRes.status, 200, 'Story endpoint must return 200');
    const storyJson = await storyRes.json();
    const { headline, intro, story, callToAction } = storyJson.data;
    assert.ok(headline && headline.length >= 5 && headline.length <= 100, 'Headline length 5-100');
    assert.ok(intro && intro.length >= 20 && intro.length <= 500, 'Intro length 20-500');
    assert.ok(story && story.length >= 100 && story.length <= 5000, 'Story length 100-5000');
    assert.ok(callToAction && callToAction.length >= 5 && callToAction.length <= 100, 'CTA length 5-100');
    console.log('  Story generation verified:');
    console.log('    Headline:', headline);
    console.log('    Intro length:', intro.length);
    console.log('    Story length:', story.length);
    console.log('    CTA:', callToAction);

    // [TEST 5] Ad Creative Generation (/campaign/ad-creative)
    console.log('\n[TEST 5] Testing POST /ai/campaign/ad-creative...');
    const adRes = await fetch(`${BASE_URL}/ai/campaign/ad-creative`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        title: 'Youth Coding Bootcamps in Every Public School',
        summary: 'Equipping underrepresented students with modern software engineering skills.',
        targetAudience: 'Parents, educators, and tech advocates',
        platform: 'Meta',
      }),
    });
    assert.equal(adRes.status, 200, 'Ad creative endpoint must return 200');
    const adJson = await adRes.json();
    const adData = adJson.data;
    assert.ok(adData.headline && adData.headline.length >= 5 && adData.headline.length <= 60, 'Ad headline 5-60');
    assert.ok(adData.description && adData.description.length >= 10 && adData.description.length <= 150, 'Ad description 10-150');
    assert.ok(adData.callToAction && adData.callToAction.length >= 2 && adData.callToAction.length <= 25, 'Ad CTA 2-25');
    assert.ok(adData.visualConcept && adData.visualConcept.length >= 10, 'Visual concept present');
    console.log('  Ad Creative generation verified:', {
      headline: adData.headline,
      description: adData.description,
      cta: adData.callToAction,
    });

    // [TEST 6] Audience & Targeting Generation (/campaign/audience)
    console.log('\n[TEST 6] Testing POST /ai/campaign/audience...');
    const audRes = await fetch(`${BASE_URL}/ai/campaign/audience`, {
      method: 'POST',
      headers: userHeaders,
      body: JSON.stringify({
        title: 'Community Mental Health Walk-in Center',
        category: 'Healthcare',
        summary: 'Opening 24/7 accessible mental health support in our downtown district.',
      }),
    });
    assert.equal(audRes.status, 200, 'Audience endpoint must return 200');
    const audJson = await audRes.json();
    const audData = audJson.data;
    assert.ok(audData.audienceDescription && audData.audienceDescription.length >= 20, 'Audience description length >= 20');
    assert.ok(Array.isArray(audData.interests) && audData.interests.length >= 1, 'Interests array >= 1');
    assert.ok(Array.isArray(audData.suggestedChannels) && audData.suggestedChannels.length >= 1, 'Channels array >= 1');
    console.log('  Audience generation verified:', {
      interests: audData.interests,
      suggestedChannels: audData.suggestedChannels,
      geographicFocus: audData.geographicFocus,
    });

    // [TEST 7] Rate Limiting Enforcement
    console.log('\n[TEST 7] Testing Per-User Rate Limiting (exceeding 30 requests)...');
    AIService.resetRateLimits();
    const rateLimitToken = AuthService.signToken({
      sub: '00000000-0000-4000-8000-000000000077',
      email: 'ratelimit@ai-test.org',
      role: 'USER',
    });
    const rlHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${rateLimitToken}` };

    let hitRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${BASE_URL}/ai/campaign/summary`, {
        method: 'POST',
        headers: rlHeaders,
        body: JSON.stringify({ title: `Rate limit test campaign ${i}`, category: 'Democracy' }),
      });
      if (res.status === 429) {
        hitRateLimit = true;
        const errJson = await res.json();
        assert.equal(errJson.error?.code, 'RATE_LIMIT_EXCEEDED');
        break;
      }
    }
    assert.ok(hitRateLimit, 'Rate limit of 30 req/min must be triggered with HTTP 429');
    console.log('  Rate limiting verified: 429 RATE_LIMIT_EXCEEDED received after threshold.');

    console.log('\n========================================================');
    console.log('ALL AI DRAFTING INTEGRATION TESTS PASSED (100% SUCCESS)');
    console.log('========================================================\n');
  } finally {
    AIService.resetRateLimits();
    server.close();
  }
}

runAITestSuite().catch((err) => {
  console.error('AI Test Suite FAILED:', err);
  process.exit(1);
});
