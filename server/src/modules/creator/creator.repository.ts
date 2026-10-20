import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { CampaignListDTO, CampaignDetailDTO, calculateDaysRemaining } from '../campaigns/campaign.types';
import { CreatorCampaignsQuery } from './creator.schemas';
import { CAMPAIGN_POLICY } from '../../config/campaign-policy';
import { NotFoundError, DatabaseUnavailableError } from '../../utils/errors';

export const CreatorRepository = {
  findCreatorCampaigns: async (params: {
    actorUserId: string;
    query?: CreatorCampaignsQuery;
  }): Promise<CampaignListDTO[]> => {
    if (!env.DATABASE_URL) {
      return [];
    }

    try {
      const db = getDb();
      const conditions = [eq(schema.campaigns.creatorId, params.actorUserId as any)];

      if (params.query?.status && params.query.status !== 'ALL') {
        conditions.push(eq(schema.campaigns.status, params.query.status as any));
      }

      if (params.query?.category && params.query.category !== 'All') {
        conditions.push(eq(schema.campaigns.category, params.query.category));
      }

      if (params.query?.search && params.query.search.trim().length > 0) {
        const q = `%${params.query.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.campaigns.title, q),
            ilike(schema.campaigns.summary, q),
            ilike(schema.campaigns.category, q)
          )!
        );
      }

      const rows = await db
        .select()
        .from(schema.campaigns)
        .where(and(...conditions))
        .orderBy(desc(schema.campaigns.updatedAt));

      return await Promise.all(
        rows.map(async (row) => {
          const targeting = await db
            .select({ channels: schema.campaignTargeting.channels })
            .from(schema.campaignTargeting)
            .where(eq(schema.campaignTargeting.campaignId, row.id))
            .limit(1);

          const channels = (targeting[0]?.channels as string[]) || [];
          const goal = row.fundingGoal ?? 0;
          const raised = row.amountRaised ?? 0;
          const fundingPercentage = goal > 0 ? Math.round((raised / goal) * 100) : 0;
          const daysRemaining = calculateDaysRemaining({
            status: row.status,
            fundingStartedAt: row.fundingStartedAt,
            durationDays: row.durationDays,
          });

          return {
            id: row.id,
            title: row.title || 'Untitled Campaign',
            category: row.category || 'General',
            creator: row.creatorDisplayName || 'Community Campaigner',
            creatorType: 'Community Campaigner',
            summary: row.summary || '',
            status: row.status,
            coverImage: row.coverImageUrl || undefined,
            fundingGoal: goal,
            raised,
            backerCount: row.backerCount,
            fundingPercentage,
            estimatedReachMin: Math.round(
              goal * CAMPAIGN_POLICY.impressionsPerDollarMin * (CAMPAIGN_POLICY.advertisingPercentage / 100)
            ),
            estimatedReachMax: Math.round(
              goal * CAMPAIGN_POLICY.impressionsPerDollarMax * (CAMPAIGN_POLICY.advertisingPercentage / 100)
            ),
            estimatedImpressionsMin: Math.round(
              goal * CAMPAIGN_POLICY.impressionsPerDollarMin * (CAMPAIGN_POLICY.advertisingPercentage / 100)
            ),
            estimatedImpressionsMax: Math.round(
              goal * CAMPAIGN_POLICY.impressionsPerDollarMax * (CAMPAIGN_POLICY.advertisingPercentage / 100)
            ),
            daysRemaining,
            featured: row.featured,
            createdAt: row.createdAt.toISOString(),
            distributionChannels: channels,
          };
        })
      );
    } catch (err) {
      console.error('[CreatorRepository] Error in findCreatorCampaigns:', err);
      throw new DatabaseUnavailableError('Failed to fetch creator campaigns.');
    }
  },

  findCreatorCampaignById: async (params: {
    campaignId: string;
    actorUserId: string;
  }): Promise<CampaignDetailDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.campaigns)
        .where(
          and(
            eq(schema.campaigns.id, params.campaignId as any),
            eq(schema.campaigns.creatorId, params.actorUserId as any)
          )
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        throw new NotFoundError(
          `Campaign "${params.campaignId}" not found or does not belong to creator.`
        );
      }

      // Fetch related records
      const sources = await db
        .select()
        .from(schema.campaignSources)
        .where(eq(schema.campaignSources.campaignId, row.id))
        .orderBy(schema.campaignSources.position);

      const creativeRows = await db
        .select()
        .from(schema.adCreatives)
        .where(eq(schema.adCreatives.campaignId, row.id))
        .limit(1);
      const creative = creativeRows[0];

      const targetingRows = await db
        .select()
        .from(schema.campaignTargeting)
        .where(eq(schema.campaignTargeting.campaignId, row.id))
        .limit(1);
      const targeting = targetingRows[0];

      // Fetch status history
      const historyRows = await db
        .select()
        .from(schema.campaignStatusHistory)
        .where(eq(schema.campaignStatusHistory.campaignId, row.id))
        .orderBy(schema.campaignStatusHistory.createdAt);

      // Fetch latest review decision/feedback
      const reviewRows = await db
        .select()
        .from(schema.campaignReviews)
        .where(eq(schema.campaignReviews.campaignId, row.id))
        .orderBy(desc(schema.campaignReviews.createdAt))
        .limit(1);
      const latestReview = reviewRows[0];

      const locations = (targeting?.locations as string[]) || [];
      const interests = (targeting?.interests as string[]) || [];
      const channels = (targeting?.channels as string[]) || [];

      const goal = row.fundingGoal ?? 0;
      const raised = row.amountRaised ?? 0;
      const fundingPercentage = goal > 0 ? Math.round((raised / goal) * 100) : 0;
      const daysRemaining = calculateDaysRemaining({
        status: row.status,
        fundingStartedAt: row.fundingStartedAt,
        durationDays: row.durationDays,
      });

      return {
        id: row.id,
        title: row.title || 'Untitled Campaign',
        category: row.category || 'General',
        creator: row.creatorDisplayName || 'Community Campaigner',
        creatorType: 'Community Campaigner',
        summary: row.summary || '',
        story: row.storyContent || undefined,
        storyHeadline: row.storyHeadline || undefined,
        storyIntro: row.storyIntro || undefined,
        storyContent: row.storyContent || undefined,
        storyImage: row.storyImageUrl || undefined,
        storyImageCaption: row.storyImageCaption || undefined,
        storyImageCredit: row.storyImageCredit || undefined,
        suggestedAction: row.suggestedAction || undefined,
        adImage: creative?.imageUrl || undefined,
        adHeadline: creative?.headline || undefined,
        adDescription: creative?.description || undefined,
        adCTA: creative?.cta || undefined,
        locations,
        interests,
        channels,
        audienceDescription: targeting?.audienceDescription || undefined,
        durationDays: row.durationDays || 14,
        coverImage: row.coverImageUrl || undefined,
        fundingGoal: goal,
        raised,
        fundingPercentage,
        estimatedReachMin: Math.round(
          goal * CAMPAIGN_POLICY.impressionsPerDollarMin * (CAMPAIGN_POLICY.advertisingPercentage / 100)
        ),
        estimatedReachMax: Math.round(
          goal * CAMPAIGN_POLICY.impressionsPerDollarMax * (CAMPAIGN_POLICY.advertisingPercentage / 100)
        ),
        estimatedImpressionsMin: Math.round(
          goal * CAMPAIGN_POLICY.impressionsPerDollarMin * (CAMPAIGN_POLICY.advertisingPercentage / 100)
        ),
        estimatedImpressionsMax: Math.round(
          goal * CAMPAIGN_POLICY.impressionsPerDollarMax * (CAMPAIGN_POLICY.advertisingPercentage / 100)
        ),
        status: row.status,
        daysRemaining,
        featured: row.featured,
        createdAt: row.createdAt.toISOString(),
        submittedAt: row.submittedAt?.toISOString(),
        reviewStartedAt: row.reviewStartedAt?.toISOString(),
        requestedChangesAt: row.requestedChangesAt?.toISOString(),
        approvedAt: row.approvedAt?.toISOString(),
        fundingStartedAt: row.fundingStartedAt?.toISOString(),
        fundingGoalReachedAt: row.fundingGoalReachedAt?.toISOString(),
        fundingEndedAt: row.fundingEndedAt?.toISOString(),
        distributionPreparationAt: row.distributionPreparationAt?.toISOString(),
        promotionStartedAt: row.promotionStartedAt?.toISOString(),
        completedAt: row.completedAt?.toISOString(),
        rejectedAt: row.rejectedAt?.toISOString(),
        cancelledAt: row.cancelledAt?.toISOString(),
        failedAt: row.failedAt?.toISOString(),
        backerCount: row.backerCount,
        distributionChannels: channels,
        useOfFunds: {
          advertising: CAMPAIGN_POLICY.advertisingPercentage,
          platformFee: CAMPAIGN_POLICY.platformPercentage,
          paymentProcessing: CAMPAIGN_POLICY.processingPercentage,
        },
        supportingSources: sources.map((s) => ({
          title: s.title,
          url: s.url,
          publisher: s.publisher || undefined,
        })),
        reviewFeedback: latestReview?.feedback || undefined,
        rejectionReason: latestReview?.decision === 'REJECTED' ? latestReview.feedback || undefined : undefined,
        statusHistory: historyRows.map((h) => ({
          id: h.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          actorType: h.actorType,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        })),
      };
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      console.error('[CreatorRepository] Error in findCreatorCampaignById:', err);
      throw new DatabaseUnavailableError('Failed to fetch creator campaign detail.');
    }
  },
};
