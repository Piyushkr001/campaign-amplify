import { Router } from 'express';
import { ReviewController } from './review.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  reviewQueueQuerySchema,
  reviewCampaignIdParamSchema,
  requestChangesSchema,
  rejectCampaignSchema,
  approveCampaignSchema,
  startFundingSchema,
} from './review.schemas';

const router = Router();

// GET /api/v1/review/campaigns
router.get(
  '/',
  validateRequest({ query: reviewQueueQuerySchema }),
  ReviewController.getQueue
);

// GET /api/v1/review/campaigns/:id
router.get(
  '/:id',
  validateRequest({ params: reviewCampaignIdParamSchema }),
  ReviewController.getCampaignById
);

// POST /api/v1/review/campaigns/:id/start
router.post(
  '/:id/start',
  validateRequest({ params: reviewCampaignIdParamSchema }),
  ReviewController.startReview
);

// POST /api/v1/review/campaigns/:id/request-changes
router.post(
  '/:id/request-changes',
  validateRequest({ params: reviewCampaignIdParamSchema, body: requestChangesSchema }),
  ReviewController.requestChanges
);

// POST /api/v1/review/campaigns/:id/approve
router.post(
  '/:id/approve',
  validateRequest({ params: reviewCampaignIdParamSchema, body: approveCampaignSchema }),
  ReviewController.approve
);

// POST /api/v1/review/campaigns/:id/reject
router.post(
  '/:id/reject',
  validateRequest({ params: reviewCampaignIdParamSchema, body: rejectCampaignSchema }),
  ReviewController.reject
);

// POST /api/v1/review/campaigns/:id/start-funding
router.post(
  '/:id/start-funding',
  validateRequest({ params: reviewCampaignIdParamSchema, body: startFundingSchema }),
  ReviewController.startFunding
);

export const reviewRouter = router;
