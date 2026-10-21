import { useQuery } from '@tanstack/react-query';
import { ActivityService } from '@/services/activity.service';
import { activityKeys } from '@/constants/query-keys';
import { Config } from '@/constants/config';
import { useAuthStore } from '@/store/auth-store';

export function useMyActivity(params?: { limit?: number; offset?: number }) {
  const { isAuthenticated, user } = useAuthStore();
  const enabled = Config.useApi && isAuthenticated && !user?.isGuest;

  return useQuery({
    queryKey: activityKeys.me(params),
    queryFn: () => ActivityService.getMyActivity(params),
    enabled,
    staleTime: 1000 * 15,
  });
}
