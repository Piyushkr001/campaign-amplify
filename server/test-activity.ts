import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq, inArray } from 'drizzle-orm';
import type { Server } from 'http';
import { AuthService } from './src/modules/auth/auth.service';
import { resolveDemoCreatorId, resolveDemoReviewerId, resolveDemoBackerId } from './src/utils/demo-identity';

async function runActivityTest() {
  console.log('========================================================');
  console.log('STARTING SERVER-BACKED ACTIVITY INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5098;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  const db = getDb();
  let testCampaignId: string | null = null;
  const createdUserIds: string[] = [];

  try {
    // 1. Resolve actors
    const creatorId = await resolveDemoCreatorId();
    const reviewerId = await resolveDemoReviewerId();
    const backerId = await resolveDemoBackerId();

    const creatorToken = AuthService.signToken({ sub: creatorId, email: 'creator@activity.test', role: 'USER' });
    const reviewerToken = AuthService.signToken({ sub: reviewerId, email: 'reviewer@activity.test', role: 'REVIEWER' });
    const backerToken = AuthService.signToken({ sub: backerId, email: 'backer@activity.test', role: 'USER' });

    const creatorHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${creatorToken}` };
    const reviewerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${reviewerToken}` };
    const backerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${backerToken}` };

    // 2. Unauthenticated request to /me/activity must fail with 401
    console.log('[STAGE 1] Testing Auth Guard: GET /me/activity without token...');
    const unauthRes = await fetch(`${BASE_URL}/me/activity`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated request must return 401');
    console.log('  Auth guard verified (401 returned).');

    // 3. Creator creates campaign draft
    console.log('\n[STAGE 2] Creator creates a new campaign DRAFT...');
    const createRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ title: 'Activity Stream Test Campaign' }),
    });
    assert.equal(createRes.status, 201, 'POST /campaigns must return 201');
    const createJson = await createRes.json();
    testCampaignId = createJson.data?.id;
    assert.ok(testCampaignId, 'Must return created campaign UUID');
    console.log('  Created campaign:', testCampaignId);

    // Populate required campaign fields
    await fetch(`${BASE_URL}/campaigns/${testCampaignId}/basics`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        title: 'Activity Stream Test Campaign',
        category: 'Environment',
        creatorName: 'Activity Alliance',
        summary: 'Verifying real-time server-backed user activity generation.',
        coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
      }),
    });
    await fetch(`${BASE_URL}/campaigns/${testCampaignId}/story`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        storyHeadline: 'Real-time Toxic Particulate Tracking for Commuters',
        storyIntro: 'Urban air pollution spikes during morning commutes are severely under-reported.',
        storyContent: 'By installing low-cost laser particulate sensors at bus stops and commuter train stations, our open-hardware network provides neighborhood-level air quality indices.',
        sources: [
          {
            title: 'World Health Organization Global Air Quality Guidelines',
            url: 'https://who.int/air-quality-guidelines',
            publisher: 'World Health Organization',
          },
        ],
      }),
    });
    await fetch(`${BASE_URL}/campaigns/${testCampaignId}/visuals`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        adHeadline: 'Check Today’s Commute Air Quality Index',
        adDescription: 'Live sensor alerts and health advisories for city transit riders.',
        adCTA: 'View Air Map',
        adImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
      }),
    });
    await fetch(`${BASE_URL}/campaigns/${testCampaignId}/reach`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        locations: ['Metro Area'],
        interests: ['Clean Energy'],
        channels: ['Meta Targeted Ads'],
        audienceDescription: 'Daily commuters, parents, and urban transit riders',
        durationDays: 14,
      }),
    });

    // 4. Submit for review
    console.log('\n[STAGE 3] Creator submits campaign for review...');
    const submitRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/submit`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ fundingGoal: 100 }),
    });
    assert.equal(submitRes.status, 200, 'POST /submit must return 200');

    // 5. Reviewer claims, approves and launches campaign to FUNDING
    console.log('\n[STAGE 4] Reviewer starts review, approves, and launches campaign to FUNDING...');
    const startRes = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/start`, {
      method: 'POST',
      headers: reviewerHeaders,
    });
    assert.equal(startRes.status, 200, 'Start review must return 200');

    const approveRes = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/approve`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Campaign approved for community funding.' }),
    });
    assert.equal(approveRes.status, 200, 'Approve must return 200');

    const launchRes = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/start-funding`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Public funding launched.' }),
    });
    assert.equal(launchRes.status, 200, 'Start funding must return 200');

    // 6. Backer makes contribution that reaches funding goal ($100)
    console.log('\n[STAGE 5] Backer contributes $100 (reaching funding goal)...');
    const contribRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/contributions`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({
        amount: 100,
        backerName: 'Activity Backer',
        isAnonymous: false,
      }),
    });
    assert.equal(contribRes.status, 201, 'POST /campaigns/:id/contributions must return 201');
    const contribJson = await contribRes.json();
    const contributionId = contribJson.data?.id;
    assert.ok(contributionId, 'Must return contribution id');

    // Confirm payment via simulation
    const confirmRes = await fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({
        contributionId,
        outcome: 'SUCCESS',
        cardLast4: '4242',
      }),
    });
    assert.equal(confirmRes.status, 200, 'POST /payments/simulate must return 200');
    console.log('  Contribution confirmed and goal reached!');

    // 7. Check Reviewer/Admin advances to DISTRIBUTION_PREPARATION
    console.log('\n[STAGE 6] Reviewer advances campaign to DISTRIBUTION_PREPARATION...');
    const prepRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/prepare-distribution`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Preparing creatives and channel slots' }),
    });
    assert.equal(prepRes.status, 200, 'prepare-distribution must return 200');

    // 8. Test Creator's Activity Feed
    console.log('\n[STAGE 7] Fetching Creator Activity feed (GET /me/activity)...');
    const creatorActivityRes = await fetch(`${BASE_URL}/me/activity`, {
      headers: creatorHeaders,
    });
    assert.equal(creatorActivityRes.status, 200, 'GET /me/activity must return 200 for creator');
    const creatorActivityJson = await creatorActivityRes.json();
    const creatorEvents = creatorActivityJson.data?.events;
    assert.ok(Array.isArray(creatorEvents), 'Creator activity events must be an array');
    console.log(`  Creator received ${creatorEvents.length} activity events.`);

    // Check that creator events belong to creator's campaign
    const relevantCreatorEvents = creatorEvents.filter((e: any) => e.campaignId === testCampaignId);
    assert.ok(relevantCreatorEvents.length >= 4, 'Creator must have at least 4 events for this campaign');

    const creatorEventTypes = relevantCreatorEvents.map((e: any) => e.type);
    console.log('  Creator event types found:', creatorEventTypes);
    assert.ok(creatorEventTypes.includes('CAMPAIGN_DRAFT_CREATED'), 'Must include CAMPAIGN_DRAFT_CREATED');
    assert.ok(creatorEventTypes.includes('CAMPAIGN_SUBMITTED'), 'Must include CAMPAIGN_SUBMITTED');
    assert.ok(creatorEventTypes.includes('CAMPAIGN_APPROVED'), 'Must include CAMPAIGN_APPROVED');
    assert.ok(creatorEventTypes.includes('FUNDING_GOAL_REACHED'), 'Must include FUNDING_GOAL_REACHED');

    // Verify ordering: newest first
    for (let i = 0; i < creatorEvents.length - 1; i++) {
      const current = new Date(creatorEvents[i].createdAt).getTime();
      const next = new Date(creatorEvents[i + 1].createdAt).getTime();
      assert.ok(current >= next, `Events must be ordered newest first (index ${i})`);
    }
    console.log('  Creator events verified: correctly ordered newest first.');

    // 9. Test Backer's Activity Feed
    console.log('\n[STAGE 8] Fetching Backer Activity feed (GET /me/activity)...');
    const backerActivityRes = await fetch(`${BASE_URL}/me/activity`, {
      headers: backerHeaders,
    });
    assert.equal(backerActivityRes.status, 200, 'GET /me/activity must return 200 for backer');
    const backerActivityJson = await backerActivityRes.json();
    const backerEvents = backerActivityJson.data?.events;
    assert.ok(Array.isArray(backerEvents), 'Backer activity events must be an array');

    const backerContributionEvents = backerEvents.filter((e: any) => e.campaignId === testCampaignId);
    console.log(`  Backer received ${backerContributionEvents.length} events for this campaign.`);
    assert.ok(backerContributionEvents.length >= 1, 'Backer must have contribution event');
    assert.ok(
      backerContributionEvents.some((e: any) => e.type === 'CONTRIBUTION_CONFIRMED'),
      'Backer must see CONTRIBUTION_CONFIRMED'
    );

    // Verify Backer DOES NOT see Creator's private draft/submit lifecycle events
    const backerSawCreatorDraft = backerContributionEvents.some((e: any) => e.type === 'CAMPAIGN_DRAFT_CREATED');
    assert.equal(backerSawCreatorDraft, false, 'Backer must NOT see creator draft events for campaigns they do not own');
    console.log('  Data isolation verified: backer only sees authorized contribution events.');

    // 10. Pagination test: limit and offset
    console.log('\n[STAGE 9] Testing Activity pagination (limit=2, offset=0)...');
    const page1Res = await fetch(`${BASE_URL}/me/activity?limit=2&offset=0`, { headers: creatorHeaders });
    assert.equal(page1Res.status, 200);
    const page1Json = await page1Res.json();
    assert.equal(page1Json.data?.events.length, 2, 'Limit 2 must return exactly 2 items');

    const page2Res = await fetch(`${BASE_URL}/me/activity?limit=2&offset=2`, { headers: creatorHeaders });
    assert.equal(page2Res.status, 200);
    const page2Json = await page2Res.json();
    assert.notEqual(page1Json.data?.events[0].id, page2Json.data?.events[0].id, 'Page 2 must have different items');
    console.log('  Pagination verified.');

    console.log('\n========================================================');
    console.log('SERVER-BACKED ACTIVITY TEST PASSED (100% SUCCESS)');
    console.log('========================================================\n');
  } finally {
    if (testCampaignId) {
      console.log(`[Teardown] Cleaning up test campaign ${testCampaignId}...`);
      try {
        const contribs = await db.select({ id: schema.contributions.id }).from(schema.contributions).where(eq(schema.contributions.campaignId, testCampaignId));
        for (const c of contribs) {
          await db.delete(schema.payments).where(eq(schema.payments.contributionId, c.id));
        }
        await db.delete(schema.contributions).where(eq(schema.contributions.campaignId, testCampaignId));
        await db.delete(schema.campaignStatusHistory).where(eq(schema.campaignStatusHistory.campaignId, testCampaignId));
        await db.delete(schema.campaignReviews).where(eq(schema.campaignReviews.campaignId, testCampaignId));
        await db.delete(schema.campaigns).where(eq(schema.campaigns.id, testCampaignId));
        console.log('[Teardown] Test campaign cleanly removed.');
      } catch (err) {
        console.warn('[Teardown] Cleanup warning:', err);
      }
    }
    server.close();
  }
}

runActivityTest().catch((err) => {
  console.error('\n❌ Activity Test Failed:', err);
  process.exit(1);
});
