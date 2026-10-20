import { Request, Response, NextFunction } from 'express';
import { ContributionService } from './contribution.service';
import {
  ContributionQuoteInput,
  CreateContributionInput,
  CampaignContributionParam,
  ContributionIdParam,
} from './contribution.schemas';
import { apiSuccess } from '../../utils/response';
import { resolveDemoBackerId } from '../../utils/demo-identity';

async function getBackerUserId(req: Request): Promise<string> {
  const headerId = req.headers['x-actor-user-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  return resolveDemoBackerId();
}

export const ContributionController = {
  getQuote: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as CampaignContributionParam;
      const { amount } = req.body as ContributionQuoteInput;
      const quote = await ContributionService.getQuote(id, amount);
      apiSuccess(res, quote);
    } catch (err) {
      next(err);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as CampaignContributionParam;
      const { amount } = req.body as CreateContributionInput;
      const actorUserId = await getBackerUserId(req);
      const contribution = await ContributionService.createContribution({
        campaignId: id,
        amount,
        actorUserId,
      });
      apiSuccess(res, contribution, 201);
    } catch (err) {
      next(err);
    }
  },

  listMyContributions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = await getBackerUserId(req);
      const contributions = await ContributionService.getMyContributions(actorUserId);
      apiSuccess(res, contributions);
    } catch (err) {
      next(err);
    }
  },

  getMyContributionById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ContributionIdParam;
      const actorUserId = await getBackerUserId(req);
      const detail = await ContributionService.getMyContributionById(id, actorUserId);
      apiSuccess(res, detail);
    } catch (err) {
      next(err);
    }
  },

  getMyReceipt: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ContributionIdParam;
      const actorUserId = await getBackerUserId(req);
      const receipt = await ContributionService.getMyReceipt(id, actorUserId);
      apiSuccess(res, receipt);
    } catch (err) {
      next(err);
    }
  },
};
