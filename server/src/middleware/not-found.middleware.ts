import { Request, Response } from 'express';
import { apiError } from '../utils/response';

export function notFoundHandler(req: Request, res: Response): Response {
  return apiError(
    res,
    404,
    'ROUTE_NOT_FOUND',
    `Endpoint ${req.method} ${req.originalUrl} does not exist.`
  );
}
