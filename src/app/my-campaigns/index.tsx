import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppButton } from '@/components/ui/AppButton';
import { CreatorCampaignCard } from '@/components/campaign/CreatorCampaignCard';
import { DraftCampaignCard } from '@/components/campaign/DraftCampaignCard';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { useCreatorCampaigns } from '@/hooks/useCampaigns';
import { Config } from '@/constants/config';
import {
  CREATOR_DASHBOARD_TABS,
  CREATOR_TAB_STATUS_MAPPING,
  CreatorDashboardTab,
} from '@/constants/campaign-status';
import { Campaign } from '@/types/campaign';
import { getEffectiveCampaign } from '@/utils/effective-campaign';
import { useAuthStore } from '@/store/auth-store';

export default function MyCampaignsScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isAuthorized = !Config.useApi || (isAuthenticated && !user?.isGuest);

  const { campaigns: localCampaigns, hasHydrated } = useMyCampaignsStore();
  const { draft, hasMeaningfulDraft, resetDraft } = useCampaignDraftStore();
  const [selectedTab, setSelectedTab] = useState<CreatorDashboardTab>('ALL');

  // Query backend in API mode; fall back to local Zustand store in local mode
  const {
    data: apiCampaigns,
    isLoading: isApiLoading,
    isError,
    refetch,
  } = useCreatorCampaigns();

  if (!isAuthorized) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
          <Text style={styles.navTitle}>Creator Studio</Text>
          <View style={{ width: 36 }} />
        </View>
        <EmptyState
          iconName="lock-closed-outline"
          title="Sign In Required"
          description="Sign in to view your created campaigns, manage submissions, and review verification feedback."
          actionTitle="Sign In"
          onAction={() => router.push('/auth/login')}
        />
      </ScreenContainer>
    );
  }

  const activeCampaigns = Config.useApi && apiCampaigns ? apiCampaigns : localCampaigns;
  const isLoading = Config.useApi ? isApiLoading && !apiCampaigns : !hasHydrated;

  // Compute authoritative effective campaign state including live funding adjustments
  const effectiveCampaigns = activeCampaigns.map(getEffectiveCampaign);

  const showActiveDraft =
    (selectedTab === 'ALL' || selectedTab === 'DRAFTS') && hasMeaningfulDraft();

  // Filter campaigns by selected tab
  const activeStatusFilter = CREATOR_TAB_STATUS_MAPPING[selectedTab];
  let filteredCampaigns = effectiveCampaigns.filter((c) => {
    if (!activeStatusFilter) return true;
    return activeStatusFilter.includes(c.status);
  });

  // Requirement #5: REMOVE DUPLICATE DRAFT CARD
  // Prefer DraftCampaignCard for the active local working draft. Filter the matching backend DRAFT from the normal list.
  if (showActiveDraft && draft.id) {
    filteredCampaigns = filteredCampaigns.filter((c) => c.id !== draft.id);
  }

  // Calculate count for each tab without duplicate counting
  const getTabCount = (tab: CreatorDashboardTab) => {
    const statuses = CREATOR_TAB_STATUS_MAPPING[tab];
    let baseList = effectiveCampaigns;
    if (statuses) {
      baseList = baseList.filter((c) => statuses.includes(c.status));
    }
    const hasActiveLocalDraftForTab =
      (tab === 'ALL' || tab === 'DRAFTS') && hasMeaningfulDraft();

    if (hasActiveLocalDraftForTab) {
      const duplicateCount = draft.id ? baseList.filter((c) => c.id === draft.id).length : 0;
      return baseList.length - duplicateCount + 1;
    }
    return baseList.length;
  };

  const handleCardPress = (campaign: Campaign) => {
    if (campaign.status === 'DRAFT') {
      // Requirement #3: Server DRAFT -> Continue Editing -> load backend campaign into CampaignDraft store -> mode = NEW -> id = same server UUID
      useCampaignDraftStore.getState().loadCampaignIntoDraft(campaign);
      const step = campaign.draftStep || 1;
      const stepRoute =
        step === 2
          ? '/create-campaign/story'
          : step === 3
          ? '/create-campaign/visuals'
          : step === 4
          ? '/create-campaign/reach'
          : step === 5
          ? '/create-campaign/submit'
          : '/create-campaign/basics';
      router.push(stepRoute as any);
    } else {
      router.push(`/my-campaigns/${campaign.id}`);
    }
  };

  const getEmptyStateConfig = () => {
    switch (selectedTab) {
      case 'UNDER_REVIEW':
        return {
          title: 'No campaigns under review',
          description: 'Campaigns submitted for editorial and source verification will appear here.',
        };
      case 'REQUIRES_ACTION':
        return {
          title: 'No actions required',
          description: 'Campaigns requiring adjustments, citations, or creator revisions will appear here.',
        };
      case 'DRAFTS':
        return {
          title: 'No drafts in progress',
          description: 'Start building a campaign message to distribute across digital channels.',
          actionTitle: 'Create New Campaign',
          onAction: () => router.push('/create-campaign/basics'),
        };
      case 'FUNDING':
        return {
          title: 'No funding campaigns yet',
          description: 'Once reviewed and approved, campaigns open for community backing will show here.',
        };
      case 'PROMOTING':
        return {
          title: 'No active promotions',
          description: 'Campaigns that reach their funding milestone and are actively running ads will appear here.',
        };
      case 'COMPLETED':
        return {
          title: 'No completed campaigns',
          description: 'Concluded campaigns with prototype distribution impression reports will appear here.',
        };
      case 'ALL':
      default:
        return {
          title: 'No campaigns found',
          description: 'You have not submitted any amplification campaigns yet. Create your first campaign to get started.',
          actionTitle: 'Create Campaign',
          onAction: () => router.push('/create-campaign/basics'),
        };
    }
  };

  return (
    <ScreenContainer scrollable={false} paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.navTitle}>Creator Dashboard</Text>
        <Pressable
          onPress={() => router.push('/create-campaign/basics')}
          accessibilityRole="button"
          accessibilityLabel="Create campaign"
          hitSlop={8}
          style={styles.createIconBtn}>
          <Ionicons name="add" size={22} color={Palette.primary700} />
        </Pressable>
      </View>

      {/* Header Titles */}
      <View style={styles.headerTitles}>
        <Text style={styles.pageTitle}>My Campaigns</Text>
        <Text style={styles.pageSubtitle}>
          Manage your drafts, review status, funding progress, and distribution.
        </Text>
      </View>

      {/* Horizontal Tabs Filter */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}>
          {CREATOR_DASHBOARD_TABS.map((tab) => {
            const count = getTabCount(tab.key);
            const isSelected = selectedTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setSelectedTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                style={[styles.tabBtn, isSelected && styles.tabBtnSelected]}>
                <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextSelected]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabCountBadge, isSelected && styles.tabCountBadgeSelected]}>
                    <Text
                      style={[
                        styles.tabCountBadgeText,
                        isSelected && styles.tabCountBadgeTextSelected,
                      ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Campaigns List or Loading/Error/Empty State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary700} />
          <Text style={styles.loadingText}>Loading your campaigns...</Text>
        </View>
      ) : Config.useApi && isError && !apiCampaigns ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            iconName="cloud-offline-outline"
            title="Unable to load campaigns"
            description="Could not connect to the campaign service to retrieve your dashboard records."
            actionTitle="Retry"
            onAction={() => refetch()}
          />
        </View>
      ) : filteredCampaigns.length === 0 && !showActiveDraft ? (
        <View style={styles.emptyWrapper}>
          {(() => {
            const emptyConfig = getEmptyStateConfig();
            return (
              <EmptyState
                iconName="folder-open-outline"
                title={emptyConfig.title}
                description={emptyConfig.description}
                actionTitle={emptyConfig.actionTitle}
                onAction={emptyConfig.onAction}
              />
            );
          })()}
        </View>
      ) : (
        <FlatList
          data={filteredCampaigns}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={Config.useApi && isApiLoading}
          onRefresh={Config.useApi ? () => refetch() : undefined}
          ListHeaderComponent={
            showActiveDraft ? (
              <DraftCampaignCard draft={draft} onDiscard={resetDraft} />
            ) : undefined
          }
          renderItem={({ item }) => (
            <CreatorCampaignCard
              campaign={item}
              onPress={() => handleCardPress(item)}
              onPrimaryAction={() => handleCardPress(item)}
            />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  createIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.primary50,
    borderWidth: 1,
    borderColor: Palette.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pageTitle: {
    ...Typography.h1,
    color: Palette.navy950,
  },
  pageSubtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginTop: 2,
  },
  tabsWrapper: {
    marginBottom: Spacing.sm,
  },
  tabsScrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  tabBtnSelected: {
    backgroundColor: Palette.navy950,
  },
  tabBtnText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.neutral600,
  },
  tabBtnTextSelected: {
    color: Palette.pureWhite,
    fontWeight: '700',
  },
  tabCountBadge: {
    backgroundColor: Palette.neutral200,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountBadgeSelected: {
    backgroundColor: Palette.primary600,
  },
  tabCountBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.navy900,
  },
  tabCountBadgeTextSelected: {
    color: Palette.pureWhite,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
  },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  listContent: {
    paddingBottom: Spacing.xxl * 2,
    paddingTop: Spacing.xs,
  },
});
