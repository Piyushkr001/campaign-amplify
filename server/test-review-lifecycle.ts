import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq } from 'drizzle-orm';
import type { Server } from 'http';
import { resolveDemoCreatorId, resolveDemoReviewerId, DEMO_CREATOR_EMAIL, DEMO_REVIEWER_EMAIL } from './src/utils/demo-identity';
import { AuthService } from './src/modules/auth/auth.service';

async function runReviewLifecycleTest() {
  console.log('========================================================');
  console.log('STARTING FULL REVIEW & LIFECYCLE INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5097;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  let testCampaignId: string | null = null;
  const db = getDb();

  const creatorId = await resolveDemoCreatorId();
  const reviewerId = await resolveDemoReviewerId();
  const creatorToken = AuthService.signToken({ sub: creatorId, email: DEMO_CREATOR_EMAIL, role: 'USER' });
  const reviewerToken = AuthService.signToken({ sub: reviewerId, email: DEMO_REVIEWER_EMAIL, role: 'REVIEWER' });
  const creatorHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${creatorToken}` };
  const reviewerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${reviewerToken}` };

  try {
    // 1. Create Backend Draft (mode = NEW)
    console.log('[STAGE 1] Creator: Create backend DRAFT...');
    const createRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ title: 'Autonomous Air Quality Monitoring Network' }),
    });
    assert.equal(createRes.status, 201, 'POST /campaigns must return 201');
    const createJson = await createRes.json();
    testCampaignId = createJson.data?.id;
    assert.ok(testCampaignId, 'Must return a server UUID');
    assert.equal(createJson.data?.status, 'DRAFT', 'Initial status must be DRAFT');
    console.log('  Created server DRAFT UUID:', testCampaignId);

    // 2. Save Basics
    console.log('\n[STAGE 2] Creator: Save Step 1 (Basics)...');
    const basicsRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/basics`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        title: 'Autonomous Air Quality Monitoring Network',
        category: 'Environment',
        creatorName: 'Civic Sensor Alliance',
        summary: 'Deploying high-density particulate matter sensors and public awareness ads across 15 transit corridors.',
        coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
      }),
    });
    assert.equal(basicsRes.status, 200, 'PATCH /basics must return 200');
    console.log('  Basics persisted.');

    // 3. Save Story & Sources
    console.log('\n[STAGE 3] Creator: Save Step 2 (Story & Sources)...');
    const storyRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/story`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        storyHeadline: 'Real-time Toxic Particulate Tracking for Commuters',
        storyIntro: 'Urban air pollution spikes during morning commutes are severely under-reported.',
        storyContent: 'By installing low-cost laser particulate sensors at bus stops and commuter train stations, our open-hardware network provides neighborhood-level air quality indices. This amplification campaign funds geo-targeted notifications and public service displays to inform transit riders about peak exposure windows and encourage municipal transition to zero-emission bus fleets.',
        sources: [
          {
            title: 'World Health Organization Global Air Quality Guidelines',
            url: 'https://who.int/air-quality-guidelines',
            publisher: 'World Health Organization',
          },
        ],
      }),
    });
    assert.equal(storyRes.status, 200, 'PATCH /story must return 200');
    console.log('  Story and verified sources persisted.');

    // 4. Save Visuals & Creative
    console.log('\n[STAGE 4] Creator: Save Step 3 (Visuals & Ad Creative)...');
    const visualsRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/visuals`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        adHeadline: 'Check Today’s Commute Air Quality Index',
        adDescription: 'Live sensor alerts and health advisories for city transit riders.',
        adCTA: 'View Air Map',
        adImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
      }),
    });
    assert.equal(visualsRes.status, 200, 'PATCH /visuals must return 200');
    console.log('  Visuals & ad creative persisted.');

    // 5. Save Reach
    console.log('\n[STAGE 5] Creator: Save Step 4 (Reach & Targeting)...');
    const reachRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/reach`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        locations: ['Metro Area', 'Transit Corridors'],
        interests: ['Public Health', 'Clean Energy', 'Commuter Transit'],
        channels: ['Meta Targeted Ads', 'Transit Display Inventory'],
        audienceDescription: 'Daily commuters, parents, and urban transit riders',
        durationDays: 30,
      }),
    });
    assert.equal(reachRes.status, 200, 'PATCH /reach must return 200');
    console.log('  Reach & targeting persisted.');

    // 6. Creator: Submit for Review
    console.log('\n[STAGE 6] Creator: Submit campaign (POST /submit)...');
    const submitRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/submit`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ fundingGoal: 12000 }),
    });
    assert.equal(submitRes.status, 200, 'POST /submit must return 200');
    const submitJson = await submitRes.json();
    assert.equal(submitJson.data?.status, 'SUBMITTED_FOR_REVIEW', 'Status must be SUBMITTED_FOR_REVIEW');
    assert.equal(submitJson.data?.id, testCampaignId, 'Must keep the SAME UUID');
    console.log('  Campaign submitted -> status: SUBMITTED_FOR_REVIEW');

    // 7. Verify in Creator Dashboard API (GET /me/campaigns)
    console.log('\n[STAGE 7] Creator Dashboard: Check GET /me/campaigns and GET /me/campaigns/:id...');
    const creatorListRes = await fetch(`${BASE_URL}/me/campaigns`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(creatorListRes.status, 200, 'GET /me/campaigns must return 200');
    const creatorListJson = await creatorListRes.json();
    const foundInCreatorList = creatorListJson.data?.find((c: any) => c.id === testCampaignId);
    assert.ok(foundInCreatorList, 'Campaign must appear in Creator Dashboard API');
    assert.equal(foundInCreatorList.status, 'SUBMITTED_FOR_REVIEW');

    const creatorDetailRes = await fetch(`${BASE_URL}/me/campaigns/${testCampaignId}`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    assert.equal(creatorDetailRes.status, 200, 'GET /me/campaigns/:id must return 200');
    const creatorDetailJson = await creatorDetailRes.json();
    assert.equal(creatorDetailJson.data?.id, testCampaignId);
    assert.equal(creatorDetailJson.data?.status, 'SUBMITTED_FOR_REVIEW');
    console.log('  Creator APIs accurately reflect SUBMITTED_FOR_REVIEW.');

    // 8. Reviewer Queue Inspection (GET /review/campaigns)
    console.log('\n[STAGE 8] Reviewer: Check GET /review/campaigns...');
    const queueRes = await fetch(`${BASE_URL}/review/campaigns`, {
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert.equal(queueRes.status, 200, 'GET /review/campaigns must return 200');
    const queueJson = await queueRes.json();
    const foundInQueue = queueJson.data?.find((c: any) => c.id === testCampaignId);
    assert.ok(foundInQueue, 'Campaign must appear in Reviewer Queue');
    assert.equal(foundInQueue.status, 'SUBMITTED_FOR_REVIEW');
    console.log('  Campaign present in Reviewer Queue.');

    // 9. Reviewer: Start Review
    console.log('\n[STAGE 9] Reviewer: Start review (POST /review/campaigns/:id/start)...');
    const startRes = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert.equal(startRes.status, 200, 'Start review must return 200');
    const startJson = await startRes.json();
    assert.equal(startJson.data?.status, 'UNDER_REVIEW', 'Status must transition to UNDER_REVIEW');
    assert.ok(startJson.data?.reviewStartedAt, 'reviewStartedAt must be set');
    console.log('  Review started -> status: UNDER_REVIEW');

    // 10. Reviewer: Request Changes
    console.log('\n[STAGE 10] Reviewer: Request changes (POST /review/campaigns/:id/request-changes)...');
    const FEEDBACK_TEXT = 'Please provide an additional peer-reviewed sensor calibration source and clarify transit agency permissions.';
    const reqChangesRes = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/request-changes`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ feedback: FEEDBACK_TEXT }),
    });
    assert.equal(reqChangesRes.status, 200, 'Request changes must return 200');
    const reqChangesJson = await reqChangesRes.json();
    assert.equal(reqChangesJson.data?.status, 'CHANGES_REQUESTED', 'Status must transition to CHANGES_REQUESTED');
    assert.ok(reqChangesJson.data?.requestedChangesAt, 'requestedChangesAt must be set');
    console.log('  Changes requested -> status: CHANGES_REQUESTED');

    // 11. Creator: Verify Reviewer Feedback in Creator API
    console.log('\n[STAGE 11] Creator: Verify reviewer feedback appears on GET /me/campaigns/:id...');
    const revFeedbackRes = await fetch(`${BASE_URL}/me/campaigns/${testCampaignId}`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
    });
    const revFeedbackJson = await revFeedbackRes.json();
    assert.equal(revFeedbackJson.data?.status, 'CHANGES_REQUESTED');
    assert.equal(revFeedbackJson.data?.reviewFeedback, FEEDBACK_TEXT, 'Creator must see exact feedback text');
    console.log('  Reviewer feedback verified in Creator detail API.');

    // 12. Creator: Edit Campaign Story during Revision (Same UUID, mode REVISION)
    console.log('\n[STAGE 12] Creator: Revision edit on same UUID (PATCH /story)...');
    const revStoryRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/story`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        storyHeadline: 'Real-time Toxic Particulate Tracking for Commuters',
        storyIntro: 'Urban air pollution spikes during morning commutes are severely under-reported.',
        storyContent: 'UPDATED: By installing low-cost laser particulate sensors at bus stops and commuter train stations, our open-hardware network provides neighborhood-level air quality indices. Calibration against reference-grade EPA BAM-1020 monitors is published open-source.',
        sources: [
          {
            title: 'World Health Organization Global Air Quality Guidelines',
            url: 'https://who.int/air-quality-guidelines',
            publisher: 'World Health Organization',
          },
          {
            title: 'Atmospheric Measurement Techniques - Low Cost Optical Sensor Calibration',
            url: 'https://amt.copernicus.org/articles/14/5678',
            publisher: 'Copernicus Publications',
          },
        ],
      }),
    });
    assert.equal(revStoryRes.status, 200, 'Revision PATCH /story must return 200');
    console.log('  Revision edits saved to PostgreSQL.');

    // 13. Creator: Resubmit Campaign (Same UUID)
    console.log('\n[STAGE 13] Creator: Resubmit campaign (POST /submit)...');
    const resubmitRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/submit`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ fundingGoal: 12000 }),
    });
    assert.equal(resubmitRes.status, 200, 'Resubmit must return 200');
    const resubmitJson = await resubmitRes.json();
    assert.equal(resubmitJson.data?.status, 'SUBMITTED_FOR_REVIEW');
    assert.equal(resubmitJson.data?.id, testCampaignId, 'Must keep the exact same UUID');
    console.log('  Resubmitted -> status: SUBMITTED_FOR_REVIEW');

    // 14. Reviewer: Start Review (2nd Round)
    console.log('\n[STAGE 14] Reviewer: Start 2nd review round (POST /start)...');
    const start2Res = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert.equal(start2Res.status, 200, 'Start review round 2 must return 200');
    const start2Json = await start2Res.json();
    assert.equal(start2Json.data?.status, 'UNDER_REVIEW');
    console.log('  Under review again.');

    // 15. Reviewer: Approve Campaign
    console.log('\n[STAGE 15] Reviewer: Approve campaign (POST /approve)...');
    const approveRes = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/approve`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Calibration citations verified and methodology approved.' }),
    });
    assert.equal(approveRes.status, 200, 'Approve must return 200');
    const approveJson = await approveRes.json();
    assert.equal(approveJson.data?.status, 'APPROVED', 'Status must transition to APPROVED');
    assert.ok(approveJson.data?.approvedAt, 'approvedAt must be set');
    console.log('  Approved -> status: APPROVED');

    // 16. Reviewer / Admin: Start Funding (Publish to Live Community Backing)
    console.log('\n[STAGE 16] Reviewer/Admin: Publish to public funding (POST /start-funding)...');
    const fundingRes = await fetch(`${BASE_URL}/review/campaigns/${testCampaignId}/start-funding`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Campaign launched into public community amplification backing.' }),
    });
    assert.equal(fundingRes.status, 200, 'Start funding must return 200');
    const fundingJson = await fundingRes.json();
    assert.equal(fundingJson.data?.status, 'FUNDING', 'Status must transition to FUNDING');
    assert.ok(fundingJson.data?.fundingStartedAt, 'fundingStartedAt must be set');
    console.log('  Published to funding -> status: FUNDING');

    // 17. Public Visibility Verification
    console.log('\n[STAGE 17] Public Explore: Verify campaign is visible on public GET /campaigns...');
    const publicRes = await fetch(`${BASE_URL}/campaigns`);
    assert.equal(publicRes.status, 200, 'Public GET /campaigns must return 200');
    const publicJson = await publicRes.json();
    const foundInPublic = publicJson.data?.find((c: any) => c.id === testCampaignId);
    assert.ok(foundInPublic, 'Approved and FUNDING campaign must be visible publicly on Explore');
    assert.equal(foundInPublic.status, 'FUNDING');
    console.log('  Campaign is now publicly visible in Explore with status FUNDING.');

    // 18. Database Integrity Verification (Same UUID, single row, complete history)
    console.log('\n[STAGE 18] Neon Database Verification: Single row, history sequence, review records...');
    const campRows = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, testCampaignId as any));
    assert.equal(campRows.length, 1, 'MUST HAVE EXACTLY ONE CAMPAIGN ROW (No duplicate)');
    const campRow = campRows[0];
    assert.equal(campRow.status, 'FUNDING', 'Final DB row status must be FUNDING');
    assert.ok(campRow.submittedAt, 'submittedAt must be present');
    assert.ok(campRow.reviewStartedAt, 'reviewStartedAt must be present');
    assert.ok(campRow.requestedChangesAt, 'requestedChangesAt must be present');
    assert.ok(campRow.approvedAt, 'approvedAt must be present');
    assert.ok(campRow.fundingStartedAt, 'fundingStartedAt must be present');

    // Verify Review Records
    const reviewsInDb = await db
      .select()
      .from(schema.campaignReviews)
      .where(eq(schema.campaignReviews.campaignId, testCampaignId as any))
      .orderBy(schema.campaignReviews.createdAt);
    assert.equal(reviewsInDb.length, 2, 'Exactly 2 review records must exist (CHANGES_REQUESTED and APPROVED)');
    assert.equal(reviewsInDb[0].decision, 'CHANGES_REQUESTED');
    assert.equal(reviewsInDb[0].feedback, FEEDBACK_TEXT);
    assert.equal(reviewsInDb[1].decision, 'APPROVED');
    console.log('  campaign_reviews table contains accurate editorial history.');

    // Verify Status History Sequence
    const historyInDb = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(eq(schema.campaignStatusHistory.campaignId, testCampaignId as any))
      .orderBy(schema.campaignStatusHistory.createdAt);

    const statusTransitions = historyInDb.map((h) => `${h.fromStatus || 'NULL'} -> ${h.toStatus}`);
    console.log('  Status history sequence:', statusTransitions);
    assert.ok(historyInDb.length >= 8, 'Full lifecycle audit trail must be recorded');
    assert.equal(historyInDb[historyInDb.length - 1].toStatus, 'FUNDING', 'Latest event must be FUNDING');

    // 19. State Machine Protection Check: Disallow invalid edits/transitions
    console.log('\n[STAGE 19] Testing State Machine Protection (Disallow creator editing while FUNDING)...');
    const invalidEditRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/basics`, {
      method: 'PATCH',
      headers: creatorHeaders,
      body: JSON.stringify({
        title: 'Hacked Title While Funding',
        category: 'Environment',
        creatorName: 'Attacker',
        summary: 'Cannot mutate an active funding campaign.',
      }),
    });
    assert.equal(invalidEditRes.status, 400, 'Direct PATCH on FUNDING campaign must be rejected');
    const invalidEditJson = await invalidEditRes.json();
    assert.equal(invalidEditJson.error?.code, 'INVALID_CAMPAIGN_STATUS');
    console.log('  State machine enforced: creator step APIs blocked for FUNDING campaign.');

    console.log('\n========================================================');
    console.log('FULL REVIEW & LIFECYCLE TEST SUITE PASSED (100% SUCCESS)');
    console.log('========================================================');
  } finally {
    if (testCampaignId) {
      console.log(`\n[Cleanup] Deleting test campaign ${testCampaignId} from Neon...`);
      try {
        await db.delete(schema.campaigns).where(eq(schema.campaigns.id, testCampaignId as any));
        console.log('[Cleanup] Test campaign cleanly removed from database.');
      } catch (err) {
        console.warn('[Cleanup] Failed to clean up campaign:', err);
      }
    }
    server.close();
  }
}

runReviewLifecycleTest().catch((err) => {
  console.error('\n❌ Review Lifecycle Test Failed:', err);
  process.exit(1);
});
