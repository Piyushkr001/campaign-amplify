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
  lifecycleNoteSchema,
  failCampaignSchema,
} from './campaign.schemas';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware';
import { campaignContributionsRouter } from '../contributions/contribution.routes';

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

router.post(
  '/:id/submit',
  authenticateUser,
  validateRequest({ params: campaignIdParamSchema, body: submitCampaignSchema }),
  CampaignController.submit
);

// Post-Funding Distribution & Promotion Lifecycle Endpoints (Reviewer / Admin)
router.post(
  '/:id/end-funding',
  authenticateUser,
  requireRole('REVIEWER', 'ADMIN'),
  validateRequest({ params: campaignIdParamSchema, body: lifecycleNoteSchema }),
  CampaignController.endFunding
);

router.post(
  '/:id/prepare-distribution',
  authenticateUser,
  requireRole('REVIEWER', 'ADMIN'),
  validateRequest({ params: campaignIdParamSchema, body: lifecycleNoteSchema }),
  CampaignController.prepareDistribution
);

router.post(
  '/:id/start-promotion',
  authenticateUser,
  requireRole('REVIEWER', 'ADMIN'),
  validateRequest({ params: campaignIdParamSchema, body: lifecycleNoteSchema }),
  CampaignController.startPromotion
);

router.post(
  '/:id/complete',
  authenticateUser,
  requireRole('REVIEWER', 'ADMIN'),
  validateRequest({ params: campaignIdParamSchema, body: lifecycleNoteSchema }),
  CampaignController.complete
);

router.post(
  '/:id/fail',
  authenticateUser,
  requireRole('REVIEWER', 'ADMIN'),
  validateRequest({ params: campaignIdParamSchema, body: failCampaignSchema }),
  CampaignController.fail
);

// Campaign Contribution Subroutes: /api/v1/campaigns/:id/contributions
router.use('/:id/contributions', campaignContributionsRouter);

import { reportRouter } from '../reports/report.routes';

// Campaign Reports: /api/v1/campaigns/:id/report
router.use('/', reportRouter);

export const campaignRouter = router;



