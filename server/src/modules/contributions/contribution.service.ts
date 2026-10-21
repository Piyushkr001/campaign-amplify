import { ContributionRepository } from './contribution.repository';

export const ContributionService = {
  getQuote: async (campaignId: string, amount: number) => {
    return ContributionRepository.calculateQuote(campaignId, amount);
  },

  createContribution: async (params: {
    campaignId: string;
    amount: number;
    actorUserId: string;
  }) => {
    return ContributionRepository.createPending({
      campaignId: params.campaignId,
      userId: params.actorUserId,
      amount: params.amount,
    });
  },

  getMyContributions: async (actorUserId: string) => {
    return ContributionRepository.findUserContributions(actorUserId);
  },

  getMyContributionById: async (id: string, actorUserId: string) => {
    return ContributionRepository.findDetailById(id, actorUserId);
  },

  getMyReceipt: async (id: string, actorUserId: string) => {
    return ContributionRepository.findReceipt(id, actorUserId);
  },

  cancelContribution: async (id: string, actorUserId: string) => {
    return ContributionRepository.cancelPending(id, actorUserId);
  },
};
