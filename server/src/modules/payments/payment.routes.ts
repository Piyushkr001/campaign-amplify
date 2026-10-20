import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { simulatePaymentSchema } from './payment.schemas';

export const paymentsRouter = Router();

paymentsRouter.post(
  '/simulate',
  validateRequest({ body: simulatePaymentSchema }),
  PaymentController.simulate
);
