import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq, inArray, and } from 'drizzle-orm';
import { AuthService } from './src/modules/auth/auth.service';
import type { Server } from 'http';

async function runPaymentIdempotencyTest() {
  console.log('========================================================');
  console.log('STARTING PAYMENT FINANCIAL INTEGRITY & IDEMPOTENCY SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5095;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  const db = getDb();
  let testCampaignId: string | null = null;
  let testUserId: string | null = null;
  let testContributionId: string | null = null;

  try {
    // 1. Setup Test User & JWT
    console.log('[STAGE 1] Creating test backer user & token...');
    const now = new Date();
    const [user] = await db
      .insert(schema.users)
      .values({
        email: `idempotency.backer.${Date.now()}@campaignamplify.test`,
        displayName: 'Idempotency Tester',
        role: 'USER',
        passwordHash: 'dummy-hash',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    testUserId = user.id;

    const token = AuthService.signToken({
      sub: user.id,
      email: user.email,
      role: 'USER',
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Setup FUNDING Campaign (Goal $1,000, Raised $900, Backers 9)
    console.log('\n[STAGE 2] Seeding near-goal FUNDING campaign...');
    const [camp] = await db
      .insert(schema.campaigns)
      .values({
        creatorId: user.id,
        creatorDisplayName: 'Test Creator',
        title: 'Single-Contribution Concurrency Safety Verification',
        category: 'Technology',
        summary: 'Verifying that concurrent SUCCESS requests on the exact same contribution cannot double-fund.',
        status: 'FUNDING',
        fundingGoal: 1000,
        amountRaised: 900,
        backerCount: 9,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    testCampaignId = camp.id;
    console.log(`  Campaign seeded: ${testCampaignId} ($900 / $1000, 9 backers)`);

    // 3. Create ONE Pending Contribution for $100 (This crosses the $1,000 goal!)
    console.log('\n[STAGE 3] Creating single PENDING contribution for $100...');
    const contribRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/contributions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: 100 }),
    });
    assert.equal(contribRes.status, 201, 'Create contribution must return 201');
    const contribJson = await contribRes.json();
    testContributionId = contribJson.data.id;
    assert.equal(contribJson.data.status, 'PENDING');
    console.log(`  Contribution created: ${testContributionId} (status: PENDING)`);

    // 4. FIRE TWO SIMULTANEOUS SUCCESS REQUESTS ON THE EXACT SAME CONTRIBUTION!
    console.log('\n[STAGE 4] Firing 2 simultaneous simulated SUCCESS requests on the SAME contribution...');
    const req1 = fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        contributionId: testContributionId,
        outcome: 'SUCCESS',
        cardLast4: '4242',
      }),
    });

    const req2 = fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        contributionId: testContributionId,
        outcome: 'SUCCESS',
        cardLast4: '4242',
      }),
    });

    const [res1, res2] = await Promise.all([req1, req2]);
    assert.equal(res1.status, 200, 'Request 1 must return 200');
    assert.equal(res2.status, 200, 'Request 2 must return 200 (idempotent success response)');

    const json1 = await res1.json();
    const json2 = await res2.json();
    assert.equal(json1.success, true);
    assert.equal(json2.success, true);
    assert.equal(json1.data.status, 'SUCCESS');
    assert.equal(json2.data.status, 'SUCCESS');
    console.log('  Both requests responded 200 OK.');

    // 5. Assert database invariants directly in Neon PostgreSQL
    console.log('\n[STAGE 5] Checking Neon database invariants directly...');

    // Invariant A: Contribution must be CONFIRMED
    const [finalContrib] = await db
      .select()
      .from(schema.contributions)
      .where(eq(schema.contributions.id, testContributionId as any));
    assert.equal(finalContrib.status, 'CONFIRMED', 'Contribution must be CONFIRMED');
    assert.ok(finalContrib.confirmedAt, 'confirmedAt must be recorded');
    console.log('  [PASS] Contribution is CONFIRMED.');

    // Invariant B: Exactly ONE SUCCESS payment record must exist for this contribution
    const successPayments = await db
      .select()
      .from(schema.payments)
      .where(
        and(
          eq(schema.payments.contributionId, testContributionId as any),
          eq(schema.payments.status, 'SUCCESS')
        )
      );
    assert.equal(
      successPayments.length,
      1,
      `Exactly 1 SUCCESS payment must exist for contribution (found ${successPayments.length})`
    );
    console.log('  [PASS] Exactly ONE SUCCESS payment record exists.');

    // Invariant C: Campaign amountRaised must have increased by EXACTLY $100 (900 + 100 = 1000, NOT 1100!)
    const [finalCamp] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, testCampaignId as any));
    assert.equal(
      finalCamp.amountRaised,
      1000,
      `amountRaised must be exactly 1000 (found: ${finalCamp.amountRaised}). Double-funding prevented!`
    );
    console.log('  [PASS] amountRaised increased by exactly 100 (900 -> 1000). Double-funding prevented!');

    // Invariant D: backerCount must have increased by EXACTLY 1 (9 + 1 = 10, NOT 11!)
    assert.equal(
      finalCamp.backerCount,
      10,
      `backerCount must be exactly 10 (found: ${finalCamp.backerCount})`
    );
    console.log('  [PASS] backerCount increased by exactly 1 (9 -> 10).');

    // Invariant E: Campaign status must be FUNDING_GOAL_REACHED
    assert.equal(
      finalCamp.status,
      'FUNDING_GOAL_REACHED',
      'Campaign status must be FUNDING_GOAL_REACHED'
    );
    assert.ok(finalCamp.fundingGoalReachedAt, 'fundingGoalReachedAt must be populated');
    console.log('  [PASS] Campaign transitioned to FUNDING_GOAL_REACHED.');

    // Invariant F: Exactly ONE status history record for FUNDING_GOAL_REACHED
    const goalHistory = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(
        and(
          eq(schema.campaignStatusHistory.campaignId, testCampaignId as any),
          eq(schema.campaignStatusHistory.toStatus, 'FUNDING_GOAL_REACHED')
        )
      );
    assert.equal(
      goalHistory.length,
      1,
      `Exactly 1 FUNDING_GOAL_REACHED history entry must exist (found ${goalHistory.length})`
    );
    console.log('  [PASS] Exactly ONE status history transition recorded.');

    console.log('\n========================================================');
    console.log('ALL FINANCIAL IDEMPOTENCY INVARIANTS VERIFIED (100% PASS)');
    console.log('========================================================');
  } finally {
    console.log('\n[Cleanup] Cleaning up test records from Neon PostgreSQL...');
    if (testContributionId) {
      await db
        .delete(schema.payments)
        .where(eq(schema.payments.contributionId, testContributionId as any));
      await db
        .delete(schema.contributions)
        .where(eq(schema.contributions.id, testContributionId as any));
    }

    if (testCampaignId) {
      await db
        .delete(schema.campaignStatusHistory)
        .where(eq(schema.campaignStatusHistory.campaignId, testCampaignId as any));
      await db
        .delete(schema.campaigns)
        .where(eq(schema.campaigns.id, testCampaignId as any));
    }

    if (testUserId) {
      await db
        .delete(schema.users)
        .where(eq(schema.users.id, testUserId as any));
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('[Cleanup] Cleanup complete. Test server closed.');
  }
}

runPaymentIdempotencyTest().catch((err) => {
  console.error('\n❌ PAYMENT IDEMPOTENCY TEST FAILED:', err);
  process.exit(1);
});
