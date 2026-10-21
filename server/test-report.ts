import assert from 'node:assert/strict';
import { createApp } from './src/app';
import { getDb, schema } from './src/db/index';
import { eq } from 'drizzle-orm';
import type { Server } from 'http';
import { resolveDemoCreatorId } from './src/utils/demo-identity';

async function runReportTest() {
  console.log('========================================================');
  console.log('STARTING CAMPAIGN REPORT INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  const app = createApp();
  const PORT = 5100;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });
  const BASE_URL = `http://localhost:${PORT}/api/v1`;

  const db = getDb();
  let draftCampaignId: string | null = null;
  let completedCampaignId: string | null = null;

  try {
    const creatorId = await resolveDemoCreatorId();

    // 1. Create a DRAFT campaign
    console.log('[STAGE 1] Testing Report Availability Guard for DRAFT campaign...');
    const [draft] = await db
      .insert(schema.campaigns)
      .values({
        creatorId,
        title: 'Draft Campaign No Report',
        category: 'Technology',
        creatorName: 'Demo Creator',
        summary: 'Should not have a report available.',
        fundingGoal: 500,
        amountRaised: 0,
        status: 'DRAFT',
      } as any)
      .returning();
    draftCampaignId = draft.id;

    const draftReportRes = await fetch(`${BASE_URL}/campaigns/${draftCampaignId}/report`);
    assert.equal(draftReportRes.status, 400, 'DRAFT campaign must return 400 for report');
    const draftJson = await draftReportRes.json();
    assert.equal(draftJson.error?.code, 'REPORT_NOT_AVAILABLE');
    console.log('  Availability guard verified: 400 REPORT_NOT_AVAILABLE for DRAFT.');

    // 2. Create a COMPLETED campaign with specific channels and raised amount
    console.log('\n[STAGE 2] Generating Report for COMPLETED campaign ($2,000 raised)...');
    const selectedChannels = ['Meta', 'YouTube', 'TikTok'];
    const amountRaised = 2000;
    const [completed] = await db
      .insert(schema.campaigns)
      .values({
        creatorId,
        title: 'Clean Riverway Awareness Blitz',
        category: 'Environment',
        creatorName: 'River Protectors',
        summary: 'Public education on agricultural runoff.',
        fundingGoal: 2000,
        amountRaised,
        distributionChannels: selectedChannels,
        durationDays: 21,
        status: 'COMPLETED',
        completedAt: new Date(),
      } as any)
      .returning();
    completedCampaignId = completed.id;

    await db.insert(schema.campaignTargeting).values({
      campaignId: completedCampaignId as any,
      locations: ['National'],
      interests: ['Clean Water', 'Ecology'],
      channels: selectedChannels,
      audienceDescription: 'General public and local community residents.',
    });

    // 3. First fetch of report (triggers generator and database persistence)
    const reportRes1 = await fetch(`${BASE_URL}/campaigns/${completedCampaignId}/report`);
    assert.equal(reportRes1.status, 200, 'GET /campaigns/:id/report must return 200');
    const json1 = await reportRes1.json();
    const report1 = json1.data;

    assert.ok(report1, 'Report payload must exist');
    assert.equal(report1.campaignId, completedCampaignId);
    assert.equal(report1.reportStatus, 'FINAL');
    assert.equal(report1.isDemoData, true, 'Report must be explicitly flagged as isDemoData: true');
    assert.ok(report1.disclaimer, 'Disclaimer must be present');
    console.log('  Report generated and persisted in Neon PostgreSQL.');

    // 4. Mathematical and consistency assertions
    console.log('\n[STAGE 3] Asserting Mathematical & Budget Consistency...');
    // A. Budget Allocations: 85% ad allocation, 10% platform, 5% processing
    const expectedAdAllocation = Math.round(amountRaised * 0.85);
    const expectedPlatformFee = Math.round(amountRaised * 0.10);
    const expectedProcessingFee = Math.round(amountRaised * 0.05);

    assert.equal(report1.fundsRaised, amountRaised, 'Funds raised must match campaign amountRaised');
    assert.equal(report1.advertisingAllocation, expectedAdAllocation, 'Ad allocation must be 85%');
    assert.equal(report1.platformFee, expectedPlatformFee, 'Platform fee must be 10%');
    assert.equal(report1.processingFee, expectedProcessingFee, 'Processing fee must be 5%');
    assert.ok(
      report1.advertisingSpend <= report1.advertisingAllocation,
      `Ad spend (${report1.advertisingSpend}) must NOT exceed ad allocation (${report1.advertisingAllocation})`
    );
    console.log(`  Budget verified: Raised=$${report1.fundsRaised}, Ad Allocation=$${report1.advertisingAllocation}, Spend=$${report1.advertisingSpend}`);

    // B. Metrics Consistency
    assert.ok(
      report1.measuredReach <= report1.measuredImpressions,
      `Reach (${report1.measuredReach}) must be <= Impressions (${report1.measuredImpressions})`
    );
    assert.ok(
      report1.clicks <= report1.measuredImpressions,
      `Clicks (${report1.clicks}) must be <= Impressions (${report1.measuredImpressions})`
    );
    const calculatedCtr = Number(((report1.clicks / report1.measuredImpressions) * 100).toFixed(2));
    assert.equal(report1.ctr, calculatedCtr, `CTR (${report1.ctr}) must equal (clicks/impressions)*100 (${calculatedCtr})`);
    console.log(`  Metrics verified: Impressions=${report1.measuredImpressions}, Reach=${report1.measuredReach}, Clicks=${report1.clicks}, CTR=${report1.ctr}%`);

    // C. Channel Consistency
    console.log('\n[STAGE 4] Asserting Channel Consistency...');
    const channelsReturned = report1.channelResults.map((c: any) => c.channel);
    console.log('  Selected campaign channels:', selectedChannels);
    console.log('  Returned report channels:', channelsReturned);
    assert.equal(channelsReturned.length, selectedChannels.length, 'Report must contain exactly the selected channels');
    for (const ch of selectedChannels) {
      assert.ok(channelsReturned.includes(ch), `Channel results must contain selected channel ${ch}`);
    }

    let sumChannelSpend = 0;
    for (const chResult of report1.channelResults) {
      assert.ok(chResult.spend > 0, 'Each channel must have positive spend');
      assert.ok(chResult.reach <= chResult.impressions, `Channel reach <= impressions for ${chResult.channel}`);
      assert.ok(chResult.clicks <= chResult.impressions, `Channel clicks <= impressions for ${chResult.channel}`);
      const expectedChannelCtr = Number(((chResult.clicks / chResult.impressions) * 100).toFixed(2));
      assert.equal(chResult.ctr, expectedChannelCtr, `Channel CTR matches calculation for ${chResult.channel}`);
      sumChannelSpend += chResult.spend;
    }
    assert.equal(sumChannelSpend, report1.advertisingSpend, 'Sum of channel spend must equal total advertisingSpend');
    console.log(`  Channel metrics verified: Sum channel spend ($${sumChannelSpend}) == advertisingSpend ($${report1.advertisingSpend})`);

    // 5. Deterministic Test: Fetch report second time and assert identical results
    console.log('\n[STAGE 5] Testing Deterministic Consistency (Second Fetch)...');
    const reportRes2 = await fetch(`${BASE_URL}/campaigns/${completedCampaignId}/report`);
    assert.equal(reportRes2.status, 200);
    const json2 = await reportRes2.json();
    const report2 = json2.data;

    assert.equal(report2.id, report1.id, 'Report ID must be identical');
    assert.equal(report2.measuredImpressions, report1.measuredImpressions, 'Impressions must be identical');
    assert.equal(report2.measuredReach, report1.measuredReach, 'Reach must be identical');
    assert.equal(report2.clicks, report1.clicks, 'Clicks must be identical');
    assert.equal(report2.advertisingSpend, report1.advertisingSpend, 'Spend must be identical');
    assert.equal(report2.channelResults.length, report1.channelResults.length, 'Channel results length identical');
    for (let i = 0; i < report1.channelResults.length; i++) {
      assert.equal(report2.channelResults[i].spend, report1.channelResults[i].spend);
      assert.equal(report2.channelResults[i].impressions, report1.channelResults[i].impressions);
    }
    console.log('  Deterministic persistence verified: 100% identical on subsequent refetch.');

    // 6. Verify PostgreSQL database records
    console.log('\n[STAGE 6] Verifying campaign_reports and campaign_channel_results in Neon DB...');
    const [dbReport] = await db.select().from(schema.campaignReports).where(eq(schema.campaignReports.campaignId, completedCampaignId));
    assert.ok(dbReport, 'campaign_reports row must exist in database');
    assert.equal(dbReport.measuredImpressions, report1.measuredImpressions);

    const dbChannels = await db.select().from(schema.campaignChannelResults).where(eq(schema.campaignChannelResults.reportId, dbReport.id));
    assert.equal(dbChannels.length, selectedChannels.length, 'campaign_channel_results rows must match selected channels');
    console.log('  PostgreSQL tables campaign_reports and campaign_channel_results verified.');

    console.log('\n========================================================');
    console.log('CAMPAIGN REPORT TEST PASSED (100% SUCCESS)');
    console.log('========================================================\n');
  } finally {
    console.log('[Teardown] Cleaning up test report records...');
    for (const cid of [draftCampaignId, completedCampaignId]) {
      if (cid) {
        try {
          const reports = await db.select().from(schema.campaignReports).where(eq(schema.campaignReports.campaignId, cid));
          for (const r of reports) {
            await db.delete(schema.campaignChannelResults).where(eq(schema.campaignChannelResults.reportId, r.id));
          }
          await db.delete(schema.campaignReports).where(eq(schema.campaignReports.campaignId, cid));
          await db.delete(schema.campaigns).where(eq(schema.campaigns.id, cid));
        } catch (err) {
          console.warn('[Teardown] Cleanup warning:', err);
        }
      }
    }
    server.close();
  }
}

runReportTest().catch((err) => {
  console.error('\n❌ Campaign Report Test Failed:', err);
  process.exit(1);
});
