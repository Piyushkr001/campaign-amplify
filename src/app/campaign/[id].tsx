import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
  const [showAmplifyModal, setShowAmplifyModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(25);

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

  const handleOpenAmplify = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowAmplifyModal(true);
  };

  const handleConfirmBacking = () => {
    setShowAmplifyModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      'Payment Gateway Preview',
      `In this phase, payments are simulated. A $${selectedTier} contribution would fund approximately ${selectedTier * 25} to ${selectedTier * 35} targeted impressions for "${campaign.title}". Payment gateway integration will be added in Phase 2.`,
      [{ text: 'Understood' }]
    );
  };

  const sampleTiers = [
    { amount: 10, impressions: '400–600' },
    { amount: 25, impressions: '1,000–1,500' },
    { amount: 50, impressions: '2,200–3,500' },
    { amount: 100, impressions: '5,000–7,500' },
  ];

  return (
    <ScreenContainer
      scrollable
      paddingHorizontal={false}
      backgroundColor={Palette.warmWhite}>
      {/* Custom Sticky Header */}
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
          <Ionicons name="shield-checkmark" size={18} color={Palette.primary600} />
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{campaign.creator}</Text>
            <Text style={styles.creatorType}>{campaign.creatorType} • Verified Publisher</Text>
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
              <Text style={styles.reachTitle}>Estimated audience reach</Text>
              <Text style={styles.reachRange}>
                {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)} potential viewers
              </Text>
              <Text style={styles.reachDisclaimer}>
                Based on active ad network inventory and targeted channel distribution.
              </Text>
            </View>
          </View>

          {/* Primary CTA */}
          <AppButton
            title="Back This Campaign's Reach"
            onPress={handleOpenAmplify}
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
        </View>

        {/* Section: Campaign Story */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>The Campaign Message</Text>
          <Text style={styles.storyText}>{campaign.story}</Text>
        </View>

        {/* Section: Distribution Channels */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Distribution & Placement Channels</Text>
          <Text style={styles.sectionSubtitle}>
            Where your amplification dollars deliver impressions:
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
                <Text style={styles.allocationLabel}>Verification & Review Platform Fee</Text>
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
                * Sample breakdown percentages displayed for demonstration.
              </Text>
            </View>
          )}
        </View>

        {/* Section: Supporting Sources */}
        <View style={[styles.sectionCard, styles.lastCard]}>
          <Text style={styles.sectionHeading}>Supporting Sources & Citations</Text>
          <Text style={styles.sectionSubtitle}>
            Independently verified references supporting the campaign claims:
          </Text>

          {campaign.supportingSources.map((source, idx) => (
            <View key={idx} style={styles.sourceItem}>
              <Ionicons name="document-text-outline" size={16} color={Palette.primary600} />
              <View style={styles.sourceContent}>
                <Text style={styles.sourceTitle}>{source.title}</Text>
                {source.publisher && (
                  <Text style={styles.sourcePublisher}>Published by {source.publisher}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Amplify Modal Sheet */}
      <Modal
        visible={showAmplifyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAmplifyModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowAmplifyModal(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fund Message Amplification</Text>
              <Pressable
                onPress={() => setShowAmplifyModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Palette.neutral600} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Select an amplification tier to sponsor message distribution across targeted ad networks.
            </Text>

            {/* Tier selector */}
            <View style={styles.tierList}>
              {sampleTiers.map((tier) => (
                <Pressable
                  key={tier.amount}
                  onPress={() => setSelectedTier(tier.amount)}
                  accessibilityRole="button"
                  accessibilityLabel={`$${tier.amount} for approximately ${tier.impressions} impressions`}
                  style={[
                    styles.tierCard,
                    selectedTier === tier.amount && styles.tierCardSelected,
                  ]}>
                  <View style={styles.tierRadio}>
                    {selectedTier === tier.amount && <View style={styles.tierRadioActive} />}
                  </View>
                  <View style={styles.tierContent}>
                    <Text style={styles.tierAmount}>${tier.amount}</Text>
                    <Text style={styles.tierReach}>~{tier.impressions} potential views</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalDisclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={Palette.primary700} />
              <Text style={styles.modalDisclaimerText}>
                Your payment purchases verified digital impressions. This is not a direct charitable donation.
              </Text>
            </View>

            <AppButton
              title={`Confirm $${selectedTier} Amplification (Demo)`}
              onPress={handleConfirmBacking}
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.xxl,
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
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
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
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: Palette.pureWhite,
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    paddingHorizontal: Layout.screenPaddingHorizontal,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.neutral300,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginBottom: Spacing.md,
  },
  tierList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Palette.neutral200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tierCardSelected: {
    borderColor: Palette.primary600,
    backgroundColor: Palette.primary50,
  },
  tierRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Palette.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRadioActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.primary600,
  },
  tierContent: {
    flex: 1,
  },
  tierAmount: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
  },
  tierReach: {
    ...Typography.caption,
    color: Palette.primary700,
    fontWeight: '600',
  },
  modalDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral50,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 8,
    marginBottom: Spacing.lg,
  },
  modalDisclaimerText: {
    ...Typography.caption,
    color: Palette.neutral600,
    flex: 1,
    lineHeight: 16,
  },
});
