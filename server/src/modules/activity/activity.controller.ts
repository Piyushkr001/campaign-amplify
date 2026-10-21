import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service';
import { ListActivityQuery } from './activity.schemas';
import { apiSuccess } from '../../utils/response';

export const ActivityController = {
  getMyActivity: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as ListActivityQuery;
      const feed = await ActivityService.getMyActivity(userId, query);
      apiSuccess(res, feed);
    } catch (err) {
      next(err);
    }
  },
};
