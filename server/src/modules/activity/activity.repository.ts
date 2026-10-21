import { eq, inArray, desc, and } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { ActivityEventDTO, ActivityEventType, ActivityFeedResponseDTO } from './activity.types';
import { ListActivityQuery } from './activity.schemas';

function mapStatusToActivityEvent(
  toStatus: string,
  fromStatus?: string | null
): { type: ActivityEventType; title: string; defaultDesc: string } {
  switch (toStatus) {
    case 'DRAFT':
      return {
        type: 'CAMPAIGN_DRAFT_CREATED',
        title: 'Campaign Draft Created',
        defaultDesc: 'Initial campaign draft was created.',
      };
    case 'SUBMITTED_FOR_REVIEW':
      return {
        type: 'CAMPAIGN_SUBMITTED',
        title: 'Campaign Submitted for Review',
        defaultDesc: fromStatus === 'CHANGES_REQUESTED'
          ? 'Campaign resubmitted with requested revisions addressed.'
          : 'Campaign submitted for editorial and factual review.',
      };
    case 'UNDER_REVIEW':
      return {
        type: 'REVIEW_STARTED',
        title: 'Verification Review Started',
        defaultDesc: 'Reviewer assigned and began factual verification.',
      };
    case 'CHANGES_REQUESTED':
      return {
        type: 'CHANGES_REQUESTED',
        title: 'Reviewer Requested Changes',
        defaultDesc: 'Editorial reviewer requested modifications before approval.',
      };
    case 'APPROVED':
      return {
        type: 'CAMPAIGN_APPROVED',
        title: 'Campaign Approved',
        defaultDesc: 'Campaign approved for community backing.',
      };
    case 'REJECTED':
      return {
        type: 'CAMPAIGN_REJECTED',
        title: 'Campaign Not Approved',
        defaultDesc: 'Campaign did not meet amplification editorial guidelines.',
      };
    case 'FUNDING':
      return {
        type: 'FUNDING_STARTED',
        title: 'Campaign Open for Backing',
        defaultDesc: 'Campaign is now actively accepting community contributions.',
      };
    case 'FUNDING_GOAL_REACHED':
      return {
        type: 'FUNDING_GOAL_REACHED',
        title: 'Funding Goal Reached',
        defaultDesc: '100% of the community funding goal has been achieved!',
      };
    case 'FUNDING_ENDED':
      return {
        type: 'FUNDING_ENDED',
        title: 'Funding Period Concluded',
        defaultDesc: 'Contribution window closed and campaign transitioned to distribution preparation.',
      };
    case 'DISTRIBUTION_PREPARATION':
      return {
        type: 'DISTRIBUTION_PREPARATION_STARTED',
        title: 'Distribution Preparation Started',
        defaultDesc: 'Targeting, audience parameters, and advertising creatives are being configured.',
      };
    case 'PROMOTING':
      return {
        type: 'PROMOTION_STARTED',
        title: 'Promotion Active Across Ad Networks',
        defaultDesc: 'Message distribution is actively delivering impressions across selected channels.',
      };
    case 'COMPLETED':
      return {
        type: 'CAMPAIGN_COMPLETED',
        title: 'Campaign Distribution Completed',
        defaultDesc: 'All advertising delivery finalized. Campaign report is available.',
      };
    case 'FAILED':
      return {
        type: 'CAMPAIGN_FAILED',
        title: 'Campaign Delivery Failed',
        defaultDesc: 'Campaign delivery encountered an unrecoverable issue.',
      };
    default:
      return {
        type: 'CAMPAIGN_SUBMITTED',
        title: `Campaign Status: ${toStatus}`,
        defaultDesc: `Campaign transitioned to ${toStatus}.`,
      };
  }
}

