export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters.', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor(message = 'Database service is currently unavailable.', code = 'DATABASE_UNAVAILABLE') {
    super(message, 503, code);
  }
}

export class IncompleteCampaignError extends AppError {
  constructor(
    step: string,
    fields: string[],
    message = 'Campaign cannot be submitted because required information is missing.'
  ) {
    super(message, 400, 'CAMPAIGN_INCOMPLETE', { step, fields });
  }
}
