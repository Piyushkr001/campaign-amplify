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
} from './campaign.schemas';
import { apiSuccess } from '../../utils/response';
import { resolveDemoCreatorId } from '../../utils/demo-identity';

async function getActorUserId(req: Request): Promise<string> {
  const headerId = req.headers['x-actor-user-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  return resolveDemoCreatorId();
}

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
      const actorUserId = await getActorUserId(req);
      const input = req.body as CreateDraftInput;
      const draft = await CampaignService.createDraft(input, actorUserId);
      apiSuccess(res, draft, 201);
    } catch (err) {
      next(err);
    }
  },

  updateBasics: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const actorUserId = await getActorUserId(req);
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
      const actorUserId = await getActorUserId(req);
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
      const actorUserId = await getActorUserId(req);
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
      const actorUserId = await getActorUserId(req);
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
      const actorUserId = await getActorUserId(req);
      const { id } = req.params as unknown as CampaignIdParam;
      const input = req.body as SubmitCampaignInput;
      const result = await CampaignService.submitCampaign(id, input, actorUserId);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
