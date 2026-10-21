import { Request, Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { apiSuccess } from '../../utils/response';
import { AuthenticationRequiredError } from '../../utils/errors';

export const AIController = {
  generateSummary: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationRequiredError('Authentication required to use AI assist.');
      }

      const result = await AIService.generateSummary(userId, req.body);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  generateStory: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationRequiredError('Authentication required to use AI assist.');
      }

      const result = await AIService.generateStory(userId, req.body);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  generateAdCreative: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationRequiredError('Authentication required to use AI assist.');
      }

      const result = await AIService.generateAdCreative(userId, req.body);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  generateAudience: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationRequiredError('Authentication required to use AI assist.');
      }

      const result = await AIService.generateAudience(userId, req.body);
      apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
