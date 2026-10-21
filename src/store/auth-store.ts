import { create } from 'zustand';
import { User } from '@/types/user';
import { AuthService } from '@/services/auth.service';
import { setOnUnauthorizedCallback, getPersistedToken } from '@/services/api';
import { queryClient } from '@/services/query-client';
import { useCampaignDraftStore } from './campaign-draft-store';
import { useContributionStore } from './contribution-store';
import { useMyCampaignsStore } from './my-campaigns-store';
import { Config } from '@/constants/config';

interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  sessionError: string | null;
  hydrateAuth: () => Promise<void>;
  signInGuest: () => void;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  clearSessionError: () => void;
}

/**
 * Ensures strict privacy on logout or session expiration:
 * Clears TanStack Query cache, active campaign draft, and private stores
 * so no previous user data can ever be exposed to another account.
 */
function clearPrivateClientState() {
  try {
    queryClient.clear();
    useCampaignDraftStore.getState().resetDraft();
    if (Config.useApi) {
      useContributionStore.setState({
        contributions: [],
        payments: [],
        currentContribution: null,
        currentPayment: null,
      });
      useMyCampaignsStore.setState({
        campaigns: [],
      });
    }
  } catch (err) {
    console.warn('[AuthStore] Error clearing private client state:', err);
  }
}

export const useAuthStore = create<AuthStoreState>((set) => {
  // Wire 401 callback to reset auth state and purge private caches
  setOnUnauthorizedCallback(() => {
    clearPrivateClientState();
    set({
      user: AuthService.getGuestUser(),
      isAuthenticated: false,
      isLoading: false,
      sessionError: 'Session expired. Please sign in again.',
    });
  });

  return {
    user: AuthService.getGuestUser(),
    isAuthenticated: false,
    isHydrated: false,
    isLoading: false,
    sessionError: null,

    hydrateAuth: async () => {
      set({ isLoading: true });
      try {
        const persistedToken = await getPersistedToken();
        if (!persistedToken) {
          clearPrivateClientState();
          set({
            user: AuthService.getGuestUser(),
            isAuthenticated: false,
            isHydrated: true,
            isLoading: false,
            sessionError: null,
          });
          return;
        }

        const user = await AuthService.getMe();
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isHydrated: true,
            isLoading: false,
            sessionError: null,
          });
        } else {
          // Check if token remains in SecureStore (connectivity error) or was deleted (401 auth error)
          const stillHasToken = await getPersistedToken();
          if (stillHasToken) {
            set({
              user: AuthService.getGuestUser(),
              isAuthenticated: false,
              isHydrated: true,
              isLoading: false,
              sessionError: 'Unable to reach authentication server. Network offline.',
            });
          } else {
            clearPrivateClientState();
            set({
              user: AuthService.getGuestUser(),
              isAuthenticated: false,
              isHydrated: true,
              isLoading: false,
              sessionError: null,
            });
          }
        }
      } catch {
        set({
          user: AuthService.getGuestUser(),
          isAuthenticated: false,
          isHydrated: true,
          isLoading: false,
          sessionError: 'Failed to verify session. Check network connection.',
        });
      }
    },

    signInGuest: () =>
      set({
        user: AuthService.getGuestUser(),
        isAuthenticated: false,
        isLoading: false,
        sessionError: null,
      }),

    setUser: (user) => {
      // If setting a new authenticated user, ensure draft is scoped or fresh
      if (user && !user.isGuest) {
        const currentDraft = useCampaignDraftStore.getState().draft;
        if (currentDraft?.ownerUserId && currentDraft.ownerUserId !== user.id) {
          useCampaignDraftStore.getState().resetDraft();
        } else {
          useCampaignDraftStore.getState().updateField('ownerUserId', user.id);
        }
      }
      set({
        user,
        isAuthenticated: !!user && !user.isGuest,
        isLoading: false,
        sessionError: null,
      });
    },

    signOut: async () => {
      await AuthService.logout();
      clearPrivateClientState();
      set({
        user: AuthService.getGuestUser(),
        isAuthenticated: false,
        isLoading: false,
        sessionError: null,
      });
    },

    clearSessionError: () => set({ sessionError: null }),
  };
});
