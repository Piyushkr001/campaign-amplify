import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq } from 'drizzle-orm';
import type { Server } from 'http';
import { resolveDemoCreatorId, DEMO_CREATOR_EMAIL } from './src/utils/demo-identity';
import { AuthService } from './src/modules/auth/auth.service';

async function runTests() {
  console.log('========================================================');
  console.log('STARTING CAMPAIGN AMPLIFY SYNC HARDENING TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5098;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  let testCampaignId: string | null = null;

  const creatorId = await resolveDemoCreatorId();
  const token = AuthService.signToken({
    sub: creatorId,
    email: DEMO_CREATOR_EMAIL,
    role: 'USER',
  });
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  try {
    // 1. Readiness Check
    console.log('[TEST 1] Checking /health and /ready endpoints...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.equal(healthRes.status, 200, 'Health endpoint must return 200');
    const healthJson = await healthRes.json();
    assert.equal(healthJson.success, true, 'Health check must be true');

    const readyRes = await fetch(`${BASE_URL}/ready`);
    assert.equal(readyRes.status, 200, 'Ready endpoint must return 200');
    const readyJson = await readyRes.json();
    assert.equal(readyJson.data?.database, 'connected', 'Database must report connected');
    console.log('  Health & DB connection verified.');

    // 2. Phase 18: UUID Validation Check
    console.log('\n[TEST 2] Testing UUID Validation (Phase 18 & 19)...');
    const invalidIdRes = await fetch(`${BASE_URL}/campaigns/not-a-valid-uuid`);
    assert.equal(invalidIdRes.status, 400, 'Invalid UUID must return 400');
    const invalidIdJson = await invalidIdRes.json();
    assert.equal(invalidIdJson.error?.code, 'INVALID_CAMPAIGN_ID', 'Error code must be INVALID_CAMPAIGN_ID');
    console.log('  UUID validation verified (400 INVALID_CAMPAIGN_ID).');

    // 3. Phase 5: Category Validation Check
    console.log('\n[TEST 3] Testing Category Validation (Phase 5)...');
    const invalidCatDraftRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Invalid Category Test' }),
    });
    const invalidCatDraftJson = await invalidCatDraftRes.json();
    const tempUuid = invalidCatDraftJson.data?.id;
    assert.ok(tempUuid, 'Temp UUID must exist');

    try {
      const invalidCatRes = await fetch(`${BASE_URL}/campaigns/${tempUuid}/basics`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Clean Water Project',
          category: 'BANANA', // Arbitrary invalid category
          creatorName: 'Clean Water Group',
          summary: 'Community-funded amplification message summary.',
        }),
      });
      assert.equal(invalidCatRes.status, 400, 'Arbitrary category BANANA must be rejected with 400');
      const invalidCatJson = await invalidCatRes.json();
      assert.equal(invalidCatJson.error?.code, 'VALIDATION_ERROR', 'Error code must be VALIDATION_ERROR');
      console.log('  Invalid category rejected with 400 VALIDATION_ERROR.');
    } finally {
      const db = getDb();
      await db.delete(schema.campaigns).where(eq(schema.campaigns.id, tempUuid as any));
    }

    // 4. Phase 32: End-to-End API Campaign Creation
    console.log('\n[TEST 4] Testing Step A: POST /campaigns (Server Draft Creation)...');
    const createRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Sync Hardening Clean Water Campaign' }),
    });
    assert.equal(createRes.status, 201, 'Draft creation must return 201');
    const createJson = await createRes.json();
    testCampaignId = createJson.data?.id;
    assert.ok(testCampaignId, 'Must receive a valid server UUID');
    assert.equal(createJson.data?.status, 'DRAFT', 'Initial status must be DRAFT');
    console.log('  Created server DRAFT UUID:', testCampaignId);

    // Verify initial DRAFT status history exists in DB (Phase 12)
    const db = getDb();
    const initialHist = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(eq(schema.campaignStatusHistory.campaignId, testCampaignId as any));
    assert.equal(initialHist.length, 1, 'Initial status history row must be created');
    assert.equal(initialHist[0].toStatus, 'DRAFT', 'Initial history event must record DRAFT');
    console.log('  Initial DRAFT status history verified in DB.');

    // Step B: Basics
    console.log('\n[TEST 5] Testing Step B: PATCH /basics...');
    const basicsRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/basics`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Sync Hardening Clean Water Campaign',
        category: 'Environment',
        creatorName: 'Global Clean Water Initiative',
        summary: 'Community-funded amplification to deliver biological sand filtration infrastructure blueprints to 50 rural districts.',
        coverImage: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800',
      }),
    });
    assert.equal(basicsRes.status, 200, 'Basics PATCH must return 200');
    const basicsJson = await basicsRes.json();
    assert.equal(basicsJson.success, true, 'Basics response success must be true');
    console.log('  Step B (Basics) persisted.');

    // Step C: Story
    console.log('\n[TEST 6] Testing Step C: PATCH /story...');
    const storyRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/story`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        storyHeadline: 'Freshwater Access For Underrepresented Districts',
        storyIntro: 'Connecting underserved communities with gravity filtration blueprints.',
        storyContent: 'Over 2 billion people worldwide lack safely managed drinking water services. WaterFirst Foundation has engineered low-cost, gravity-fed biological sand filtration systems, but local civic leaders and regional authorities often remain unaware of available matching grants and implementation blueprints. By amplifying this informative campaign across regional media and social channels, we can directly connect 45 community centers with actionable filtration blueprints.',
        sources: [
          {
            title: 'WHO/UNICEF Joint Monitoring Programme for Water Supply',
            url: 'https://washdata.org',
            publisher: 'WHO / UNICEF',
          },
        ],
      }),
    });
    assert.equal(storyRes.status, 200, 'Story PATCH must return 200');
    const storyJson = await storyRes.json();
    assert.equal(storyJson.success, true, 'Story response success must be true');
    console.log('  Step C (Story & Sources) persisted.');

    // Step D: Visuals
    console.log('\n[TEST 7] Testing Step D: PATCH /visuals...');
    const visualsRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/visuals`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        adHeadline: 'Safe Drinking Water Blueprint',
        adDescription: 'Help fund advertising to bring freshwater blueprints to rural villages.',
        adCTA: 'Learn More',
        adImage: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800',
      }),
    });
    assert.equal(visualsRes.status, 200, 'Visuals PATCH must return 200');
    const visualsJson = await visualsRes.json();
    assert.equal(visualsJson.success, true, 'Visuals response success must be true');
    console.log('  Step D (Visuals & Ad Creative) persisted.');

    // Step E: Reach
    console.log('\n[TEST 8] Testing Step E: PATCH /reach...');
    const reachRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/reach`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        locations: ['India', 'Delhi NCR', 'Rural Districts'],
        interests: ['Clean Water', 'Public Infrastructure', 'Sustainability'],
        channels: ['Meta Targeted Ads', 'Regional News Outlets'],
        audienceDescription: 'Civic-minded community members, educators, and public stakeholders',
        durationDays: 21,
      }),
    });
    assert.equal(reachRes.status, 200, 'Reach PATCH must return 200');
    const reachJson = await reachRes.json();
    assert.equal(reachJson.success, true, 'Reach response success must be true');
    console.log('  Step E (Reach & Targeting) persisted.');

    // Step F: Submit
    console.log('\n[TEST 9] Testing Step F: POST /submit...');
    const submitRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ fundingGoal: 3500 }),
    });
    assert.equal(submitRes.status, 200, 'Submit must return 200');
    const submitJson = await submitRes.json();
    assert.equal(submitJson.data?.status, 'SUBMITTED_FOR_REVIEW', 'Status must transition to SUBMITTED_FOR_REVIEW');
    assert.equal(submitJson.data?.id, testCampaignId, 'Returned ID must match exact server UUID');
    console.log('  Step F (Submit) successfully reached SUBMITTED_FOR_REVIEW with same UUID.');

    // Step G: Database Inspection (Phase 36)
    console.log('\n[TEST 10] Database Inspection via Drizzle ORM in Neon...');
    const campRows = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, testCampaignId as any));
    assert.equal(campRows.length, 1, 'Exactly ONE row must exist for campaign UUID');
    assert.equal(campRows[0].status, 'SUBMITTED_FOR_REVIEW', 'Database row status must be SUBMITTED_FOR_REVIEW');
    assert.equal(campRows[0].fundingGoal, 3500, 'Funding goal must match submitted value');

    const sourceRows = await db
      .select()
      .from(schema.campaignSources)
      .where(eq(schema.campaignSources.campaignId, testCampaignId as any));
    assert.ok(sourceRows.length >= 1, 'Sources must be stored in DB');

    const creativeRows = await db
      .select()
      .from(schema.adCreatives)
      .where(eq(schema.adCreatives.campaignId, testCampaignId as any));
    assert.equal(creativeRows.length, 1, 'Exactly one ad creative record must exist');

    const targetingRows = await db
      .select()
      .from(schema.campaignTargeting)
      .where(eq(schema.campaignTargeting.campaignId, testCampaignId as any));
    assert.equal(targetingRows.length, 1, 'Targeting record must exist');
    console.log('  Database integrity confirmed: campaign row, sources, creative, and targeting match.');

    // Phase 33: True Revision Test
    console.log('\n[TEST 11] Testing True Revision Workflow (Phase 33)...');
    // Set status to CHANGES_REQUESTED in DB
    await db
      .update(schema.campaigns)
      .set({ status: 'CHANGES_REQUESTED' })
      .where(eq(schema.campaigns.id, testCampaignId as any));

    // Creator edits story during revision
    const revStoryRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/story`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        storyHeadline: 'REVISED: Freshwater Access For Underrepresented Districts',
        storyIntro: 'Updated introduction connecting underserved communities with gravity filtration blueprints.',
        storyContent: 'REVISED: Over 2 billion people worldwide lack safely managed drinking water services. WaterFirst Foundation has engineered low-cost, gravity-fed biological sand filtration systems, but local civic leaders and regional authorities often remain unaware of available matching grants and implementation blueprints. By amplifying this informative campaign across regional media and social channels, we can directly connect 45 community centers with actionable filtration blueprints.',
        sources: [
          {
            title: 'WHO/UNICEF Joint Monitoring Programme for Water Supply',
            url: 'https://washdata.org',
            publisher: 'WHO / UNICEF',
          },
          {
            title: 'United Nations World Water Development Report',
            url: 'https://unesco.org/water',
            publisher: 'UNESCO',
          },
        ],
      }),
    });
    assert.equal(revStoryRes.status, 200, 'Story revision PATCH must succeed with 200');

    // Resubmit
    const resubmitRes = await fetch(`${BASE_URL}/campaigns/${testCampaignId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ fundingGoal: 4000 }),
    });
    assert.equal(resubmitRes.status, 200, 'Resubmission must succeed with 200');
    const resubmitJson = await resubmitRes.json();
    assert.equal(resubmitJson.data?.status, 'SUBMITTED_FOR_REVIEW', 'Status must return to SUBMITTED_FOR_REVIEW');

    // Verify still exactly one row
    const finalRows = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, testCampaignId as any));
    assert.equal(finalRows.length, 1, 'Must still be EXACTLY ONE DB row with same UUID (no duplicate)');
    assert.equal(finalRows[0].fundingGoal, 4000, 'Funding goal must update to 4000');
    console.log('  Revision workflow verified: SAME row updated without duplicate.');

    // Phase 11: Ending Soon Sort Check
    console.log('\n[TEST 12] Testing ending_soon query...');
    const sortRes = await fetch(`${BASE_URL}/campaigns?sort=ending_soon`);
    assert.equal(sortRes.status, 200, 'ending_soon query must succeed');
    const sortJson = await sortRes.json();
    assert.equal(sortJson.success, true, 'ending_soon query success must be true');
    console.log('  ending_soon query verified.');

    console.log('\n========================================================');
    console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================');
  } finally {
    // Phase 4: Clean test data from Neon so database is never polluted
    if (testCampaignId) {
      console.log(`\n[Cleanup] Removing test campaign ${testCampaignId} from Neon...`);
      try {
        const db = getDb();
        await db.delete(schema.campaigns).where(eq(schema.campaigns.id, testCampaignId as any));
        console.log('[Cleanup] Test campaign cleaned up successfully.');
      } catch (cleanupErr) {
        console.warn('[Cleanup] Failed to delete test campaign:', cleanupErr);
      }
    }
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed with Error:', err);
  process.exit(1);
});
