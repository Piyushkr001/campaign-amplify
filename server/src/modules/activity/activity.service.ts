import { ActivityRepository } from './activity.repository';
import { ListActivityQuery } from './activity.schemas';
import { ActivityFeedResponseDTO } from './activity.types';

export const ActivityService = {
  getMyActivity: async (
    userId: string,
    query: ListActivityQuery
  ): Promise<ActivityFeedResponseDTO> => {
    return ActivityRepository.findUserActivityFeed(userId, query);
  },
};
