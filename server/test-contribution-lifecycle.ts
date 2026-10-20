import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq, inArray } from 'drizzle-orm';
import type { Server } from 'http';
import { resolveDemoCreatorId, resolveDemoBackerId, DEMO_BACKER_EMAIL } from './src/utils/demo-identity';
import { AuthService } from './src/modules/auth/auth.service';

async function runContributionLifecycleTest() {
  console.log('========================================================');
  console.log('STARTING CONTRIBUTION & PAYMENT INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5098;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  const db = getDb();
  const createdCampaignIds: string[] = [];
  const createdContributionIds: string[] = [];
  const demoCreatorId = await resolveDemoCreatorId();
  const demoBackerId = await resolveDemoBackerId();

  const backerToken = AuthService.signToken({
    sub: demoBackerId,
    email: DEMO_BACKER_EMAIL,
    role: 'USER',
  });
  const backerHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${backerToken}`,
  };

  try {
    // -------------------------------------------------------------
    // STAGE 1: Seed a FUNDING Campaign in Neon PostgreSQL
    // -------------------------------------------------------------
    console.log('[STAGE 1] Seeding a test campaign in FUNDING status...');
    const [seededCampaign] = await db
      .insert(schema.campaigns)
      .values({
        title: 'Clean River Restoration Ad Initiative',
        category: 'Environment',
        creatorId: demoCreatorId,
        creatorDisplayName: 'Clean Water Coalition',
        summary: 'Amplifying community petitions for industrial river discharge accountability.',
        fundingGoal: 1000,
        amountRaised: 500,
        backerCount: 5,
        status: 'FUNDING',
        draftStep: 5,
        durationDays: 30,
        fundingStartedAt: new Date(),
      })
      .returning();

    assert.ok(seededCampaign?.id, 'Seeded campaign must have an id');
    createdCampaignIds.push(seededCampaign.id);
    console.log(`  Seeded campaign ${seededCampaign.id} (Goal: $1,000, Raised: $500, Backers: 5)`);

    // -------------------------------------------------------------
    // STAGE 2: Test Quote API Math (CAMPAIGN_POLICY: 85/10/5, 20-30 imp/$)
    // -------------------------------------------------------------
    console.log('\n[STAGE 2] Testing Quote API (POST /campaigns/:id/contributions/quote)...');
    const quoteRes = await fetch(`${BASE_URL}/campaigns/${seededCampaign.id}/contributions/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }),
    });

    assert.equal(quoteRes.status, 200, 'Quote API must return 200');
    const quoteJson = await quoteRes.json();
    assert.equal(quoteJson.success, true);
    assert.equal(quoteJson.data.amount, 100);
    assert.equal(quoteJson.data.advertisingAllocation, 85, '85% advertising allocation');
    assert.equal(quoteJson.data.platformFee, 10, '10% platform fee');
    assert.equal(quoteJson.data.processingFee, 5, '5% processing fee');
    assert.equal(quoteJson.data.estimatedImpressionsMin, 85 * 20, 'Min impressions = 85 * 20 = 1700');
    assert.equal(quoteJson.data.estimatedImpressionsMax, 85 * 30, 'Max impressions = 85 * 30 = 2550');
    console.log('  Quote calculation matches CAMPAIGN_POLICY specification perfectly (85 / 10 / 5, 1700 - 2550 imp).');

    // -------------------------------------------------------------
    // STAGE 3: Create PENDING Contribution
    // -------------------------------------------------------------
    console.log('\n[STAGE 3] Creating contribution (POST /campaigns/:id/contributions)...');
    const createContribRes = await fetch(`${BASE_URL}/campaigns/${seededCampaign.id}/contributions`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({ amount: 100 }),
    });

    assert.equal(createContribRes.status, 201, 'Create contribution must return 201');
    const createContribJson = await createContribRes.json();
    assert.equal(createContribJson.success, true);
    const contribution1Id = createContribJson.data.id;
    assert.ok(contribution1Id, 'Must return contribution UUID');
    assert.equal(createContribJson.data.status, 'PENDING', 'Contribution must start in PENDING status');
    assert.equal(createContribJson.data.amount, 100);
    createdContributionIds.push(contribution1Id);
    console.log(`  Created contribution ${contribution1Id} in PENDING status.`);

    // -------------------------------------------------------------
    // STAGE 4: Simulate FAILED Payment (Verify NO funding mutation)
    // -------------------------------------------------------------
    console.log('\n[STAGE 4] Simulating FAILED payment (POST /payments/simulate)...');
    const failRes = await fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({
        contributionId: contribution1Id,
        outcome: 'FAILED',
        cardLast4: '4242',
      }),
    });

    assert.equal(failRes.status, 200, 'Simulate payment endpoint returns 200 with result');
    const failJson = await failRes.json();
    assert.equal(failJson.data.status, 'FAILED');

    // Verify DB campaign funding is unchanged
    const [afterFailCampaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, seededCampaign.id));
    assert.equal(afterFailCampaign.amountRaised, 500, 'amountRaised must NOT change on FAILED payment');
    assert.equal(afterFailCampaign.backerCount, 5, 'backerCount must NOT change on FAILED payment');

    // Verify contribution status remains PENDING for retry
    const [afterFailContrib] = await db
      .select()
      .from(schema.contributions)
      .where(eq(schema.contributions.id, contribution1Id));
    assert.equal(afterFailContrib.status, 'PENDING', 'Contribution remains PENDING after failure');
    console.log('  Confirmed: FAILED payment left campaign funding and backer count unchanged.');

    // -------------------------------------------------------------
    // STAGE 5: Simulate SUCCESS Payment
    // -------------------------------------------------------------
    console.log('\n[STAGE 5] Simulating SUCCESS payment for same contribution...');
    const successRes = await fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({
        contributionId: contribution1Id,
        outcome: 'SUCCESS',
        cardLast4: '4242',
      }),
    });

    assert.equal(successRes.status, 200, 'Simulate payment returns 200');
    const successJson = await successRes.json();
    assert.equal(successJson.data.status, 'SUCCESS');
    assert.equal(successJson.data.goalReached, false, 'Goal not yet reached ($600 / $1,000)');

    // Verify DB campaign funding updated
    const [afterSuccessCampaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, seededCampaign.id));
    assert.equal(afterSuccessCampaign.amountRaised, 600, 'amountRaised increased from 500 to 600');
    assert.equal(afterSuccessCampaign.backerCount, 6, 'backerCount increased from 5 to 6');

    // Verify contribution is CONFIRMED
    const [afterSuccessContrib] = await db
      .select()
      .from(schema.contributions)
      .where(eq(schema.contributions.id, contribution1Id));
    assert.equal(afterSuccessContrib.status, 'CONFIRMED', 'Contribution is now CONFIRMED');
    assert.ok(afterSuccessContrib.confirmedAt, 'confirmedAt timestamp is populated');
    console.log('  Confirmed: Transaction succeeded, amountRaised -> 600, backerCount -> 6, contribution -> CONFIRMED.');

    // -------------------------------------------------------------
    // STAGE 6: Idempotency Verification (Repeat SUCCESS request)
    // -------------------------------------------------------------
    console.log('\n[STAGE 6] Verifying Payment Idempotency (Repeat SUCCESS request)...');
    const repeatRes = await fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({
        contributionId: contribution1Id,
        outcome: 'SUCCESS',
        cardLast4: '4242',
      }),
    });

    assert.equal(repeatRes.status, 200, 'Repeat payment returns 200 idempotent response');
    const repeatJson = await repeatRes.json();
    assert.equal(repeatJson.data.status, 'SUCCESS');

    // Verify DB campaign funding was NOT incremented again
    const [afterRepeatCampaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, seededCampaign.id));
    assert.equal(afterRepeatCampaign.amountRaised, 600, 'Idempotency check: amountRaised must still be 600');
    assert.equal(afterRepeatCampaign.backerCount, 6, 'Idempotency check: backerCount must still be 6');
    console.log('  Confirmed: Duplicate SUCCESS request was completely idempotent (no duplicate funding).');

    // -------------------------------------------------------------
    // STAGE 7: Goal Crossing Transition (FUNDING -> FUNDING_GOAL_REACHED)
    // -------------------------------------------------------------
    console.log('\n[STAGE 7] Testing Goal Crossing & FUNDING_GOAL_REACHED Transition...');
    // Seed campaign near goal ($950 / $1,000)
    const [nearGoalCampaign] = await db
      .insert(schema.campaigns)
      .values({
        title: 'Wildfire Prevention Community Billboard Blitz',
        category: 'Environment',
        creatorId: demoCreatorId,
        creatorDisplayName: 'FireSafe Network',
        fundingGoal: 1000,
        amountRaised: 950,
        backerCount: 15,
        status: 'FUNDING',
        draftStep: 5,
        durationDays: 14,
        fundingStartedAt: new Date(),
      })
      .returning();

    createdCampaignIds.push(nearGoalCampaign.id);
    console.log(`  Created near-goal campaign ${nearGoalCampaign.id} ($950 / $1,000)`);

    // Create $100 contribution (will reach $1,050, crossing $1,000 goal)
    const nearGoalContribRes = await fetch(`${BASE_URL}/campaigns/${nearGoalCampaign.id}/contributions`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({ amount: 100 }),
    });
    const nearGoalContribJson = await nearGoalContribRes.json();
    const nearGoalContribId = nearGoalContribJson.data.id;
    createdContributionIds.push(nearGoalContribId);

    // Simulate payment SUCCESS
    const goalPayRes = await fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({
        contributionId: nearGoalContribId,
        outcome: 'SUCCESS',
        cardLast4: '1111',
      }),
    });

    const goalPayJson = await goalPayRes.json();
    assert.equal(goalPayJson.data.goalReached, true, 'goalReached flag must be true');
    assert.equal(goalPayJson.data.campaignStatus, 'FUNDING_GOAL_REACHED');

    // Verify DB campaign state
    const [afterGoalCampaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, nearGoalCampaign.id));

    assert.equal(afterGoalCampaign.amountRaised, 1050, 'Overfunding allowed: amountRaised is $1,050');
    assert.equal(afterGoalCampaign.backerCount, 16, 'backerCount incremented to 16');
    assert.equal(afterGoalCampaign.status, 'FUNDING_GOAL_REACHED', 'Campaign transitioned to FUNDING_GOAL_REACHED');
    assert.ok(afterGoalCampaign.fundingGoalReachedAt, 'fundingGoalReachedAt timestamp is populated');

    // Verify status history row was created
    const goalHistory = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(eq(schema.campaignStatusHistory.campaignId, nearGoalCampaign.id));
    const goalReachedEvent = goalHistory.find((h) => h.toStatus === 'FUNDING_GOAL_REACHED');
    assert.ok(goalReachedEvent, 'Status history event FUNDING_GOAL_REACHED must exist');
    assert.equal(goalReachedEvent.actorType, 'SYSTEM');
    console.log('  Confirmed: Goal crossing transitioned campaign to FUNDING_GOAL_REACHED with status history.');

    // -------------------------------------------------------------
    // STAGE 8: Campaign Backing Guard (Verify Non-FUNDING cannot be backed)
    // -------------------------------------------------------------
    console.log('\n[STAGE 8] Verifying Campaign Backing Guard (Non-backable after goal reached)...');
    const blockedContribRes = await fetch(`${BASE_URL}/campaigns/${nearGoalCampaign.id}/contributions`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({ amount: 50 }),
    });

    assert.equal(blockedContribRes.status, 409, 'Must return 409 Conflict when backing non-FUNDING campaign');
    const blockedJson = await blockedContribRes.json();
    assert.equal(blockedJson.error?.code, 'CAMPAIGN_NOT_BACKABLE');
    console.log('  Confirmed: Campaign in FUNDING_GOAL_REACHED correctly rejected new contributions with 409.');

    // -------------------------------------------------------------
    // STAGE 9: Contribution History API (GET /me/contributions)
    // -------------------------------------------------------------
    console.log('\n[STAGE 9] Verifying Contribution History API (GET /me/contributions)...');
    const historyRes = await fetch(`${BASE_URL}/me/contributions`, {
      headers: backerHeaders,
    });
    assert.equal(historyRes.status, 200, 'GET /me/contributions must return 200');
    const historyJson = await historyRes.json();
    assert.equal(historyJson.success, true);
    assert.ok(Array.isArray(historyJson.data));
    const foundOurContrib = historyJson.data.find((c: any) => c.id === contribution1Id);
    assert.ok(foundOurContrib, 'Confirmed contribution must appear in history');
    assert.equal(foundOurContrib.receiptAvailable, true, 'receiptAvailable must be true');
    console.log(`  Confirmed: GET /me/contributions returned history with ${historyJson.data.length} records.`);

    // -------------------------------------------------------------
    // STAGE 10: Contribution Detail API (GET /me/contributions/:id)
    // -------------------------------------------------------------
    console.log('\n[STAGE 10] Verifying Contribution Detail API (GET /me/contributions/:id)...');
    const detailRes = await fetch(`${BASE_URL}/me/contributions/${contribution1Id}`, {
      headers: backerHeaders,
    });
    assert.equal(detailRes.status, 200, 'GET /me/contributions/:id must return 200');
    const detailJson = await detailRes.json();
    assert.equal(detailJson.data.id, contribution1Id);
    assert.equal(detailJson.data.amount, 100);
    assert.equal(detailJson.data.useOfFunds.advertising, 85);
    assert.equal(detailJson.data.impact.advertisingAllocation, 85);
    console.log('  Confirmed: Detail API accurately returned breakdown and impact.');

    // -------------------------------------------------------------
    // STAGE 11: Receipt API (GET /me/contributions/:id/receipt)
    // -------------------------------------------------------------
    console.log('\n[STAGE 11] Verifying Receipt API (GET /me/contributions/:id/receipt)...');
    const receiptRes = await fetch(`${BASE_URL}/me/contributions/${contribution1Id}/receipt`, {
      headers: backerHeaders,
    });
    assert.equal(receiptRes.status, 200, 'GET /me/contributions/:id/receipt must return 200');
    const receiptJson = await receiptRes.json();
    assert.ok(receiptJson.data.receiptReference, 'Receipt reference must be populated');
    assert.equal(receiptJson.data.amount, 100);
    assert.ok(receiptJson.data.disclaimer.includes('Demo payment receipt'), 'Disclaimer must mention demo');
    console.log(`  Confirmed: Receipt API returned official demo receipt (${receiptJson.data.receiptReference}).`);

    // -------------------------------------------------------------
    // STAGE 12: Cancellation API (POST /me/contributions/:id/cancel)
    // -------------------------------------------------------------
    console.log('\n[STAGE 12] Testing Contribution Cancellation (POST /me/contributions/:id/cancel)...');
    const cancelCampaignRes = await fetch(`${BASE_URL}/campaigns/${seededCampaign.id}/contributions`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({ amount: 75 }),
    });
    const toCancelContribId = (await cancelCampaignRes.json()).data.id;
    createdContributionIds.push(toCancelContribId);

    const cancelRes = await fetch(`${BASE_URL}/me/contributions/${toCancelContribId}/cancel`, {
      method: 'POST',
      headers: backerHeaders,
    });
    assert.equal(cancelRes.status, 200, 'Cancel endpoint returns 200');
    const cancelJson = await cancelRes.json();
    assert.equal(cancelJson.data.status, 'CANCELLED');
    assert.ok(cancelJson.data.cancelledAt, 'cancelledAt timestamp set');

    // Attempting to cancel already CANCELLED should return 400
    const reCancelRes = await fetch(`${BASE_URL}/me/contributions/${toCancelContribId}/cancel`, {
      method: 'POST',
      headers: backerHeaders,
    });
    assert.equal(reCancelRes.status, 400, 'Re-cancelling non-PENDING contribution returns 400');
    console.log('  Confirmed: Pending contribution successfully cancelled and validated.');

    // -------------------------------------------------------------
    // STAGE 13: Concurrency & Transaction Safety Test
    // -------------------------------------------------------------
    console.log('\n[STAGE 13] Testing Concurrency & Race-condition Safety (Two simultaneous payments near goal)...');
    const [concurrentCampaign] = await db
      .insert(schema.campaigns)
      .values({
        title: 'Concurrent Race Protection Campaign',
        category: 'Environment',
        creatorId: demoCreatorId,
        creatorDisplayName: 'Audit Tester',
        fundingGoal: 1000,
        amountRaised: 850,
        backerCount: 10,
        status: 'FUNDING',
        draftStep: 5,
        durationDays: 14,
        fundingStartedAt: new Date(),
      })
      .returning();

    createdCampaignIds.push(concurrentCampaign.id);

    // Create 2 separate pending contributions
    const cA_res = await fetch(`${BASE_URL}/campaigns/${concurrentCampaign.id}/contributions`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({ amount: 100 }),
    });
    const cA_id = (await cA_res.json()).data.id;
    createdContributionIds.push(cA_id);

    const cB_res = await fetch(`${BASE_URL}/campaigns/${concurrentCampaign.id}/contributions`, {
      method: 'POST',
      headers: backerHeaders,
      body: JSON.stringify({ amount: 100 }),
    });
    const cB_id = (await cB_res.json()).data.id;
    createdContributionIds.push(cB_id);

    // Fire both payment success simulations simultaneously
    console.log('  Firing 2 simultaneous payment simulation requests...');
    const [resA, resB] = await Promise.all([
      fetch(`${BASE_URL}/payments/simulate`, {
        method: 'POST',
        headers: backerHeaders,
        body: JSON.stringify({ contributionId: cA_id, outcome: 'SUCCESS', cardLast4: '1111' }),
      }),
      fetch(`${BASE_URL}/payments/simulate`, {
        method: 'POST',
        headers: backerHeaders,
        body: JSON.stringify({ contributionId: cB_id, outcome: 'SUCCESS', cardLast4: '2222' }),
      }),
    ]);

    const jsonA = await resA.json();
    const jsonB = await resB.json();

    // Verify DB integrity: no lost updates!
    const [finalConcurrentCampaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, concurrentCampaign.id));

    // Both contributions should be confirmed: 850 + 100 + 100 = 1050, backers = 12
    assert.equal(finalConcurrentCampaign.amountRaised, 1050, 'Concurrency: amountRaised must reflect both contributions without lost update');
    assert.equal(finalConcurrentCampaign.backerCount, 12, 'Concurrency: backerCount must increment by 2');
    assert.equal(finalConcurrentCampaign.status, 'FUNDING_GOAL_REACHED');

    // Verify status history has exactly ONE transition to FUNDING_GOAL_REACHED
    const concurrentHistory = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(eq(schema.campaignStatusHistory.campaignId, concurrentCampaign.id));

    const goalTransitions = concurrentHistory.filter((h) => h.toStatus === 'FUNDING_GOAL_REACHED');
    assert.equal(goalTransitions.length, 1, 'Only ONE status history transition to FUNDING_GOAL_REACHED should be recorded');
    console.log('  Confirmed: Transactional concurrency safety verified. Both updates applied without lost updates, and lifecycle transition fired exactly once.');

    console.log('\n========================================================');
    console.log('ALL CONTRIBUTION & PAYMENT INTEGRATION TESTS PASSED (100%)');
    console.log('========================================================\n');
  } finally {
    // -------------------------------------------------------------
    // Cleanup Neon PostgreSQL Test Records
    // -------------------------------------------------------------
    console.log('[Cleanup] Cleaning up test records from Neon PostgreSQL...');
    if (createdContributionIds.length > 0) {
      await db.delete(schema.payments).where(inArray(schema.payments.contributionId, createdContributionIds));
      await db.delete(schema.contributions).where(inArray(schema.contributions.id, createdContributionIds));
    }
    if (createdCampaignIds.length > 0) {
      await db.delete(schema.campaignStatusHistory).where(inArray(schema.campaignStatusHistory.campaignId, createdCampaignIds));
      await db.delete(schema.campaignReviews).where(inArray(schema.campaignReviews.campaignId, createdCampaignIds));
      await db.delete(schema.campaigns).where(inArray(schema.campaigns.id, createdCampaignIds));
    }
    server.close();
    console.log('[Cleanup] Cleanup complete. Test server closed.\n');
  }
}

runContributionLifecycleTest().catch((err) => {
  console.error('\nTEST SUITE FAILED with error:', err);
  process.exit(1);
});
