import { eq } from 'drizzle-orm';
import { getDb } from './index';
import * as schema from './schema';
import { env } from '../config/env';

export const DEMO_USER_EMAIL = 'creator@campaignamplify.org';
export const DEMO_CAMP_1_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_CAMP_2_ID = '00000000-0000-4000-8000-000000000002';
export const DEMO_CAMP_3_ID = '00000000-0000-4000-8000-000000000003';

async function seed() {
  if (!env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please provide a valid Neon PostgreSQL connection string in .env to run the seed.');
    process.exit(1);
  }

  console.log('[Seed] Connecting to Neon PostgreSQL...');
  const db = getDb();

  console.log('[Seed] Ensuring demo accounts (USER, REVIEWER, ADMIN) exist...');
  const bcrypt = (await import('bcryptjs')).default;
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  // 1. Creator / Backer (USER)
  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_USER_EMAIL))
    .limit(1);

  let userId: string;
  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
    await db
      .update(schema.users)
      .set({ passwordHash: defaultPasswordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, userId as any));
    console.log(`[Seed] Found existing demo user with ID: ${userId}`);
  } else {
    const [insertedUser] = await db
      .insert(schema.users)
      .values({
        email: DEMO_USER_EMAIL,
        displayName: 'Clean Water Action Network',
        role: 'USER',
        passwordHash: defaultPasswordHash,
      })
      .returning();
    userId = insertedUser.id;
    console.log(`[Seed] Created demo user with ID: ${userId}`);
  }

  // 2. Demo Reviewer
  const reviewerEmail = 'reviewer@campaignamplify.org';
  const existingReviewer = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, reviewerEmail))
    .limit(1);

  if (existingReviewer.length > 0) {
    await db
      .update(schema.users)
      .set({ passwordHash: defaultPasswordHash, role: 'REVIEWER', updatedAt: new Date() })
      .where(eq(schema.users.id, existingReviewer[0].id as any));
    console.log(`[Seed] Updated demo reviewer account: ${existingReviewer[0].id}`);
  } else {
    const [insertedReviewer] = await db
      .insert(schema.users)
      .values({
        email: reviewerEmail,
        displayName: 'Editorial Review Board',
        role: 'REVIEWER',
        passwordHash: defaultPasswordHash,
      })
      .returning();
    console.log(`[Seed] Created demo reviewer account: ${insertedReviewer.id}`);
  }

  // 3. Demo Admin
  const adminEmail = 'admin@campaignamplify.org';
  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existingAdmin.length > 0) {
    await db
      .update(schema.users)
      .set({ passwordHash: adminPasswordHash, role: 'ADMIN', updatedAt: new Date() })
      .where(eq(schema.users.id, existingAdmin[0].id as any));
    console.log(`[Seed] Updated demo admin account: ${existingAdmin[0].id}`);
  } else {
    const [insertedAdmin] = await db
      .insert(schema.users)
      .values({
        email: adminEmail,
        displayName: 'Platform Administrator',
        role: 'ADMIN',
        passwordHash: adminPasswordHash,
      })
      .returning();
    console.log(`[Seed] Created demo admin account: ${insertedAdmin.id}`);
  }

  console.log('[Seed] Upserting public demo campaigns with deterministic IDs...');

  // ==========================================
  // Campaign 1: FUNDING
  // ==========================================
  await db
    .insert(schema.campaigns)
    .values({
      id: DEMO_CAMP_1_ID,
      creatorId: userId,
      creatorDisplayName: 'Clean Water Action Network',
      title: 'Protect Municipal Watersheds from Industrial PFAS',
      category: 'Environment',
      summary:
        'Funding high-impact digital billboard and social advertising campaigns targeting municipal councils and voters ahead of the watershed protection vote.',
      status: 'FUNDING',
      fundingGoal: 15000,
      amountRaised: 11250,
      backerCount: 142,
      storyHeadline: 'Every Child Deserves Clean, Uncontaminated Drinking Water',
      storyIntro:
        'Recent tests found PFAS levels 4x above the proposed EPA health advisory limit across 12 municipal districts.',
      storyContent:
        'Industrial runoff upstream from the Blackwood River reservoir has introduced unsafe concentrations of per- and polyfluoroalkyl substances (PFAS). This campaign funds public service advertisements on geo-targeted local news websites and social media to educate residents and urge the regional water board to pass mandatory filtration requirements at the upcoming November referendum.',
      storyImageUrl:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
      storyImageCaption: 'Water quality engineers sampling the Blackwood reservoir outflow.',
      storyImageCredit: 'Environmental Monitoring Lab / CC BY 4.0',
      suggestedAction:
        'Attend the municipal water board public hearing on Nov 14th or call your council representative.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
      durationDays: 24,
      featured: true,
      createdAt: new Date('2026-10-01T09:00:00Z'),
      submittedAt: new Date('2026-10-02T14:30:00Z'),
      reviewStartedAt: new Date('2026-10-03T10:00:00Z'),
      approvedAt: new Date('2026-10-03T16:00:00Z'),
      fundingStartedAt: new Date('2026-10-04T08:00:00Z'),
    })
    .onConflictDoUpdate({
      target: schema.campaigns.id,
      set: {
        creatorId: userId,
        creatorDisplayName: 'Clean Water Action Network',
        title: 'Protect Municipal Watersheds from Industrial PFAS',
        category: 'Environment',
        summary:
          'Funding high-impact digital billboard and social advertising campaigns targeting municipal councils and voters ahead of the watershed protection vote.',
        status: 'FUNDING',
        fundingGoal: 15000,
        amountRaised: 11250,
        backerCount: 142,
        durationDays: 24,
        featured: true,
        fundingStartedAt: new Date('2026-10-04T08:00:00Z'),
      },
    });

  // Re-seed child records for Campaign 1
  await db.delete(schema.campaignSources).where(eq(schema.campaignSources.campaignId, DEMO_CAMP_1_ID));
  await db.insert(schema.campaignSources).values([
    {
      campaignId: DEMO_CAMP_1_ID,
      title: 'EPA Proposed PFAS National Primary Drinking Water Regulation',
      url: 'https://www.epa.gov/sdwa/and-polyfluoroalkyl-substances-pfas',
      publisher: 'U.S. EPA',
      position: 0,
    },
    {
      campaignId: DEMO_CAMP_1_ID,
      title: 'Regional Watershed Contamination Assessment 2026',
      url: 'https://waterwatch.org/regional-assessment',
      publisher: 'WaterWatch Institute',
      position: 1,
    },
  ]);

  await db.delete(schema.adCreatives).where(eq(schema.adCreatives.campaignId, DEMO_CAMP_1_ID));
  await db.insert(schema.adCreatives).values({
    campaignId: DEMO_CAMP_1_ID,
    headline: 'Is Your Family’s Tap Water Truly Safe?',
    description:
      'PFAS levels in our municipal river tested 4x over health advisories. Support amplified public awareness to mandate clean filtration.',
    cta: 'Learn More & Act',
    imageUrl:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
  });

  await db.delete(schema.campaignTargeting).where(eq(schema.campaignTargeting.campaignId, DEMO_CAMP_1_ID));
  await db.insert(schema.campaignTargeting).values({
    campaignId: DEMO_CAMP_1_ID,
    locations: ['Regional Municipal District', 'Blackwood County', 'Cascade Valley'],
    interests: ['Clean Water', 'Parenting & Families', 'Local Government', 'Public Health'],
    channels: ['Meta (Instagram & Facebook)', 'Google Display Network', 'Local Digital Press'],
    audienceDescription:
      'Registered voters, homeowners, and parents within 25 miles of the Blackwood water supply.',
  });

  // ==========================================
  // Campaign 2: PROMOTING
  // ==========================================
  await db
    .insert(schema.campaigns)
    .values({
      id: DEMO_CAMP_2_ID,
      creatorId: userId,
      creatorDisplayName: 'CleanGrid Initiative',
      title: 'Understanding Renewable Energy Grid Economics',
      category: 'Environment',
      summary:
        'Interactive public explainer ads demystifying transmission costs, solar peak shaving, and distributed battery storage incentives.',
      status: 'PROMOTING',
      fundingGoal: 20000,
      amountRaised: 24800,
      backerCount: 290,
      storyHeadline: 'Clear Facts on Clean Energy Economics',
      storyIntro: 'Demystifying renewable transmission economics for municipal planners.',
      storyContent:
        'Transitioning to zero-carbon energy requires community buy-in. Misconceptions about grid instability and peak-demand pricing frequently stall local solar and wind municipal permits. This campaign finances concise, verifiable video explainers on local social feeds and regional journalism networks.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
      durationDays: 30,
      featured: false,
      createdAt: new Date('2026-09-18T13:00:00Z'),
      submittedAt: new Date('2026-09-19T10:00:00Z'),
      approvedAt: new Date('2026-09-20T11:00:00Z'),
      fundingStartedAt: new Date('2026-09-21T08:00:00Z'),
      fundingGoalReachedAt: new Date('2026-09-28T19:00:00Z'),
      fundingEndedAt: new Date('2026-09-30T23:59:59Z'),
      distributionPreparationAt: new Date('2026-10-01T08:00:00Z'),
      promotionStartedAt: new Date('2026-10-01T10:00:00Z'),
    })
    .onConflictDoUpdate({
      target: schema.campaigns.id,
      set: {
        creatorId: userId,
        creatorDisplayName: 'CleanGrid Initiative',
        title: 'Understanding Renewable Energy Grid Economics',
        category: 'Environment',
        status: 'PROMOTING',
        fundingGoal: 20000,
        amountRaised: 24800,
        backerCount: 290,
        durationDays: 30,
        featured: false,
        promotionStartedAt: new Date('2026-10-01T10:00:00Z'),
      },
    });

  await db.delete(schema.campaignSources).where(eq(schema.campaignSources.campaignId, DEMO_CAMP_2_ID));
  await db.insert(schema.campaignSources).values([
    {
      campaignId: DEMO_CAMP_2_ID,
      title: 'Renewable Power Generation Costs Report',
      url: 'https://irena.org/publications',
      publisher: 'IRENA',
      position: 0,
    },
  ]);

  await db.delete(schema.adCreatives).where(eq(schema.adCreatives.campaignId, DEMO_CAMP_2_ID));
  await db.insert(schema.adCreatives).values({
    campaignId: DEMO_CAMP_2_ID,
    headline: 'The Real Math Behind Clean Energy Storage',
    description:
      'Learn how distributed battery storage saves taxpayers money while stabilizing regional power grids.',
    cta: 'Explore the Data',
    imageUrl:
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
  });

  await db.delete(schema.campaignTargeting).where(eq(schema.campaignTargeting.campaignId, DEMO_CAMP_2_ID));
  await db.insert(schema.campaignTargeting).values({
    campaignId: DEMO_CAMP_2_ID,
    locations: ['Statewide', 'Regional Power Co-ops'],
    interests: ['Clean Technology', 'Public Utilities', 'Renewable Energy'],
    channels: ['YouTube Explainer Inventory', 'Clean Energy Publishers & Meta'],
    audienceDescription: 'Energy consumers, tech workers, and civic leaders statewide.',
  });

  // ==========================================
  // Campaign 3: COMPLETED
  // ==========================================
  await db
    .insert(schema.campaigns)
    .values({
      id: DEMO_CAMP_3_ID,
      creatorId: userId,
      creatorDisplayName: 'FairEconomy Alliance',
      title: 'Financial Literacy for Early Careers',
      category: 'Economic Policy',
      summary:
        'Educating young workers on compound interest, predatory payday lending risks, and employer retirement matches.',
      status: 'COMPLETED',
      fundingGoal: 16000,
      amountRaised: 18400,
      backerCount: 201,
      storyHeadline: 'Financial Survival Essentials for New Graduates',
      storyIntro: 'Equipping early career workers with financial independence fundamentals.',
      storyContent:
        'Predatory financial products cost young workers billions annually in avoidable fees and high interest. FairEconomy Alliance has built practical, jargon-free interactive calculators on retirement compounding, credit score recovery, and student loan management. Funds power social distribution targeting young adults entering the workforce.',
      coverImageUrl:
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
      durationDays: 30,
      featured: false,
      createdAt: new Date('2026-09-01T15:30:00Z'),
      submittedAt: new Date('2026-09-03T09:00:00Z'),
      approvedAt: new Date('2026-09-05T14:00:00Z'),
      fundingStartedAt: new Date('2026-09-06T08:00:00Z'),
      fundingGoalReachedAt: new Date('2026-09-18T17:00:00Z'),
      fundingEndedAt: new Date('2026-09-19T23:59:59Z'),
      distributionPreparationAt: new Date('2026-09-20T08:00:00Z'),
      promotionStartedAt: new Date('2026-09-20T08:00:00Z'),
      completedAt: new Date('2026-10-11T18:00:00Z'),
    })
    .onConflictDoUpdate({
      target: schema.campaigns.id,
      set: {
        creatorId: userId,
        creatorDisplayName: 'FairEconomy Alliance',
        title: 'Financial Literacy for Early Careers',
        category: 'Economic Policy',
        status: 'COMPLETED',
        fundingGoal: 16000,
        amountRaised: 18400,
        backerCount: 201,
        durationDays: 30,
        featured: false,
        completedAt: new Date('2026-10-11T18:00:00Z'),
      },
    });

  await db.delete(schema.campaignSources).where(eq(schema.campaignSources.campaignId, DEMO_CAMP_3_ID));
  await db.insert(schema.campaignSources).values([
    {
      campaignId: DEMO_CAMP_3_ID,
      title: 'National Financial Capability Study Summary',
      url: 'https://faireconomy.example.org/study',
      publisher: 'Financial Capability Bureau',
      position: 0,
    },
  ]);

  await db.delete(schema.adCreatives).where(eq(schema.adCreatives.campaignId, DEMO_CAMP_3_ID));
  await db.insert(schema.adCreatives).values({
    campaignId: DEMO_CAMP_3_ID,
    headline: 'Don’t Leave Employer Retirement Matches on the Table',
    description:
      'Interactive tools showing young graduates how small 401(k) contributions compound into hundreds of thousands over a career.',
    cta: 'Try the Free Calculator',
    imageUrl:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
  });

  await db.delete(schema.campaignTargeting).where(eq(schema.campaignTargeting.campaignId, DEMO_CAMP_3_ID));
  await db.insert(schema.campaignTargeting).values({
    campaignId: DEMO_CAMP_3_ID,
    locations: ['National Urban Centers', 'College Towns'],
    interests: ['Recent Graduates', 'Personal Finance', 'Career Development'],
    channels: ['Meta (Instagram & Facebook)', 'Google Display Network', 'Educational Newsletters'],
    audienceDescription: 'Adults aged 20–30 starting full-time employment.',
  });

  console.log('[Seed] Database successfully seeded with 3 deterministic demo campaigns!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed] Error seeding database:', err);
    process.exit(1);
  });
