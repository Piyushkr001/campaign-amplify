import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Campaign, CampaignDraft, CampaignSource, CampaignSyncStatus } from '@/types/campaign';
import { generateId } from '@/utils/id';

export const INITIAL_CAMPAIGN_DRAFT: CampaignDraft = {
  id: undefined,
  mode: 'NEW',
  syncStatus: 'LOCAL_ONLY',
  lastSyncError: undefined,
  lastSyncedAt: undefined,
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
  lastSavedAt: string | null;

  // Actions
  updateField: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void;
  updateFields: (fields: Partial<CampaignDraft>) => void;
  setCurrentStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  setDraftServerId: (id: string) => void;
  setSyncStatus: (status: CampaignSyncStatus, error?: string) => void;
  addSource: (source: Omit<CampaignSource, 'id'> & { id?: string }) => void;
  updateSource: (id: string, updated: Partial<CampaignSource>) => void;
  removeSource: (id: string) => void;
  saveAsDraft: () => void;
  saveDraft: (data?: Partial<CampaignDraft>) => void;
  loadCampaignIntoDraft: (campaign: Campaign, step?: 1 | 2 | 3 | 4 | 5) => void;
  resetDraft: () => void;
  setHasHydrated: (status: boolean) => void;
  hasDraft: () => boolean;
  hasMeaningfulDraft: () => boolean;
  isRevision: () => boolean;

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

      setDraftServerId: (id: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            id,
            syncStatus: 'SYNCED',
            lastSyncError: undefined,
            lastSyncedAt: now,
          },
          lastSavedAt: now,
        }));
      },

      setSyncStatus: (status: CampaignSyncStatus, error?: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          draft: {
            ...state.draft,
            syncStatus: status,
            lastSyncError: error,
            lastSyncedAt: status === 'SYNCED' ? now : state.draft.lastSyncedAt,
          },
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
          }));
        } else {
          get().saveAsDraft();
        }
      },

      /**
       * Centralized action to populate the active draft with an existing campaign's data for revision.
       * Sets `draft.id = campaign.id`, `draft.mode = 'REVISION'`, and `draft.syncStatus = 'SYNCED'`.
       */
      loadCampaignIntoDraft: (campaign: Campaign, step: 1 | 2 | 3 | 4 | 5 = 2) => {
        const now = new Date().toISOString();
        const sources: CampaignSource[] = (campaign.supportingSources || []).map((s, idx) => ({
          id: `src-${idx}-${generateId('item')}`,
          title: s.title,
          url: s.url,
          publisher: s.publisher,
        }));

        set({
          draft: {
            id: campaign.id,
            mode: 'REVISION',
            syncStatus: 'SYNCED',
            lastSyncError: undefined,
            lastSyncedAt: now,
            currentStep: step,
            title: campaign.title,
            category: campaign.category,
            creatorName: campaign.creator,
            summary: campaign.summary,
            coverImage: campaign.coverImage,

            storyHeadline: campaign.storyHeadline || campaign.storyDetails?.headline || '',
            storyIntro: campaign.storyIntro || campaign.storyDetails?.intro || '',
            storyContent: campaign.storyContent || campaign.storyDetails?.content || campaign.story || '',
            sources,
            storyImage: campaign.storyImage || campaign.storyDetails?.image,
            storyImageCaption: campaign.storyImageCaption || campaign.storyDetails?.caption,
            storyImageCredit: campaign.storyImageCredit || campaign.storyDetails?.credit,
            suggestedAction: campaign.suggestedAction || '',

            adImage: campaign.adImage || campaign.coverImage,
            adHeadline: campaign.adHeadline || campaign.title,
            adDescription: campaign.adDescription || campaign.summary,
            adCTA: campaign.adCTA || 'Learn More',

            locations: campaign.locations || ['India', 'Delhi NCR'],
            interests: campaign.interests || ['Environment', 'Sustainability'],
            channels: campaign.distributionChannels || campaign.channels || ['Meta', 'Google Display'],
            audienceDescription: campaign.audienceDescription || '',
            durationDays: campaign.durationDays || 14,
            fundingGoal: campaign.goal,
            lastSavedAt: now,
          },
          lastSavedAt: now,
        });
      },

      resetDraft: () => {
        set({
          draft: { ...INITIAL_CAMPAIGN_DRAFT },
          lastSavedAt: null,
        });
      },

      setHasHydrated: (status) => {
        set({ hasHydrated: status });
      },

      hasDraft: () => {
        return get().hasMeaningfulDraft();
      },

      hasMeaningfulDraft: () => {
        const { draft } = get();
        return (
          draft.mode === 'REVISION' ||
          draft.title.trim().length > 0 ||
          draft.summary.trim().length > 0 ||
          draft.storyContent.trim().length > 0 ||
          Boolean(draft.coverImage) ||
          draft.currentStep > 1
        );
      },

      isRevision: () => {
        return get().draft.mode === 'REVISION';
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
