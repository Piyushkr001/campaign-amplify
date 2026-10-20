import apiClient, { persistToken, clearPersistedToken, getPersistedToken } from './api';
import { User, UserRole } from '@/types/user';
import { Config } from '@/constants/config';

export interface AuthResponseData {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: string;
  };
  token: string;
}

export interface UserProfileResponseData {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: string;
  };
}

function mapApiUserToModel(apiUser: AuthResponseData['user']): User {
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
  }): Promise<{ user: User; token: string }> => {
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
      return { user: mockUser, token: 'local_demo_token' };
    }

    const response = await apiClient.post<{ success: boolean; data: AuthResponseData }>(
      '/auth/register',
      {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        displayName: input.displayName.trim(),
      }
    );

    const { user, token } = response.data.data;
    await persistToken(token);
    return {
      user: mapApiUserToModel(user),
      token,
    };
  },

  login: async (input: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> => {
    if (!Config.useApi) {
      const role: UserRole = input.email.includes('reviewer')
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
      return { user: mockUser, token: 'local_demo_token' };
    }

    const response = await apiClient.post<{ success: boolean; data: AuthResponseData }>(
      '/auth/login',
      {
        email: input.email.trim().toLowerCase(),
        password: input.password,
      }
    );

    const { user, token } = response.data.data;
    await persistToken(token);
    return {
      user: mapApiUserToModel(user),
      token,
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
      const response = await apiClient.get<{ success: boolean; data: UserProfileResponseData }>(
        '/auth/me'
      );
      return mapApiUserToModel(response.data.data.user);
    } catch {
      await clearPersistedToken();
      return null;
    }
  },

  logout: async (): Promise<void> => {
    await clearPersistedToken();
  },
};

