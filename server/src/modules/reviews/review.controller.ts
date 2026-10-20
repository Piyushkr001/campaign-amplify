import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service';
import {
  ReviewQueueQuery,
  ReviewCampaignIdParam,
  RequestChangesInput,
  RejectCampaignInput,
  ApproveCampaignInput,
  StartFundingInput,
} from './review.schemas';
import { apiSuccess } from '../../utils/response';

async function getReviewerUserId(req: Request): Promise<string> {
  if (req.user?.id) {
    return req.user.id;
  }
  const headerId = req.headers['x-actor-user-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  const { resolveDemoReviewerId } = await import('../../utils/demo-identity');
  return resolveDemoReviewerId();
}

export const ReviewController = {
  getQueue: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ReviewQueueQuery;
      const campaigns = await ReviewService.getQueue(query);
      apiSuccess(res, campaigns);
    } catch (err) {
      next(err);
    }
  },

  getCampaignById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ReviewCampaignIdParam;
      const campaign = await ReviewService.getCampaignById(id);
      apiSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },

  startReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ReviewCampaignIdParam;
      const reviewerId = await getReviewerUserId(req);
      const updated = await ReviewService.startReview(id, reviewerId);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        reviewStartedAt: updated.reviewStartedAt?.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  requestChanges: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ReviewCampaignIdParam;
      const { feedback } = req.body as RequestChangesInput;
      const reviewerId = await getReviewerUserId(req);
      const updated = await ReviewService.requestChanges(id, feedback, reviewerId);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        requestedChangesAt: updated.requestedChangesAt?.toISOString(),
        feedback,
      });
    } catch (err) {
      next(err);
    }
  },

  approve: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ReviewCampaignIdParam;
      const input = req.body as ApproveCampaignInput;
      const reviewerId = await getReviewerUserId(req);
      const updated = await ReviewService.approve(id, input?.note, reviewerId);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt?.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  reject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ReviewCampaignIdParam;
      const { reason } = req.body as RejectCampaignInput;
      const reviewerId = await getReviewerUserId(req);
      const updated = await ReviewService.reject(id, reason, reviewerId);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        rejectedAt: updated.rejectedAt?.toISOString(),
        reason,
      });
    } catch (err) {
      next(err);
    }
  },

  startFunding: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ReviewCampaignIdParam;
      const input = req.body as StartFundingInput;
      const reviewerId = await getReviewerUserId(req);
      const updated = await ReviewService.startFunding(id, input?.note, reviewerId);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        fundingStartedAt: updated.fundingStartedAt?.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
};
