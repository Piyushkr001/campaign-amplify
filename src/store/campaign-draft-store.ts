import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CampaignDraft, CampaignSource } from '@/types/campaign';
import { generateId } from '@/utils/id';

export const INITIAL_CAMPAIGN_DRAFT: CampaignDraft = {
  currentStep: 1,
  title: '',
  category: 'Environment',
  creatorName: '',
  summary: '',
  coverImage: undefined,

  storyHeadline: '',
  storyIntro: '',
  storyContent: '',
  sources: [],
  storyImage: undefined,
  storyImageCaption: undefined,
  storyImageCredit: undefined,
  suggestedAction: '',

  adImage: undefined,
  adHeadline: '',
  adDescription: '',
  adCTA: 'Learn More',

  locations: ['India', 'Delhi NCR'],
  interests: ['Environment', 'Sustainability'],
  channels: ['Meta', 'Google Display'],
  audienceDescription: 'Civic-minded community members, educators, and public stakeholders',
  durationDays: 14,

  fundingGoal: undefined,
  lastSavedAt: undefined,
};

export interface CampaignDraftStore {
  draft: CampaignDraft;
  hasHydrated: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;

  // Actions
  updateField: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void;
  updateFields: (fields: Partial<CampaignDraft>) => void;
  setCurrentStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  addSource: (source: Omit<CampaignSource, 'id'> & { id?: string }) => void;
  updateSource: (id: string, updated: Partial<CampaignSource>) => void;
  removeSource: (id: string) => void;
  saveAsDraft: () => void;
  saveDraft: (data?: Partial<CampaignDraft>) => void;
  resetDraft: () => void;
  setHasHydrated: (status: boolean) => void;
  hasDraft: () => boolean;

  // Backward compatibility getters for screens
  title: string;
  category: string;
  creatorName: string;
  summary: string;
  currentStep: number;
}

export const useCampaignDraftStore = create<CampaignDraftStore>()(
  persist(
    (set, get) => ({
      draft: { ...INITIAL_CAMPAIGN_DRAFT },
      hasHydrated: false,
      isSaving: false,
      lastSavedAt: null,

      // Top-level aliases for fast access & backwards compatibility
      get title() {
        return get().draft.title;
      },
      get category() {
        return get().draft.category;
      },
      get creatorName() {
        return get().draft.creatorName;
      },
      get summary() {
        return get().draft.summary;
      },
      get currentStep() {
        return get().draft.currentStep;
      },

      updateField: (key, value) => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            [key]: value,
            lastSavedAt: now,
          },
          lastSavedAt: now,
        }));
      },

      updateFields: (fields) => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            ...fields,
            lastSavedAt: now,
          },
          lastSavedAt: now,
        }));
      },

      setCurrentStep: (step) => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            currentStep: step,
            lastSavedAt: now,
          },
          lastSavedAt: now,
        }));
      },

      addSource: (source) => {
        const newSource: CampaignSource = {
          id: source.id || generateId('src'),
          title: source.title,
          url: source.url,
          publisher: source.publisher,
        };
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            sources: [...state.draft.sources, newSource],
            lastSavedAt: now,
          },
          lastSavedAt: now,
        }));
      },

      updateSource: (id, updated) => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            sources: state.draft.sources.map((s) => (s.id === id ? { ...s, ...updated } : s)),
            lastSavedAt: now,
          },
          lastSavedAt: now,
        }));
      },

      removeSource: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            sources: state.draft.sources.filter((s) => s.id !== id),
            lastSavedAt: now,
          },
          lastSavedAt: now,
        }));
      },

      saveAsDraft: () => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            lastSavedAt: now,
          },
          lastSavedAt: now,
          isSaving: false,
        }));
      },

      saveDraft: (data?: Partial<CampaignDraft>) => {
        const now = new Date().toISOString();
        if (data) {
          set((state) => ({
            draft: {
              ...state.draft,
              ...data,
              lastSavedAt: now,
            },
            lastSavedAt: now,
            isSaving: false,
          }));
        } else {
          get().saveAsDraft();
        }
      },

      resetDraft: () => {
        set({
          draft: { ...INITIAL_CAMPAIGN_DRAFT },
          lastSavedAt: null,
          isSaving: false,
        });
      },

      setHasHydrated: (status) => {
        set({ hasHydrated: status });
      },

      hasDraft: () => {
        const { draft } = get();
        return (
          draft.title.trim().length > 0 ||
          draft.summary.trim().length > 0 ||
          draft.storyContent.trim().length > 0
        );
      },
    }),
    {
      name: 'campaign-amplify-draft',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        draft: state.draft,
        lastSavedAt: state.lastSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
