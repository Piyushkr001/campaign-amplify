/**
 * Authoritative API contract DTOs for Campaign Amplify Authentication
 * Matching backend: server/src/modules/auth/auth.types.ts
 */

export type ApiUserRole = 'USER' | 'REVIEWER' | 'ADMIN';

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  role: ApiUserRole;
  createdAt: string;
}

export interface AuthSessionApiDTO {
  user: ApiUser;
  accessToken: string;
}

export type AuthMeApiDTO = ApiUser;
