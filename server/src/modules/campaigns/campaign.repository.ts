import { eq, inArray, and, ilike, or, desc, asc, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { BACKEND_PUBLIC_STATUSES, CampaignPublicDTO } from './campaign.types';
import { ListCampaignsQuery } from './campaign.schemas';

// Seed fallback data for when DATABASE_URL is not yet provisioned locally
const FALLBACK_PUBLIC_CAMPAIGNS: CampaignPublicDTO[] = [
  {
    id: 'camp-1',
    title: 'Clean Water for Every Village',
    category: 'Environment',
    creator: 'WaterFirst Foundation',
    creatorType: 'Nonprofit Organization',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    summary: 'Funding digital and local print message distribution to bring awareness to freshwater filtration infrastructure in underserved rural areas.',
    story: 'Over 2 billion people worldwide lack safely managed drinking water services. WaterFirst Foundation has engineered low-cost, gravity-fed biological sand filtration systems, but local civic leaders and regional authorities often remain unaware of available matching grants and implementation blueprints. By amplifying this informative campaign across regional media and social channels, we can directly connect 45 community centers with actionable filtration blueprints.',
    storyHeadline: 'Safe Drinking Water Infrastructure',
    storyIntro: 'Connecting underserved communities with gravity filtration blueprints.',
    storyContent: 'Over 2 billion people worldwide lack safely managed drinking water services. WaterFirst Foundation has engineered low-cost, gravity-fed biological sand filtration systems, but local civic leaders and regional authorities often remain unaware of available matching grants and implementation blueprints. By amplifying this informative campaign across regional media and social channels, we can directly connect 45 community centers with actionable filtration blueprints.',
    coverImage: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=1200&q=80',
    raised: 18450,
    goal: 25000,
    estimatedReachMin: 360000,
    estimatedReachMax: 520000,
    status: 'FUNDING',
    daysRemaining: 12,
    featured: true,
    createdAt: '2026-09-15T08:00:00Z',
    backerCount: 312,
    distributionChannels: ['Meta Targeted Ads', 'Regional News Outlets', 'Civic Network Newsletters'],
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
    durationDays: 0
  },
  {
    id: 'camp-6',
    title: 'Understanding Renewable Energy Grid Economics',
    category: 'Environment',
    creator: 'CleanGrid Initiative',
    creatorType: 'Research Collective',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
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
    goal: 20000,
    durationDays: 30,
    estimatedReachMin: 421600,
    estimatedReachMax: 632400,
    status: 'PROMOTING',
    daysRemaining: 18,
    featured: false,
    createdAt: '2026-09-18T13:00:00Z',
    promotionStartedAt: '2026-10-01T10:00:00Z',
    backerCount: 290,
    distributionChannels: ['YouTube Explainer Inventory', 'Clean Energy Publishers & Meta'],
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
    id: 'camp-8',
    title: 'Financial Literacy for Early Careers',
    category: 'Economic Policy',
    creator: 'FairEconomy Alliance',
    creatorType: 'Nonprofit Organization',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    summary:
      'Educating young workers on compound interest, predatory payday lending risks, and employer retirement matches.',
    story:
      'Predatory financial products cost young workers billions annually in avoidable fees and high interest. FairEconomy Alliance has built practical, jargon-free interactive calculators on retirement compounding, credit score recovery, and student loan management. Funds will power social distribution targeting young adults entering the workforce.',
    storyHeadline: 'Financial Survival Essentials for New Graduates',
    storyIntro: 'Equipping early career workers with financial independence fundamentals.',
    storyContent:
      'Predatory financial products cost young workers billions annually in avoidable fees and high interest. FairEconomy Alliance has built practical, jargon-free interactive calculators on retirement compounding, credit score recovery, and student loan management. Funds will power social distribution targeting young adults entering the workforce.',
    coverImage:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    raised: 18400,
    goal: 16000,
    durationDays: 30,
    estimatedReachMin: 312800,
    estimatedReachMax: 469200,
    status: 'COMPLETED',
    daysRemaining: 0,
    featured: false,
    createdAt: '2026-09-25T15:30:00Z',
    promotionStartedAt: '2026-09-20T08:00:00Z',
    completedAt: '2026-10-11T18:00:00Z',
    backerCount: 201,
    distributionChannels: ['Meta (Instagram & Facebook)', 'Google Display Network', 'Educational Newsletters'],
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
  findPublicCampaigns: async (query: ListCampaignsQuery): Promise<CampaignPublicDTO[]> => {
    if (!env.DATABASE_URL) {
      // Local fallback when DB is not yet provisioned
      let list = [...FALLBACK_PUBLIC_CAMPAIGNS];

      if (query.category && query.category !== 'All') {
        list = list.filter((c) => c.category.toLowerCase() === query.category?.toLowerCase());
      }

      if (query.status) {
        list = list.filter((c) => c.status === query.status);
      }

      if (query.searchQuery) {
        const q = query.searchQuery.toLowerCase().trim();
        list = list.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.creator.toLowerCase().includes(q) ||
            c.summary.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
        );
      }

      if (query.sortBy) {
        switch (query.sortBy) {
          case 'newest':
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'most_funded':
            list.sort((a, b) => b.raised / b.goal - a.raised / a.goal);
            break;
          case 'ending_soon':
            list.sort((a, b) => a.daysRemaining - b.daysRemaining);
            break;
          case 'featured':
          default:
            list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
            break;
        }
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

      if (query.searchQuery) {
        const q = `%${query.searchQuery.trim()}%`;
        conditions.push(
          or(
            ilike(schema.campaigns.title, q),
            ilike(schema.campaigns.creatorDisplayName, q),
            ilike(schema.campaigns.summary, q),
            ilike(schema.campaigns.category, q)
          )!
        );
      }

      const rows = await db
        .select()
        .from(schema.campaigns)
        .where(and(...conditions))
        .limit(query.limit)
        .offset(query.offset);

      // Fetch sources for each campaign
      const campaignsWithDetails = await Promise.all(
        rows.map(async (row) => {
          const sources = await db
            .select()
            .from(schema.campaignSources)
            .where(eq(schema.campaignSources.campaignId, row.id));

          const targeting = await db
            .select()
            .from(schema.campaignTargeting)
            .where(eq(schema.campaignTargeting.campaignId, row.id))
            .limit(1);

          const channels =
            targeting[0]?.channels && Array.isArray(targeting[0].channels)
              ? (targeting[0].channels as string[])
              : ['Meta', 'Google Display'];

          return {
            id: row.id,
            title: row.title,
            category: row.category,
            creator: row.creatorDisplayName,
            creatorType: 'Community Campaigner',
            summary: row.summary,
            story: row.storyContent,
            storyHeadline: row.storyHeadline || undefined,
            storyIntro: row.storyIntro || undefined,
            storyContent: row.storyContent,
            storyImage: row.storyImageUrl || undefined,
            storyImageCaption: row.storyImageCaption || undefined,
            storyImageCredit: row.storyImageCredit || undefined,
            suggestedAction: row.suggestedAction || undefined,
            coverImage: row.coverImageUrl,
            raised: row.amountRaised,
            goal: row.fundingGoal,
            estimatedReachMin: Math.round(row.fundingGoal * 20 * 0.85),
            estimatedReachMax: Math.round(row.fundingGoal * 30 * 0.85),
            status: row.status as any,
            durationDays: row.durationDays || 14,
            daysRemaining: row.durationDays || 14,
            featured: row.featured,
            createdAt: row.createdAt.toISOString(),
            submittedAt: row.submittedAt?.toISOString(),
            promotionStartedAt: row.promotionStartedAt?.toISOString(),
            completedAt: row.completedAt?.toISOString(),
            backerCount: row.backerCount,
            distributionChannels: channels,
            useOfFunds: {
              advertising: 85,
              platformFee: 10,
              paymentProcessing: 5,
            },
            supportingSources: sources.map((s) => ({
              title: s.title,
              url: s.url,
              publisher: s.publisher || undefined,
            })),
          };
        })
      );

      return campaignsWithDetails;
    } catch (err) {
      console.warn('[CampaignRepository] PostgreSQL query failed, using fallback:', err);
      return FALLBACK_PUBLIC_CAMPAIGNS;
    }
  },

  findPublicCampaignById: async (id: string): Promise<CampaignPublicDTO | null> => {
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
        // If not found in DB, check fallback
        const fallback = FALLBACK_PUBLIC_CAMPAIGNS.find((c) => c.id === id);
        return fallback || null;
      }

      const row = rows[0];
      const sources = await db
        .select()
        .from(schema.campaignSources)
        .where(eq(schema.campaignSources.campaignId, row.id));

      const targeting = await db
        .select()
        .from(schema.campaignTargeting)
        .where(eq(schema.campaignTargeting.campaignId, row.id))
        .limit(1);

      const creative = await db
        .select()
        .from(schema.adCreatives)
        .where(eq(schema.adCreatives.campaignId, row.id))
        .limit(1);

      return {
        id: row.id,
        title: row.title,
        category: row.category,
        creator: row.creatorDisplayName,
        creatorType: 'Community Campaigner',
        summary: row.summary,
        story: row.storyContent,
        storyHeadline: row.storyHeadline || undefined,
        storyIntro: row.storyIntro || undefined,
        storyContent: row.storyContent,
        storyImage: row.storyImageUrl || undefined,
        storyImageCaption: row.storyImageCaption || undefined,
        storyImageCredit: row.storyImageCredit || undefined,
        suggestedAction: row.suggestedAction || undefined,
        adImage: creative[0]?.imageUrl || undefined,
        adHeadline: creative[0]?.headline || undefined,
        adDescription: creative[0]?.description || undefined,
        adCTA: creative[0]?.cta || undefined,
        coverImage: row.coverImageUrl,
        raised: row.amountRaised,
        goal: row.fundingGoal,
        estimatedReachMin: Math.round(row.fundingGoal * 20 * 0.85),
        estimatedReachMax: Math.round(row.fundingGoal * 30 * 0.85),
        status: row.status as any,
        durationDays: row.durationDays || 14,
        daysRemaining: row.durationDays || 14,
        featured: row.featured,
        createdAt: row.createdAt.toISOString(),
        submittedAt: row.submittedAt?.toISOString(),
        promotionStartedAt: row.promotionStartedAt?.toISOString(),
        completedAt: row.completedAt?.toISOString(),
        backerCount: row.backerCount,
        distributionChannels: (targeting[0]?.channels as string[]) || ['Meta', 'Google Display'],
        useOfFunds: {
          advertising: 85,
          platformFee: 10,
          paymentProcessing: 5,
        },
        supportingSources: sources.map((s) => ({
          title: s.title,
          url: s.url,
          publisher: s.publisher || undefined,
        })),
      };
    } catch (err) {
      console.warn('[CampaignRepository] findPublicCampaignById error, fallback:', err);
      const fallback = FALLBACK_PUBLIC_CAMPAIGNS.find((c) => c.id === id);
      return fallback || null;
    }
  },
};
