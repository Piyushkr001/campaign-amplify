import { Router } from 'express';
import { ReportController } from './report.controller';
import { validateRequest } from '../../middleware/validate.middleware';
import { reportCampaignIdParamSchema } from './report.schemas';

const router = Router();

// GET /api/v1/campaigns/:id/report
router.get(
  '/:id/report',
  validateRequest({ params: reportCampaignIdParamSchema }),
  ReportController.getReport
);

export const reportRouter = router;
