import { Router } from 'express';
import { ContributionController } from './contribution.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  contributionQuoteSchema,
  createContributionSchema,
  campaignContributionParamSchema,
  contributionIdParamSchema,
} from './contribution.schemas';
import { authenticateUser, optionalAuthenticateUser } from '../../middleware/auth.middleware';

/**
 * Routes mounted at /api/v1/campaigns/:id/contributions
 */
export const campaignContributionsRouter = Router({ mergeParams: true });

// Quote endpoint is public (optional auth for personalized logging if needed)
campaignContributionsRouter.post(
  '/quote',
  optionalAuthenticateUser,
  validateRequest({
    params: campaignContributionParamSchema,
    body: contributionQuoteSchema,
  }),
  ContributionController.getQuote
);

// Creating a contribution requires authenticated user
campaignContributionsRouter.post(
  '/',
  authenticateUser,
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

// Backer contributions history and detail require authenticated user
myContributionsRouter.get('/', authenticateUser, ContributionController.listMyContributions);

myContributionsRouter.get(
  '/:id',
  authenticateUser,
  validateRequest({ params: contributionIdParamSchema }),
  ContributionController.getMyContributionById
);

myContributionsRouter.get(
  '/:id/receipt',
  authenticateUser,
  validateRequest({ params: contributionIdParamSchema }),
  ContributionController.getMyReceipt
);

myContributionsRouter.post(
  '/:id/cancel',
  authenticateUser,
  validateRequest({ params: contributionIdParamSchema }),
  ContributionController.cancelMyContribution
);

