export type UserRole = 'USER' | 'REVIEWER' | 'ADMIN';

export interface AuthUserDTO {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSessionDTO {
  user: AuthUserDTO;
  accessToken: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
