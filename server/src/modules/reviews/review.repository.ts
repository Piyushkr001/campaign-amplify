import { eq, and, inArray, desc, ilike, or } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { BackendCampaignStatus, calculateDaysRemaining } from '../campaigns/campaign.types';
import { ReviewerCampaignListDTO, ReviewerCampaignDetailDTO } from './review.types';
import { ReviewQueueQuery } from './review.schemas';
import { transitionCampaign } from '../campaigns/campaign.transition';
import { CAMPAIGN_POLICY } from '../../config/campaign-policy';
import { NotFoundError, DatabaseUnavailableError } from '../../utils/errors';

export const REVIEW_QUEUE_STATUSES: BackendCampaignStatus[] = [
  'SUBMITTED_FOR_REVIEW',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
];

export const ReviewRepository = {
  findQueue: async (query?: ReviewQueueQuery): Promise<ReviewerCampaignListDTO[]> => {
    if (!env.DATABASE_URL) {
      return [];
    }

    try {
      const db = getDb();
      const conditions = [];

      if (query?.status && query.status !== 'ALL') {
        conditions.push(eq(schema.campaigns.status, query.status as any));
      } else {
        conditions.push(inArray(schema.campaigns.status, REVIEW_QUEUE_STATUSES));
      }

      if (query?.category && query.category !== 'All') {
        conditions.push(eq(schema.campaigns.category, query.category));
      }

      if (query?.search && query.search.trim().length > 0) {
        const q = `%${query.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.campaigns.title, q),
            ilike(schema.campaigns.summary, q),
            ilike(schema.campaigns.creatorDisplayName, q)
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
          const sources = await db
            .select({ id: schema.campaignSources.id })
            .from(schema.campaignSources)
            .where(eq(schema.campaignSources.campaignId, row.id));

          const reviews = await db
            .select({ feedback: schema.campaignReviews.feedback })
            .from(schema.campaignReviews)
            .where(eq(schema.campaignReviews.campaignId, row.id))
            .orderBy(desc(schema.campaignReviews.createdAt))
            .limit(1);

          const goal = row.fundingGoal ?? 0;
          const reachMin = Math.round(
            goal * CAMPAIGN_POLICY.impressionsPerDollarMin * (CAMPAIGN_POLICY.advertisingPercentage / 100)
          );
          const reachMax = Math.round(
            goal * CAMPAIGN_POLICY.impressionsPerDollarMax * (CAMPAIGN_POLICY.advertisingPercentage / 100)
          );

          return {
            id: row.id,
            title: row.title || 'Untitled Campaign',
            category: row.category || 'General',
            creator: row.creatorDisplayName || 'Community Campaigner',
            creatorName: row.creatorDisplayName || 'Community Campaigner',
            creatorType: 'Community Campaigner',
            summary: row.summary || '',
            status: row.status,
            coverImage: row.coverImageUrl || undefined,
            fundingGoal: goal,
            submittedAt: row.submittedAt?.toISOString(),
            reviewStartedAt: row.reviewStartedAt?.toISOString(),
            requestedChangesAt: row.requestedChangesAt?.toISOString(),
            approvedAt: row.approvedAt?.toISOString(),
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            sourcesCount: sources.length,
            lastReviewFeedback: reviews[0]?.feedback || undefined,
            latestReviewFeedback: reviews[0]?.feedback || undefined,
            estimatedReachMin: reachMin,
            estimatedReachMax: reachMax,
          };
        })
      );
    } catch (err) {
      console.error('[ReviewRepository] Error in findQueue:', err);
      throw new DatabaseUnavailableError('Failed to fetch reviewer queue.');
    }
  },

  findCampaignById: async (campaignId: string): Promise<ReviewerCampaignDetailDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.campaigns)
        .where(eq(schema.campaigns.id, campaignId as any))
        .limit(1);

      const row = rows[0];
      if (!row) {
        throw new NotFoundError(`Campaign "${campaignId}" not found.`);
      }

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

      const historyRows = await db
        .select()
        .from(schema.campaignStatusHistory)
        .where(eq(schema.campaignStatusHistory.campaignId, row.id))
        .orderBy(schema.campaignStatusHistory.createdAt);

      const reviewRows = await db
        .select()
        .from(schema.campaignReviews)
        .where(eq(schema.campaignReviews.campaignId, row.id))
        .orderBy(desc(schema.campaignReviews.createdAt));

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
        reviewFeedback: reviewRows[0]?.feedback || undefined,
        rejectionReason: reviewRows[0]?.decision === 'REJECTED' ? reviewRows[0].feedback || undefined : undefined,
        statusHistory: historyRows.map((h) => ({
          id: h.id,
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          actorType: h.actorType,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        })),
        reviews: reviewRows.map((r) => ({
          id: r.id,
          reviewerId: r.reviewerId,
          decision: r.decision,
          feedback: r.feedback,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      console.error('[ReviewRepository] Error in findCampaignById:', err);
      throw new DatabaseUnavailableError('Failed to fetch review campaign details.');
    }
  },

  startReview: async (campaignId: string, reviewerId: string) => {
    return transitionCampaign({
      campaignId,
      nextStatus: 'UNDER_REVIEW',
      actorType: 'REVIEWER',
      actorId: reviewerId,
      note: 'Reviewer assigned and began factual verification.',
    });
  },

  requestChanges: async (campaignId: string, reviewerId: string, feedback: string) => {
    return transitionCampaign({
      campaignId,
      nextStatus: 'CHANGES_REQUESTED',
      actorType: 'REVIEWER',
      actorId: reviewerId,
      note: feedback,
      reviewDecision: 'CHANGES_REQUESTED',
      reviewFeedback: feedback,
    });
  },

  approve: async (campaignId: string, reviewerId: string, note?: string) => {
    const feedbackNote = note || 'Passed source verification and policy compliance checks.';
    return transitionCampaign({
      campaignId,
      nextStatus: 'APPROVED',
      actorType: 'REVIEWER',
      actorId: reviewerId,
      note: feedbackNote,
      reviewDecision: 'APPROVED',
      reviewFeedback: feedbackNote,
    });
  },

  reject: async (campaignId: string, reviewerId: string, reason: string) => {
    return transitionCampaign({
      campaignId,
      nextStatus: 'REJECTED',
      actorType: 'REVIEWER',
      actorId: reviewerId,
      note: reason,
      reviewDecision: 'REJECTED',
      reviewFeedback: reason,
    });
  },

  startFunding: async (campaignId: string, reviewerId: string, note?: string) => {
    return transitionCampaign({
      campaignId,
      nextStatus: 'FUNDING',
      actorType: 'REVIEWER',
      actorId: reviewerId,
      note: note || 'Campaign approved and published for community funding.',
    });
  },
};
