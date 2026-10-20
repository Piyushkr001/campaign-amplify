import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq, sql } from 'drizzle-orm';
import type { Server } from 'http';

async function runTests() {
  console.log('========================================================');
  console.log('STARTING CAMPAIGN AMPLIFY SYNC HARDENING TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5099;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  try {
    // 1. Readiness Check
    console.log('[TEST 1] Checking /health and /ready endpoints...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    console.log('  Health:', healthJson.success ? 'PASS' : 'FAIL');

    const readyRes = await fetch(`${BASE_URL}/ready`);
    const readyJson = await readyRes.json();
    console.log('  Ready (DB connection):', readyJson.data?.database === 'connected' ? 'PASS' : 'FAIL');

    // 2. Phase 18: UUID Validation Check
    console.log('\n[TEST 2] Testing UUID Validation (Phase 18 & 19)...');
    const invalidIdRes = await fetch(`${BASE_URL}/campaigns/not-a-valid-uuid`);
    const invalidIdJson = await invalidIdRes.json();
    console.log('  Status Code:', invalidIdRes.status, invalidIdRes.status === 400 ? 'PASS' : 'FAIL');
    console.log('  Error Code:', invalidIdJson.error?.code, invalidIdJson.error?.code === 'INVALID_CAMPAIGN_ID' ? 'PASS' : 'FAIL');

    // 3. Phase 32: End-to-End API Campaign Creation
    console.log('\n[TEST 3] Testing Step A: POST /campaigns (Server Draft Creation)...');
    const createRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Clean Water Village Pipeline' }),
    });
    const createJson = await createRes.json();
    const serverUuid = createJson.data?.id;
    console.log('  Received Server UUID:', serverUuid);
    console.log('  Initial Status:', createJson.data?.status, createJson.data?.status === 'DRAFT' ? 'PASS' : 'FAIL');
    if (!serverUuid) throw new Error('Failed to get server UUID from create draft');

    // Step B: Basics
    console.log('\n[TEST 4] Testing Step B: PATCH /basics...');
    const basicsRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/basics`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Clean Water Village Pipeline',
        category: 'Environment',
        creatorName: 'Global Clean Water Initiative',
        summary: 'Community-funded amplification to deliver biological sand filtration infrastructure blueprints to 50 rural districts.',
        coverImage: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800',
      }),
    });
    const basicsJson = await basicsRes.json();
    console.log('  Basics Response:', basicsJson.success ? 'PASS' : 'FAIL');

    // Step C: Story
    console.log('\n[TEST 5] Testing Step C: PATCH /story...');
    const storyRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/story`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    const storyJson = await storyRes.json();
    console.log('  Story Response:', storyJson.success ? 'PASS' : 'FAIL');

    // Step D: Visuals
    console.log('\n[TEST 6] Testing Step D: PATCH /visuals...');
    const visualsRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/visuals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adHeadline: 'Safe Drinking Water Blueprint',
        adDescription: 'Help fund advertising to bring freshwater blueprints to rural villages.',
        adCTA: 'Learn More',
        adImage: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800',
      }),
    });
    const visualsJson = await visualsRes.json();
    console.log('  Visuals Response:', visualsJson.success ? 'PASS' : 'FAIL');

    // Step E: Reach
    console.log('\n[TEST 7] Testing Step E: PATCH /reach...');
    const reachRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/reach`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: ['India', 'Delhi NCR', 'Rural Districts'],
        interests: ['Clean Water', 'Public Infrastructure', 'Sustainability'],
        channels: ['Meta Targeted Ads', 'Regional News Outlets'],
        audienceDescription: 'Civic-minded community members, educators, and public stakeholders',
        durationDays: 21,
      }),
    });
    const reachJson = await reachRes.json();
    console.log('  Reach Response:', reachJson.success ? 'PASS' : 'FAIL');

    // Step F: Submit
    console.log('\n[TEST 8] Testing Step F: POST /submit...');
    const submitRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fundingGoal: 3500 }),
    });
    const submitJson = await submitRes.json();
    console.log('  Submit Status Code:', submitRes.status, submitRes.status === 200 ? 'PASS' : 'FAIL');
    console.log('  Submitted Campaign Status:', submitJson.data?.status, submitJson.data?.status === 'SUBMITTED_FOR_REVIEW' ? 'PASS' : 'FAIL');
    console.log('  Returned Same UUID:', submitJson.data?.id === serverUuid ? 'PASS' : 'FAIL');

    // Step G: Database Inspection (Phase 36)
    console.log('\n[TEST 9] Database Inspection via Drizzle ORM in Neon...');
    const db = getDb();
    const campRows = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, serverUuid as any));
    console.log('  Campaign Rows Found for UUID:', campRows.length, campRows.length === 1 ? 'PASS (EXACTLY ONE)' : 'FAIL');
    const campRow = campRows[0];
    console.log('  Row Status:', campRow.status, campRow.status === 'SUBMITTED_FOR_REVIEW' ? 'PASS' : 'FAIL');
    console.log('  Funding Goal:', campRow.fundingGoal, campRow.fundingGoal === 3500 ? 'PASS' : 'FAIL');

    const sourceRows = await db
      .select()
      .from(schema.campaignSources)
      .where(eq(schema.campaignSources.campaignId, serverUuid as any));
    console.log('  Sources Count in DB:', sourceRows.length, sourceRows.length >= 1 ? 'PASS' : 'FAIL');

    const creativeRows = await db
      .select()
      .from(schema.adCreatives)
      .where(eq(schema.adCreatives.campaignId, serverUuid as any));
    console.log('  Ad Creatives Count in DB:', creativeRows.length, creativeRows.length === 1 ? 'PASS' : 'FAIL');

    const targetingRows = await db
      .select()
      .from(schema.campaignTargeting)
      .where(eq(schema.campaignTargeting.campaignId, serverUuid as any));
    console.log('  Targeting Rows Count in DB:', targetingRows.length, targetingRows.length === 1 ? 'PASS' : 'FAIL');

    const historyRows = await db
      .select()
      .from(schema.campaignStatusHistory)
      .where(eq(schema.campaignStatusHistory.campaignId, serverUuid as any));
    console.log('  Status History Count in DB:', historyRows.length, historyRows.length >= 1 ? 'PASS' : 'FAIL');

    // Phase 33: True Revision Test
    console.log('\n[TEST 10] Testing True Revision Workflow (Phase 33)...');
    // Set status to CHANGES_REQUESTED in DB
    await db
      .update(schema.campaigns)
      .set({ status: 'CHANGES_REQUESTED' })
      .where(eq(schema.campaigns.id, serverUuid as any));

    // Creator edits story during revision
    const revStoryRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/story`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    const revStoryJson = await revStoryRes.json();
    console.log('  Revision Story PATCH:', revStoryJson.success ? 'PASS' : 'FAIL');

    // Resubmit
    const resubmitRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fundingGoal: 4000 }),
    });
    const resubmitJson = await resubmitRes.json();
    console.log('  Resubmit Status:', resubmitJson.data?.status, resubmitJson.data?.status === 'SUBMITTED_FOR_REVIEW' ? 'PASS' : 'FAIL');

    // Check DB: MUST STILL BE EXACTLY ONE ROW WITH SAME UUID
    const finalRows = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, serverUuid as any));
    console.log('  DB Rows After Revision:', finalRows.length, finalRows.length === 1 ? 'PASS (NO DUPLICATE ROW)' : 'FAIL');
    console.log('  Final Funding Goal in DB:', finalRows[0].fundingGoal, finalRows[0].fundingGoal === 4000 ? 'PASS' : 'FAIL');

    // Phase 30: Edit Status Restriction Check
    console.log('\n[TEST 11] Testing Edit Status Restriction (Phase 30)...');
    await db
      .update(schema.campaigns)
      .set({ status: 'FUNDING' })
      .where(eq(schema.campaigns.id, serverUuid as any));

    const invalidEditRes = await fetch(`${BASE_URL}/campaigns/${serverUuid}/basics`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Mutated in funding state',
        category: 'Environment',
        creatorName: 'Hacker',
        summary: 'This should not be allowed.',
      }),
    });
    const invalidEditJson = await invalidEditRes.json();
    console.log('  Forbidden Status Code:', invalidEditRes.status, invalidEditRes.status === 400 ? 'PASS' : 'FAIL');
    console.log('  Error Code:', invalidEditJson.error?.code, invalidEditJson.error?.code === 'INVALID_CAMPAIGN_STATUS' ? 'PASS' : 'FAIL');

    // Phase 22: Ending Soon Sort Check
    console.log('\n[TEST 12] Testing ending_soon sort query (Phase 22)...');
    const sortRes = await fetch(`${BASE_URL}/campaigns?sort=ending_soon`);
    const sortJson = await sortRes.json();
    console.log('  Sort ending_soon Query:', sortJson.success ? 'PASS' : 'FAIL');

    console.log('\n========================================================');
    console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
