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
      const reviewerId = req.user!.id;
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
      const reviewerId = req.user!.id;
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
      const reviewerId = req.user!.id;
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
      const reviewerId = req.user!.id;
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
      const reviewerId = req.user!.id;
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
