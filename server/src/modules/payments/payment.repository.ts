import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { PaymentResultDTO, PaymentOutcome } from './payment.types';
import {
  AppError,
  NotFoundError,
  DatabaseUnavailableError,
  CampaignNotBackableError,
  BadRequestError,
  ForbiddenError,
  ContributionAccessDeniedError,
} from '../../utils/errors';

function generateDemoReference(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let ref = '';
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DEMO-AMP-${ref}`;
}

export const PaymentRepository = {
  simulate: async (params: {
    contributionId: string;
    outcome: PaymentOutcome;
    cardLast4?: string;
    actorUserId?: string;
  }): Promise<PaymentResultDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for payment processing.');
    }

    try {
      const db = getDb();

      return await db.transaction(async (tx) => {
        // 1. Load contribution record
        const contributionRows = await tx
          .select()
          .from(schema.contributions)
          .where(eq(schema.contributions.id, params.contributionId as any))
          .limit(1);

        const contribution = contributionRows[0];
        if (!contribution) {
          throw new NotFoundError(`Contribution "${params.contributionId}" not found.`);
        }

        // Ownership enforcement: Only the owning user can process payment for this contribution
        if (params.actorUserId && contribution.userId && contribution.userId !== params.actorUserId) {
          throw new ForbiddenError(
            'You do not have permission to process payment for this contribution.',
            'CONTRIBUTION_ACCESS_DENIED'
          );
        }

        // 2. IDEMPOTENCY CHECK: If contribution is already CONFIRMED, return existing success state
        if (contribution.status === 'CONFIRMED') {
          const existingPaymentRows = await tx
            .select()
            .from(schema.payments)
            .where(
              and(
                eq(schema.payments.contributionId, contribution.id),
                eq(schema.payments.status, 'SUCCESS')
              )
            )
            .limit(1);

          const existingPayment = existingPaymentRows[0];

          const campaignRows = await tx
            .select()
            .from(schema.campaigns)
            .where(eq(schema.campaigns.id, contribution.campaignId))
            .limit(1);
          const campaign = campaignRows[0]!;

          return {
            success: true,
            paymentId: existingPayment?.id || 'idempotent-replay',
            contributionId: contribution.id,
            providerReference: existingPayment?.providerReference || 'DEMO-AMP-EXISTING',
            status: 'SUCCESS',
            amount: contribution.amount,
            campaignId: campaign.id,
            campaignStatus: campaign.status,
            campaignAmountRaised: campaign.amountRaised,
            campaignFundingGoal: campaign.fundingGoal || 0,
            campaignBackerCount: campaign.backerCount,
            goalReached: campaign.amountRaised >= (campaign.fundingGoal || 0),
            cardLast4: existingPayment?.cardLast4 || params.cardLast4 || '4242',
            message: 'Payment already processed and contribution confirmed (idempotent response).',
            createdAt: contribution.createdAt.toISOString(),
            processedAt: (contribution.confirmedAt || contribution.updatedAt).toISOString(),
          };
        }

        // 3. Verify contribution is PENDING before processing
        if (contribution.status !== 'PENDING') {
          throw new BadRequestError(
            `Cannot process payment for contribution with status "${contribution.status}". Only PENDING contributions can be processed.`,
            'CONTRIBUTION_NOT_PENDING'
          );
        }

        // 4. Load campaign and ensure it is still in FUNDING state
        const campaignRows = await tx
          .select()
          .from(schema.campaigns)
          .where(eq(schema.campaigns.id, contribution.campaignId))
          .limit(1);

        const campaign = campaignRows[0];
        if (!campaign) {
          throw new NotFoundError(`Campaign "${contribution.campaignId}" not found.`);
        }

        if (campaign.status !== 'FUNDING') {
          throw new CampaignNotBackableError(
            `Campaign is in "${campaign.status}" state and no longer accepting contributions.`
          );
        }

        const now = new Date();
        const safeCardLast4 = params.cardLast4 || '4242';

        // Helper to generate a unique provider reference
        let providerReference = generateDemoReference();
        for (let attempt = 0; attempt < 3; attempt++) {
          const [collision] = await tx
            .select({ id: schema.payments.id })
            .from(schema.payments)
            .where(eq(schema.payments.providerReference, providerReference))
            .limit(1);
          if (!collision) break;
          providerReference = generateDemoReference();
        }

        // 5. Handle FAILED outcome
        if (params.outcome === 'FAILED') {
          const [payment] = await tx
            .insert(schema.payments)
            .values({
              contributionId: contribution.id,
              provider: 'DEMO',
              providerReference,
              amount: contribution.amount,
              status: 'FAILED',
              cardLast4: safeCardLast4,
              errorCode: 'DEMO_CARD_DECLINED',
              errorMessage: 'Simulated demo card decline or payment processing rejection.',
              failedAt: now,
              createdAt: now,
            })
            .returning();

          // Contribution remains PENDING to allow retry
          return {
            success: false,
            paymentId: payment.id,
            contributionId: contribution.id,
            providerReference: payment.providerReference,
            status: 'FAILED',
            amount: contribution.amount,
            campaignId: campaign.id,
            campaignStatus: campaign.status,
            campaignAmountRaised: campaign.amountRaised,
            campaignFundingGoal: campaign.fundingGoal || 0,
            campaignBackerCount: campaign.backerCount,
            goalReached: false,
            cardLast4: safeCardLast4,
            message: 'Simulated payment failed. Card declined by demo bank.',
            createdAt: payment.createdAt.toISOString(),
            processedAt: now.toISOString(),
          };
        }

        // 6. Handle CANCELLED outcome
        if (params.outcome === 'CANCELLED') {
          const [payment] = await tx
            .insert(schema.payments)
            .values({
              contributionId: contribution.id,
              provider: 'DEMO',
              providerReference,
              amount: contribution.amount,
              status: 'CANCELLED',
              cardLast4: safeCardLast4,
              cancelledAt: now,
              createdAt: now,
            })
            .returning();

          // Mark contribution cancelled
          await tx
            .update(schema.contributions)
            .set({
              status: 'CANCELLED',
              cancelledAt: now,
              updatedAt: now,
            })
            .where(eq(schema.contributions.id, contribution.id));

          return {
            success: false,
            paymentId: payment.id,
            contributionId: contribution.id,
            providerReference: payment.providerReference,
            status: 'CANCELLED',
            amount: contribution.amount,
            campaignId: campaign.id,
            campaignStatus: campaign.status,
            campaignAmountRaised: campaign.amountRaised,
            campaignFundingGoal: campaign.fundingGoal || 0,
            campaignBackerCount: campaign.backerCount,
            goalReached: false,
            cardLast4: safeCardLast4,
            message: 'Payment simulation was cancelled by user.',
            createdAt: payment.createdAt.toISOString(),
            processedAt: now.toISOString(),
          };
        }

        // 7. Handle SUCCESS outcome (Transactional & Concurrency-Safe)
        // CRITICAL: Atomically transition contribution from PENDING to CONFIRMED.
        // If another concurrent transaction already confirmed this contribution, zero rows return.
        const confirmedRows = await tx
          .update(schema.contributions)
          .set({
            status: 'CONFIRMED',
            confirmedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(schema.contributions.id, contribution.id),
              eq(schema.contributions.status, 'PENDING')
            )
          )
          .returning();

        if (confirmedRows.length === 0) {
          // Zero rows updated: Another concurrent transaction won the race or changed status!
          const [latestContrib] = await tx
            .select()
            .from(schema.contributions)
            .where(eq(schema.contributions.id, contribution.id))
            .limit(1);

          if (latestContrib?.status === 'CONFIRMED') {
            // Idempotent recovery: Return existing confirmed state without duplicate funding!
            const [existingPayment] = await tx
              .select()
              .from(schema.payments)
              .where(
                and(
                  eq(schema.payments.contributionId, contribution.id),
                  eq(schema.payments.status, 'SUCCESS')
                )
              )
              .limit(1);

            const [currentCampaign] = await tx
              .select()
              .from(schema.campaigns)
              .where(eq(schema.campaigns.id, contribution.campaignId))
              .limit(1);

            return {
              success: true,
              paymentId: existingPayment?.id || 'idempotent-concurrent-recovery',
              contributionId: contribution.id,
              providerReference: existingPayment?.providerReference || 'DEMO-AMP-CONCURRENT',
              status: 'SUCCESS',
              amount: contribution.amount,
              campaignId: currentCampaign!.id,
              campaignStatus: currentCampaign!.status,
              campaignAmountRaised: currentCampaign!.amountRaised,
              campaignFundingGoal: currentCampaign!.fundingGoal || 0,
              campaignBackerCount: currentCampaign!.backerCount,
              goalReached: currentCampaign!.amountRaised >= (currentCampaign!.fundingGoal || 0),
              cardLast4: existingPayment?.cardLast4 || safeCardLast4,
              message: 'Payment already processed and contribution confirmed (concurrent idempotent response).',
              createdAt: contribution.createdAt.toISOString(),
              processedAt: (latestContrib.confirmedAt || now).toISOString(),
            };
          }

          throw new BadRequestError(
            `Contribution status changed to "${latestContrib?.status || 'UNKNOWN'}". Cannot process payment.`,
            'CONTRIBUTION_NOT_PENDING'
          );
        }

        // Winning transaction: Record SUCCESS payment
        const [payment] = await tx
          .insert(schema.payments)
          .values({
            contributionId: contribution.id,
            provider: 'DEMO',
            providerReference,
            amount: contribution.amount,
            status: 'SUCCESS',
            cardLast4: safeCardLast4,
            processedAt: now,
            createdAt: now,
          })
          .returning();

        // 8. Atomic SQL increment for amountRaised and backerCount
        const [updatedCampaign] = await tx
          .update(schema.campaigns)
          .set({
            amountRaised: sql`${schema.campaigns.amountRaised} + ${contribution.amount}`,
            backerCount: sql`${schema.campaigns.backerCount} + 1`,
            updatedAt: now,
          })
          .where(eq(schema.campaigns.id, campaign.id))
          .returning();

        const goal = updatedCampaign.fundingGoal || 0;
        const isGoalReached = goal > 0 && updatedCampaign.amountRaised >= goal;

        let finalStatus = updatedCampaign.status;

        if (isGoalReached && updatedCampaign.status === 'FUNDING') {
          // Concurrency-safe conditional status update (only update if status is still FUNDING)
          const transitionedRows = await tx
            .update(schema.campaigns)
            .set({
              status: 'FUNDING_GOAL_REACHED',
              fundingGoalReachedAt: now,
              updatedAt: now,
            })
            .where(
              and(
                eq(schema.campaigns.id, campaign.id),
                eq(schema.campaigns.status, 'FUNDING')
              )
            )
            .returning();

          if (transitionedRows.length > 0) {
            finalStatus = 'FUNDING_GOAL_REACHED';
            await tx.insert(schema.campaignStatusHistory).values({
              campaignId: campaign.id,
              fromStatus: 'FUNDING',
              toStatus: 'FUNDING_GOAL_REACHED',
              actorType: 'SYSTEM',
              note: `Funding goal reached! Succeeded with backer contribution of $${contribution.amount} (Total: $${updatedCampaign.amountRaised} of $${goal}).`,
              createdAt: now,
            });
          }
        }

        return {
          success: true,
          paymentId: payment.id,
          contributionId: contribution.id,
          providerReference: payment.providerReference,
          status: 'SUCCESS',
          amount: contribution.amount,
          campaignId: campaign.id,
          campaignStatus: finalStatus,
          campaignAmountRaised: updatedCampaign.amountRaised,
          campaignFundingGoal: goal,
          campaignBackerCount: updatedCampaign.backerCount,
          goalReached: isGoalReached,
          cardLast4: safeCardLast4,
          message: isGoalReached
            ? 'Payment successful! Campaign funding goal reached.'
            : 'Payment successful! Contribution confirmed.',
          createdAt: payment.createdAt.toISOString(),
          processedAt: now.toISOString(),
        };
      });
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      console.error('[PaymentRepository] Error in simulate:', err);
      throw new DatabaseUnavailableError('Failed to process payment simulation.');
    }
  },
};
