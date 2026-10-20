import { Router } from 'express';
import { CreatorController } from './creator.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { creatorCampaignsQuerySchema, creatorCampaignIdParamSchema } from './creator.schemas';

import { authenticateUser } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/v1/me/campaigns
router.get(
  '/',
  authenticateUser,
  validateRequest({ query: creatorCampaignsQuerySchema }),
  CreatorController.list
);

// GET /api/v1/me/campaigns/:id
router.get(
  '/:id',
  authenticateUser,
  validateRequest({ params: creatorCampaignIdParamSchema }),
  CreatorController.getById
);

export const creatorRouter = router;
