import {
  pgTable,
  uuid,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { campaigns } from './campaigns';
import { users } from './users';

export const contributionStatusEnum = pgEnum('contribution_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED',
]);

export const contributions = pgTable(
  'contributions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .references(() => campaigns.id)
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    status: contributionStatusEnum('status').default('PENDING').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
  },
  (table) => [
    index('contributions_campaign_id_idx').on(table.campaignId),
    index('contributions_user_id_idx').on(table.userId),
    index('contributions_status_idx').on(table.status),
    index('contributions_created_at_idx').on(table.createdAt),
  ]
);

export type ContributionRecord = typeof contributions.$inferSelect;
export type NewContributionRecord = typeof contributions.$inferInsert;
