import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthRepository } from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schemas';
import { AuthSessionDTO, AuthUserDTO, JWTPayload } from './auth.types';
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  NotFoundError,
  InvalidTokenError,
  TokenExpiredError,
} from '../../utils/errors';

export const AuthService = {
  signToken: (payload: { sub: string; email: string; role: string }): string => {
    return jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );
  },

  verifyToken: (token: string): JWTPayload => {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        throw new TokenExpiredError();
      }
      throw new InvalidTokenError();
    }
  },

  register: async (input: RegisterInput): Promise<AuthSessionDTO> => {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await AuthRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new EmailAlreadyExistsError(`An account with email "${normalizedEmail}" already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    try {
      const user = await AuthRepository.createUser({
        email: normalizedEmail,
        passwordHash,
        displayName: input.displayName.trim(),
        role: 'USER', // Registration always creates a normal USER
      });

      const accessToken = AuthService.signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        accessToken,
      };
    } catch (err: any) {
      if (
        err?.code === '23505' ||
        err?.message?.includes('duplicate key') ||
        err?.message?.includes('users_email_unique')
      ) {
        throw new EmailAlreadyExistsError(`An account with email "${normalizedEmail}" already exists.`);
      }
      throw err;
    }
  },

  login: async (input: LoginInput): Promise<AuthSessionDTO> => {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await AuthRepository.findByEmail(normalizedEmail);
    if (!existing) {
      throw new InvalidCredentialsError();
    }

    // If existing user has empty passwordHash (e.g. legacy demo user before password feature)
    if (!existing.passwordHash) {
      throw new InvalidCredentialsError();
    }

    const isMatch = await bcrypt.compare(input.password, existing.passwordHash);
    if (!isMatch) {
      throw new InvalidCredentialsError();
    }

    const user: AuthUserDTO = {
      id: existing.id,
      email: existing.email,
      displayName: existing.displayName,
      role: existing.role,
      createdAt: existing.createdAt.toISOString(),
    };

    const accessToken = AuthService.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user,
      accessToken,
    };
  },

  getMe: async (userId: string): Promise<AuthUserDTO> => {
    const existing = await AuthRepository.findById(userId);
    if (!existing) {
      throw new NotFoundError('User profile not found.', 'USER_NOT_FOUND');
    }

    return {
      id: existing.id,
      email: existing.email,
      displayName: existing.displayName,
      role: existing.role,
      createdAt: existing.createdAt.toISOString(),
    };
  },
};

