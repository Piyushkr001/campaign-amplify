import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import { SimulatePaymentInput } from './payment.schemas';
import { apiSuccess } from '../../utils/response';
export const PaymentController = {
  simulate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as SimulatePaymentInput;
      const actorUserId = req.user!.id;
      const result = await PaymentService.simulatePayment(input, actorUserId);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
