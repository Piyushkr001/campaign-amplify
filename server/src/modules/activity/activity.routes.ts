import { Router } from 'express';
import { ActivityController } from './activity.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { listActivityQuerySchema } from './activity.schemas';
import { authenticateUser } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/v1/me/activity - authenticated user activity feed
router.get(
  '/',
  authenticateUser,
  validateRequest({ query: listActivityQuerySchema }),
  ActivityController.getMyActivity
);

export const activityRouter = router;
