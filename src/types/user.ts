export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGuest: boolean;
  backedCampaignCount: number;
  totalAmplifiedAmount: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
