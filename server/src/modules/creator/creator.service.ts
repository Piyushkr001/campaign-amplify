import { CreatorRepository } from './creator.repository';
import { CreatorCampaignsQuery } from './creator.schemas';
import { CampaignListDTO, CampaignDetailDTO } from '../campaigns/campaign.types';
import { resolveDemoCreatorId } from '../../utils/demo-identity';

export const CreatorService = {
  getMyCampaigns: async (
    query?: CreatorCampaignsQuery,
    actorUserId?: string
  ): Promise<CampaignListDTO[]> => {
    const userId = actorUserId || (await resolveDemoCreatorId());
    return CreatorRepository.findCreatorCampaigns({ actorUserId: userId, query });
  },

  getMyCampaignById: async (
    campaignId: string,
    actorUserId?: string
  ): Promise<CampaignDetailDTO> => {
    const userId = actorUserId || (await resolveDemoCreatorId());
    return CreatorRepository.findCreatorCampaignById({ campaignId, actorUserId: userId });
  },
};
