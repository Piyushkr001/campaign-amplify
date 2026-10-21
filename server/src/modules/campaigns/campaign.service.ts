import { CampaignRepository } from './campaign.repository';
import {
  ListCampaignsQuery,
  CreateDraftInput,
  UpdateBasicsInput,
  UpdateStoryInput,
  UpdateVisualsInput,
  UpdateReachInput,
  SubmitCampaignInput,
} from './campaign.schemas';
import { CampaignListDTO, CampaignDetailDTO } from './campaign.types';
import { NotFoundError } from '../../utils/errors';

export const CampaignService = {
  getPublicCampaigns: async (query: ListCampaignsQuery): Promise<CampaignListDTO[]> => {
    return CampaignRepository.findPublicCampaigns(query);
  },

  getPublicCampaignById: async (id: string): Promise<CampaignDetailDTO> => {
    const campaign = await CampaignRepository.findPublicCampaignById(id);
    if (!campaign) {
      throw new NotFoundError(`Campaign "${id}" not found or not publicly available.`);
    }
    return campaign;
  },

  createDraft: async (input: CreateDraftInput, actorUserId: string) => {
    return CampaignRepository.createDraft(input, actorUserId);
  },

  updateBasics: async (id: string, input: UpdateBasicsInput, actorUserId: string) => {
    return CampaignRepository.updateBasics(id, input, actorUserId);
  },

  updateStory: async (id: string, input: UpdateStoryInput, actorUserId: string) => {
    return CampaignRepository.updateStory(id, input, actorUserId);
  },

  updateVisuals: async (id: string, input: UpdateVisualsInput, actorUserId: string) => {
    return CampaignRepository.updateVisuals(id, input, actorUserId);
  },

  updateReach: async (id: string, input: UpdateReachInput, actorUserId: string) => {
    return CampaignRepository.updateReach(id, input, actorUserId);
  },

  submitCampaign: async (id: string, input: SubmitCampaignInput, actorUserId: string) => {
    return CampaignRepository.submitCampaign(id, input, actorUserId);
  },

  endFunding: async (id: string, actorUserId: string, note?: string) => {
    return CampaignRepository.endFunding(id, actorUserId, note);
  },

  prepareDistribution: async (id: string, actorUserId: string, note?: string) => {
    return CampaignRepository.prepareDistribution(id, actorUserId, note);
  },

  startPromotion: async (id: string, actorUserId: string, note?: string) => {
    return CampaignRepository.startPromotion(id, actorUserId, note);
  },

  completeCampaign: async (id: string, actorUserId: string, note?: string) => {
    return CampaignRepository.completeCampaign(id, actorUserId, note);
  },

  failPromotion: async (id: string, reason: string, actorUserId: string) => {
    return CampaignRepository.failPromotion(id, reason, actorUserId);
  },
};

