import { create } from 'zustand';
import { User } from '@/types/user';
import { AuthService } from '@/services/auth.service';

interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInGuest: () => void;
  setUser: (user: User | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: AuthService.getGuestUser(),
  isAuthenticated: false,
  isLoading: false,

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

  signOut: () =>
    set({
      user: AuthService.getGuestUser(),
      isAuthenticated: false,
      isLoading: false,
    }),
}));
