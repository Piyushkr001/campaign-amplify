import { Request, Response, NextFunction } from 'express';
import { CampaignService } from './campaign.service';
import { ListCampaignsQuery, CampaignIdParam } from './campaign.schemas';
import { apiSuccess } from '../../utils/response';

export const CampaignController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListCampaignsQuery;
      const campaigns = await CampaignService.getPublicCampaigns(query);
      apiSuccess(res, campaigns);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as CampaignIdParam;
      const campaign = await CampaignService.getPublicCampaignById(id);
      apiSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },
};
