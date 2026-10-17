import { User } from '@/types/user';

export const AuthService = {
  getGuestUser: (): User => ({
    id: 'guest_user',
    name: 'Guest Backer',
    email: '',
    isGuest: true,
    backedCampaignCount: 0,
    totalAmplifiedAmount: 0,
    createdAt: new Date().toISOString(),
  }),

  // Auth placeholders for future integration
  signIn: async (): Promise<never> => {
    throw new Error('Authentication is planned for a future release.');
  },

  signOut: async (): Promise<void> => {
    // No-op for guest mode
  },
};
