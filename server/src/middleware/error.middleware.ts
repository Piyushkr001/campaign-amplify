import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { apiError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return apiError(res, err.statusCode, err.code, err.message);
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join('; ') || 'Invalid request payload.';
    return apiError(res, 400, 'VALIDATION_ERROR', message, err.format());
  }

  // Hide raw internal/SQL errors in production/demo
  console.error('[Unhandled Server Error]:', err);
  return apiError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.');
}
