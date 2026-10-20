import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq, inArray, and } from 'drizzle-orm';
import { AuthService } from './src/modules/auth/auth.service';
import type { Server } from 'http';

async function runTerminalRaceTest() {
  console.log('========================================================');
  console.log('STARTING FINANCIAL TERMINAL STATE RACE (SUCCESS vs CANCELLED)');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5096;
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
        email: `race.backer.${Date.now()}@campaignamplify.test`,
        displayName: 'Race Tester',
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
        title: 'Terminal Outcome Race Verification Campaign',
        category: 'Technology',
        summary: 'Verifying that concurrent SUCCESS vs CANCELLED requests on the exact same contribution produce exactly one terminal state.',
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

    // 3. Create ONE Pending Contribution for $100
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

    // 4. FIRE SIMULTANEOUS COMPETING REQUESTS: SUCCESS vs CANCELLED!
    console.log('\n[STAGE 4] Firing concurrent SUCCESS vs CANCELLED requests on the SAME contribution...');
    const successReq = fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        contributionId: testContributionId,
        outcome: 'SUCCESS',
        cardLast4: '4242',
      }),
    });

    const cancelReq = fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        contributionId: testContributionId,
        outcome: 'CANCELLED',
      }),
    });

    const [resSuccessSettled, resCancelSettled] = await Promise.allSettled([
      successReq,
      cancelReq,
    ]);

    assert.equal(resSuccessSettled.status, 'fulfilled', 'SUCCESS request must resolve');
    assert.equal(resCancelSettled.status, 'fulfilled', 'CANCEL request must resolve');

    const successResponse = (resSuccessSettled as PromiseFulfilledResult<Response>).value;
    const cancelResponse = (resCancelSettled as PromiseFulfilledResult<Response>).value;

    console.log(`  SUCCESS endpoint response HTTP: ${successResponse.status}`);
    console.log(`  CANCEL endpoint response HTTP: ${cancelResponse.status}`);

    // 5. INSPECT DATABASE INVARIANTS DIRECTLY VIA DRIZZLE
    console.log('\n[STAGE 5] Checking database financial invariants directly...');
    const [finalContrib] = await db
      .select()
      .from(schema.contributions)
      .where(eq(schema.contributions.id, testContributionId as any));

    assert.ok(finalContrib, 'Contribution record must exist');
    console.log(`  Final contribution status in DB: ${finalContrib.status}`);
    assert.ok(
      finalContrib.status === 'CONFIRMED' || finalContrib.status === 'CANCELLED',
      `Terminal status must be CONFIRMED or CANCELLED, but got: ${finalContrib.status}`
    );

    // Payments inspection
    const payments = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.contributionId, testContributionId as any));

    // Campaign inspection
    const [finalCamp] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, testCampaignId as any));

    if (finalContrib.status === 'CONFIRMED') {
      console.log('  -> SUCCESS transition won the race:');
      assert.equal(payments.filter((p) => p.status === 'SUCCESS').length, 1, 'Must have exactly ONE SUCCESS payment');
      assert.equal(finalCamp.amountRaised, 1000, 'Campaign amountRaised must be exactly incremented to $1000');
      assert.equal(finalCamp.backerCount, 10, 'Campaign backerCount must be incremented to 10');
      console.log('  [PASS] Confirmation won. Amount raised increased exactly once (900 -> 1000).');
      console.log('  [PASS] Backer count incremented exactly once (9 -> 10).');
      console.log('  [PASS] Cancellation was safely prevented from overwriting terminal CONFIRMED status.');
    } else {
      console.log('  -> CANCELLED transition won the race:');
      assert.equal(payments.filter((p) => p.status === 'SUCCESS').length, 0, 'Must have ZERO SUCCESS payments');
      assert.equal(finalCamp.amountRaised, 900, 'Campaign amountRaised must remain unchanged at $900');
      assert.equal(finalCamp.backerCount, 9, 'Campaign backerCount must remain unchanged at 9');
      console.log('  [PASS] Cancellation won. Amount raised completely unchanged ($900).');
      console.log('  [PASS] Backer count completely unchanged (9).');
      console.log('  [PASS] Funding was safely prevented from applying to cancelled contribution.');
    }

    console.log('\n========================================================');
    console.log('ALL TERMINAL STATE RACE INVARIANTS VERIFIED (100% PASS)');
    console.log('========================================================\n');
  } finally {
    console.log('[Cleanup] Cleaning up test records from Neon PostgreSQL...');
    if (testContributionId) {
      await db.delete(schema.payments).where(eq(schema.payments.contributionId, testContributionId as any));
      await db.delete(schema.contributions).where(eq(schema.contributions.id, testContributionId as any));
    }
    if (testCampaignId) {
      await db.delete(schema.campaignStatusHistory).where(eq(schema.campaignStatusHistory.campaignId, testCampaignId as any));
      await db.delete(schema.campaigns).where(eq(schema.campaigns.id, testCampaignId as any));
    }
    if (testUserId) {
      await db.delete(schema.users).where(eq(schema.users.id, testUserId as any));
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('[Cleanup] Cleanup complete. Test server closed.');
  }
}

runTerminalRaceTest().catch((err) => {
  console.error('\n❌ TERMINAL RACE TEST FAILED:', err);
  process.exit(1);
});
