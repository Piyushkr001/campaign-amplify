import { create } from 'zustand';
import { CategoryName } from '@/constants/categories';

export interface CampaignDraftState {
  currentStep: number;
  title: string;
  category: CategoryName;
  creatorName: string;
  summary: string;
  story: string;
  coverImage: string | null;
  targetBudget: number;
  targetAudience: string;

  // Actions
  updateField: <K extends keyof Omit<CampaignDraftState, 'updateField' | 'setCurrentStep' | 'resetDraft'>>(
    key: K,
    value: CampaignDraftState[K]
  ) => void;
  setCurrentStep: (step: number) => void;
  resetDraft: () => void;
}

const initialDraftValues = {
  currentStep: 1,
  title: '',
  category: 'Environment' as CategoryName,
  creatorName: '',
  summary: '',
  story: '',
  coverImage: null,
  targetBudget: 5000,
  targetAudience: 'Educators & community members',
};

export const useCampaignDraftStore = create<CampaignDraftState>((set) => ({
  ...initialDraftValues,

  updateField: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
    })),

  setCurrentStep: (step: number) =>
    set({
      currentStep: step,
    }),

  resetDraft: () =>
    set({
      ...initialDraftValues,
    }),
}));
