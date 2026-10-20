import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { contributions } from './contributions';

export const paymentProviderEnum = pgEnum('payment_provider', ['DEMO']);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
  'CANCELLED',
]);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contributionId: uuid('contribution_id')
      .references(() => contributions.id)
      .notNull(),
    provider: paymentProviderEnum('provider').default('DEMO').notNull(),
    providerReference: text('provider_reference').notNull(),
    amount: integer('amount').notNull(),
    status: paymentStatusEnum('status').default('PENDING').notNull(),
    cardLast4: varchar('card_last4', { length: 4 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),
  },
  (table) => [
    index('payments_contribution_id_idx').on(table.contributionId),
    index('payments_status_idx').on(table.status),
    index('payments_provider_reference_idx').on(table.providerReference),
  ]
);

export type PaymentRecord = typeof payments.$inferSelect;
export type NewPaymentRecord = typeof payments.$inferInsert;
