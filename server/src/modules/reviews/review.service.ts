import { ReviewRepository } from './review.repository';
import { ReviewQueueQuery } from './review.schemas';
import { ReviewerCampaignListDTO, ReviewerCampaignDetailDTO } from './review.types';

export const ReviewService = {
  getQueue: async (query?: ReviewQueueQuery): Promise<ReviewerCampaignListDTO[]> => {
    return ReviewRepository.findQueue(query);
  },

  getCampaignById: async (campaignId: string): Promise<ReviewerCampaignDetailDTO> => {
    return ReviewRepository.findCampaignById(campaignId);
  },

  startReview: async (campaignId: string, actorUserId: string) => {
    return ReviewRepository.startReview(campaignId, actorUserId);
  },

  requestChanges: async (campaignId: string, feedback: string, actorUserId: string) => {
    return ReviewRepository.requestChanges(campaignId, actorUserId, feedback);
  },

  approve: async (campaignId: string, note: string | undefined, actorUserId: string) => {
    return ReviewRepository.approve(campaignId, actorUserId, note);
  },

  reject: async (campaignId: string, reason: string, actorUserId: string) => {
    return ReviewRepository.reject(campaignId, actorUserId, reason);
  },

  startFunding: async (campaignId: string, note: string | undefined, actorUserId: string) => {
    return ReviewRepository.startFunding(campaignId, actorUserId, note);
  },
};
