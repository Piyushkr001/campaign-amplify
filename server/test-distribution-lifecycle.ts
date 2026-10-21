import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq, and } from 'drizzle-orm';
import type { Server } from 'http';
import { AuthService } from './src/modules/auth/auth.service';
import { resolveDemoCreatorId, resolveDemoReviewerId } from './src/utils/demo-identity';

async function runDistributionLifecycleTest() {
  console.log('========================================================');
  console.log('STARTING DISTRIBUTION / PROMOTION LIFECYCLE TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5099;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  const db = getDb();
  let campaignId1: string | null = null;
  let campaignId2: string | null = null;

  try {
    const creatorId = await resolveDemoCreatorId();
    const reviewerId = await resolveDemoReviewerId();

    const creatorToken = AuthService.signToken({ sub: creatorId, email: 'creator@dist.test', role: 'USER' });
    const reviewerToken = AuthService.signToken({ sub: reviewerId, email: 'reviewer@dist.test', role: 'REVIEWER' });

    const creatorHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${creatorToken}` };
    const reviewerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${reviewerToken}` };

    // Helper to setup an approved FUNDING campaign directly
    const createFundingCampaign = async (title: string, amountRaised = 1000, fundingGoal = 1000) => {
      const [c] = await db
        .insert(schema.campaigns)
        .values({
          creatorId,
          title,
          category: 'Democracy',
          creatorName: 'Lifecycle Test Org',
          summary: 'Testing post-funding distribution transitions.',
          fundingGoal,
          amountRaised,
          distributionChannels: ['Meta', 'YouTube', 'Search'],
          durationDays: 30,
          status: 'FUNDING',
        } as any)
        .returning();
      return c.id;
    };

    // ==========================================
    // CAMPAIGN 1: HAPPY PATH TO COMPLETION
    // ==========================================
    console.log('[BRANCH 1] Testing Happy Path: FUNDING → FUNDING_GOAL_REACHED → PREP → PROMOTING → COMPLETED...');
    campaignId1 = await createFundingCampaign('Clean Water Access Awareness Campaign');
    console.log('  Created test campaign 1 in FUNDING status:', campaignId1);

    // 1. Advance to FUNDING_GOAL_REACHED (using transitionCampaign via repo or simulation)
    // Notice transitionCampaign allows FUNDING -> FUNDING_GOAL_REACHED
    await db
      .update(schema.campaigns)
      .set({ status: 'FUNDING_GOAL_REACHED', fundingGoalReachedAt: new Date() })
      .where(eq(schema.campaigns.id, campaignId1));

    // 2. Role Guard: USER cannot call prepare-distribution (must return 403)
    console.log('\n[STAGE 1] Testing Role Guard (USER role must be blocked with 403)...');
    const userRoleRes = await fetch(`${BASE_URL}/campaigns/${campaignId1}/prepare-distribution`, {
      method: 'POST',
      headers: creatorHeaders,
      body: JSON.stringify({ note: 'Unauthorized call by creator' }),
    });
    assert.equal(userRoleRes.status, 403, 'USER role must return 403 on reviewer distribution endpoints');
    console.log('  Role guard verified: 403 Forbidden returned for USER role.');

    // 3. Reviewer: Advance to DISTRIBUTION_PREPARATION
    console.log('\n[STAGE 2] Reviewer: POST /campaigns/:id/prepare-distribution...');
    const prepRes = await fetch(`${BASE_URL}/campaigns/${campaignId1}/prepare-distribution`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Creatives vetted and scheduled for ad platforms.' }),
    });
    assert.equal(prepRes.status, 200, 'prepare-distribution must return 200');
    const prepJson = await prepRes.json();
    assert.equal(prepJson.data?.status, 'DISTRIBUTION_PREPARATION');
    console.log('  Status is now DISTRIBUTION_PREPARATION.');

    // Verify DB timestamp
    const [c1AfterPrep] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, campaignId1));
    assert.ok(c1AfterPrep.distributionPreparationAt, 'distributionPreparationAt must be populated');

    // 4. Reviewer: Launch promotion (DISTRIBUTION_PREPARATION → PROMOTING)
    console.log('\n[STAGE 3] Reviewer: POST /campaigns/:id/start-promotion...');
    const promoRes = await fetch(`${BASE_URL}/campaigns/${campaignId1}/start-promotion`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Ads live across Meta and YouTube feeds.' }),
    });
    assert.equal(promoRes.status, 200, 'start-promotion must return 200');
    const promoJson = await promoRes.json();
    assert.equal(promoJson.data?.status, 'PROMOTING');

    const [c1AfterPromo] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, campaignId1));
    assert.ok(c1AfterPromo.promotionStartedAt, 'promotionStartedAt must be populated');
    console.log('  Status is now PROMOTING. promotionStartedAt set.');

    // 5. Invalid Transition check: Cannot call prepare-distribution while PROMOTING
    console.log('\n[STAGE 4] Testing Invalid Transition (cannot call prepare-distribution while PROMOTING)...');
    const invalidPrepRes = await fetch(`${BASE_URL}/campaigns/${campaignId1}/prepare-distribution`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Invalid backward transition' }),
    });
    assert.equal(invalidPrepRes.status, 400, 'Invalid transition must return 400');
    console.log('  Invalid transition correctly rejected with 400.');

    // 6. Reviewer: Complete promotion (PROMOTING → COMPLETED)
    console.log('\n[STAGE 5] Reviewer: POST /campaigns/:id/complete...');
    const completeRes = await fetch(`${BASE_URL}/campaigns/${campaignId1}/complete`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Flight finished. Impressions and engagement delivered.' }),
    });
    assert.equal(completeRes.status, 200, 'complete must return 200');
    const completeJson = await completeRes.json();
    assert.equal(completeJson.data?.status, 'COMPLETED');

    const [c1AfterComplete] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, campaignId1));
    assert.ok(c1AfterComplete.completedAt, 'completedAt timestamp must be populated');
    console.log('  Campaign successfully marked COMPLETED. completedAt set.');

    // 7. Verify status history audit trail
    console.log('\n[STAGE 6] Verifying campaign_status_history audit trail...');
    const history1 = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(eq(schema.campaignStatusHistory.campaignId, campaignId1));
    const historyStatuses = history1.map((h) => h.toStatus);
    console.log('  Status history records written:', historyStatuses);
    assert.ok(historyStatuses.includes('DISTRIBUTION_PREPARATION'), 'History must contain DISTRIBUTION_PREPARATION');
    assert.ok(historyStatuses.includes('PROMOTING'), 'History must contain PROMOTING');
    assert.ok(historyStatuses.includes('COMPLETED'), 'History must contain COMPLETED');
    console.log('  Audit trail verified.');

    // ==========================================
    // CAMPAIGN 2: ALTERNATIVE BRANCHES (FUNDING_ENDED & FAILED)
    // ==========================================
    console.log('\n[BRANCH 2] Testing Alternative Branches: FUNDING → FUNDING_ENDED and PROMOTING → FAILED...');
    campaignId2 = await createFundingCampaign('Expired and Failed Edge Test Campaign', 700, 1000);
    console.log('  Created test campaign 2 in FUNDING status (underfunded $700/$1000):', campaignId2);

    // A. End funding period before goal reached (FUNDING → FUNDING_ENDED)
    console.log('\n[STAGE 7] Reviewer: POST /campaigns/:id/end-funding...');
    const endRes = await fetch(`${BASE_URL}/campaigns/${campaignId2}/end-funding`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Campaign 30-day funding window expired.' }),
    });
    assert.equal(endRes.status, 200, 'end-funding must return 200');
    const endJson = await endRes.json();
    assert.equal(endJson.data?.status, 'FUNDING_ENDED');

    const [c2AfterEnd] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, campaignId2));
    assert.ok(c2AfterEnd.fundingEndedAt, 'fundingEndedAt must be populated');
    console.log('  Status is now FUNDING_ENDED. fundingEndedAt set.');

    // B. Advance FUNDING_ENDED to DISTRIBUTION_PREPARATION
    console.log('\n[STAGE 8] Reviewer advances FUNDING_ENDED → DISTRIBUTION_PREPARATION...');
    const prep2Res = await fetch(`${BASE_URL}/campaigns/${campaignId2}/prepare-distribution`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Proceeding with partial funding distribution.' }),
    });
    assert.equal(prep2Res.status, 200, 'prepare-distribution must accept FUNDING_ENDED');

    // C. Launch promotion
    await fetch(`${BASE_URL}/campaigns/${campaignId2}/start-promotion`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ note: 'Promotion started' }),
    });

    // D. Fail promotion requires reason
    console.log('\n[STAGE 9] Testing Fail without reason (must return 400)...');
    const failNoReasonRes = await fetch(`${BASE_URL}/campaigns/${campaignId2}/fail`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({}),
    });
    assert.equal(failNoReasonRes.status, 400, 'Failing without reason must return 400');
    console.log('  Validation enforced: reason is required to fail a campaign.');

    // E. Fail promotion with valid reason
    console.log('\n[STAGE 10] Reviewer: POST /campaigns/:id/fail with reason...');
    const failRes = await fetch(`${BASE_URL}/campaigns/${campaignId2}/fail`, {
      method: 'POST',
      headers: reviewerHeaders,
      body: JSON.stringify({ reason: 'Publisher policy rejection across ad networks.', note: 'Manual review override' }),
    });
    assert.equal(failRes.status, 200, 'fail must return 200 with valid reason');
    const failJson = await failRes.json();
    assert.equal(failJson.data?.status, 'FAILED');

    const [c2AfterFail] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, campaignId2));
    assert.ok(c2AfterFail.failedAt, 'failedAt must be set');

    const [failedHistory] = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(
        and(
          eq(schema.campaignStatusHistory.campaignId, campaignId2),
          eq(schema.campaignStatusHistory.toStatus, 'FAILED')
        )
      );
    assert.ok(failedHistory?.note?.includes('Publisher policy'), 'status history must store fail reason');
    console.log('  Campaign 2 successfully marked FAILED with reason stored in status history.');

    console.log('\n========================================================');
    console.log('DISTRIBUTION LIFECYCLE TEST PASSED (100% SUCCESS)');
    console.log('========================================================\n');
  } finally {
    console.log('[Teardown] Cleaning up test campaigns...');
    for (const cid of [campaignId1, campaignId2]) {
      if (cid) {
        try {
          const repRows = await db.select().from(schema.campaignReports).where(eq(schema.campaignReports.campaignId, cid));
          for (const rep of repRows) {
            await db.delete(schema.campaignChannelResults).where(eq(schema.campaignChannelResults.reportId, rep.id));
            await db.delete(schema.campaignReports).where(eq(schema.campaignReports.id, rep.id));
          }
          await db.delete(schema.campaignStatusHistory).where(eq(schema.campaignStatusHistory.campaignId, cid));
          await db.delete(schema.campaigns).where(eq(schema.campaigns.id, cid));
        } catch (err) {
          console.warn('[Teardown] Cleanup warning:', err);
        }
      }
    }
    server.close();
  }
}

runDistributionLifecycleTest().catch((err) => {
  console.error('\n❌ Distribution Lifecycle Test Failed:', err);
  process.exit(1);
});
