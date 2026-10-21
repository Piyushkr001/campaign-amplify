import { PaymentRepository } from './payment.repository';
import { SimulatePaymentInput } from './payment.schemas';

export const PaymentService = {
  simulatePayment: async (input: SimulatePaymentInput, actorUserId: string) => {
    return PaymentRepository.simulate({
      contributionId: input.contributionId,
      outcome: input.outcome,
      cardLast4: input.cardLast4,
      actorUserId,
    });
  },
};
