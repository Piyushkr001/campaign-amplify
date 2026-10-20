import { create } from 'zustand';
import { User } from '@/types/user';
import { AuthService } from '@/services/auth.service';
import { setOnUnauthorizedCallback } from '@/services/api';

interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  hydrateAuth: () => Promise<void>;
  signInGuest: () => void;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStoreState>((set) => {
  // Wire 401 callback to reset auth state
  setOnUnauthorizedCallback(() => {
    set({
      user: AuthService.getGuestUser(),
      isAuthenticated: false,
      isLoading: false,
    });
  });

  return {
    user: AuthService.getGuestUser(),
    isAuthenticated: false,
    isHydrated: false,
    isLoading: false,

    hydrateAuth: async () => {
      set({ isLoading: true });
      try {
        const user = await AuthService.getMe();
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isHydrated: true,
            isLoading: false,
          });
        } else {
          set({
            user: AuthService.getGuestUser(),
            isAuthenticated: false,
            isHydrated: true,
            isLoading: false,
          });
        }
      } catch {
        set({
          user: AuthService.getGuestUser(),
          isAuthenticated: false,
          isHydrated: true,
          isLoading: false,
        });
      }
    },

    signInGuest: () =>
      set({
        user: AuthService.getGuestUser(),
        isAuthenticated: false,
        isLoading: false,
      }),

    setUser: (user) =>
      set({
        user,
        isAuthenticated: !!user && !user.isGuest,
        isLoading: false,
      }),

    signOut: async () => {
      await AuthService.logout();
      set({
        user: AuthService.getGuestUser(),
        isAuthenticated: false,
        isLoading: false,
      });
    },
  };
});
