import { CampaignRepository } from './campaign.repository';
import { ListCampaignsQuery } from './campaign.schemas';
import { CampaignPublicDTO } from './campaign.types';
import { NotFoundError } from '../../utils/errors';

export const CampaignService = {
  getPublicCampaigns: async (query: ListCampaignsQuery): Promise<CampaignPublicDTO[]> => {
    return CampaignRepository.findPublicCampaigns(query);
  },

  getPublicCampaignById: async (id: string): Promise<CampaignPublicDTO> => {
    const campaign = await CampaignRepository.findPublicCampaignById(id);
    if (!campaign) {
      throw new NotFoundError(`Campaign "${id}" not found or not publicly available.`);
    }
    return campaign;
  },
};
