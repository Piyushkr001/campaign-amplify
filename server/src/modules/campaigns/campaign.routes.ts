import { Router } from 'express';
import { CampaignController } from './campaign.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  listCampaignsQuerySchema,
  campaignIdParamSchema,
  createDraftSchema,
  updateBasicsSchema,
  updateStorySchema,
  updateVisualsSchema,
  updateReachSchema,
  submitCampaignSchema,
} from './campaign.schemas';

const router = Router();

// Public Read Endpoints
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

// Campaign Creation & 5-Step Draft Write Endpoints
router.post(
  '/',
  validateRequest({ body: createDraftSchema }),
  CampaignController.createDraft
);

router.patch(
  '/:id/basics',
  validateRequest({ params: campaignIdParamSchema, body: updateBasicsSchema }),
  CampaignController.updateBasics
);

router.patch(
  '/:id/story',
  validateRequest({ params: campaignIdParamSchema, body: updateStorySchema }),
  CampaignController.updateStory
);

router.patch(
  '/:id/visuals',
  validateRequest({ params: campaignIdParamSchema, body: updateVisualsSchema }),
  CampaignController.updateVisuals
);

router.patch(
  '/:id/reach',
  validateRequest({ params: campaignIdParamSchema, body: updateReachSchema }),
  CampaignController.updateReach
);

import { campaignContributionsRouter } from '../contributions/contribution.routes';

router.post(
  '/:id/submit',
  validateRequest({ params: campaignIdParamSchema, body: submitCampaignSchema }),
  CampaignController.submit
);

// Campaign Contribution Subroutes: /api/v1/campaigns/:id/contributions
router.use('/:id/contributions', campaignContributionsRouter);

export const campaignRouter = router;

