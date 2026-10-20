import { eq, and, desc } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { CAMPAIGN_POLICY } from '../../config/campaign-policy';
import {
  ContributionQuoteDTO,
  ContributionDTO,
  ContributionSummaryDTO,
  ContributionDetailDTO,
  ContributionReceiptDTO,
} from './contribution.types';
import {
  NotFoundError,
  DatabaseUnavailableError,
  CampaignNotBackableError,
  ForbiddenError,
  BadRequestError,
} from '../../utils/errors';

export const ContributionRepository = {
  calculateQuote: async (campaignId: string, amount: number): Promise<ContributionQuoteDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for contributions.');
    }

    try {
      const db = getDb();
      const campaignRows = await db
        .select()
        .from(schema.campaigns)
        .where(eq(schema.campaigns.id, campaignId as any))
        .limit(1);

      const campaign = campaignRows[0];
      if (!campaign) {
        throw new NotFoundError(`Campaign "${campaignId}" not found.`);
      }

      if (campaign.status !== 'FUNDING') {
        throw new CampaignNotBackableError(
          `Campaign "${campaign.title || campaignId}" is in "${campaign.status}" state and not open for funding.`
        );
      }

      const advertising = Math.round(
        amount * (CAMPAIGN_POLICY.advertisingPercentage / 100)
      );
      const platformFee = Math.round(
        amount * (CAMPAIGN_POLICY.platformPercentage / 100)
      );
      const processingFee = amount - advertising - platformFee;

      const estimatedImpressionsMin = Math.round(
        advertising * CAMPAIGN_POLICY.impressionsPerDollarMin
      );
      const estimatedImpressionsMax = Math.round(
        advertising * CAMPAIGN_POLICY.impressionsPerDollarMax
      );

      return {
        campaignId: campaign.id,
        campaignTitle: campaign.title || 'Untitled Campaign',
        amount,
        advertisingAllocation: advertising,
        platformFee,
        processingFee,
        estimatedImpressionsMin,
        estimatedImpressionsMax,
        currency: 'USD',
      };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof CampaignNotBackableError) throw err;
      console.error('[ContributionRepository] Error in calculateQuote:', err);
      throw new DatabaseUnavailableError('Failed to generate contribution quote.');
    }
  },

  createPending: async (params: {
    campaignId: string;
    userId?: string | null;
    amount: number;
  }): Promise<ContributionDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for contributions.');
    }

    try {
      const db = getDb();
      const campaignRows = await db
        .select()
        .from(schema.campaigns)
        .where(eq(schema.campaigns.id, params.campaignId as any))
        .limit(1);

      const campaign = campaignRows[0];
      if (!campaign) {
        throw new NotFoundError(`Campaign "${params.campaignId}" not found.`);
      }

      if (campaign.status !== 'FUNDING') {
        throw new CampaignNotBackableError(
          `Cannot contribute to campaign in "${campaign.status}" state. Only campaigns in FUNDING can be backed.`
        );
      }

      const now = new Date();
      const [inserted] = await db
        .insert(schema.contributions)
        .values({
          campaignId: params.campaignId as any,
          userId: (params.userId as any) || null,
          amount: params.amount,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const quote = await ContributionRepository.calculateQuote(params.campaignId, params.amount);

      return {
        id: inserted.id,
        campaignId: inserted.campaignId,
        userId: inserted.userId,
        amount: inserted.amount,
        status: inserted.status,
        createdAt: inserted.createdAt.toISOString(),
        quote: {
          advertisingAllocation: quote.advertisingAllocation,
          platformFee: quote.platformFee,
          processingFee: quote.processingFee,
          estimatedImpressionsMin: quote.estimatedImpressionsMin,
          estimatedImpressionsMax: quote.estimatedImpressionsMax,
          currency: quote.currency,
        },
      };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof CampaignNotBackableError) throw err;
      console.error('[ContributionRepository] Error in createPending:', err);
      throw new DatabaseUnavailableError('Failed to create contribution record.');
    }
  },

  findUserContributions: async (userId: string): Promise<ContributionSummaryDTO[]> => {
    if (!env.DATABASE_URL) {
      return [];
    }

    try {
      const db = getDb();
      const rows = await db
        .select({
          contribution: schema.contributions,
          campaign: schema.campaigns,
        })
        .from(schema.contributions)
        .innerJoin(schema.campaigns, eq(schema.contributions.campaignId, schema.campaigns.id))
        .where(eq(schema.contributions.userId, userId as any))
        .orderBy(desc(schema.contributions.createdAt));

      return await Promise.all(
        rows.map(async ({ contribution, campaign }) => {
          const payments = await db
            .select({ status: schema.payments.status })
            .from(schema.payments)
            .where(eq(schema.payments.contributionId, contribution.id))
            .orderBy(desc(schema.payments.createdAt))
            .limit(1);

          return {
            id: contribution.id,
            campaignId: campaign.id,
            campaignTitle: campaign.title || 'Untitled Campaign',
            campaignCoverImage: campaign.coverImageUrl || undefined,
            amount: contribution.amount,
            status: contribution.status,
            paymentStatus: payments[0]?.status || undefined,
            createdAt: contribution.createdAt.toISOString(),
            confirmedAt: contribution.confirmedAt?.toISOString() || null,
            receiptAvailable: contribution.status === 'CONFIRMED',
          };
        })
      );
    } catch (err) {
      console.error('[ContributionRepository] Error in findUserContributions:', err);
      throw new DatabaseUnavailableError('Failed to fetch contributions.');
    }
  },

  findDetailById: async (
    contributionId: string,
    actorUserId?: string
  ): Promise<ContributionDetailDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    try {
      const db = getDb();
      const rows = await db
        .select({
          contribution: schema.contributions,
          campaign: schema.campaigns,
        })
        .from(schema.contributions)
        .innerJoin(schema.campaigns, eq(schema.contributions.campaignId, schema.campaigns.id))
        .where(eq(schema.contributions.id, contributionId as any))
        .limit(1);

      const row = rows[0];
      if (!row) {
        throw new NotFoundError(`Contribution "${contributionId}" not found.`);
      }

      if (actorUserId && row.contribution.userId && row.contribution.userId !== actorUserId) {
        throw new ForbiddenError('You do not have permission to view this contribution.');
      }

      const paymentRows = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.contributionId, row.contribution.id))
        .orderBy(desc(schema.payments.createdAt))
        .limit(1);

      const payment = paymentRows[0];
      const amount = row.contribution.amount;
      const advertising = Math.round(
        amount * (CAMPAIGN_POLICY.advertisingPercentage / 100)
      );
      const platformFee = Math.round(
        amount * (CAMPAIGN_POLICY.platformPercentage / 100)
      );
      const processingFee = amount - advertising - platformFee;

      return {
        id: row.contribution.id,
        campaignId: row.campaign.id,
        campaignTitle: row.campaign.title || 'Untitled Campaign',
        campaignCoverImage: row.campaign.coverImageUrl || undefined,
        creatorName: row.campaign.creatorDisplayName || undefined,
        amount,
        status: row.contribution.status,
        paymentStatus: payment?.status || undefined,
        paymentReference: payment?.providerReference || undefined,
        cardLast4: payment?.cardLast4 || undefined,
        useOfFunds: {
          advertising,
          platformFee,
          paymentProcessing: processingFee,
        },
        impact: {
          advertisingAllocation: advertising,
          estimatedImpressionsMin: Math.round(
            advertising * CAMPAIGN_POLICY.impressionsPerDollarMin
          ),
          estimatedImpressionsMax: Math.round(
            advertising * CAMPAIGN_POLICY.impressionsPerDollarMax
          ),
        },
        createdAt: row.contribution.createdAt.toISOString(),
        confirmedAt: row.contribution.confirmedAt?.toISOString() || null,
      };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) throw err;
      console.error('[ContributionRepository] Error in findDetailById:', err);
      throw new DatabaseUnavailableError('Failed to fetch contribution detail.');
    }
  },

  findReceipt: async (
    contributionId: string,
    actorUserId?: string
  ): Promise<ContributionReceiptDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    try {
      const db = getDb();
      const rows = await db
        .select({
          contribution: schema.contributions,
          campaign: schema.campaigns,
        })
        .from(schema.contributions)
        .innerJoin(schema.campaigns, eq(schema.contributions.campaignId, schema.campaigns.id))
        .where(eq(schema.contributions.id, contributionId as any))
        .limit(1);

      const row = rows[0];
      if (!row) {
        throw new NotFoundError(`Contribution "${contributionId}" not found.`);
      }

      if (actorUserId && row.contribution.userId && row.contribution.userId !== actorUserId) {
        throw new ForbiddenError('You do not have permission to view this receipt.');
      }

      if (row.contribution.status !== 'CONFIRMED') {
        throw new BadRequestError(
          `Receipt is only available for CONFIRMED contributions (current status: ${row.contribution.status}).`,
          'RECEIPT_NOT_AVAILABLE'
        );
      }

      const paymentRows = await db
        .select()
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.contributionId, row.contribution.id),
            eq(schema.payments.status, 'SUCCESS')
          )
        )
        .orderBy(desc(schema.payments.processedAt))
        .limit(1);

      const payment = paymentRows[0];
      if (!payment) {
        throw new BadRequestError(
          'Receipt is only available for contributions with a SUCCESS payment record.',
          'PAYMENT_NOT_CONFIRMED'
        );
      }

      const amount = row.contribution.amount;
      const advertising = Math.round(
        amount * (CAMPAIGN_POLICY.advertisingPercentage / 100)
      );
      const platformFee = Math.round(
        amount * (CAMPAIGN_POLICY.platformPercentage / 100)
      );
      const processingFee = amount - advertising - platformFee;

      const receiptRef = `RCP-AMP-${row.contribution.id.slice(0, 8).toUpperCase()}`;

      return {
        receiptReference: receiptRef,
        contributionId: row.contribution.id,
        amount,
        currency: 'USD',
        status: 'CONFIRMED',
        campaign: {
          id: row.campaign.id,
          title: row.campaign.title || 'Untitled Campaign',
          creator: row.campaign.creatorDisplayName || 'Community Campaigner',
          category: row.campaign.category || 'General',
          coverImage: row.campaign.coverImageUrl || undefined,
        },
        payment: {
          provider: payment.provider,
          reference: payment.providerReference,
          status: payment.status,
          cardLast4: payment.cardLast4 || undefined,
          processedAt: payment.processedAt?.toISOString(),
        },
        allocation: {
          advertising,
          platformFee,
          paymentProcessing: processingFee,
          estimatedImpressionsMin: Math.round(
            advertising * CAMPAIGN_POLICY.impressionsPerDollarMin
          ),
          estimatedImpressionsMax: Math.round(
            advertising * CAMPAIGN_POLICY.impressionsPerDollarMax
          ),
        },
        createdAt: row.contribution.createdAt.toISOString(),
        confirmedAt: (row.contribution.confirmedAt || payment.processedAt || new Date()).toISOString(),
        disclaimer:
          'Demo payment receipt. No real payment processor was used. This contribution directly funds targeted campaign message distribution and community amplification.',
      };
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError || err instanceof BadRequestError) {
        throw err;
      }
      console.error('[ContributionRepository] Error in findReceipt:', err);
      throw new DatabaseUnavailableError('Failed to fetch contribution receipt.');
    }
  },
};
