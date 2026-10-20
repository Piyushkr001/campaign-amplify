import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { SimulatePaymentInput } from './payment.schemas';
import { apiSuccess } from '../../utils/response';
import { resolveDemoBackerId } from '../../utils/demo-identity';

async function getBackerUserId(req: Request): Promise<string> {
  if (req.user?.id) {
    return req.user.id;
  }
  const headerId = req.headers['x-actor-user-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  return resolveDemoBackerId();
}

export const PaymentController = {
  simulate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as SimulatePaymentInput;
      const actorUserId = await getBackerUserId(req);
      const result = await PaymentService.simulatePayment(input, actorUserId);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
