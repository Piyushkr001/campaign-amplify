import { Request, Response, NextFunction } from 'express';
import { ContributionService } from './contribution.service';
import {
  ContributionQuoteInput,
  CreateContributionInput,
  CampaignContributionParam,
  ContributionIdParam,
} from './contribution.schemas';
import { apiSuccess } from '../../utils/response';
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
      const actorUserId = req.user!.id;
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
      const actorUserId = req.user!.id;
      const contributions = await ContributionService.getMyContributions(actorUserId);
      apiSuccess(res, contributions);
    } catch (err) {
      next(err);
    }
  },

  getMyContributionById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ContributionIdParam;
      const actorUserId = req.user!.id;
      const detail = await ContributionService.getMyContributionById(id, actorUserId);
      apiSuccess(res, detail);
    } catch (err) {
      next(err);
    }
  },

  getMyReceipt: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ContributionIdParam;
      const actorUserId = req.user!.id;
      const receipt = await ContributionService.getMyReceipt(id, actorUserId);
      apiSuccess(res, receipt);
    } catch (err) {
      next(err);
    }
  },

  cancelMyContribution: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ContributionIdParam;
      const actorUserId = req.user!.id;
      const result = await ContributionService.cancelContribution(id, actorUserId);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
