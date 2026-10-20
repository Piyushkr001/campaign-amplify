export type UserRole = 'USER' | 'REVIEWER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  displayName: string;
  name: string; // compatibility alias for UI
  role: UserRole;
  avatarUrl?: string;
  isGuest: boolean;
  backedCampaignCount: number;
  totalAmplifiedAmount: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
}
