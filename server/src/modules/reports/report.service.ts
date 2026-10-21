import { ReportRepository } from './report.repository';
import { CampaignReportDTO } from './report.types';
import { getDb, schema } from '../../db/index';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { NotFoundError, ReportNotAvailableError, DatabaseUnavailableError } from '../../utils/errors';

export const ReportService = {
  getCampaignReport: async (campaignId: string): Promise<CampaignReportDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    const db = getDb();
    const [campaign] = await db
      .select({
        id: schema.campaigns.id,
        status: schema.campaigns.status,
      })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId as any))
      .limit(1);

    if (!campaign) {
      throw new NotFoundError(`Campaign "${campaignId}" not found.`);
    }

    // Availability rule: reports are only available for PROMOTING or COMPLETED campaigns
    if (campaign.status !== 'PROMOTING' && campaign.status !== 'COMPLETED') {
      throw new ReportNotAvailableError(
        `Campaign report is not available yet (current status: ${campaign.status}). Reports become available once promotion begins or completes.`,
        { status: campaign.status }
      );
    }

    const existingReport = await ReportRepository.findReportByCampaignId(campaignId);

    // If report exists and matches current lifecycle state (e.g. FINAL for COMPLETED), return it
    if (existingReport) {
      if (campaign.status === 'COMPLETED' && existingReport.reportStatus === 'INTERIM') {
        // Upgrade interim report to final upon completion
        return await ReportRepository.upsertReportForCampaign(campaignId);
      }
      return existingReport;
    }

    // Generate and persist new report
    return await ReportRepository.upsertReportForCampaign(campaignId);
  },
};
