import { Router } from 'express';
import { CampaignController } from './campaign.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { listCampaignsQuerySchema, campaignIdParamSchema } from './campaign.schemas';

const router = Router();

router.get(
  '/',
  validateRequest({ query: listCampaignsQuerySchema }),
  CampaignController.list
);

router.get(
  '/:id',
  validateRequest({ params: campaignIdParamSchema }),
  CampaignController.getById
);

export const campaignRouter = router;
