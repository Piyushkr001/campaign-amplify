import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.schemas';
import { authenticateUser } from '../../middleware/auth.middleware';

export const authRouter = Router();

// Public auth endpoints
authRouter.post('/register', validateBody(registerSchema), AuthController.register);
authRouter.post('/login', validateBody(loginSchema), AuthController.login);

// Protected session endpoint
authRouter.get('/me', authenticateUser, AuthController.getMe);