export const ActivityRepository = {
  findUserActivityFeed: async (
    userId: string,
    query: ListActivityQuery
  ): Promise<ActivityFeedResponseDTO> => {
    if (!env.DATABASE_URL) {
      return {
        events: [],
        total: 0,
        limit: query.limit,
        offset: query.offset,
      };
    }

    const db = getDb();
    const eventMap = new Map<string, ActivityEventDTO>();

    // 1. Fetch campaigns created by this user
    const userCampaigns = await db
      .select({
        id: schema.campaigns.id,
        title: schema.campaigns.title,
        status: schema.campaigns.status,
      })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.creatorId, userId as any));

    const userCampaignIds = userCampaigns.map((c) => c.id);
    const campaignTitleMap = new Map<string, string>();
    userCampaigns.forEach((c) => {
      if (c.title) campaignTitleMap.set(c.id, c.title);
    });

    // 2. Fetch contributions by this user
    const userContributions = await db
      .select({
        id: schema.contributions.id,
        campaignId: schema.contributions.campaignId,
        amount: schema.contributions.amount,
        status: schema.contributions.status,
        confirmedAt: schema.contributions.confirmedAt,
        createdAt: schema.contributions.createdAt,
        campaignTitle: schema.campaigns.title,
      })
      .from(schema.contributions)
      .innerJoin(schema.campaigns, eq(schema.contributions.campaignId, schema.campaigns.id))
      .where(eq(schema.contributions.userId, userId as any));

    // Save backed campaign IDs and titles
    const backedCampaignIds: string[] = [];
    userContributions.forEach((c) => {
      if (c.campaignTitle) campaignTitleMap.set(c.campaignId, c.campaignTitle);
      if (!backedCampaignIds.includes(c.campaignId)) {
        backedCampaignIds.push(c.campaignId);
      }
    });

    // Generate contribution confirmed events
    userContributions.forEach((contrib) => {
      if (contrib.status === 'CONFIRMED') {
        const eventId = `contrib-${contrib.id}`;
        eventMap.set(eventId, {
          id: eventId,
          type: 'CONTRIBUTION_CONFIRMED',
          campaignId: contrib.campaignId,
          campaignTitle: contrib.campaignTitle || 'Campaign',
          contributionId: contrib.id,
          title: 'Backed Campaign',
          description: `Contributed $${contrib.amount} to amplify this message.`,
          status: 'CONFIRMED',
          createdAt: (contrib.confirmedAt || contrib.createdAt).toISOString(),
          metadata: {
            amount: contrib.amount,
            advertisingAllocation: Math.round(contrib.amount * 0.85),
          },
        });
      }
    });

    // 3. Fetch failed payments for this user's contributions
    const contributionIds = userContributions.map((c) => c.id);
    if (contributionIds.length > 0) {
      const failedPayments = await db
        .select({
          id: schema.payments.id,
          contributionId: schema.payments.contributionId,
          amount: schema.payments.amount,
          cardLast4: schema.payments.cardLast4,
          failedAt: schema.payments.failedAt,
          createdAt: schema.payments.createdAt,
          errorMessage: schema.payments.errorMessage,
        })
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.status, 'FAILED' as any),
            inArray(schema.payments.contributionId, contributionIds as any)
          )
        );

      failedPayments.forEach((p) => {
          const contrib = userContributions.find((c) => c.id === p.contributionId);
          const eventId = `payment-fail-${p.id}`;
          eventMap.set(eventId, {
            id: eventId,
            type: 'PAYMENT_FAILED',
            campaignId: contrib?.campaignId,
            campaignTitle: contrib?.campaignTitle || 'Campaign',
            contributionId: p.contributionId,
            title: 'Payment Failed',
            description: p.errorMessage || `Payment attempt for $${p.amount} failed.`,
            status: 'FAILED',
            createdAt: (p.failedAt || p.createdAt).toISOString(),
            metadata: {
              amount: p.amount,
              cardLast4: p.cardLast4,
            },
          });
        });
    }

    // 4. Fetch status history for creator campaigns (and backed campaigns milestone updates)
    const allRelevantCampaignIds = Array.from(
      new Set([...userCampaignIds, ...backedCampaignIds])
    );

    if (allRelevantCampaignIds.length > 0) {
      const historyRows = await db
        .select({
          id: schema.campaignStatusHistory.id,
          campaignId: schema.campaignStatusHistory.campaignId,
          fromStatus: schema.campaignStatusHistory.fromStatus,
          toStatus: schema.campaignStatusHistory.toStatus,
          note: schema.campaignStatusHistory.note,
          createdAt: schema.campaignStatusHistory.createdAt,
        })
        .from(schema.campaignStatusHistory)
        .where(inArray(schema.campaignStatusHistory.campaignId, allRelevantCampaignIds as any))
        .orderBy(desc(schema.campaignStatusHistory.createdAt));

      historyRows.forEach((row) => {
        const isCreator = userCampaignIds.includes(row.campaignId);
        // For backed campaigns, only show major milestone events: FUNDING_GOAL_REACHED, PROMOTING, COMPLETED
        if (
          !isCreator &&
          row.toStatus !== 'FUNDING_GOAL_REACHED' &&
          row.toStatus !== 'PROMOTING' &&
          row.toStatus !== 'COMPLETED'
        ) {
          return;
        }

        const mapping = mapStatusToActivityEvent(row.toStatus, row.fromStatus);
        const eventId = `status-${row.id}`;
        eventMap.set(eventId, {
          id: eventId,
          type: mapping.type,
          campaignId: row.campaignId,
          campaignTitle: campaignTitleMap.get(row.campaignId) || 'Campaign',
          title: mapping.title,
          description: row.note || mapping.defaultDesc,
          status: row.toStatus,
          createdAt: row.createdAt.toISOString(),
          metadata: {
            fromStatus: row.fromStatus,
            toStatus: row.toStatus,
          },
        });
      });
    }

    // Sort all events newest first
    const allEvents = Array.from(eventMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = allEvents.length;
    const paginatedEvents = allEvents.slice(query.offset, query.offset + query.limit);

    return {
      events: paginatedEvents,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  },
};
