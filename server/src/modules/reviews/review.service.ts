import { ReviewRepository } from './review.repository';
import { ReviewQueueQuery } from './review.schemas';
import { ReviewerCampaignListDTO, ReviewerCampaignDetailDTO } from './review.types';
import { resolveDemoReviewerId } from '../../utils/demo-identity';

export const ReviewService = {
  getQueue: async (query?: ReviewQueueQuery): Promise<ReviewerCampaignListDTO[]> => {
    return ReviewRepository.findQueue(query);
  },

  getCampaignById: async (campaignId: string): Promise<ReviewerCampaignDetailDTO> => {
    return ReviewRepository.findCampaignById(campaignId);
  },

  startReview: async (campaignId: string, actorUserId?: string) => {
    const reviewerId = actorUserId || (await resolveDemoReviewerId());
    return ReviewRepository.startReview(campaignId, reviewerId);
  },

  requestChanges: async (campaignId: string, feedback: string, actorUserId?: string) => {
    const reviewerId = actorUserId || (await resolveDemoReviewerId());
    return ReviewRepository.requestChanges(campaignId, reviewerId, feedback);
  },

  approve: async (campaignId: string, note?: string, actorUserId?: string) => {
    const reviewerId = actorUserId || (await resolveDemoReviewerId());
    return ReviewRepository.approve(campaignId, reviewerId, note);
  },

  reject: async (campaignId: string, reason: string, actorUserId?: string) => {
    const reviewerId = actorUserId || (await resolveDemoReviewerId());
    return ReviewRepository.reject(campaignId, reviewerId, reason);
  },

  startFunding: async (campaignId: string, note?: string, actorUserId?: string) => {
    const reviewerId = actorUserId || (await resolveDemoReviewerId());
    return ReviewRepository.startFunding(campaignId, reviewerId, note);
  },
};
