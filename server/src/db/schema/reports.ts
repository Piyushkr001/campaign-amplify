import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';

export const campaignReports = pgTable(
  'campaign_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .references(() => campaigns.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    reportStatus: varchar('report_status', { length: 30 }).default('INTERIM').notNull(), // 'INTERIM' | 'FINAL'
    fundsRaised: integer('funds_raised').notNull(),
    advertisingAllocation: integer('advertising_allocation').notNull(), // 85%
    advertisingSpend: integer('advertising_spend').notNull(),
    platformFee: integer('platform_fee').notNull(), // 10%
    processingFee: integer('processing_fee').notNull(), // 5%
    estimatedImpressionsMin: integer('estimated_impressions_min').notNull(),
    estimatedImpressionsMax: integer('estimated_impressions_max').notNull(),
    measuredImpressions: integer('measured_impressions').notNull(),
    measuredReach: integer('measured_reach').notNull(),
    clicks: integer('clicks').notNull(),
    ctr: numeric('ctr', { precision: 5, scale: 2 }).notNull(), // e.g. 2.50
    durationDays: integer('duration_days').default(14).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    disclaimer: text('disclaimer').notNull(),
    isDemoData: boolean('is_demo_data').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('campaign_reports_campaign_id_idx').on(table.campaignId),
    index('campaign_reports_status_idx').on(table.reportStatus),
  ]
);

export const campaignChannelResults = pgTable(
  'campaign_channel_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id')
      .references(() => campaignReports.id, { onDelete: 'cascade' })
      .notNull(),
    channel: varchar('channel', { length: 100 }).notNull(),
    spend: integer('spend').notNull(),
    impressions: integer('impressions').notNull(),
    reach: integer('reach').notNull(),
    clicks: integer('clicks').notNull(),
    ctr: numeric('ctr', { precision: 5, scale: 2 }).notNull(),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('campaign_channel_results_report_id_idx').on(table.reportId),
  ]
);

export type CampaignReportRecord = typeof campaignReports.$inferSelect;
export type NewCampaignReportRecord = typeof campaignReports.$inferInsert;
export type CampaignChannelResultRecord = typeof campaignChannelResults.$inferSelect;
export type NewCampaignChannelResultRecord = typeof campaignChannelResults.$inferInsert;
