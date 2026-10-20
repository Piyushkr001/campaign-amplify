import { Request, Response, NextFunction } from 'express';
import { CreatorService } from './creator.service';
import { CreatorCampaignsQuery, CreatorCampaignIdParam } from './creator.schemas';
import { apiSuccess } from '../../utils/response';

async function getCreatorUserId(req: Request): Promise<string> {
  if (req.user?.id) {
    return req.user.id;
  }
  const headerId = req.headers['x-actor-user-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  const { resolveDemoCreatorId } = await import('../../utils/demo-identity');
  return resolveDemoCreatorId();
}

export const CreatorController = {
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as CreatorCampaignsQuery;
      const actorUserId = await getCreatorUserId(req);
      const campaigns = await CreatorService.getMyCampaigns(query, actorUserId);
      apiSuccess(res, campaigns);
    } catch (err) {
      next(err);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as CreatorCampaignIdParam;
      const actorUserId = await getCreatorUserId(req);
      const campaign = await CreatorService.getMyCampaignById(id, actorUserId);
      apiSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },
};
