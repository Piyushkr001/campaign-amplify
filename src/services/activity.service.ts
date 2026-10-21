import { apiClient } from './api';
import { ActivityFeedApiDTO } from '@/types/activity-api';

export const ActivityService = {
  getMyActivity: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<ActivityFeedApiDTO> => {
    const response = await apiClient.get<{ success: boolean; data: ActivityFeedApiDTO }>(
      '/me/activity',
      { params }
    );
    return response.data.data;
  },
};
