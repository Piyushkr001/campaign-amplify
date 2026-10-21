import { Request, Response, NextFunction } from 'express';
import { CampaignService } from './campaign.service';
import {
  ListCampaignsQuery,
  CampaignIdParam,
  CreateDraftInput,
  UpdateBasicsInput,
  UpdateStoryInput,
  UpdateVisualsInput,
  UpdateReachInput,
  SubmitCampaignInput,
  LifecycleNoteInput,
  FailCampaignInput,
} from './campaign.schemas';
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

  createDraft: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const input = req.body as CreateDraftInput;
      const draft = await CampaignService.createDraft(input, actorUserId);
      apiSuccess(res, draft, 201);
    } catch (err) {
      next(err);
    }
  },

  updateBasics: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const input = req.body as UpdateBasicsInput;
      const updated = await CampaignService.updateBasics(id, input, actorUserId);
      apiSuccess(res, {
        id: updated.id,
        title: updated.title,
        category: updated.category,
        summary: updated.summary,
        coverImageUrl: updated.coverImageUrl,
        draftStep: updated.draftStep,
        updatedAt: updated.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },

  updateStory: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const input = req.body as UpdateStoryInput;
      await CampaignService.updateStory(id, input, actorUserId);
      apiSuccess(res, { success: true, step: 'STORY' });
    } catch (err) {
      next(err);
    }
  },

  updateVisuals: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const input = req.body as UpdateVisualsInput;
      await CampaignService.updateVisuals(id, input, actorUserId);
      apiSuccess(res, { success: true, step: 'VISUALS' });
    } catch (err) {
      next(err);
    }
  },

  updateReach: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const input = req.body as UpdateReachInput;
      await CampaignService.updateReach(id, input, actorUserId);
      apiSuccess(res, { success: true, step: 'REACH' });
    } catch (err) {
      next(err);
    }
  },

  submit: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const input = req.body as SubmitCampaignInput;
      const result = await CampaignService.submitCampaign(id, input, actorUserId);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  endFunding: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const { note } = (req.body || {}) as LifecycleNoteInput;
      const updated = await CampaignService.endFunding(id, actorUserId, note);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        fundingEndedAt: updated.fundingEndedAt?.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  prepareDistribution: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const { note } = (req.body || {}) as LifecycleNoteInput;
      const updated = await CampaignService.prepareDistribution(id, actorUserId, note);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        distributionPreparationAt: updated.distributionPreparationAt?.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  startPromotion: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const { note } = (req.body || {}) as LifecycleNoteInput;
      const updated = await CampaignService.startPromotion(id, actorUserId, note);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        promotionStartedAt: updated.promotionStartedAt?.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  complete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const { note } = (req.body || {}) as LifecycleNoteInput;
      const updated = await CampaignService.completeCampaign(id, actorUserId, note);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        completedAt: updated.completedAt?.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  fail: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = req.user!.id;
      const { id } = req.params as unknown as CampaignIdParam;
      const { reason } = req.body as FailCampaignInput;
      const updated = await CampaignService.failPromotion(id, reason, actorUserId);
      apiSuccess(res, {
        id: updated.id,
        status: updated.status,
        failedAt: updated.failedAt?.toISOString(),
        reason,
      });
    } catch (err) {
      next(err);
    }
  },
};

