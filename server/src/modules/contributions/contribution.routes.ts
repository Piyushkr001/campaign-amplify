import { Router } from 'express';
import { ContributionController } from './contribution.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  contributionQuoteSchema,
  createContributionSchema,
  campaignContributionParamSchema,
  contributionIdParamSchema,
} from './contribution.schemas';

/**
 * Routes mounted at /api/v1/campaigns/:id/contributions
 */
export const campaignContributionsRouter = Router({ mergeParams: true });

campaignContributionsRouter.post(
  '/quote',
  validateRequest({
    params: campaignContributionParamSchema,
    body: contributionQuoteSchema,
  }),
  ContributionController.getQuote
);

campaignContributionsRouter.post(
  '/',
  validateRequest({
    params: campaignContributionParamSchema,
    body: createContributionSchema,
  }),
  ContributionController.create
);

/**
 * Routes mounted at /api/v1/me/contributions
 */
export const myContributionsRouter = Router();

myContributionsRouter.get('/', ContributionController.listMyContributions);

myContributionsRouter.get(
  '/:id',
  validateRequest({ params: contributionIdParamSchema }),
  ContributionController.getMyContributionById
);

myContributionsRouter.get(
  '/:id/receipt',
  validateRequest({ params: contributionIdParamSchema }),
  ContributionController.getMyReceipt
);
