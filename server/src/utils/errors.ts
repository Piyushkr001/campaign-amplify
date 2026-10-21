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
  constructor(message = 'Resource not found.', code = 'CAMPAIGN_NOT_FOUND') {
    super(message, 404, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters.', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class InvalidCampaignIdError extends AppError {
  constructor(message = 'Invalid campaign ID format. Expected a valid UUID.', details?: unknown) {
    super(message, 400, 'INVALID_CAMPAIGN_ID', details);
  }
}

export class InvalidCampaignStatusError extends AppError {
  constructor(status: string, action = 'edit') {
    super(
      `Cannot ${action} campaign in "${status}" status.`,
      400,
      'INVALID_CAMPAIGN_STATUS',
      { status, action }
    );
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

export class LifecycleConflictError extends AppError {
  constructor(
    message = 'Campaign status was modified concurrently.',
    details?: unknown
  ) {
    super(message, 409, 'LIFECYCLE_CONFLICT', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to perform this action.',
    details?: unknown
  ) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class CampaignNotBackableError extends AppError {
  constructor(
    message = 'Campaign is not currently accepting financial contributions.',
    details?: unknown
  ) {
    super(message, 409, 'CAMPAIGN_NOT_BACKABLE', details);
  }
}

export class FundingConflictError extends AppError {
  constructor(
    message = 'Contribution could not be processed due to a funding state conflict.',
    details?: unknown
  ) {
    super(message, 409, 'FUNDING_CONFLICT', details);
  }
}

export class AuthenticationRequiredError extends AppError {
  constructor(
    message = 'Authentication is required to perform this action.',
    details?: unknown
  ) {
    super(message, 401, 'AUTHENTICATION_REQUIRED', details);
  }
}

export class InvalidTokenError extends AppError {
  constructor(
    message = 'The provided authentication token is invalid or malformed.',
    details?: unknown
  ) {
    super(message, 401, 'INVALID_TOKEN', details);
  }
}

export class TokenExpiredError extends AppError {
  constructor(
    message = 'Authentication session has expired. Please log in again.',
    details?: unknown
  ) {
    super(message, 401, 'TOKEN_EXPIRED', details);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(
    message = 'Invalid email or password.',
    details?: unknown
  ) {
    super(message, 401, 'INVALID_CREDENTIALS', details);
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(
    message = 'An account with this email address already exists.',
    details?: unknown
  ) {
    super(message, 409, 'EMAIL_ALREADY_EXISTS', details);
  }
}

export class InsufficientRoleError extends AppError {
  constructor(
    message = 'You do not have the required permissions to access this resource.',
    details?: unknown
  ) {
    super(message, 403, 'INSUFFICIENT_ROLE', details);
  }
}

export class CampaignAccessDeniedError extends AppError {
  constructor(
    message = 'You do not have permission to modify this campaign.',
    details?: unknown
  ) {
    super(message, 403, 'CAMPAIGN_ACCESS_DENIED', details);
  }
}

export class ContributionAccessDeniedError extends AppError {
  constructor(
    message = 'You do not have permission to access or process this contribution.',
    details?: unknown
  ) {
    super(message, 403, 'CONTRIBUTION_ACCESS_DENIED', details);
  }
}

export class ContributionStateConflictError extends AppError {
  constructor(
    message = 'Contribution is not in a valid state for this action.',
    details?: unknown
  ) {
    super(message, 409, 'CONTRIBUTION_STATE_CONFLICT', details);
  }
}

export class ReportNotAvailableError extends AppError {
  constructor(
    message = 'Campaign report is not available yet.',
    details?: unknown
  ) {
    super(message, 400, 'REPORT_NOT_AVAILABLE', details);
  }
}

export class RateLimitExceededError extends AppError {
  constructor(
    message = 'Rate limit exceeded. Please wait a moment before trying again.',
    details?: unknown
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}



