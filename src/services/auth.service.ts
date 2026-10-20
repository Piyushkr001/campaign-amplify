import apiClient, { persistToken, clearPersistedToken, getPersistedToken } from './api';
import { User } from '@/types/user';
import { Config } from '@/constants/config';
import { AuthSessionApiDTO, AuthMeApiDTO, ApiUser, ApiUserRole } from '@/types/auth-api';

function mapApiUserToModel(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    displayName: apiUser.displayName,
    name: apiUser.displayName,
    role: apiUser.role,
    isGuest: false,
    backedCampaignCount: 0,
    totalAmplifiedAmount: 0,
    createdAt: apiUser.createdAt,
  };
}

export const AuthService = {
  getGuestUser: (): User => ({
    id: 'guest_user',
    name: 'Guest Backer',
    displayName: 'Guest Backer',
    email: '',
    role: 'USER',
    isGuest: true,
    backedCampaignCount: 0,
    totalAmplifiedAmount: 0,
    createdAt: new Date().toISOString(),
  }),

  register: async (input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<{ user: User; accessToken: string }> => {
    if (!Config.useApi) {
      const mockUser: User = {
        id: 'local_user_' + Date.now(),
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        name: input.displayName.trim(),
        role: 'USER',
        isGuest: false,
        backedCampaignCount: 0,
        totalAmplifiedAmount: 0,
        createdAt: new Date().toISOString(),
      };
      return { user: mockUser, accessToken: 'local_demo_token' };
    }

    const response = await apiClient.post<{ success: boolean; data: AuthSessionApiDTO }>(
      '/auth/register',
      {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        displayName: input.displayName.trim(),
      }
    );

    const { user, accessToken } = response.data.data;
    await persistToken(accessToken);
    return {
      user: mapApiUserToModel(user),
      accessToken,
    };
  },

  login: async (input: {
    email: string;
    password: string;
  }): Promise<{ user: User; accessToken: string }> => {
    if (!Config.useApi) {
      const role: ApiUserRole = input.email.includes('reviewer')
        ? 'REVIEWER'
        : input.email.includes('admin')
        ? 'ADMIN'
        : 'USER';
      const mockUser: User = {
        id: 'local_user_' + Date.now(),
        email: input.email.trim().toLowerCase(),
        displayName: input.email.split('@')[0],
        name: input.email.split('@')[0],
        role,
        isGuest: false,
        backedCampaignCount: 0,
        totalAmplifiedAmount: 0,
        createdAt: new Date().toISOString(),
      };
      return { user: mockUser, accessToken: 'local_demo_token' };
    }

    const response = await apiClient.post<{ success: boolean; data: AuthSessionApiDTO }>(
      '/auth/login',
      {
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }
    );

    const { user, accessToken } = response.data.data;
    await persistToken(accessToken);
    return {
      user: mapApiUserToModel(user),
      accessToken,
    };
  },

  getMe: async (): Promise<User | null> => {
    if (!Config.useApi) {
      return null;
    }

    const token = await getPersistedToken();
    if (!token) {
      return null;
    }

    try {
      const response = await apiClient.get<{ success: boolean; data: AuthMeApiDTO }>(
        '/auth/me'
      );
      return mapApiUserToModel(response.data.data);
    } catch (err: any) {
      const status = err?.response?.status;
      // Differentiate genuine 401/403 auth failure from temporary connectivity/server failures
      if (status === 401 || status === 403) {
        await clearPersistedToken();
        return null;
      }
      // On temporary network errors, timeouts, or 5xx: DO NOT clear token from SecureStore!
      console.warn('[AuthService] Temporary error connecting to /auth/me, preserving token:', err?.message || err);
      return null;
    }
  },

  logout: async (): Promise<void> => {
    await clearPersistedToken();
  },
};
