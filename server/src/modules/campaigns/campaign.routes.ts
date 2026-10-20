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

import { authenticateUser } from '../../middleware/auth.middleware';

// Campaign Creation & 5-Step Draft Write Endpoints (Protected by JWT)
router.post(
  '/',
  authenticateUser,
  validateRequest({ body: createDraftSchema }),
  CampaignController.createDraft
);

router.patch(
  '/:id/basics',
  authenticateUser,
  validateRequest({ params: campaignIdParamSchema, body: updateBasicsSchema }),
  CampaignController.updateBasics
);

router.patch(
  '/:id/story',
  authenticateUser,
  validateRequest({ params: campaignIdParamSchema, body: updateStorySchema }),
  CampaignController.updateStory
);

router.patch(
  '/:id/visuals',
  authenticateUser,
  validateRequest({ params: campaignIdParamSchema, body: updateVisualsSchema }),
  CampaignController.updateVisuals
);

router.patch(
  '/:id/reach',
  authenticateUser,
  validateRequest({ params: campaignIdParamSchema, body: updateReachSchema }),
  CampaignController.updateReach
);

import { campaignContributionsRouter } from '../contributions/contribution.routes';

router.post(
  '/:id/submit',
  authenticateUser,
  validateRequest({ params: campaignIdParamSchema, body: submitCampaignSchema }),
  CampaignController.submit
);

// Campaign Contribution Subroutes: /api/v1/campaigns/:id/contributions
router.use('/:id/contributions', campaignContributionsRouter);

export const campaignRouter = router;

