import { CreatorRepository } from './creator.repository';
import { CreatorCampaignsQuery } from './creator.schemas';
import { CampaignListDTO, CampaignDetailDTO } from '../campaigns/campaign.types';

export const CreatorService = {
  getMyCampaigns: async (
    query: CreatorCampaignsQuery | undefined,
    actorUserId: string
  ): Promise<CampaignListDTO[]> => {
    return CreatorRepository.findCreatorCampaigns({ actorUserId, query });
  },

  getMyCampaignById: async (
    campaignId: string,
    actorUserId: string
  ): Promise<CampaignDetailDTO> => {
    return CreatorRepository.findCreatorCampaignById({ campaignId, actorUserId });
  },
};
