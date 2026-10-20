import { Request, Response, NextFunction } from 'express';
import { CreatorService } from './creator.service';
import { CreatorCampaignsQuery, CreatorCampaignIdParam } from './creator.schemas';
import { apiSuccess } from '../../utils/response';

export const CreatorController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as CreatorCampaignsQuery;
      const actorUserId = req.user!.id;
      const campaigns = await CreatorService.getMyCampaigns(query, actorUserId);
      apiSuccess(res, campaigns);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as CreatorCampaignIdParam;
      const actorUserId = req.user!.id;
      const campaign = await CreatorService.getMyCampaignById(id, actorUserId);
      apiSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },
};
