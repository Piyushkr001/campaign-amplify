import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { simulatePaymentSchema } from './payment.schemas';
import { authenticateUser } from '../../middleware/auth.middleware';

export const paymentsRouter = Router();

paymentsRouter.post(
  '/simulate',
  authenticateUser,
  validateRequest({ body: simulatePaymentSchema }),
  PaymentController.simulate
);

