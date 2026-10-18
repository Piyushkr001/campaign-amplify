import { Response } from 'express';

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const payload: ApiResponseSuccess<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(payload);
}

export function apiError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  const payload: ApiResponseError = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}
