import { PaymentRepository } from './payment.repository';
import { SimulatePaymentInput } from './payment.schemas';
import { resolveDemoBackerId } from '../../utils/demo-identity';

export const PaymentService = {
  simulatePayment: async (input: SimulatePaymentInput, actorUserId?: string) => {
    const userId = actorUserId || (await resolveDemoBackerId());
    return PaymentRepository.simulate({
      contributionId: input.contributionId,
      outcome: input.outcome,
      cardLast4: input.cardLast4,
      actorUserId: userId,
    });
  },
};
