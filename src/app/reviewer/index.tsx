import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import { ReviewCampaignCard } from '@/components/reviewer/ReviewCampaignCard';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useState } from 'react';

type ReviewQueueTab = 'PENDING' | 'APPROVED' | 'ALL';

export default function ReviewerQueueScreen() {
  const router = useRouter();
  const { campaigns, hasHydrated } = useMyCampaignsStore();
  const [activeTab, setActiveTab] = useState<ReviewQueueTab>('PENDING');

  // Filter campaigns based on tab
  const pendingCampaigns = campaigns.filter(
    (c) => c.status === 'SUBMITTED_FOR_REVIEW' || c.status === 'UNDER_REVIEW'
  );
  const approvedCampaigns = campaigns.filter((c) => c.status === 'APPROVED');
  const allCampaigns = campaigns;

  const currentList =
    activeTab === 'PENDING'
      ? pendingCampaigns
      : activeTab === 'APPROVED'
      ? approvedCampaigns
      : allCampaigns;

  return (
    <ScreenContainer scrollable={false} paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Top Nav Header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.navTitle}>Reviewer Demo</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Demo Warning / Disclaimers Banner */}
      <View style={styles.demoDisclaimerBanner}>
        <Ionicons name="shield-outline" size={16} color={Palette.primary700} />
        <View style={styles.disclaimerTextWrap}>
          <Text style={styles.disclaimerTitle}>Internal Review Prototype</Text>
          <Text style={styles.disclaimerSubtitle}>
            Simulates editorial moderation, source vetting, and approval workflows.
          </Text>
        </View>
      </View>

      {/* Header Titles */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Review Queue</Text>
        <Text style={styles.pageSubtitle}>
          Inspect submitted campaign claims, ad creatives, and citations.
        </Text>
      </View>

      {/* Queue Filter Segment */}
      <View style={styles.segmentContainer}>
        {(
          [
            { key: 'PENDING', label: `Pending (${pendingCampaigns.length})` },
            { key: 'APPROVED', label: `Ready for Launch (${approvedCampaigns.length})` },
            { key: 'ALL', label: `All (${allCampaigns.length})` },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            style={[styles.segmentBtn, activeTab === tab.key && styles.segmentBtnActive]}>
            <Text style={[styles.segmentText, activeTab === tab.key && styles.segmentTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Campaigns Queue List */}
      {!hasHydrated ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Palette.primary700} />
          <Text style={styles.loadingText}>Loading review queue...</Text>
        </View>
      ) : currentList.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            iconName="checkmark-done-circle-outline"
            title="No campaigns waiting for review"
            description={
              activeTab === 'PENDING'
                ? 'All submitted campaigns have been reviewed. When a creator submits a new campaign or revisions, it will appear here.'
                : 'No campaigns match the selected queue filter.'
            }
            actionTitle="Submit a Test Campaign"
            onAction={() => router.push('/create-campaign/basics')}
          />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ReviewCampaignCard
              campaign={item}
              onPressReview={() => router.push(`/reviewer/${item.id}`)}
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
  headerSpacer: {
    width: 36,
  },
  demoDisclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary50,
    borderColor: Palette.primary100,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  disclaimerTextWrap: {
    flex: 1,
  },
  disclaimerTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.primary800,
    fontSize: 11,
  },
  disclaimerSubtitle: {
    ...Typography.caption,
    color: Palette.primary700,
    fontSize: 10,
    marginTop: 1,
  },
  titleSection: {
    marginBottom: Spacing.sm,
  },
  pageTitle: {
    ...Typography.h1,
    fontSize: 22,
    color: Palette.navy950,
  },
  pageSubtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.neutral100,
    borderRadius: BorderRadius.pill,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
  },
  segmentBtnActive: {
    backgroundColor: Palette.pureWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  segmentTextActive: {
    color: Palette.navy950,
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
  },
  listContent: {
    paddingBottom: Spacing.xxl * 2,
    paddingTop: Spacing.xs,
  },
});
