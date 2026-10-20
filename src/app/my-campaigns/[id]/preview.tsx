import React from 'react';
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
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CampaignStatusBadge } from '@/components/campaign/CampaignStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/auth-store';
import { Config } from '@/constants/config';
import { useCreatorCampaign } from '@/hooks/useCampaigns';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import {
  calculateFundingProgress,
  formatCurrency,
  formatReachRange,
} from '@/utils/formatters';

export default function CreatorCampaignPreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const isAuthorized = !Config.useApi || (isAuthenticated && !user?.isGuest);

  const { data: campaign, isLoading } = useCreatorCampaign(id || '');
  const { loadCampaignIntoDraft } = useCampaignDraftStore();

  if (!isAuthorized) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Palette.navy950} />
          </Pressable>
        </View>
        <EmptyState
          iconName="lock-closed-outline"
          title="Sign In Required"
          description="Sign in to preview your campaign details and review comments."
          actionTitle="Sign In"
          onAction={() => router.push('/auth/login')}
        />
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Palette.navy950} />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading campaign preview...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!campaign) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Palette.navy950} />
          </Pressable>
        </View>
        <View style={styles.notFoundContainer}>
          <Ionicons name="eye-off-outline" size={48} color={Palette.neutral400} />
          <Text style={styles.notFoundTitle}>Preview Not Available</Text>
          <Text style={styles.notFoundDesc}>
            Could not find a creator campaign matching this identifier.
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

  const { percentage, clampedPercentage } = calculateFundingProgress(
    campaign.raised,
    campaign.goal
  );

  const handleOpenSourceUrl = async (url?: string) => {
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      Alert.alert('Invalid Link', 'This supporting source does not provide a valid web address.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(url.trim());
      if (canOpen) {
        await Linking.openURL(url.trim());
      } else {
        Alert.alert('Unable to Open Link', 'Your device cannot open this web link.');
      }
    } catch {
      Alert.alert('Link Error', 'An error occurred while attempting to open this web link.');
    }
  };

  const handleEdit = () => {
    loadCampaignIntoDraft(campaign, 2);
    router.push('/create-campaign/story');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal={false} backgroundColor={Palette.warmWhite}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.navCircleBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <View style={styles.previewTag}>
          <Ionicons name="eye-outline" size={14} color={Palette.amber900} />
          <Text style={styles.previewTagText}>CREATOR PREVIEW</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      {/* Prominent Private Preview Banner */}
      <View style={styles.previewNoticeBanner}>
        <View style={styles.bannerHeader}>
          <Ionicons name="lock-closed" size={18} color={Palette.amber800} />
          <Text style={styles.bannerTitle}>PREVIEW MODE — NOT PUBLIC</Text>
        </View>
        <Text style={styles.bannerText}>
          This campaign is currently in editorial review or draft state and is not visible to the
          public. This preview shows how the campaign will appear to backers once approved.
        </Text>
        <View style={styles.statusWrap}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <CampaignStatusBadge status={campaign.status} size="sm" />
        </View>
      </View>

      {/* Cover Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: campaign.coverImage }}
          style={styles.coverImage}
          contentFit="cover"
          transition={250}
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{campaign.category}</Text>
        </View>
      </View>

      {/* Body Content */}
      <View style={styles.body}>
        <Text style={styles.title}>{campaign.title}</Text>

        <View style={styles.creatorCard}>
          <Ionicons name="person-circle-outline" size={22} color={Palette.primary700} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{campaign.creator}</Text>
            <Text style={styles.creatorType}>{campaign.creatorType} • Campaign Creator</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{campaign.summary}</Text>
        </View>

        {/* Funding & Reach Dashboard */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsHeader}>
            <View>
              <Text style={styles.raisedAmount}>{formatCurrency(campaign.raised)}</Text>
              <Text style={styles.raisedSub}>funded of {formatCurrency(campaign.goal)} target</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressPercentText}>{percentage}%</Text>
            </View>
          </View>

          <ProgressBar
            progress={clampedPercentage}
            height={8}
            color={Palette.primary600}
            style={styles.progressBar}
          />

          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Backers</Text>
              <Text style={styles.statValue}>{campaign.backerCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Days Target</Text>
              <Text style={styles.statValue}>{campaign.durationDays || 14}d</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Est. Impressions</Text>
              <Text style={styles.statValue}>
                {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)}
              </Text>
            </View>
          </View>
        </View>

        {/* Story Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>The Campaign Message</Text>
          {campaign.storyHeadline ? (
            <Text style={styles.storyHeadline}>{campaign.storyHeadline}</Text>
          ) : null}
          {campaign.storyIntro ? (
            <Text style={styles.storyIntro}>{campaign.storyIntro}</Text>
          ) : null}
          <Text style={styles.storyBody}>
            {campaign.storyContent || campaign.story}
          </Text>

          {campaign.storyImage && (
            <View style={styles.storyImageContainer}>
              <Image
                source={{ uri: campaign.storyImage }}
                style={styles.storyImage}
                contentFit="cover"
              />
              {campaign.storyImageCaption ? (
                <Text style={styles.imageCaption}>{campaign.storyImageCaption}</Text>
              ) : null}
              {campaign.storyImageCredit ? (
                <Text style={styles.imageCredit}>Source: {campaign.storyImageCredit}</Text>
              ) : null}
            </View>
          )}

          {campaign.suggestedAction ? (
            <View style={styles.calloutBox}>
              <Ionicons name="sparkles-outline" size={18} color={Palette.primary700} />
              <View style={styles.calloutTextCol}>
                <Text style={styles.calloutTitle}>Creator's Intended Action</Text>
                <Text style={styles.calloutBody}>{campaign.suggestedAction}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Supporting Sources */}
        {campaign.supportingSources && campaign.supportingSources.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sourcesHeaderRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Palette.primary700} />
              <Text style={styles.sectionHeading}>Supporting Sources & Citations</Text>
            </View>
            <Text style={styles.sourcesSubtext}>
              All campaigns must cite verifiable evidence for their core claims before approval.
            </Text>

            {campaign.supportingSources.map((source, index) => (
              <Pressable
                key={`${source.url}-${index}`}
                onPress={() => handleOpenSourceUrl(source.url)}
                style={styles.sourceItem}>
                <Ionicons name="link-outline" size={16} color={Palette.primary700} />
                <View style={styles.sourceTextCol}>
                  <Text style={styles.sourceTitle}>{source.title}</Text>
                  {source.publisher ? (
                    <Text style={styles.sourcePublisher}>{source.publisher}</Text>
                  ) : null}
                </View>
                <Ionicons name="open-outline" size={14} color={Palette.neutral400} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Ad Creative Preview */}
        {(campaign.adHeadline || campaign.adDescription) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Advertising Creative Preview</Text>
            <Text style={styles.sourcesSubtext}>
              Targeted digital ad units configured for sponsor delivery.
            </Text>

            <View style={styles.adCard}>
              {campaign.adImage ? (
                <Image
                  source={{ uri: campaign.adImage }}
                  style={styles.adCardImage}
                  contentFit="cover"
                />
              ) : null}
              <View style={styles.adContent}>
                <Text style={styles.adHeadline}>{campaign.adHeadline || campaign.title}</Text>
                <Text style={styles.adDescription}>
                  {campaign.adDescription || campaign.summary}
                </Text>
                <View style={styles.adCTAButton}>
                  <Text style={styles.adCTAText}>{campaign.adCTA || 'Learn More'}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Reach & Channels */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Audience Targeting & Channels</Text>
          <View style={styles.tagGrid}>
            {(campaign.distributionChannels || []).map((ch, idx) => (
              <View key={`${ch}-${idx}`} style={styles.tag}>
                <Ionicons name="megaphone-outline" size={12} color={Palette.primary700} />
                <Text style={styles.tagText}>{ch}</Text>
              </View>
            ))}
            {(campaign.interests || []).map((interest, idx) => (
              <View key={`${interest}-${idx}`} style={styles.tagNeutral}>
                <Text style={styles.tagNeutralText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {campaign.status === 'CHANGES_REQUESTED' && (
            <AppButton
              title="Edit Requested Changes"
              onPress={handleEdit}
              variant="primary"
              size="lg"
              fullWidth
              icon={<Ionicons name="create-outline" size={18} color={Palette.pureWhite} />}
            />
          )}
          <AppButton
            title="Return to Campaign Status"
            onPress={() => router.back()}
            variant="outline"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  navCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.amber100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  previewTagText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.amber950,
  },
  spacer: {
    width: 36,
  },
  previewNoticeBanner: {
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.amber950,
    fontSize: 12,
  },
  bannerText: {
    ...Typography.caption,
    color: Palette.amber900,
    fontSize: 11,
    lineHeight: 16,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Palette.amber200,
  },
  statusLabel: {
    ...Typography.caption,
    color: Palette.amber900,
    fontSize: 11,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: Palette.neutral100,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(10, 15, 29, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontWeight: '600',
    fontSize: 11,
  },
  body: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.navy950,
    lineHeight: 28,
    marginBottom: Spacing.xs,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  creatorType: {
    ...Typography.caption,
    color: Palette.neutral500,
    fontSize: 11,
  },
  summaryCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryText: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    lineHeight: 20,
  },
  metricsCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  raisedAmount: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.primary700,
  },
  raisedSub: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  progressBadge: {
    backgroundColor: Palette.primary50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  progressPercentText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.primary700,
  },
  progressBar: {
    marginVertical: Spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Palette.neutral200,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
    textTransform: 'uppercase',
  },
  statValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy900,
    marginTop: 2,
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
    marginBottom: Spacing.xs,
  },
  storyHeadline: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 4,
  },
  storyIntro: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  storyBody: {
    ...Typography.bodySmall,
    color: Palette.neutral700,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  storyImageContainer: {
    marginVertical: Spacing.sm,
  },
  storyImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
  imageCaption: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 4,
  },
  imageCredit: {
    ...Typography.caption,
    color: Palette.neutral400,
    fontSize: 10,
  },
  calloutBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Palette.primary50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  calloutTextCol: {
    flex: 1,
  },
  calloutTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.primary900,
    marginBottom: 2,
  },
  calloutBody: {
    ...Typography.caption,
    color: Palette.primary800,
    lineHeight: 16,
  },
  sourcesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sourcesSubtext: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: Spacing.sm,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  sourceTextCol: {
    flex: 1,
  },
  sourceTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.navy900,
  },
  sourcePublisher: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
  },
  adCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    overflow: 'hidden',
  },
  adCardImage: {
    width: '100%',
    height: 140,
  },
  adContent: {
    padding: Spacing.sm,
  },
  adHeadline: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 2,
  },
  adDescription: {
    ...Typography.caption,
    color: Palette.neutral600,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  adCTAButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary600,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  adCTAText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontWeight: '700',
    fontSize: 11,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primary50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  tagText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.primary800,
  },
  tagNeutral: {
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  tagNeutralText: {
    ...Typography.caption,
    color: Palette.neutral700,
  },
  bottomActions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  navBar: {
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
  },
  notFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
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
});
