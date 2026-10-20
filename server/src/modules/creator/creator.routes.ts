import { Router } from 'express';
import { CreatorController } from './creator.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { creatorCampaignsQuerySchema, creatorCampaignIdParamSchema } from './creator.schemas';

const router = Router();

// GET /api/v1/me/campaigns
router.get(
  '/',
  validateRequest({ query: creatorCampaignsQuerySchema }),
  CreatorController.list
);

// GET /api/v1/me/campaigns/:id
router.get(
  '/:id',
  validateRequest({ params: creatorCampaignIdParamSchema }),
  CreatorController.getById
);

export const creatorRouter = router;
