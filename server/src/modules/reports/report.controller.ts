import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { ReportCampaignIdParam } from './report.schemas';
import { apiSuccess } from '../../utils/response';

export const ReportController = {
  getReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ReportCampaignIdParam;
      const report = await ReportService.getCampaignReport(id);
      apiSuccess(res, report);
    } catch (err) {
      next(err);
    }
  },
};
