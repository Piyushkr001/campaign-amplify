import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq, inArray } from 'drizzle-orm';
import type { Server } from 'http';

async function runAuthTests() {
  console.log('========================================================');
  console.log('STARTING REAL JWT AUTH & RBAC INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5096;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  const createdUserIds: string[] = [];
  const createdCampaignIds: string[] = [];
  const createdContributionIds: string[] = [];

  const timestamp = Date.now();
  const user1Email = `test.user1.${timestamp}@campaignamplify.test`;
  const user2Email = `test.user2.${timestamp}@campaignamplify.test`;
  const reviewerEmail = `test.reviewer.${timestamp}@campaignamplify.test`;
  const password = 'TestSecurePassword123!';

  let user1Token = '';
  let user1Id = '';
  let user2Token = '';
  let user2Id = '';
  let reviewerToken = '';
  let reviewerId = '';
  let testCampaignId = '';
  let testContributionId = '';

  const db = getDb();

  try {
    // 1. Register USER
    console.log('[TEST 1] Registering a new USER...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user1Email,
        password,
        displayName: 'Alice User',
      }),
    });
    assert.equal(regRes.status, 201, 'Register must return 201');
    const regJson = await regRes.json();
    assert.equal(regJson.success, true);
    assert.ok(regJson.data?.accessToken, 'Must return accessToken');
    assert.equal(regJson.data?.user?.email, user1Email);
    assert.equal(regJson.data?.user?.role, 'USER');
    assert.equal(regJson.data?.user?.passwordHash, undefined, 'passwordHash must never be returned');
    user1Token = regJson.data.accessToken;
    user1Id = regJson.data.user.id;
    createdUserIds.push(user1Id);
    console.log('  Registered user 1:', user1Id);

    // 2. Duplicate email rejected
    console.log('\n[TEST 2] Verifying duplicate email rejection...');
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user1Email,
        password,
        displayName: 'Alice Duplicate',
      }),
    });
    assert.equal(dupRes.status, 409, 'Duplicate email must return 409');
    const dupJson = await dupRes.json();
    assert.equal(dupJson.error?.code, 'EMAIL_ALREADY_EXISTS');
    console.log('  Duplicate email rejected with 409 EMAIL_ALREADY_EXISTS.');

    // 3. Login wrong password rejected
    console.log('\n[TEST 3] Verifying wrong password rejection...');
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user1Email,
        password: 'WrongPassword999!',
      }),
    });
    assert.equal(wrongPassRes.status, 401, 'Wrong password must return 401');
    const wrongPassJson = await wrongPassRes.json();
    assert.equal(wrongPassJson.error?.code, 'INVALID_CREDENTIALS');
    console.log('  Wrong password rejected with 401 INVALID_CREDENTIALS.');

    // 4. Login correct password succeeds
    console.log('\n[TEST 4] Logging in with correct credentials...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user1Email,
        password,
      }),
    });
    assert.equal(loginRes.status, 200, 'Login must return 200');
    const loginJson = await loginRes.json();
    assert.ok(loginJson.data?.accessToken, 'Must return fresh JWT');
    assert.equal(loginJson.data?.user?.id, user1Id);
    console.log('  Login successful. Token acquired.');

    // 5. Token accesses /auth/me
    console.log('\n[TEST 5] Accessing /auth/me with Bearer token...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(meRes.status, 200, '/auth/me must return 200');
    const meJson = await meRes.json();
    assert.equal(meJson.data?.id, user1Id);
    assert.equal(meJson.data?.email, user1Email);
    assert.equal(meJson.data?.passwordHash, undefined);
    console.log('  /auth/me returned validated user profile.');

    // 6. Invalid token rejected
    console.log('\n[TEST 6] Verifying invalid / malformed token rejection...');
    const badTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer this.is.a.bad.token' },
    });
    assert.equal(badTokenRes.status, 401, 'Bad token must return 401');
    const badTokenJson = await badTokenRes.json();
    assert.equal(badTokenJson.error?.code, 'INVALID_TOKEN');
    console.log('  Invalid token rejected with 401 INVALID_TOKEN.');

    // Register User 2
    const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user2Email,
        password,
        displayName: 'Bob User',
      }),
    });
    const reg2Json = await reg2Res.json();
    user2Token = reg2Json.data.accessToken;
    user2Id = reg2Json.data.user.id;
    createdUserIds.push(user2Id);

    // Register Reviewer (Promote in DB)
    const regRevRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: reviewerEmail,
        password,
        displayName: 'Carol Reviewer',
      }),
    });
    const regRevJson = await regRevRes.json();
    reviewerId = regRevJson.data.user.id;
    createdUserIds.push(reviewerId);

    // Promote Carol to REVIEWER role directly in DB
    await db
      .update(schema.users)
      .set({ role: 'REVIEWER', updatedAt: new Date() })
      .where(eq(schema.users.id, reviewerId as any));

    // Re-login as reviewer to get token with REVIEWER role
    const revLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: reviewerEmail, password }),
    });
    const revLoginJson = await revLoginRes.json();
    reviewerToken = revLoginJson.data.accessToken;
    assert.equal(revLoginJson.data.user.role, 'REVIEWER');

    // 7. USER cannot access reviewer route
    console.log('\n[TEST 7] Verifying normal USER cannot access reviewer queue...');
    const userReviewRes = await fetch(`${BASE_URL}/review/campaigns`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(userReviewRes.status, 403, 'Normal USER must be forbidden from reviewer queue');
    const userReviewJson = await userReviewRes.json();
    assert.equal(userReviewJson.error?.code, 'INSUFFICIENT_ROLE');
    console.log('  Normal USER access blocked with 403 INSUFFICIENT_ROLE.');

    // 8. REVIEWER can access review queue
    console.log('\n[TEST 8] Verifying REVIEWER can access review queue...');
    const revQueueRes = await fetch(`${BASE_URL}/review/campaigns`, {
      headers: { Authorization: `Bearer ${reviewerToken}` },
    });
    assert.equal(revQueueRes.status, 200, 'REVIEWER must be allowed to access review queue');
    console.log('  REVIEWER access permitted.');

    // 9. USER creates campaign
    console.log('\n[TEST 9] USER creates a draft campaign...');
    const createCampRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ title: 'Alice Clean Energy Initiative' }),
    });
    assert.equal(createCampRes.status, 201, 'Campaign creation must return 201');
    const createCampJson = await createCampRes.json();
    testCampaignId = createCampJson.data.id;
    createdCampaignIds.push(testCampaignId);
    console.log('  Created campaign:', testCampaignId);

    // 10. Different USER cannot edit campaign
    console.log('\n[TEST 10] Verifying different USER cannot edit Alice\'s campaign...');
    const editOtherRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/basics`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`, // Bob trying to edit Alice's campaign
      },
      body: JSON.stringify({
        title: 'Hacked by Bob Campaign Title',
        category: 'Environment',
        creatorName: 'Bob Hacker',
        summary: 'This is a summary that is at least twenty characters long.',
      }),
    });
    assert.equal(editOtherRes.status, 403, 'Unauthorized editor must receive 403');
    console.log('  Non-owner edit rejected with 403.');

    // 11. Owner USER can edit campaign
    console.log('\n[TEST 11] Verifying Alice can edit her own campaign...');
    const editOwnRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/basics`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'Alice Clean Energy Initiative Updated',
        category: 'Environment',
        creatorName: 'Alice Green',
        summary: 'Amplifying clean solar power for schools across the country.',
      }),
    });
    assert.equal(editOwnRes.status, 200, 'Owner edit must succeed');
    console.log('  Owner edit succeeded.');

    // Put campaign into FUNDING status directly for contribution tests
    await db
      .update(schema.campaigns)
      .set({
        status: 'FUNDING',
        fundingGoal: 1000,
        amountRaised: 0,
        backerCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.campaigns.id, testCampaignId as any));

    // 12. USER creates contribution
    console.log('\n[TEST 12] USER 1 creates contribution for FUNDING campaign...');
    const createContribRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ amount: 100 }),
    });
    assert.equal(createContribRes.status, 201, 'Create contribution must return 201');
    const createContribJson = await createContribRes.json();
    testContributionId = createContribJson.data.id;
    createdContributionIds.push(testContributionId);
    assert.equal(createContribJson.data.status, 'PENDING');
    assert.equal(createContribJson.data.userId, user1Id);
    console.log('  Contribution created for User 1:', testContributionId);

    // 13. Different USER cannot process contribution
    console.log('\n[TEST 13] Verifying Bob cannot process Alice\'s contribution...');
    const bobSimRes = await fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`, // Bob trying to pay for Alice's contribution
      },
      body: JSON.stringify({
        contributionId: testContributionId,
        outcome: 'SUCCESS',
      }),
    });
    assert.equal(bobSimRes.status, 403, 'Unauthorized payer must receive 403');
    console.log('  Different user payment rejected with 403.');

    // 14. Owner USER can process it
    console.log('\n[TEST 14] Owner Alice processes payment for her contribution...');
    const aliceSimRes = await fetch(`${BASE_URL}/payments/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        contributionId: testContributionId,
        outcome: 'SUCCESS',
        cardLast4: '4242',
      }),
    });
    assert.equal(aliceSimRes.status, 200, 'Owner payment must succeed');
    const aliceSimJson = await aliceSimRes.json();
    assert.equal(aliceSimJson.data?.status, 'SUCCESS');
    assert.equal(aliceSimJson.data?.campaignAmountRaised, 100);
    console.log('  Owner payment succeeded. Contribution confirmed.');

    // 15. Receipt ownership enforced
    console.log('\n[TEST 15] Verifying Bob cannot view Alice\'s receipt...');
    const bobReceiptRes = await fetch(`${BASE_URL}/me/contributions/${testContributionId}/receipt`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert.equal(bobReceiptRes.status, 403, 'Non-owner viewing receipt must get 403');

    const aliceReceiptRes = await fetch(`${BASE_URL}/me/contributions/${testContributionId}/receipt`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(aliceReceiptRes.status, 200, 'Owner viewing receipt must succeed');
    console.log('  Receipt ownership enforced successfully.');

    // 16. Verify cancel endpoint
    console.log('\n[TEST 16] Verifying pending contribution cancellation...');
    const newPendingRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ amount: 50 }),
    });
    const newPendingJson = await newPendingRes.json();
    const cancelContribId = newPendingJson.data.id;
    createdContributionIds.push(cancelContribId);

    const cancelRes = await fetch(`${BASE_URL}/me/contributions/${cancelContribId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(cancelRes.status, 200, 'Cancellation must return 200');
    const cancelJson = await cancelRes.json();
    assert.equal(cancelJson.data?.status, 'CANCELLED');
    console.log('  Pending contribution cancelled successfully.');

    console.log('\n========================================================');
    console.log('ALL AUTH & RBAC INTEGRATION TESTS PASSED (100% SUCCESS)');
    console.log('========================================================');
  } finally {
    console.log('\n[Cleanup] Cleaning up test records from Neon PostgreSQL...');
    if (createdContributionIds.length > 0) {
      await db
        .delete(schema.payments)
        .where(inArray(schema.payments.contributionId, createdContributionIds as any));
      await db
        .delete(schema.contributions)
        .where(inArray(schema.contributions.id, createdContributionIds as any));
    }

    if (createdCampaignIds.length > 0) {
      await db
        .delete(schema.campaignStatusHistory)
        .where(inArray(schema.campaignStatusHistory.campaignId, createdCampaignIds as any));
      await db
        .delete(schema.campaigns)
        .where(inArray(schema.campaigns.id, createdCampaignIds as any));
    }

    if (createdUserIds.length > 0) {
      await db
        .delete(schema.users)
        .where(inArray(schema.users.id, createdUserIds as any));
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('[Cleanup] Cleanup complete. Test server closed.');
  }
}

runAuthTests().catch((err) => {
  console.error('\n❌ AUTH TEST SUITE FAILED:', err);
  process.exit(1);
});
