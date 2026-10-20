import { z } from 'zod';

export const simulatePaymentSchema = z.object({
  contributionId: z.string().trim().uuid('Invalid contribution ID format. Expected a valid UUID.'),
  outcome: z.enum(['SUCCESS', 'FAILED', 'CANCELLED']),
  cardLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'cardLast4 must be exactly 4 digits.')
    .optional(),
});

export type SimulatePaymentInput = z.infer<typeof simulatePaymentSchema>;
