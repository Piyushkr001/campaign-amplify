import { ContributionRepository } from './contribution.repository';
import { resolveDemoBackerId } from '../../utils/demo-identity';

export const ContributionService = {
  getQuote: async (campaignId: string, amount: number) => {
    return ContributionRepository.calculateQuote(campaignId, amount);
  },

  createContribution: async (params: {
    campaignId: string;
    amount: number;
    actorUserId?: string;
  }) => {
    const userId = params.actorUserId || (await resolveDemoBackerId());
    return ContributionRepository.createPending({
      campaignId: params.campaignId,
      userId,
      amount: params.amount,
    });
  },

  getMyContributions: async (actorUserId?: string) => {
    const userId = actorUserId || (await resolveDemoBackerId());
    return ContributionRepository.findUserContributions(userId);
  },

  getMyContributionById: async (id: string, actorUserId?: string) => {
    const userId = actorUserId || (await resolveDemoBackerId());
    return ContributionRepository.findDetailById(id, userId);
  },

  getMyReceipt: async (id: string, actorUserId?: string) => {
    const userId = actorUserId || (await resolveDemoBackerId());
    return ContributionRepository.findReceipt(id, userId);
  },

  cancelContribution: async (id: string, actorUserId?: string) => {
    const userId = actorUserId || (await resolveDemoBackerId());
    return ContributionRepository.cancelPending(id, userId);
  },
};
