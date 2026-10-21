import { Router } from 'express';
import { AIController } from './ai.controller';
import { authenticateUser } from '../../middleware/auth.middleware';

const router = Router();

// Protect all AI endpoints with authentication
router.use(authenticateUser);

// Summary generation
router.post('/campaign/summary', AIController.generateSummary);
router.post('/summary', AIController.generateSummary);

// Story generation
router.post('/campaign/story', AIController.generateStory);
router.post('/story', AIController.generateStory);

// Ad Creative generation
router.post('/campaign/ad-creative', AIController.generateAdCreative);
router.post('/ad-creative', AIController.generateAdCreative);

// Audience & Targeting generation
router.post('/campaign/audience', AIController.generateAudience);
router.post('/audience', AIController.generateAudience);

export const aiRouter = router;
