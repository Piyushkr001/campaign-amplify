import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';
import { UserRole } from '../modules/auth/auth.types';
import {
  AuthenticationRequiredError,
  InvalidTokenError,
  InsufficientRoleError,
} from '../utils/errors';

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

/**
 * Middleware that strictly verifies JWT Bearer token and populates req.user.
 */
export function authenticateUser(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AuthenticationRequiredError('Authorization header with Bearer token is required.');
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new InvalidTokenError('Malformed Authorization header. Format: Bearer <token>');
  }

  try {
    const payload = AuthService.verifyToken(token);
    if (!payload.sub) {
      throw new InvalidTokenError('Token is missing subject identifier.');
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication: attaches req.user if a valid Bearer token is provided,
 * but allows guest requests through if no Authorization header is present.
 */
export function optionalAuthenticateUser(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next();
  }

  try {
    const payload = AuthService.verifyToken(token);
    if (payload.sub) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
    next();
  } catch {
    // Silently continue for optional auth
    next();
  }
}

/**
 * Middleware that restricts route access to specific roles (e.g. REVIEWER, ADMIN).
 * Requires authenticateUser to have run beforehand.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationRequiredError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new InsufficientRoleError(
          `Action requires one of the following roles: ${allowedRoles.join(', ')}. Current role: "${req.user.role}".`
        )
      );
    }

    next();
  };
}
