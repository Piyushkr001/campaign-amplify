import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CampaignStatusBadge } from '@/components/campaign/CampaignStatusBadge';
import { CampaignStatusTimeline } from '@/components/campaign/CampaignStatusTimeline';
import { ReviewFeedbackCard } from '@/components/campaign/ReviewFeedbackCard';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { useAuthStore } from '@/store/auth-store';
import { useCreatorCampaign } from '@/hooks/useCampaigns';
import { Config } from '@/constants/config';
import {
  calculateFundingProgress,
  formatCurrency,
  formatReachRange,
} from '@/utils/formatters';
import { getEffectiveCampaign } from '@/utils/effective-campaign';
import { isPublicCampaign } from '@/constants/campaign-status';
import { ActivityIndicator } from 'react-native';

export default function MyCampaignDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const isAuthorized = !Config.useApi || (isAuthenticated && !user?.isGuest);

  const { getCampaignById } = useMyCampaignsStore();
  const { loadCampaignIntoDraft } = useCampaignDraftStore();
  const { data: apiCampaign, isLoading: isApiLoading } = useCreatorCampaign(id || '');

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
        </View>
        <EmptyState
          iconName="lock-closed-outline"
          title="Sign In Required"
          description="Sign in to view campaign details, review status, and management controls."
          actionTitle="Sign In"
          onAction={() => router.push('/auth/login')}
        />
      </ScreenContainer>
    );
  }

  const localCampaign = id ? getCampaignById(id) : undefined;
  const rawCampaign = Config.useApi ? apiCampaign || localCampaign : localCampaign;
  const campaign = rawCampaign ? getEffectiveCampaign(rawCampaign) : undefined;

  if (Config.useApi && isApiLoading && !campaign) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
        </View>
        <View style={styles.notFoundContainer}>
          <ActivityIndicator size="large" color={Palette.primary700} />
          <Text style={[styles.notFoundTitle, { marginTop: Spacing.md }]}>Loading Campaign...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!campaign) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="folder-outline" size={48} color={Palette.neutral400} />
          <Text style={styles.notFoundTitle}>Campaign Not Found</Text>
          <Text style={styles.notFoundDesc}>
            We could not find this campaign in your local creator records.
          </Text>
          <AppButton
            title="Return to Dashboard"
            onPress={() => router.replace('/my-campaigns')}
            variant="primary"
            size="md"
          />
        </View>
      </ScreenContainer>
    );
  }

  const { clampedPercentage } = calculateFundingProgress(campaign.raised, campaign.goal);
  const isChangesRequested = campaign.status === 'CHANGES_REQUESTED';
  const isUnderReview =
    campaign.status === 'SUBMITTED_FOR_REVIEW' || campaign.status === 'UNDER_REVIEW';

  const handleEditForChanges = () => {
    // Populate campaign draft with existing campaign ID and data so creator can edit
    loadCampaignIntoDraft(campaign, 2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/create-campaign/story');
  };

  const handleOpenSource = async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) Linking.openURL(url);
    } catch {
      // Ignore
    }
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Top Nav */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.navTitle}>Campaign Status</Text>
        <Pressable
          onPress={() => {
            if (isPublicCampaign(campaign)) {
              router.push(`/campaign/${campaign.id}`);
            } else {
              router.push(`/my-campaigns/${campaign.id}/preview`);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Preview campaign presentation"
          style={styles.previewBtn}>
          <Ionicons name="eye-outline" size={18} color={Palette.navy900} />
        </Pressable>
      </View>

      {/* Cover Image & Status Badge */}
      <View style={styles.coverWrapper}>
        <Image source={{ uri: campaign.coverImage }} style={styles.coverImage} contentFit="cover" />
        <View style={styles.statusBadgeWrap}>
          <CampaignStatusBadge status={campaign.status} size="md" />
        </View>
      </View>

      {/* Title & Metadata */}
      <View style={styles.headerBlock}>
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.creatorSubtitle}>
          By {campaign.creator} • {campaign.category}
        </Text>
      </View>

      {/* Action Required Callout Card */}
      {isChangesRequested && (
        <ReviewFeedbackCard
          feedback={
            campaign.reviewFeedback ||
            'Please update supporting sources and revise ad copy to meet platform editorial standards.'
          }
          requestedAt={campaign.requestedChangesAt}
          onEditCampaign={handleEditForChanges}
          onViewCampaign={() => {
            if (isPublicCampaign(campaign)) {
              router.push(`/campaign/${campaign.id}`);
            } else {
              router.push(`/my-campaigns/${campaign.id}/preview`);
            }
          }}
        />
      )}



      {/* Status Timeline */}
      <CampaignStatusTimeline
        currentStatus={campaign.status}
        statusHistory={campaign.statusHistory}
        reviewFeedback={campaign.reviewFeedback}
        rejectionReason={campaign.rejectionReason}
      />

      {/* Key Metrics Summary Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Campaign Metrics</Text>

        <View style={styles.metricGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Funding Goal</Text>
            <Text style={styles.metricVal}>{formatCurrency(campaign.goal)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Raised</Text>
            <Text style={styles.metricVal}>{formatCurrency(campaign.raised)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Backers</Text>
            <Text style={styles.metricVal}>{campaign.backerCount}</Text>
          </View>
        </View>

        {campaign.raised > 0 && (
          <View style={styles.progressWrap}>
            <ProgressBar
              progress={clampedPercentage}
              height={6}
              color={Palette.primary600}
            />
          </View>
        )}

        <View style={styles.reachEstimateBox}>
          <Ionicons name="megaphone-outline" size={16} color={Palette.primary700} />
          <Text style={styles.reachEstimateText}>
            Estimated Impressions:{' '}
            <Text style={styles.reachBold}>
              {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)}
            </Text>
          </Text>
        </View>
      </View>

      {/* Target Distribution Channels */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Distribution Channels</Text>
        <View style={styles.channelPillsRow}>
          {campaign.distributionChannels.map((ch, idx) => (
            <View key={idx} style={styles.channelPill}>
              <Ionicons name="radio-outline" size={12} color={Palette.navy800} />
              <Text style={styles.channelPillText}>{ch}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Supporting Sources */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Supporting Sources ({campaign.supportingSources.length})</Text>
        {campaign.supportingSources.length === 0 ? (
          <Text style={styles.noSourcesText}>No supporting sources attached.</Text>
        ) : (
          campaign.supportingSources.map((src, idx) => (
            <Pressable
              key={idx}
              onPress={() => handleOpenSource(src.url)}
              accessibilityRole="button"
              accessibilityLabel={`Source: ${src.title}`}
              style={({ pressed }) => [styles.sourceRow, pressed && styles.sourceRowPressed]}>
              <Ionicons name="document-text-outline" size={16} color={Palette.primary700} />
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceTitle}>{src.title}</Text>
                {src.publisher ? (
                  <Text style={styles.sourcePublisher}>Published by {src.publisher}</Text>
                ) : null}
              </View>
              <Ionicons name="open-outline" size={14} color={Palette.neutral400} />
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
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
  previewBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverWrapper: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.md,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  statusBadgeWrap: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  headerBlock: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.navy950,
    lineHeight: 26,
  },
  creatorSubtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginTop: 4,
  },
  resubmitCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  resubmitTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 4,
  },
  resubmitDesc: {
    ...Typography.caption,
    color: Palette.neutral600,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    color: Palette.neutral400,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metricVal: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy900,
    marginTop: 2,
  },
  progressWrap: {
    marginTop: Spacing.sm,
  },
  reachEstimateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary50,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: 8,
    marginTop: Spacing.sm,
  },
  reachEstimateText: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.navy900,
  },
  reachBold: {
    fontWeight: '700',
    color: Palette.primary700,
  },
  channelPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  channelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  channelPillText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy900,
  },
  noSourcesText: {
    ...Typography.caption,
    color: Palette.neutral400,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  sourceRowPressed: {
    opacity: 0.7,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  sourcePublisher: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral500,
  },
  notFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.sm,
  },
  notFoundTitle: {
    ...Typography.h2,
    color: Palette.navy950,
  },
  notFoundDesc: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
