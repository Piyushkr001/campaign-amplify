import { eq, inArray, and, ilike, or, desc, asc, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import {
  BACKEND_PUBLIC_STATUSES,
  CampaignListDTO,
  CampaignDetailDTO,
  calculateDaysRemaining,
} from './campaign.types';
import {
  ListCampaignsQuery,
  CreateDraftInput,
  UpdateBasicsInput,
  UpdateStoryInput,
  UpdateVisualsInput,
  UpdateReachInput,
  SubmitCampaignInput,
} from './campaign.schemas';
import {
  AppError,
  NotFoundError,
  BadRequestError,
  DatabaseUnavailableError,
  IncompleteCampaignError,
  InvalidCampaignStatusError,
  ForbiddenError,
} from '../../utils/errors';
import { canEditCampaign, canSubmitCampaign } from './campaign.lifecycle';
import { transitionCampaign } from './campaign.transition';
import { CAMPAIGN_POLICY } from '../../config/campaign-policy';

// Seed fallback data for when DATABASE_URL is completely unset locally
const FALLBACK_PUBLIC_CAMPAIGNS: CampaignDetailDTO[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Clean Water for Every Village',
    category: 'Environment',
    creator: 'WaterFirst Foundation',
    creatorType: 'Nonprofit Organization',
    creatorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    summary:
      'Funding digital and local print message distribution to bring awareness to freshwater filtration infrastructure in underserved rural areas.',
    story:
      'Over 2 billion people worldwide lack safely managed drinking water services. WaterFirst Foundation has engineered low-cost, gravity-fed biological sand filtration systems, but local civic leaders and regional authorities often remain unaware of available matching grants and implementation blueprints. By amplifying this informative campaign across regional media and social channels, we can directly connect 45 community centers with actionable filtration blueprints.',
    storyHeadline: 'Safe Drinking Water Infrastructure',
    storyIntro: 'Connecting underserved communities with gravity filtration blueprints.',
    storyContent:
      'Over 2 billion people worldwide lack safely managed drinking water services. WaterFirst Foundation has engineered low-cost, gravity-fed biological sand filtration systems, but local civic leaders and regional authorities often remain unaware of available matching grants and implementation blueprints. By amplifying this informative campaign across regional media and social channels, we can directly connect 45 community centers with actionable filtration blueprints.',
    coverImage:
      'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=1200&q=80',
    raised: 18450,
    fundingGoal: 25000,
    fundingPercentage: 74,
    estimatedReachMin: 360000,
    estimatedReachMax: 520000,
    estimatedImpressionsMin: 360000,
    estimatedImpressionsMax: 520000,
    status: 'FUNDING',
    daysRemaining: 12,
    durationDays: 24,
    featured: true,
    createdAt: '2026-09-15T08:00:00Z',
    fundingStartedAt: '2026-09-15T08:00:00Z',
    backerCount: 312,
    distributionChannels: ['Meta Targeted Ads', 'Regional News Outlets', 'Civic Network Newsletters'],
    locations: ['Regional Districts', 'Rural Communities'],
    interests: ['Clean Water', 'Public Infrastructure'],
    channels: ['Meta Targeted Ads', 'Regional News Outlets'],
    useOfFunds: {
      advertising: 85,
      platformFee: 10,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'WHO/UNICEF Joint Monitoring Programme for Water Supply',
        url: 'https://washdata.org',
        publisher: 'WHO / UNICEF',
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Understanding Renewable Energy Grid Economics',
    category: 'Environment',
    creator: 'CleanGrid Initiative',
    creatorType: 'Research Collective',
    creatorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    summary:
      'Interactive public explainer ads demystifying transmission costs, solar peak shaving, and distributed battery storage incentives.',
    story:
      'Transitioning to zero-carbon energy requires community buy-in. Misconceptions about grid instability and peak-demand pricing frequently stall local solar and wind municipal permits. This campaign finances concise, verifiable video explainers on local social feeds and regional journalism networks.',
    storyHeadline: 'Clear Facts on Clean Energy Economics',
    storyIntro: 'Demystifying renewable transmission economics for municipal planners.',
    storyContent:
      'Transitioning to zero-carbon energy requires community buy-in. Misconceptions about grid instability and peak-demand pricing frequently stall local solar and wind municipal permits. This campaign finances concise, verifiable video explainers on local social feeds and regional journalism networks.',
    coverImage:
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
    raised: 24800,
    fundingGoal: 20000,
    fundingPercentage: 124,
    durationDays: 30,
    estimatedReachMin: 421600,
    estimatedReachMax: 632400,
    estimatedImpressionsMin: 421600,
    estimatedImpressionsMax: 632400,
    status: 'PROMOTING',
    daysRemaining: 18,
    featured: false,
    createdAt: '2026-09-18T13:00:00Z',
    promotionStartedAt: '2026-10-01T10:00:00Z',
    backerCount: 290,
    distributionChannels: ['YouTube Explainer Inventory', 'Clean Energy Publishers & Meta'],
    locations: ['Statewide'],
    interests: ['Clean Energy', 'Economics'],
    channels: ['YouTube Explainer Inventory', 'Meta'],
    useOfFunds: {
      advertising: 85,
      platformFee: 10,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'Renewable Power Generation Costs Report',
        url: 'https://irena.org/publications',
        publisher: 'IRENA',
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    title: 'Financial Literacy for Early Careers',
    category: 'Economic Policy',
    creator: 'FairEconomy Alliance',
    creatorType: 'Nonprofit Organization',
    creatorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    summary:
      'Educating young workers on compound interest, predatory payday lending risks, and employer retirement matches.',
    story:
      'Predatory financial products cost young workers billions annually in avoidable fees and high interest. FairEconomy Alliance has built practical, jargon-free interactive calculators on retirement compounding, credit score recovery, and student loan management. Funds power social distribution targeting young adults entering the workforce.',
    storyHeadline: 'Financial Survival Essentials for New Graduates',
    storyIntro: 'Equipping early career workers with financial independence fundamentals.',
    storyContent:
      'Predatory financial products cost young workers billions annually in avoidable fees and high interest. FairEconomy Alliance has built practical, jargon-free interactive calculators on retirement compounding, credit score recovery, and student loan management. Funds power social distribution targeting young adults entering the workforce.',
    coverImage:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    raised: 18400,
    fundingGoal: 16000,
    fundingPercentage: 115,
    durationDays: 30,
    estimatedReachMin: 312800,
    estimatedReachMax: 469200,
    estimatedImpressionsMin: 312800,
    estimatedImpressionsMax: 469200,
    status: 'COMPLETED',
    daysRemaining: 0,
    featured: false,
    createdAt: '2026-09-25T15:30:00Z',
    promotionStartedAt: '2026-09-20T08:00:00Z',
    completedAt: '2026-10-11T18:00:00Z',
    backerCount: 201,
    distributionChannels: ['Meta (Instagram & Facebook)', 'Google Display Network', 'Educational Newsletters'],
    locations: ['National Urban Centers'],
    interests: ['Personal Finance'],
    channels: ['Meta', 'Google Display'],
    useOfFunds: {
      advertising: 85,
      platformFee: 10,
      paymentProcessing: 5,
    },
    supportingSources: [
      {
        title: 'National Financial Capability Study Summary',
        url: 'https://faireconomy.example.org/study',
        publisher: 'Financial Capability Bureau',
      },
    ],
  },
];



export const CampaignRepository = {
  /**
   * Fetches public campaigns using real database ordering and filtering.
   */
  findPublicCampaigns: async (query: ListCampaignsQuery): Promise<CampaignListDTO[]> => {
    if (!env.DATABASE_URL) {
      // Standalone local mode when DATABASE_URL is not set
      let list = [...FALLBACK_PUBLIC_CAMPAIGNS];

      if (query.category && query.category !== 'All') {
        list = list.filter((c) => c.category === query.category);
      }
      if (query.status) {
        list = list.filter((c) => c.status === query.status);
      }
      if (query.search && query.search.trim().length > 0) {
        const q = query.search.toLowerCase().trim();
        list = list.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.creator.toLowerCase().includes(q) ||
            c.summary.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
        );
      }

      switch (query.sort) {
        case 'newest':
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'most_funded':
          list.sort((a, b) => b.raised - a.raised);
          break;
        case 'ending_soon':
          list.sort((a, b) => {
            const aPriority = a.status === 'FUNDING' ? 0 : 1;
            const bPriority = b.status === 'FUNDING' ? 0 : 1;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.daysRemaining - b.daysRemaining;
          });
          break;
        case 'featured':
        default:
          list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.raised - a.raised);
          break;
      }

      return list.slice(query.offset, query.offset + query.limit);
    }

    try {
      const db = getDb();
      const conditions = [inArray(schema.campaigns.status, BACKEND_PUBLIC_STATUSES)];

      if (query.category && query.category !== 'All') {
        conditions.push(eq(schema.campaigns.category, query.category));
      }

      if (query.status) {
        conditions.push(eq(schema.campaigns.status, query.status as any));
      }

      if (query.search && query.search.trim().length > 0) {
        const q = `%${query.search.trim()}%`;
        conditions.push(
          or(
            ilike(schema.campaigns.title, q),
            ilike(schema.campaigns.creatorDisplayName, q),
            ilike(schema.campaigns.summary, q),
            ilike(schema.campaigns.category, q)
          )!
        );
      }

      // Real Drizzle database ordering
      let orderByClause;
      switch (query.sort) {
        case 'newest':
          orderByClause = [desc(schema.campaigns.createdAt)];
          break;
        case 'most_funded':
          orderByClause = [desc(schema.campaigns.amountRaised)];
          break;
        case 'ending_soon': {
          const statusPrioritySql = sql`CASE WHEN ${schema.campaigns.status} = 'FUNDING' THEN 0 ELSE 1 END`;
          const endsAtSql = sql`COALESCE(${schema.campaigns.fundingStartedAt}, ${schema.campaigns.createdAt}) + (${schema.campaigns.durationDays} || ' days')::interval`;
          orderByClause = [asc(statusPrioritySql), asc(endsAtSql)];
          break;
        }
        case 'featured':
        default:
          orderByClause = [desc(schema.campaigns.featured), desc(schema.campaigns.amountRaised)];
          break;
      }

      const rows = await db
        .select()
        .from(schema.campaigns)
        .where(and(...conditions))
        .orderBy(...orderByClause)
        .limit(query.limit)
        .offset(query.offset);

      // Fetch minimal distribution channel details for cards
      const results: CampaignListDTO[] = await Promise.all(
        rows.map(async (row) => {
          const targeting = await db
            .select({ channels: schema.campaignTargeting.channels })
            .from(schema.campaignTargeting)
            .where(eq(schema.campaignTargeting.campaignId, row.id))
            .limit(1);

          const channels = (targeting[0]?.channels as string[]) || ['Meta', 'Google Display'];
          const goal = row.fundingGoal || 10000;
          const raised = row.amountRaised;
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
            raised: raised,
            backerCount: row.backerCount,
            fundingPercentage: fundingPercentage,
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
            daysRemaining: daysRemaining,
            featured: row.featured,
            createdAt: row.createdAt.toISOString(),
            distributionChannels: channels,
          };
        })
      );

      return results;
    } catch (err) {
      console.error('[Database] Query failed in findPublicCampaigns:', err);
      throw new DatabaseUnavailableError('Unable to load campaigns from the database.');
    }
  },

  /**
   * Fetches full public campaign detail with targeting, creative, sources, and timestamps.
   */
  findPublicCampaignById: async (id: string): Promise<CampaignDetailDTO | null> => {
    if (!env.DATABASE_URL) {
      const found = FALLBACK_PUBLIC_CAMPAIGNS.find((c) => c.id === id);
      return found || null;
    }

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.campaigns)
        .where(
          and(
            eq(schema.campaigns.id, id as any),
            inArray(schema.campaigns.status, BACKEND_PUBLIC_STATUSES)
          )
        )
        .limit(1);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];

      // Fetch relational children
      const sources = await db
        .select()
        .from(schema.campaignSources)
        .where(eq(schema.campaignSources.campaignId, row.id))
        .orderBy(asc(schema.campaignSources.position));

      const targetingRows = await db
        .select()
        .from(schema.campaignTargeting)
        .where(eq(schema.campaignTargeting.campaignId, row.id))
        .limit(1);

      const creativeRows = await db
        .select()
        .from(schema.adCreatives)
        .where(eq(schema.adCreatives.campaignId, row.id))
        .limit(1);

      const targeting = targetingRows[0];
      const creative = creativeRows[0];

      const goal = row.fundingGoal || 10000;
      const raised = row.amountRaised;
      const fundingPercentage = goal > 0 ? Math.round((raised / goal) * 100) : 0;
      const daysRemaining = calculateDaysRemaining({
        status: row.status,
        fundingStartedAt: row.fundingStartedAt,
        durationDays: row.durationDays,
      });

      const channels = (targeting?.channels as string[]) || ['Meta', 'Google Display'];
      const locations = (targeting?.locations as string[]) || [];
      const interests = (targeting?.interests as string[]) || [];

      return {
        id: row.id,
        title: row.title || 'Untitled Campaign',
        category: row.category || 'General',
        creator: row.creatorDisplayName || 'Community Campaigner',
        creatorType: 'Community Campaigner',
        summary: row.summary || '',
        story: row.storyContent || '',
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
        locations: locations,
        interests: interests,
        channels: channels,
        audienceDescription: targeting?.audienceDescription || undefined,
        durationDays: row.durationDays || 14,
        coverImage: row.coverImageUrl || undefined,
        fundingGoal: goal,
        raised: raised,
        fundingPercentage: fundingPercentage,
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
        daysRemaining: daysRemaining,
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
      };
    } catch (err) {
      console.error('[Database] Query failed in findPublicCampaignById:', err);
      throw new DatabaseUnavailableError('Unable to load campaign from the database.');
    }
  },

  findRawById: async (id: string): Promise<typeof schema.campaigns.$inferSelect | null> => {
    if (!env.DATABASE_URL) {
      const found = FALLBACK_PUBLIC_CAMPAIGNS.find((c) => c.id === id);
      if (!found) return null;
      return {
        id: found.id,
        creatorId: null,
        creatorDisplayName: found.creator,
        title: found.title,
        category: found.category,
        summary: found.summary,
        status: found.status,
        draftStep: (found as any).draftStep || 1,
        fundingGoal: found.fundingGoal,
        amountRaised: found.raised,
        backerCount: found.backerCount,
        coverImageUrl: found.coverImage || null,
        storyHeadline: found.storyHeadline || null,
        storyIntro: found.storyIntro || null,
        storyContent: found.storyContent || found.story || null,
        storyImageUrl: found.storyImage || null,
        storyImageCaption: found.storyImageCaption || null,
        storyImageCredit: found.storyImageCredit || null,
        suggestedAction: found.suggestedAction || null,
        durationDays: found.durationDays,
        featured: found.featured,
        createdAt: new Date(found.createdAt),
        updatedAt: new Date(found.createdAt),
        submittedAt: null,
        reviewStartedAt: null,
        requestedChangesAt: null,
        approvedAt: null,
        fundingStartedAt: found.fundingStartedAt ? new Date(found.fundingStartedAt) : null,
        fundingGoalReachedAt: null,
        fundingEndedAt: null,
        distributionPreparationAt: null,
        promotionStartedAt: found.promotionStartedAt ? new Date(found.promotionStartedAt) : null,
        completedAt: found.completedAt ? new Date(found.completedAt) : null,
        rejectedAt: null,
        cancelledAt: null,
        failedAt: null,
      };
    }
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.campaigns)
        .where(eq(schema.campaigns.id, id as any))
        .limit(1);
      return rows[0] || null;
    } catch (err) {
      console.error('[Database] Query failed in findRawById:', err);
      throw new DatabaseUnavailableError('Unable to inspect campaign record.');
    }
  },

  /**
   * Creates a new initial campaign draft.
   */
  createDraft: async (input: CreateDraftInput, actorUserId: string): Promise<{ id: string; status: string }> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for campaign creation.');
    }
    try {
      const db = getDb();
      const userId = actorUserId;
      const now = new Date();

      let createdCamp: typeof schema.campaigns.$inferSelect;

      await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(schema.campaigns)
          .values({
            title: input.title || 'Untitled Draft',
            creatorId: userId,
            creatorDisplayName: 'Community Campaigner',
            status: 'DRAFT',
            durationDays: 14,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        // Phase 12: Record initial draft creation in status history
        await tx.insert(schema.campaignStatusHistory).values({
          campaignId: inserted.id,
          fromStatus: null,
          toStatus: 'DRAFT',
          actorType: 'CREATOR',
          actorId: (userId as any) || null,
          note: 'Draft created',
          createdAt: now,
        });

        createdCamp = inserted;
      });

      return {
        id: createdCamp!.id,
        status: createdCamp!.status,
      };
    } catch (err) {
      console.error('[Database] Query failed in createDraft:', err);
      throw new DatabaseUnavailableError('Failed to create campaign draft.');
    }
  },

  /**
   * Updates Step 1: Basics.
   */
  updateBasics: async (id: string, input: UpdateBasicsInput, actorUserId: string) => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for campaign updates.');
    }
    try {
      const db = getDb();
      const existing = await CampaignRepository.findRawById(id);
      if (!existing) {
        throw new NotFoundError(`Campaign "${id}" not found.`);
      }
      if (actorUserId && existing.creatorId && existing.creatorId !== actorUserId) {
        throw new ForbiddenError('You do not have permission to modify this campaign.');
      }
      if (!canEditCampaign(existing.status as any)) {
        throw new InvalidCampaignStatusError(existing.status, 'edit');
      }

      const nextDraftStep = Math.max((existing as any).draftStep || 1, 2);

      const [updated] = await db
        .update(schema.campaigns)
        .set({
          title: input.title,
          category: input.category,
          creatorDisplayName: input.creatorName,
          summary: input.summary,
          coverImageUrl:
            input.coverImage !== undefined ? input.coverImage : existing.coverImageUrl,
          draftStep: nextDraftStep,
          updatedAt: new Date(),
        })
        .where(eq(schema.campaigns.id, id as any))
        .returning();

      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[Database] Query failed in updateBasics:', err);
      throw new DatabaseUnavailableError('Failed to update campaign basics.');
    }
  },

  /**
   * Updates Step 2: Story and sources atomically in a database transaction.
   */
  updateStory: async (id: string, input: UpdateStoryInput, actorUserId: string) => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for campaign updates.');
    }
    try {
      const db = getDb();
      const existing = await CampaignRepository.findRawById(id);
      if (!existing) {
        throw new NotFoundError(`Campaign "${id}" not found.`);
      }
      if (actorUserId && existing.creatorId && existing.creatorId !== actorUserId) {
        throw new ForbiddenError('You do not have permission to modify this campaign.');
      }
      if (!canEditCampaign(existing.status as any)) {
        throw new InvalidCampaignStatusError(existing.status, 'edit');
      }

      const nextDraftStep = Math.max((existing as any).draftStep || 1, 3);

      await db.transaction(async (tx) => {
        // Update story narrative fields
        await tx
          .update(schema.campaigns)
          .set({
            storyHeadline: input.storyHeadline || null,
            storyIntro: input.storyIntro || null,
            storyContent: input.storyContent,
            storyImageUrl: input.storyImage || null,
            storyImageCaption: input.storyImageCaption || null,
            storyImageCredit: input.storyImageCredit || null,
            suggestedAction: input.suggestedAction || null,
            draftStep: nextDraftStep,
            updatedAt: new Date(),
          })
          .where(eq(schema.campaigns.id, id as any));

        // Atomic source replacement
        await tx.delete(schema.campaignSources).where(eq(schema.campaignSources.campaignId, id as any));

        if (input.sources && input.sources.length > 0) {
          await tx.insert(schema.campaignSources).values(
            input.sources.map((src, index) => ({
              campaignId: id as any,
              title: src.title,
              url: src.url,
              publisher: src.publisher || null,
              position: index,
            }))
          );
        }
      });

      return { success: true };
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[Database] Query failed in updateStory:', err);
      throw new DatabaseUnavailableError('Failed to update campaign story.');
    }
  },

  /**
   * Updates Step 3: Visuals & Ad Creative.
   */
  updateVisuals: async (id: string, input: UpdateVisualsInput, actorUserId: string) => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for campaign updates.');
    }
    try {
      const db = getDb();
      const existing = await CampaignRepository.findRawById(id);
      if (!existing) {
        throw new NotFoundError(`Campaign "${id}" not found.`);
      }
      if (actorUserId && existing.creatorId && existing.creatorId !== actorUserId) {
        throw new ForbiddenError('You do not have permission to modify this campaign.');
      }
      if (!canEditCampaign(existing.status as any)) {
        throw new InvalidCampaignStatusError(existing.status, 'edit');
      }

      const nextDraftStep = Math.max((existing as any).draftStep || 1, 4);

      await db.transaction(async (tx) => {
        const updateFields: Record<string, any> = {
          draftStep: nextDraftStep,
          updatedAt: new Date(),
        };
        if (input.coverImage !== undefined) {
          updateFields.coverImageUrl = input.coverImage;
        }

        await tx
          .update(schema.campaigns)
          .set(updateFields)
          .where(eq(schema.campaigns.id, id as any));

        // Upsert ad creative
        await tx
          .insert(schema.adCreatives)
          .values({
            campaignId: id as any,
            headline: input.adHeadline,
            description: input.adDescription,
            cta: input.adCTA,
            imageUrl: input.adImage || null,
          })
          .onConflictDoUpdate({
            target: schema.adCreatives.campaignId,
            set: {
              headline: input.adHeadline,
              description: input.adDescription,
              cta: input.adCTA,
              imageUrl: input.adImage || null,
              updatedAt: new Date(),
            },
          });
      });

      return { success: true };
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[Database] Query failed in updateVisuals:', err);
      throw new DatabaseUnavailableError('Failed to update campaign creative.');
    }
  },

  /**
   * Updates Step 4: Reach & Distribution Preferences.
   */
  updateReach: async (id: string, input: UpdateReachInput, actorUserId: string) => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for campaign updates.');
    }
    try {
      const db = getDb();
      const existing = await CampaignRepository.findRawById(id);
      if (!existing) {
        throw new NotFoundError(`Campaign "${id}" not found.`);
      }
      if (actorUserId && existing.creatorId && existing.creatorId !== actorUserId) {
        throw new ForbiddenError('You do not have permission to modify this campaign.');
      }
      if (!canEditCampaign(existing.status as any)) {
        throw new InvalidCampaignStatusError(existing.status, 'edit');
      }

      const nextDraftStep = Math.max((existing as any).draftStep || 1, 5);

      await db.transaction(async (tx) => {
        // Authoritative duration and draftStep on campaigns table
        await tx
          .update(schema.campaigns)
          .set({
            durationDays: input.durationDays,
            draftStep: nextDraftStep,
            updatedAt: new Date(),
          })
          .where(eq(schema.campaigns.id, id as any));

        // Upsert targeting metadata
        await tx
          .insert(schema.campaignTargeting)
          .values({
            campaignId: id as any,
            locations: input.locations,
            interests: input.interests,
            channels: input.channels,
            audienceDescription: input.audienceDescription || null,
          })
          .onConflictDoUpdate({
            target: schema.campaignTargeting.campaignId,
            set: {
              locations: input.locations,
              interests: input.interests,
              channels: input.channels,
              audienceDescription: input.audienceDescription || null,
              updatedAt: new Date(),
            },
          });
      });

      return { success: true };
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[Database] Query failed in updateReach:', err);
      throw new DatabaseUnavailableError('Failed to update campaign targeting.');
    }
  },

  /**
   * Validates full campaign completeness and submits for review in a transaction.
   */
  submitCampaign: async (id: string, input: SubmitCampaignInput, actorUserId: string) => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured for campaign submission.');
    }
    try {
      const db = getDb();
      const existing = await CampaignRepository.findRawById(id);
      if (!existing) {
        throw new NotFoundError(`Campaign "${id}" not found.`);
      }
      if (actorUserId && existing.creatorId && existing.creatorId !== actorUserId) {
        throw new ForbiddenError('You do not have permission to submit this campaign.');
      }
      if (!canSubmitCampaign(existing.status as any)) {
        throw new InvalidCampaignStatusError(existing.status, 'submit');
      }

      // Step 1 Completeness Check: Basics
      const missingBasics: string[] = [];
      if (!existing.title || existing.title.trim().length < 5) missingBasics.push('title');
      if (!existing.category) missingBasics.push('category');
      if (!existing.creatorDisplayName || existing.creatorDisplayName.trim().length < 3)
        missingBasics.push('creatorName');
      if (!existing.summary || existing.summary.trim().length < 20) missingBasics.push('summary');
      // Phase 15: Cover Image is OPTIONAL. Not required for submit completeness.
      if (missingBasics.length > 0) {
        throw new IncompleteCampaignError('BASICS', missingBasics);
      }

      // Step 2 Completeness Check: Story & Sources (Phase 6)
      const missingStory: string[] = [];
      if (!existing.storyHeadline || existing.storyHeadline.trim().length < 5)
        missingStory.push('storyHeadline');
      if (!existing.storyIntro || existing.storyIntro.trim().length < 20)
        missingStory.push('storyIntro');
      if (!existing.storyContent || existing.storyContent.trim().length < 100)
        missingStory.push('storyContent');

      const sources = await db
        .select()
        .from(schema.campaignSources)
        .where(eq(schema.campaignSources.campaignId, id as any));

      if (sources.length === 0) {
        missingStory.push('sources');
      }
      if (missingStory.length > 0) {
        throw new IncompleteCampaignError('STORY', missingStory);
      }

      // Step 3 Completeness Check: Visuals
      const creativeRows = await db
        .select()
        .from(schema.adCreatives)
        .where(eq(schema.adCreatives.campaignId, id as any))
        .limit(1);

      const creative = creativeRows[0];
      const missingVisuals: string[] = [];
      if (!creative?.headline || creative.headline.trim().length < 5) missingVisuals.push('adHeadline');
      if (!creative?.description || creative.description.trim().length < 10) missingVisuals.push('adDescription');
      if (!creative?.cta || creative.cta.trim().length < 2) missingVisuals.push('adCTA');
      if (missingVisuals.length > 0) {
        throw new IncompleteCampaignError('VISUALS', missingVisuals);
      }

      // Step 4 Completeness Check: Reach
      const targetingRows = await db
        .select()
        .from(schema.campaignTargeting)
        .where(eq(schema.campaignTargeting.campaignId, id as any))
        .limit(1);

      const targeting = targetingRows[0];
      const missingReach: string[] = [];
      if (!targeting || !Array.isArray(targeting.locations) || targeting.locations.length === 0) {
        missingReach.push('locations');
      }
      if (!targeting || !Array.isArray(targeting.interests) || targeting.interests.length === 0) {
        missingReach.push('interests');
      }
      if (!targeting || !Array.isArray(targeting.channels) || targeting.channels.length === 0) {
        missingReach.push('channels');
      }
      if (!targeting?.audienceDescription || targeting.audienceDescription.trim().length < 10) {
        missingReach.push('audienceDescription');
      }
      if (missingReach.length > 0) {
        throw new IncompleteCampaignError('REACH', missingReach);
      }

      // Step 5: Execute atomic submission transition via central lifecycle helper
      const userId = actorUserId;
      const updatedCamp = await transitionCampaign({
        campaignId: id,
        nextStatus: 'SUBMITTED_FOR_REVIEW',
        actorType: 'CREATOR',
        actorId: userId,
        note:
          existing.status === 'CHANGES_REQUESTED'
            ? 'Campaign resubmitted by creator with requested revisions addressed.'
            : 'Campaign successfully submitted by creator for editorial review.',
        fundingGoal: input.fundingGoal,
      });

      return {
        id: updatedCamp.id,
        status: updatedCamp.status,
        fundingGoal: updatedCamp.fundingGoal!,
        submittedAt: (updatedCamp.submittedAt || new Date()).toISOString(),
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[Database] Query failed in submitCampaign:', err);
      throw new DatabaseUnavailableError('Failed to submit campaign for review.');
    }
  },

  /**
   * Concludes funding period before goal reached (FUNDING -> FUNDING_ENDED)
   */
  endFunding: async (id: string, actorUserId: string, note?: string) => {
    return transitionCampaign({
      campaignId: id,
      nextStatus: 'FUNDING_ENDED',
      actorType: 'REVIEWER',
      actorId: actorUserId,
      note: note || 'Funding period ended by reviewer/system.',
    });
  },

  /**
   * Advances campaign to distribution preparation (FUNDING_GOAL_REACHED / FUNDING_ENDED -> DISTRIBUTION_PREPARATION)
   */
  prepareDistribution: async (id: string, actorUserId: string, note?: string) => {
    return transitionCampaign({
      campaignId: id,
      nextStatus: 'DISTRIBUTION_PREPARATION',
      actorType: 'REVIEWER',
      actorId: actorUserId,
      note: note || 'Distribution preparation initiated. Configuring creative and placement inventory.',
    });
  },

  /**
   * Launches active live advertising promotion (DISTRIBUTION_PREPARATION -> PROMOTING)
   */
  startPromotion: async (id: string, actorUserId: string, note?: string) => {
    return transitionCampaign({
      campaignId: id,
      nextStatus: 'PROMOTING',
      actorType: 'REVIEWER',
      actorId: actorUserId,
      note: note || 'Promotion started. Active message distribution deployed.',
    });
  },

  /**
   * Concludes distribution run and completes campaign (PROMOTING -> COMPLETED)
   */
  completeCampaign: async (id: string, actorUserId: string, note?: string) => {
    return transitionCampaign({
      campaignId: id,
      nextStatus: 'COMPLETED',
      actorType: 'REVIEWER',
      actorId: actorUserId,
      note: note || 'Campaign message distribution completed.',
    });
  },

  /**
   * Marks failed advertising delivery (PROMOTING -> FAILED)
   */
  failPromotion: async (id: string, reason: string, actorUserId: string) => {
    return transitionCampaign({
      campaignId: id,
      nextStatus: 'FAILED',
      actorType: 'REVIEWER',
      actorId: actorUserId,
      note: reason,
    });
  },
};

