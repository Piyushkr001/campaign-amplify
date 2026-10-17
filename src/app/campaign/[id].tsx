import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Layout, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCampaign } from '@/hooks/useCampaigns';
import { canBackCampaign, CAMPAIGN_STATUS_CONFIG } from '@/constants/campaign-status';
import {
  calculateFundingProgress,
  formatCurrency,
  formatDaysRemaining,
  formatReachRange,
} from '@/utils/formatters';

export default function CampaignDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: campaign, isLoading } = useCampaign(id || '');

  const [isFundsExpanded, setIsFundsExpanded] = useState(true);

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} backgroundColor={Palette.warmWhite}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading campaign...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!campaign) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Palette.navy950} />
          </Pressable>
        </View>
        <ErrorState
          title="Campaign Not Found"
          message={`We couldn't locate a campaign matching "${id}". It may have been completed or removed.`}
          onRetry={() => router.replace('/(tabs)/explore')}
          retryText="Return to Explore"
        />
      </ScreenContainer>
    );
  }

  const { percentage, clampedPercentage } = calculateFundingProgress(
    campaign.raised,
    campaign.goal
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Amplify this message: "${campaign.title}" - Join the community campaign distribution!`,
      });
    } catch {
      // Ignore share dismissal
    }
  };

  const handleOpenContribution = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({
      pathname: '/contribution/[campaignId]',
      params: { campaignId: campaign.id },
    });
  };

  const handleOpenSourceUrl = async (url?: string) => {
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      Alert.alert('Invalid Link', 'This supporting source does not provide a valid web address.');
      return;
    }
    try {
      const trimmed = url.trim();
      const canOpen = await Linking.canOpenURL(trimmed);
      if (canOpen) {
        await Linking.openURL(trimmed);
      } else {
        Alert.alert('Unable to Open Link', 'Your device cannot open this web link.');
      }
    } catch (err) {
      console.warn('Failed to open source URL:', err);
      Alert.alert('Link Error', 'An error occurred while attempting to open this web link.');
    }
  };

  return (
    <ScreenContainer
      scrollable
      paddingHorizontal={false}
      backgroundColor={Palette.warmWhite}>
      {/* Sticky Header Nav */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
          hitSlop={8}
          style={({ pressed }) => [styles.navCircleBtn, pressed && styles.btnPressed]}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>

        <Pressable
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share campaign"
          hitSlop={8}
          style={({ pressed }) => [styles.navCircleBtn, pressed && styles.btnPressed]}>
          <Ionicons name="share-outline" size={20} color={Palette.navy950} />
        </Pressable>
      </View>

      {/* Main Cover Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: campaign.coverImage }}
          style={styles.coverImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{campaign.category}</Text>
        </View>
      </View>

      {/* Content Body Container */}
      <View style={styles.body}>
        {/* Title & Creator */}
        <Text style={styles.title}>{campaign.title}</Text>

        <View style={styles.creatorCard}>
          <Ionicons name="person-circle-outline" size={22} color={Palette.primary700} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{campaign.creator}</Text>
            <Text style={styles.creatorType}>{campaign.creatorType} • Campaign Creator</Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{campaign.summary}</Text>
        </View>

        {/* Funding & Reach Dashboard */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsHeader}>
            <View>
              <Text style={styles.raisedAmount}>{formatCurrency(campaign.raised)}</Text>
              <Text style={styles.raisedSub}>
                funded of {formatCurrency(campaign.goal)} target
              </Text>
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

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={16} color={Palette.neutral500} />
              <Text style={styles.metricLabel}>{formatDaysRemaining(campaign.daysRemaining)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Ionicons name="people-outline" size={16} color={Palette.neutral500} />
              <Text style={styles.metricLabel}>{campaign.backerCount} amplification backers</Text>
            </View>
          </View>

          {/* Estimated Reach Range */}
          <View style={styles.reachModule}>
            <View style={styles.reachIconBox}>
              <Ionicons name="megaphone" size={18} color={Palette.primary700} />
            </View>
            <View style={styles.reachTextGroup}>
              <Text style={styles.reachTitle}>Estimated Impressions</Text>
              <Text style={styles.reachRange}>
                {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)} impressions
              </Text>
              <Text style={styles.reachDisclaimer}>
                Based on active ad network inventory and targeted channel distribution.
              </Text>
            </View>
          </View>

          {/* Status-aware CTA Block */}
          {canBackCampaign(campaign) ? (
            <>
              <AppButton
                title="Back This Campaign"
                onPress={handleOpenContribution}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Ionicons name="flash" size={18} color={Palette.pureWhite} />}
                style={styles.primaryCta}
              />
              <Text style={styles.nonDonationNotice}>
                Funds are applied exclusively to public advertising and message distribution. They are not
                direct donations to the creator.
              </Text>
            </>
          ) : campaign.status === 'PROMOTING' ? (
            <View style={styles.statusNoticeBox}>
              <View style={styles.statusNoticeHeader}>
                <Ionicons name="radio-outline" size={18} color={Palette.purple600} />
                <Text style={styles.statusNoticeTitle}>Promotion Active</Text>
              </View>
              <Text style={styles.statusNoticeBody}>
                This campaign is actively being promoted across configured distribution channels.
              </Text>
              <AppButton
                title="View Distribution Progress"
                onPress={() => router.push(`/report/${campaign.id}`)}
                variant="outline"
                size="md"
                fullWidth
                icon={<Ionicons name="analytics-outline" size={16} color={Palette.navy950} />}
                style={styles.statusCta}
              />
            </View>
          ) : campaign.status === 'COMPLETED' ? (
            <View style={styles.statusNoticeBox}>
              <View style={styles.statusNoticeHeader}>
                <Ionicons name="checkmark-done-circle-outline" size={18} color={Palette.success700} />
                <Text style={styles.statusNoticeTitle}>Campaign Completed</Text>
              </View>
              <Text style={styles.statusNoticeBody}>
                The distribution run has concluded with prototype delivery metrics and impression analytics.
              </Text>
              <AppButton
                title="View Final Report"
                onPress={() => router.push(`/report/${campaign.id}`)}
                variant="primary"
                size="md"
                fullWidth
                icon={<Ionicons name="document-text-outline" size={16} color={Palette.pureWhite} />}
                style={styles.statusCta}
              />
            </View>
          ) : campaign.status === 'CHANGES_REQUESTED' ? (
            <View style={[styles.statusNoticeBox, styles.statusNoticeWarning]}>
              <View style={styles.statusNoticeHeader}>
                <Ionicons name="alert-circle-outline" size={18} color={Palette.amber600} />
                <Text style={[styles.statusNoticeTitle, styles.statusWarningTitle]}>Creator Action Required</Text>
              </View>
              <Text style={styles.statusNoticeBody}>
                {campaign.reviewFeedback || 'The verification team requested revisions to sources or ad copy before publication.'}
              </Text>
            </View>
          ) : campaign.status === 'APPROVED' ? (
            <View style={[styles.statusNoticeBox, styles.statusNoticeSuccess]}>
              <View style={styles.statusNoticeHeader}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Palette.success700} />
                <Text style={[styles.statusNoticeTitle, styles.statusSuccessTitle]}>Preparing for Funding</Text>
              </View>
              <Text style={styles.statusNoticeBody}>
                This campaign was approved and will open for community backing shortly.
              </Text>
            </View>
          ) : campaign.status === 'REJECTED' ? (
            <View style={[styles.statusNoticeBox, styles.statusNoticeDanger]}>
              <View style={styles.statusNoticeHeader}>
                <Ionicons name="close-circle-outline" size={18} color={Palette.error600} />
                <Text style={[styles.statusNoticeTitle, styles.statusDangerTitle]}>Campaign Not Approved</Text>
              </View>
              <Text style={styles.statusNoticeBody}>
                {campaign.rejectionReason || 'This campaign did not pass platform editorial and citation vetting standards.'}
              </Text>
            </View>
          ) : (
            <View style={styles.statusNoticeBox}>
              <View style={styles.statusNoticeHeader}>
                <Ionicons name="time-outline" size={18} color={Palette.info600} />
                <Text style={styles.statusNoticeTitle}>
                  {CAMPAIGN_STATUS_CONFIG[campaign.status]?.label || 'Under Review'}
                </Text>
              </View>
              <Text style={styles.statusNoticeBody}>
                {CAMPAIGN_STATUS_CONFIG[campaign.status]?.publicDescription ||
                  'This campaign is undergoing review and is not yet accepting public backing.'}
              </Text>
            </View>
          )}
        </View>

        {/* Section: Campaign Story (Structured or Narrative) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>The Campaign Message</Text>

          {campaign.storyDetails ? (
            <View style={styles.storyStructuredWrapper}>
              {campaign.storyDetails.headline ? (
                <Text style={styles.storyHeadlineText}>{campaign.storyDetails.headline}</Text>
              ) : null}

              {campaign.storyDetails.intro ? (
                <Text style={styles.storyIntroLead}>{campaign.storyDetails.intro}</Text>
              ) : null}

              {campaign.storyDetails.image ? (
                <View style={styles.storyInlineImageWrapper}>
                  <Image
                    source={{ uri: campaign.storyDetails.image }}
                    style={styles.storyInlineImage}
                    contentFit="cover"
                  />
                  {campaign.storyDetails.caption ? (
                    <Text style={styles.storyInlineCaption}>
                      {campaign.storyDetails.caption}
                      {campaign.storyDetails.credit ? ` (${campaign.storyDetails.credit})` : ''}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Text style={styles.storyText}>{campaign.storyDetails.content}</Text>
            </View>
          ) : (
            <Text style={styles.storyText}>{campaign.story.replace(/###\s*/g, '')}</Text>
          )}
        </View>

        {/* Section: Distribution Channels */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Distribution & Placement Channels</Text>
          <Text style={styles.sectionSubtitle}>
            Where amplification dollars deliver impressions:
          </Text>
          <View style={styles.channelsList}>
            {campaign.distributionChannels.map((channel, idx) => (
              <View key={idx} style={styles.channelRow}>
                <Ionicons name="checkmark-circle" size={18} color={Palette.success600} />
                <Text style={styles.channelText}>{channel}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section: Use of Funds */}
        <View style={styles.sectionCard}>
          <Pressable
            onPress={() => setIsFundsExpanded(!isFundsExpanded)}
            accessibilityRole="button"
            accessibilityLabel="Toggle Use of Funds breakdown"
            style={styles.collapsibleHeader}>
            <View style={styles.collapsibleTitleRow}>
              <Ionicons name="pie-chart-outline" size={18} color={Palette.navy950} />
              <Text style={styles.sectionHeading}>Use of Funds Breakdown</Text>
            </View>
            <Ionicons
              name={isFundsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Palette.neutral500}
            />
          </Pressable>

          {isFundsExpanded && (
            <View style={styles.fundsContent}>
              <Text style={styles.fundsNotice}>
                Contributions fund campaign amplification and distribution. They are not direct
                donations to the organization or cause.
              </Text>

              <View style={styles.allocationRow}>
                <Text style={styles.allocationLabel}>Digital Media & Ad Placement</Text>
                <Text style={styles.allocationValue}>{campaign.useOfFunds.advertising}%</Text>
              </View>
              <View style={styles.allocationBarTrack}>
                <View
                  style={[
                    styles.allocationBarFill,
                    { width: `${campaign.useOfFunds.advertising}%`, backgroundColor: Palette.primary600 },
                  ]}
                />
              </View>

              <View style={styles.allocationRow}>
                <Text style={styles.allocationLabel}>Platform Operations & Review</Text>
                <Text style={styles.allocationValue}>{campaign.useOfFunds.platformFee}%</Text>
              </View>
              <View style={styles.allocationBarTrack}>
                <View
                  style={[
                    styles.allocationBarFill,
                    { width: `${campaign.useOfFunds.platformFee}%`, backgroundColor: Palette.neutral500 },
                  ]}
                />
              </View>

              <View style={styles.allocationRow}>
                <Text style={styles.allocationLabel}>Payment Processing & Infrastructure</Text>
                <Text style={styles.allocationValue}>{campaign.useOfFunds.paymentProcessing}%</Text>
              </View>
              <View style={styles.allocationBarTrack}>
                <View
                  style={[
                    styles.allocationBarFill,
                    {
                      width: `${campaign.useOfFunds.paymentProcessing}%`,
                      backgroundColor: Palette.neutral400,
                    },
                  ]}
                />
              </View>

              <Text style={styles.demoDataTag}>
                * Standard platform allocation policy.
              </Text>
            </View>
          )}
        </View>

        {/* Section: Supporting Sources */}
        <View style={[styles.sectionCard, styles.lastCard]}>
          <Text style={styles.sectionHeading}>Supporting Sources & Citations</Text>
          <Text style={styles.sectionSubtitle}>
            References and citations provided by the campaign creator:
          </Text>

          {campaign.supportingSources.length === 0 ? (
            <Text style={styles.noSourcesText}>No external sources attached to this campaign.</Text>
          ) : (
            campaign.supportingSources.map((source, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleOpenSourceUrl(source.url)}
                accessibilityRole="button"
                accessibilityLabel={`View source: ${source.title}`}
                style={({ pressed }) => [styles.sourceItem, pressed && styles.sourceItemPressed]}>
                <Ionicons name="document-text-outline" size={18} color={Palette.primary700} style={styles.sourceIcon} />
                <View style={styles.sourceContent}>
                  <Text style={styles.sourceTitle}>{source.title}</Text>
                  {source.publisher && (
                    <Text style={styles.sourcePublisher}>Published by {source.publisher}</Text>
                  )}
                  <View style={styles.viewSourceLinkRow}>
                    <Text style={styles.viewSourceText}>View Source</Text>
                    <Ionicons name="arrow-up-right-box-outline" size={13} color={Palette.primary700} />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Palette.neutral500,
  },
  navBar: {
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNav: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btnPressed: {
    opacity: 0.7,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    backgroundColor: Palette.neutral200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    ...Typography.h1,
    fontSize: 22,
    lineHeight: 28,
    color: Palette.navy950,
    marginBottom: Spacing.xs,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
  },
  creatorType: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  summaryCard: {
    backgroundColor: Palette.neutral50,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primary600,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  summaryText: {
    ...Typography.body,
    color: Palette.neutral700,
    lineHeight: 22,
  },
  metricsCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  metricsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  raisedAmount: {
    ...Typography.h1,
    fontSize: 24,
    color: Palette.navy950,
  },
  raisedSub: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 1,
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
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: Palette.neutral200,
  },
  metricLabel: {
    ...Typography.caption,
    color: Palette.neutral600,
  },
  reachModule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  reachIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachTextGroup: {
    flex: 1,
  },
  reachTitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  reachRange: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    marginVertical: 2,
  },
  reachDisclaimer: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
    lineHeight: 15,
  },
  primaryCta: {
    marginBottom: Spacing.xs,
  },
  nonDonationNotice: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  lastCard: {
    marginBottom: Spacing.xxl * 2,
  },
  sectionHeading: {
    ...Typography.h2,
    fontSize: 17,
    color: Palette.navy950,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  storyStructuredWrapper: {
    marginTop: Spacing.xs,
  },
  storyHeadlineText: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
    marginBottom: Spacing.xs,
  },
  storyIntroLead: {
    ...Typography.body,
    fontWeight: '600',
    color: Palette.navy900,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  storyInlineImageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Palette.neutral200,
    marginVertical: Spacing.sm,
  },
  storyInlineImage: {
    width: '100%',
    height: '100%',
  },
  storyInlineCaption: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    marginTop: 4,
  },
  storyText: {
    ...Typography.body,
    color: Palette.navy800,
    lineHeight: 24,
    marginTop: Spacing.xs,
  },
  channelsList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelText: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    fontWeight: '500',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsibleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fundsContent: {
    marginTop: Spacing.md,
  },
  fundsNotice: {
    ...Typography.caption,
    color: Palette.neutral600,
    backgroundColor: Palette.neutral50,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    lineHeight: 17,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  allocationLabel: {
    ...Typography.caption,
    color: Palette.navy900,
    fontWeight: '500',
  },
  allocationValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.navy950,
  },
  allocationBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Palette.neutral200,
    borderRadius: 3,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  allocationBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  demoDataTag: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
    marginTop: 4,
  },
  noSourcesText: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: Spacing.xs,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  sourceItemPressed: {
    backgroundColor: Palette.neutral50,
    opacity: 0.8,
  },
  sourceIcon: {
    marginTop: 2,
  },
  sourceContent: {
    flex: 1,
  },
  sourceTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
  },
  sourcePublisher: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 1,
  },
  viewSourceLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  viewSourceText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primary700,
  },
  statusNoticeBox: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  statusNoticeWarning: {
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
  },
  statusNoticeSuccess: {
    backgroundColor: Palette.success50,
    borderColor: Palette.success200,
  },
  statusNoticeDanger: {
    backgroundColor: Palette.error50,
    borderColor: Palette.error200,
  },
  statusNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusNoticeTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  statusWarningTitle: {
    color: Palette.amber700,
  },
  statusSuccessTitle: {
    color: Palette.success700,
  },
  statusDangerTitle: {
    color: Palette.error600,
  },
  statusNoticeBody: {
    ...Typography.caption,
    color: Palette.neutral600,
    lineHeight: 16,
  },
  statusCta: {
    marginTop: Spacing.md,
  },
});
