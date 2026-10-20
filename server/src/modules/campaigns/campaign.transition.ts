import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { BackendCampaignStatus } from './campaign.types';
import { isAllowedTransition } from './campaign.lifecycle';
import {
  NotFoundError,
  InvalidCampaignStatusError,
  DatabaseUnavailableError,
} from '../../utils/errors';

export interface TransitionCampaignOptions {
  campaignId: string;
  nextStatus: BackendCampaignStatus;
  actorType: 'CREATOR' | 'REVIEWER' | 'SYSTEM';
  actorId?: string | null;
  note?: string | null;
  reviewDecision?: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED' | string | null;
  reviewFeedback?: string | null;
  fundingGoal?: number | null;
}

export async function transitionCampaign(options: TransitionCampaignOptions) {
  if (!env.DATABASE_URL) {
    throw new DatabaseUnavailableError('Database is not configured for campaign transitions.');
  }

  const db = getDb();
  const existingRows = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, options.campaignId as any))
    .limit(1);

  const existing = existingRows[0];
  if (!existing) {
    throw new NotFoundError(`Campaign "${options.campaignId}" not found.`);
  }

  const currentStatus = existing.status as BackendCampaignStatus;
  if (!isAllowedTransition(currentStatus, options.nextStatus)) {
    throw new InvalidCampaignStatusError(currentStatus, `transition to ${options.nextStatus}`);
  }

  const now = new Date();
  const timestampSet: Record<string, any> = {
    status: options.nextStatus,
    updatedAt: now,
  };

  if (options.fundingGoal !== undefined && options.fundingGoal !== null) {
    timestampSet.fundingGoal = options.fundingGoal;
  }

  switch (options.nextStatus) {
    case 'SUBMITTED_FOR_REVIEW':
      timestampSet.submittedAt = now;
      break;
    case 'UNDER_REVIEW':
      timestampSet.reviewStartedAt = now;
      break;
    case 'CHANGES_REQUESTED':
      timestampSet.requestedChangesAt = now;
      break;
    case 'APPROVED':
      timestampSet.approvedAt = now;
      break;
    case 'REJECTED':
      timestampSet.rejectedAt = now;
      break;
    case 'FUNDING':
      timestampSet.fundingStartedAt = now;
      break;
    case 'FUNDING_GOAL_REACHED':
      timestampSet.fundingGoalReachedAt = now;
      break;
    case 'FUNDING_ENDED':
      timestampSet.fundingEndedAt = now;
      break;
    case 'DISTRIBUTION_PREPARATION':
      timestampSet.distributionPreparationAt = now;
      break;
    case 'PROMOTING':
      timestampSet.promotionStartedAt = now;
      break;
    case 'COMPLETED':
      timestampSet.completedAt = now;
      break;
    case 'CANCELLED':
      timestampSet.cancelledAt = now;
      break;
    case 'FAILED':
      timestampSet.failedAt = now;
      break;
  }

  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.campaigns)
      .set(timestampSet)
      .where(eq(schema.campaigns.id, options.campaignId as any))
      .returning();

    // Insert authoritative status history event
    await tx.insert(schema.campaignStatusHistory).values({
      campaignId: options.campaignId as any,
      fromStatus: currentStatus,
      toStatus: options.nextStatus,
      actorType: options.actorType,
      actorId: (options.actorId as any) || null,
      note: options.note || null,
      createdAt: now,
    });

    // If this transition includes an editorial review record, persist it
    if (options.reviewDecision) {
      await tx.insert(schema.campaignReviews).values({
        campaignId: options.campaignId as any,
        reviewerId: (options.actorId as any) || null,
        decision: options.reviewDecision,
        feedback: options.reviewFeedback || null,
        createdAt: now,
      });
    }

    return updated;
  });
}
