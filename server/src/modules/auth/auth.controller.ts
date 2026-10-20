import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { apiSuccess } from '../../utils/response';
import { AuthenticationRequiredError } from '../../utils/errors';

export const AuthController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await AuthService.register(req.body);
      apiSuccess(res, session, 201);
    } catch (err) {
      next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await AuthService.login(req.body);
      apiSuccess(res, session, 200);
    } catch (err) {
      next(err);
    }
  },

  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationRequiredError();
      }
      const profile = await AuthService.getMe(req.user.id);
      apiSuccess(res, profile, 200);
    } catch (err) {
      next(err);
    }
  },
};
