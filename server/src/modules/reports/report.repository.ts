import { eq, asc } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { CampaignReportDTO, CampaignChannelResultDTO } from './report.types';
import { generateDeterministicReport } from './report.generator';
import { NotFoundError, DatabaseUnavailableError } from '../../utils/errors';

export const ReportRepository = {
  findReportByCampaignId: async (campaignId: string): Promise<CampaignReportDTO | null> => {
    if (!env.DATABASE_URL) {
      return null;
    }

    const db = getDb();
    const [reportRow] = await db
      .select({
        id: schema.campaignReports.id,
        campaignId: schema.campaignReports.campaignId,
        reportStatus: schema.campaignReports.reportStatus,
        fundsRaised: schema.campaignReports.fundsRaised,
        advertisingAllocation: schema.campaignReports.advertisingAllocation,
        advertisingSpend: schema.campaignReports.advertisingSpend,
        platformFee: schema.campaignReports.platformFee,
        processingFee: schema.campaignReports.processingFee,
        estimatedImpressionsMin: schema.campaignReports.estimatedImpressionsMin,
        estimatedImpressionsMax: schema.campaignReports.estimatedImpressionsMax,
        measuredImpressions: schema.campaignReports.measuredImpressions,
        measuredReach: schema.campaignReports.measuredReach,
        clicks: schema.campaignReports.clicks,
        ctr: schema.campaignReports.ctr,
        durationDays: schema.campaignReports.durationDays,
        startedAt: schema.campaignReports.startedAt,
        completedAt: schema.campaignReports.completedAt,
        generatedAt: schema.campaignReports.generatedAt,
        disclaimer: schema.campaignReports.disclaimer,
        isDemoData: schema.campaignReports.isDemoData,
        campaignTitle: schema.campaigns.title,
      })
      .from(schema.campaignReports)
      .innerJoin(schema.campaigns, eq(schema.campaignReports.campaignId, schema.campaigns.id))
      .where(eq(schema.campaignReports.campaignId, campaignId as any))
      .limit(1);

    if (!reportRow) {
      return null;
    }

    const channelRows = await db
      .select({
        id: schema.campaignChannelResults.id,
        channel: schema.campaignChannelResults.channel,
        spend: schema.campaignChannelResults.spend,
        impressions: schema.campaignChannelResults.impressions,
        reach: schema.campaignChannelResults.reach,
        clicks: schema.campaignChannelResults.clicks,
        ctr: schema.campaignChannelResults.ctr,
      })
      .from(schema.campaignChannelResults)
      .where(eq(schema.campaignChannelResults.reportId, reportRow.id as any))
      .orderBy(asc(schema.campaignChannelResults.position));

    const channelResults: CampaignChannelResultDTO[] = channelRows.map((ch) => ({
      id: ch.id,
      channel: ch.channel,
      spend: ch.spend,
      impressions: ch.impressions,
      reach: ch.reach,
      clicks: ch.clicks,
      ctr: typeof ch.ctr === 'string' ? parseFloat(ch.ctr) : Number(ch.ctr),
    }));

    return {
      id: reportRow.id,
      campaignId: reportRow.campaignId,
      campaignTitle: reportRow.campaignTitle || 'Campaign',
      reportStatus: reportRow.reportStatus as 'INTERIM' | 'FINAL',
      fundsRaised: reportRow.fundsRaised,
      advertisingAllocation: reportRow.advertisingAllocation,
      advertisingSpend: reportRow.advertisingSpend,
      platformFee: reportRow.platformFee,
      processingFee: reportRow.processingFee,
      estimatedImpressionsMin: reportRow.estimatedImpressionsMin,
      estimatedImpressionsMax: reportRow.estimatedImpressionsMax,
      measuredImpressions: reportRow.measuredImpressions,
      measuredReach: reportRow.measuredReach,
      clicks: reportRow.clicks,
      ctr: typeof reportRow.ctr === 'string' ? parseFloat(reportRow.ctr) : Number(reportRow.ctr),
      durationDays: reportRow.durationDays,
      channelResults,
      startedAt: reportRow.startedAt?.toISOString() || null,
      completedAt: reportRow.completedAt?.toISOString() || null,
      generatedAt: reportRow.generatedAt.toISOString(),
      disclaimer: reportRow.disclaimer,
      isDemoData: reportRow.isDemoData,
    };
  },

  upsertReportForCampaign: async (campaignId: string): Promise<CampaignReportDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for campaign reports.');
    }

    const db = getDb();
    const [campaign] = await db
      .select({
        id: schema.campaigns.id,
        title: schema.campaigns.title,
        amountRaised: schema.campaigns.amountRaised,
        fundingGoal: schema.campaigns.fundingGoal,
        status: schema.campaigns.status,
        durationDays: schema.campaigns.durationDays,
        promotionStartedAt: schema.campaigns.promotionStartedAt,
        distributionPreparationAt: schema.campaigns.distributionPreparationAt,
        completedAt: schema.campaigns.completedAt,
      })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId as any))
      .limit(1);

    if (!campaign) {
      throw new NotFoundError(`Campaign "${campaignId}" not found.`);
    }

    // Get targeting channels
    const [targeting] = await db
      .select({ channels: schema.campaignTargeting.channels })
      .from(schema.campaignTargeting)
      .where(eq(schema.campaignTargeting.campaignId, campaignId as any))
      .limit(1);

    const generated = generateDeterministicReport({
      id: campaign.id,
      title: campaign.title || 'Campaign',
      amountRaised: campaign.amountRaised,
      fundingGoal: campaign.fundingGoal,
      status: campaign.status,
      durationDays: campaign.durationDays,
      promotionStartedAt: campaign.promotionStartedAt,
      distributionPreparationAt: campaign.distributionPreparationAt,
      completedAt: campaign.completedAt,
      channels: (targeting?.channels as string[]) || null,
    });

    const now = new Date();

    return await db.transaction(async (tx) => {
      const [savedReport] = await tx
        .insert(schema.campaignReports)
        .values({
          campaignId: campaign.id as any,
          reportStatus: generated.reportStatus,
          fundsRaised: generated.fundsRaised,
          advertisingAllocation: generated.advertisingAllocation,
          advertisingSpend: generated.advertisingSpend,
          platformFee: generated.platformFee,
          processingFee: generated.processingFee,
          estimatedImpressionsMin: generated.estimatedImpressionsMin,
          estimatedImpressionsMax: generated.estimatedImpressionsMax,
          measuredImpressions: generated.measuredImpressions,
          measuredReach: generated.measuredReach,
          clicks: generated.clicks,
          ctr: generated.ctr.toFixed(2),
          durationDays: generated.durationDays,
          startedAt: generated.startedAt ? new Date(generated.startedAt) : null,
          completedAt: generated.completedAt ? new Date(generated.completedAt) : null,
          generatedAt: now,
          disclaimer: generated.disclaimer,
          isDemoData: generated.isDemoData,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.campaignReports.campaignId,
          set: {
            reportStatus: generated.reportStatus,
            fundsRaised: generated.fundsRaised,
            advertisingAllocation: generated.advertisingAllocation,
            advertisingSpend: generated.advertisingSpend,
            platformFee: generated.platformFee,
            processingFee: generated.processingFee,
            estimatedImpressionsMin: generated.estimatedImpressionsMin,
            estimatedImpressionsMax: generated.estimatedImpressionsMax,
            measuredImpressions: generated.measuredImpressions,
            measuredReach: generated.measuredReach,
            clicks: generated.clicks,
            ctr: generated.ctr.toFixed(2),
            durationDays: generated.durationDays,
            startedAt: generated.startedAt ? new Date(generated.startedAt) : null,
            completedAt: generated.completedAt ? new Date(generated.completedAt) : null,
            generatedAt: now,
            disclaimer: generated.disclaimer,
            isDemoData: generated.isDemoData,
            updatedAt: now,
          },
        })
        .returning();

      // Replace channel results atomically
      await tx
        .delete(schema.campaignChannelResults)
        .where(eq(schema.campaignChannelResults.reportId, savedReport.id as any));

      if (generated.channelResults.length > 0) {
        await tx.insert(schema.campaignChannelResults).values(
          generated.channelResults.map((ch, idx) => ({
            reportId: savedReport.id as any,
            channel: ch.channel,
            spend: ch.spend,
            impressions: ch.impressions,
            reach: ch.reach,
            clicks: ch.clicks,
            ctr: ch.ctr.toFixed(2),
            position: idx,
            createdAt: now,
          }))
        );
      }

      return {
        ...generated,
        id: savedReport.id,
      };
    });
  },
};
