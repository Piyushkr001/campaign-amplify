import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const campaignStatusEnum = pgEnum('campaign_status', [
  'DRAFT',
  'SUBMITTED_FOR_REVIEW',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'FUNDING',
  'FUNDING_GOAL_REACHED',
  'FUNDING_ENDED',
  'DISTRIBUTION_PREPARATION',
  'PROMOTING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'REFUND_PENDING',
  'FAILED',
]);

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }),
    creatorDisplayName: varchar('creator_display_name', { length: 100 }),
    title: varchar('title', { length: 60 }),
    category: varchar('category', { length: 50 }),
    summary: text('summary'),
    status: campaignStatusEnum('status').default('DRAFT').notNull(),
    fundingGoal: integer('funding_goal'), // nullable in DRAFT state; validated before submission
    amountRaised: integer('amount_raised').default(0).notNull(),
    backerCount: integer('backer_count').default(0).notNull(),
    coverImageUrl: text('cover_image_url'),

    // Editorial Story
    storyHeadline: varchar('story_headline', { length: 120 }),
    storyIntro: text('story_intro'),
    storyContent: text('story_content'),
    storyImageUrl: text('story_image_url'),
    storyImageCaption: text('story_image_caption'),
    storyImageCredit: text('story_image_credit'),
    suggestedAction: text('suggested_action'),

    // Authoritative Duration & Promotion Config
    durationDays: integer('duration_days').default(14).notNull(),
    featured: boolean('featured').default(false).notNull(),

    // Lifecycle Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    reviewStartedAt: timestamp('review_started_at', { withTimezone: true }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    fundingStartedAt: timestamp('funding_started_at', { withTimezone: true }),
    fundingGoalReachedAt: timestamp('funding_goal_reached_at', { withTimezone: true }),
    fundingEndedAt: timestamp('funding_ended_at', { withTimezone: true }),
    distributionPreparationAt: timestamp('distribution_preparation_at', { withTimezone: true }),
    promotionStartedAt: timestamp('promotion_started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
  },
  (table) => [
    index('campaigns_status_idx').on(table.status),
    index('campaigns_category_idx').on(table.category),
    index('campaigns_created_at_idx').on(table.createdAt),
    index('campaigns_amount_raised_idx').on(table.amountRaised),
  ]
);

export const campaignSources = pgTable(
  'campaign_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .references(() => campaigns.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    url: text('url').notNull(),
    publisher: varchar('publisher', { length: 100 }),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('campaign_sources_campaign_id_idx').on(table.campaignId)]
);

export const campaignAssets = pgTable('campaign_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id, { onDelete: 'cascade' })
    .notNull(),
  type: varchar('type', { length: 30 }).notNull(), // 'COVER', 'STORY_IMAGE', 'AD_IMAGE'
  url: text('url').notNull(),
  caption: text('caption'),
  credit: text('credit'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adCreatives = pgTable('ad_creatives', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  headline: varchar('headline', { length: 60 }).notNull(),
  description: text('description').notNull(),
  cta: varchar('cta', { length: 30 }).default('Learn More').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const campaignTargeting = pgTable(
  'campaign_targeting',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .references(() => campaigns.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    locations: jsonb('locations').default([]).notNull(),
    interests: jsonb('interests').default([]).notNull(),
    channels: jsonb('channels').default([]).notNull(),
    audienceDescription: text('audience_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('campaign_targeting_campaign_id_idx').on(table.campaignId)]
);

export const campaignReviews = pgTable(
  'campaign_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .references(() => campaigns.id, { onDelete: 'cascade' })
      .notNull(),
    reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    decision: varchar('decision', { length: 50 }).notNull(),
    feedback: text('feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('campaign_reviews_campaign_id_idx').on(table.campaignId)]
);

export const campaignStatusHistory = pgTable(
  'campaign_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .references(() => campaigns.id, { onDelete: 'cascade' })
      .notNull(),
    fromStatus: varchar('from_status', { length: 50 }),
    toStatus: varchar('to_status', { length: 50 }).notNull(),
    actorType: varchar('actor_type', { length: 30 }).notNull(), // 'CREATOR', 'REVIEWER', 'SYSTEM'
    actorId: uuid('actor_id'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('campaign_status_history_campaign_id_idx').on(table.campaignId)]
);

export type CampaignRecord = typeof campaigns.$inferSelect;
export type NewCampaignRecord = typeof campaigns.$inferInsert;
export type CampaignSourceRecord = typeof campaignSources.$inferSelect;
export type AdCreativeRecord = typeof adCreatives.$inferSelect;
export type CampaignTargetingRecord = typeof campaignTargeting.$inferSelect;
