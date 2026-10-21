import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
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
import { CampaignStatusBadge } from '@/components/campaign/CampaignStatusBadge';
import { ReviewSection } from '@/components/reviewer/ReviewSection';
import { ReviewDecisionSheet } from '@/components/reviewer/ReviewDecisionSheet';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency, formatReachRange } from '@/utils/formatters';
import { Config } from '@/constants/config';
import { useReviewCampaign } from '@/hooks/useReviewer';
import { ReviewerService } from '@/services/reviewer.service';
import { ActivityIndicator } from 'react-native';
import { getEffectiveCampaign } from '@/utils/effective-campaign';

export default function ReviewerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const isAuthorized = isAuthenticated && (user?.role === 'REVIEWER' || user?.role === 'ADMIN');

  const {
    getCampaignById,
    advanceToDistributionPrep,
    launchLivePromotion,
    completeCampaign,
    endFundingPeriod,
  } = useMyCampaignsStore();

  const { data: apiCampaign, isLoading: isApiLoading } = useReviewCampaign(id || '');
  const localCampaign = id ? getCampaignById(id) : undefined;
  const rawCampaign = Config.useApi ? apiCampaign || localCampaign : localCampaign;
  const campaign = rawCampaign ? getEffectiveCampaign(rawCampaign) : undefined;

  // Dialog state for feedback/rejection input
  const [modalMode, setModalMode] = useState<'CHANGES' | 'REJECT' | null>(null);

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
          title="Reviewer Access Required"
          description="This portal is restricted to authorized platform reviewers and administrators."
          actionTitle="Sign In as Reviewer"
          onAction={() => router.push('/auth/login')}
        />
      </ScreenContainer>
    );
  }

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
        <View style={styles.notFoundWrap}>
          <ActivityIndicator size="large" color={Palette.primary700} />
          <Text style={[styles.notFoundTitle, { marginTop: Spacing.md }]}>
            Loading Campaign...
          </Text>
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
        <View style={styles.notFoundWrap}>
          <Ionicons name="folder-outline" size={48} color={Palette.neutral400} />
          <Text style={styles.notFoundTitle}>Campaign Not in Queue</Text>
          <Text style={styles.notFoundDesc}>
            This campaign was not found in local submitted campaigns.
          </Text>
          <AppButton
            title="Return to Queue"
            onPress={() => router.replace('/reviewer')}
            variant="primary"
            size="md"
          />
        </View>
      </ScreenContainer>
    );
  }

  const handleStartReview = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await ReviewerService.startReview(campaign.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Failed to start review.');
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Campaign',
      'Are you sure you want to approve this campaign? It will be marked APPROVED and staged for funding launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve Campaign',
          onPress: async () => {
            try {
              await ReviewerService.approve(
                campaign.id,
                'Passed source verification and policy compliance checks.'
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (err: any) {
              Alert.alert('Action Failed', err.message || 'Failed to approve campaign.');
            }
          },
        },
      ]
    );
  };

  const handleMoveToFunding = () => {
    Alert.alert(
      'Publish to Public Funding',
      'This will make the campaign public in Explore and Home feeds, opening it for backer contributions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Available for Funding',
          onPress: async () => {
            try {
              await ReviewerService.startFunding(
                campaign.id,
                'Published and opened for community backing.'
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              Alert.alert(
                'Campaign Published!',
                'This campaign is now live on Explore and accepting backer contributions toward message distribution.',
                [
                  {
                    text: 'View in Explore',
                    onPress: () => router.replace('/(tabs)/explore'),
                  },
                  {
                    text: 'Remain in Reviewer',
                    style: 'cancel',
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert('Action Failed', err.message || 'Failed to publish campaign for funding.');
            }
          },
        },
      ]
    );
  };

  const handleOpenChangesModal = () => {
    setModalMode('CHANGES');
  };

  const handleOpenRejectModal = () => {
    setModalMode('REJECT');
  };

  const handleConfirmDecision = async (feedback: string) => {
    try {
      if (modalMode === 'CHANGES') {
        await ReviewerService.requestChanges(campaign.id, feedback);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      } else if (modalMode === 'REJECT') {
        await ReviewerService.reject(campaign.id, feedback);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Failed to record editorial decision.');
    }
    setModalMode(null);
  };

  const handleEndFunding = () => {
    Alert.alert(
      Config.useApi ? 'End Funding Period' : 'End Funding Period (Demo)',
      'This concludes public backer contributions and transitions the campaign to FUNDING_ENDED.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Funding',
          onPress: async () => {
            try {
              await ReviewerService.endFunding(campaign.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (err: any) {
              Alert.alert('Action Failed', err?.response?.data?.message || err?.message || 'Failed to end funding period.');
            }
          },
        },
      ]
    );
  };

  const handleAdvanceToDistribution = () => {
    Alert.alert(
      Config.useApi ? 'Advance to Distribution Preparation' : 'Advance to Distribution Preparation (Demo)',
      'Ad creative and audience parameters will be configured for network deployment.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Advance to Prep',
          onPress: async () => {
            try {
              await ReviewerService.prepareDistribution(campaign.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (err: any) {
              Alert.alert('Action Failed', err?.response?.data?.message || err?.message || 'Failed to advance to distribution.');
            }
          },
        },
      ]
    );
  };

  const handleLaunchPromotion = () => {
    Alert.alert(
      Config.useApi ? 'Start Demo Promotion' : 'Start Demo Promotion (Local)',
      'This transitions the campaign to PROMOTING, beginning prototype distribution simulation across selected channels.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Promotion',
          onPress: async () => {
            try {
              await ReviewerService.startPromotion(campaign.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (err: any) {
              Alert.alert('Action Failed', err?.response?.data?.message || err?.message || 'Failed to start promotion.');
            }
          },
        },
      ]
    );
  };

  const handleCompletePromotion = () => {
    Alert.alert(
      Config.useApi ? 'Complete Distribution Run' : 'Complete Distribution Run (Demo)',
      'Concludes message distribution and finalizes the Campaign Report.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete Campaign',
          onPress: async () => {
            try {
              await ReviewerService.completePromotion(campaign.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (err: any) {
              Alert.alert('Action Failed', err?.response?.data?.message || err?.message || 'Failed to complete campaign.');
            }
          },
        },
      ]
    );
  };


  const handleOpenLink = async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) Linking.openURL(url);
    } catch {
      // Ignore
    }
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Top Nav Header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.navTitle}>Reviewing Campaign</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Internal Review Banner */}
      <View style={styles.internalBadge}>
        <Ionicons name="shield-checkmark" size={14} color={Palette.navy900} />
        <Text style={styles.internalBadgeText}>INTERNAL EDITORIAL DESK • DEMO PROTOTYPE</Text>
      </View>

      {/* Header Info */}
      <View style={styles.titleSection}>
        <View style={styles.statusRow}>
          <CampaignStatusBadge status={campaign.status} size="md" />
          <Text style={styles.categoryBadge}>{campaign.category}</Text>
        </View>
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.creatorMeta}>
          Submitted by <Text style={styles.creatorBold}>{campaign.creator}</Text> ({campaign.creatorType})
        </Text>
      </View>

      {/* Review Action Bar (Based on current status) */}
      <View style={styles.actionPanel}>
        <Text style={styles.actionPanelTitle}>Reviewer Actions</Text>

        {campaign.status === 'SUBMITTED_FOR_REVIEW' && (
          <AppButton
            title="Start Editorial Review"
            onPress={handleStartReview}
            variant="primary"
            size="lg"
            icon={<Ionicons name="play-outline" size={18} color={Palette.pureWhite} />}
          />
        )}

        {campaign.status === 'UNDER_REVIEW' && (
          <View style={styles.reviewActionsGrid}>
            <AppButton
              title="Approve Campaign"
              onPress={handleApprove}
              variant="primary"
              size="md"
              icon={<Ionicons name="checkmark-circle-outline" size={16} color={Palette.pureWhite} />}
            />
            <View style={styles.secondaryActionsRow}>
              <AppButton
                title="Request Changes"
                onPress={handleOpenChangesModal}
                variant="outline"
                size="md"
                style={styles.actionBtnHalf}
                icon={<Ionicons name="create-outline" size={16} color={Palette.amber700} />}
              />
              <AppButton
                title="Reject"
                onPress={handleOpenRejectModal}
                variant="danger"
                size="md"
                style={styles.actionBtnHalf}
                icon={<Ionicons name="close-circle-outline" size={16} color={Palette.pureWhite} />}
              />
            </View>
          </View>
        )}

        {campaign.status === 'APPROVED' && (
          <View style={styles.approvedActionsWrap}>
            <View style={styles.approvedNotice}>
              <Ionicons name="checkmark-circle" size={18} color={Palette.success700} />
              <Text style={styles.approvedNoticeText}>
                Campaign is approved. Click below to publish and open public backer funding.
              </Text>
            </View>
            <AppButton
              title="Make Available for Funding"
              onPress={handleMoveToFunding}
              variant="primary"
              size="lg"
              icon={<Ionicons name="rocket-outline" size={18} color={Palette.pureWhite} />}
            />
          </View>
        )}

        {campaign.status === 'CHANGES_REQUESTED' && (
          <View style={styles.statusCalloutWarning}>
            <Ionicons name="alert-circle" size={18} color={Palette.amber700} />
            <View style={styles.statusCalloutTextWrap}>
              <Text style={styles.statusCalloutTitle}>Changes Requested from Creator</Text>
              <Text style={styles.statusCalloutDesc}>
                Feedback sent: "{campaign.reviewFeedback}"
              </Text>
            </View>
          </View>
        )}

        {campaign.status === 'REJECTED' && (
          <View style={styles.statusCalloutDanger}>
            <Ionicons name="close-circle" size={18} color={Palette.error600} />
            <View style={styles.statusCalloutTextWrap}>
              <Text style={styles.statusCalloutTitle}>Campaign Rejected</Text>
              <Text style={styles.statusCalloutDesc}>
                Reason: "{campaign.rejectionReason}"
              </Text>
            </View>
          </View>
        )}

        {campaign.status === 'FUNDING' && (
          <View style={styles.approvedActionsWrap}>
            <View style={styles.statusCalloutSuccess}>
              <Ionicons name="globe-outline" size={18} color={Palette.success700} />
              <View style={styles.statusCalloutTextWrap}>
                <Text style={styles.statusCalloutTitle}>Live in Public Funding</Text>
                <Text style={styles.statusCalloutDesc}>
                  Discoverable in Explore & Home. Backers are actively funding amplification.
                </Text>
              </View>
            </View>
            <AppButton
              title={Config.useApi ? "End Funding Period" : "Demo: End Funding Period"}
              onPress={handleEndFunding}
              variant="outline"
              size="md"
              icon={<Ionicons name="time-outline" size={16} color={Palette.navy900} />}
            />
          </View>
        )}

        {(campaign.status === 'FUNDING_GOAL_REACHED' || campaign.status === 'FUNDING_ENDED') && (
          <View style={styles.approvedActionsWrap}>
            <View style={styles.approvedNotice}>
              <Ionicons name="trophy-outline" size={18} color={Palette.purple700} />
              <Text style={styles.approvedNoticeText}>
                Funding concluded! Ready to configure advertising targeting parameters.
              </Text>
            </View>
            <AppButton
              title={Config.useApi ? "Advance to Distribution Prep" : "Demo: Advance to Distribution Prep"}
              onPress={handleAdvanceToDistribution}
              variant="primary"
              size="md"
              icon={<Ionicons name="hardware-chip-outline" size={16} color={Palette.pureWhite} />}
            />
          </View>
        )}

        {campaign.status === 'DISTRIBUTION_PREPARATION' && (
          <View style={styles.approvedActionsWrap}>
            <View style={styles.approvedNotice}>
              <Ionicons name="construct-outline" size={18} color={Palette.purple700} />
              <Text style={styles.approvedNoticeText}>
                Distribution slots staged. Begin simulated promotion across target channels.
              </Text>
            </View>
            <AppButton
              title={Config.useApi ? "Start Demo Promotion" : "Demo: Start Promotion"}
              onPress={handleLaunchPromotion}
              variant="primary"
              size="md"
              icon={<Ionicons name="megaphone-outline" size={16} color={Palette.pureWhite} />}
            />
          </View>
        )}

        {campaign.status === 'PROMOTING' && (
          <View style={styles.approvedActionsWrap}>
            <View style={styles.statusCalloutSuccess}>
              <Ionicons name="radio-outline" size={18} color={Palette.purple700} />
              <View style={styles.statusCalloutTextWrap}>
                <Text style={styles.statusCalloutTitle}>Promotion Simulation Active</Text>
                <Text style={styles.statusCalloutDesc}>
                  Prototype distribution modeled across selected channels.
                </Text>
              </View>
            </View>
            <View style={styles.secondaryActionsRow}>
              <AppButton
                title="View Progress"
                onPress={() => router.push(`/report/${campaign.id}`)}
                variant="outline"
                size="md"
                style={styles.actionBtnHalf}
                icon={<Ionicons name="analytics-outline" size={16} color={Palette.navy900} />}
              />
              <AppButton
                title={Config.useApi ? "Complete Campaign" : "Demo: Complete"}
                onPress={handleCompletePromotion}
                variant="primary"
                size="md"
                style={styles.actionBtnHalf}
                icon={<Ionicons name="checkmark-done" size={16} color={Palette.pureWhite} />}
              />
            </View>
          </View>
        )}

        {campaign.status === 'COMPLETED' && (
          <View style={styles.approvedActionsWrap}>
            <View style={styles.approvedNotice}>
              <Ionicons name="checkmark-done-circle" size={18} color={Palette.success700} />
              <Text style={styles.approvedNoticeText}>
                Campaign distribution complete. Final performance report generated.
              </Text>
            </View>
            <AppButton
              title="View Final Report"
              onPress={() => router.push(`/report/${campaign.id}`)}
              variant="primary"
              size="md"
              icon={<Ionicons name="document-text-outline" size={16} color={Palette.pureWhite} />}
            />
          </View>
        )}
      </View>

      {/* Section 1: Summary & Cover Image */}
      <ReviewSection title="Campaign Overview">
        <Image source={{ uri: campaign.coverImage }} style={styles.coverPreview} contentFit="cover" />
        <Text style={styles.sectionTextBold}>Summary Pitch:</Text>
        <Text style={styles.sectionBodyText}>{campaign.summary}</Text>
      </ReviewSection>

      {/* Section 2: Full Story Narrative & Visuals */}
      <ReviewSection title="Editorial Narrative">
        {campaign.storyHeadline ? (
          <Text style={styles.storyHeadline}>{campaign.storyHeadline}</Text>
        ) : null}
        {campaign.storyIntro ? (
          <Text style={styles.storyIntro}>{campaign.storyIntro}</Text>
        ) : null}
        <Text style={styles.sectionBodyText}>{campaign.storyContent || campaign.story}</Text>

        {campaign.storyImage && (
          <View style={styles.storyImageWrap}>
            <Image source={{ uri: campaign.storyImage }} style={styles.storyImage} contentFit="cover" />
            {(campaign.storyImageCaption || campaign.storyImageCredit) && (
              <Text style={styles.imageCaption}>
                {campaign.storyImageCaption}
                {campaign.storyImageCredit ? ` (Credit: ${campaign.storyImageCredit})` : ''}
              </Text>
            )}
          </View>
        )}
      </ReviewSection>

      {/* Section 3: Supporting Sources & Citations */}
      <ReviewSection title={`Supporting Sources (${campaign.supportingSources.length})`}>
        {campaign.supportingSources.length === 0 ? (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color={Palette.amber700} />
            <Text style={styles.warningText}>No supporting sources attached. Request citations!</Text>
          </View>
        ) : (
          campaign.supportingSources.map((s, idx) => (
            <Pressable
              key={idx}
              onPress={() => handleOpenLink(s.url)}
              accessibilityRole="button"
              accessibilityLabel={`Inspect source: ${s.title}`}
              style={styles.sourceItem}>
              <Ionicons name="document-text-outline" size={18} color={Palette.primary700} />
              <View style={styles.sourceTextGroup}>
                <Text style={styles.sourceTitle}>{s.title}</Text>
                {s.publisher && <Text style={styles.sourcePublisher}>Publisher: {s.publisher}</Text>}
                <Text style={styles.sourceUrl} numberOfLines={1}>{s.url}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Palette.primary700} />
            </Pressable>
          ))
        )}
      </ReviewSection>

      {/* Section 4: Ad Creative & Copy */}
      <ReviewSection title="Targeted Ad Creative">
        <View style={styles.adCreativeContainer}>
          {campaign.adImage && (
            <Image source={{ uri: campaign.adImage }} style={styles.adImage} contentFit="cover" />
          )}
          <View style={styles.adContent}>
            <Text style={styles.adHeadline}>{campaign.adHeadline || campaign.title}</Text>
            <Text style={styles.adDescription}>{campaign.adDescription || campaign.summary}</Text>
            <View style={styles.adCtaPill}>
              <Text style={styles.adCtaText}>{campaign.adCTA || 'Learn More'}</Text>
            </View>
          </View>
        </View>
      </ReviewSection>

      {/* Section 5: Audience & Channels */}
      <ReviewSection title="Audience Targeting & Distribution">
        <View style={styles.targetingGrid}>
          <View style={styles.targetCol}>
            <Text style={styles.targetLabel}>Distribution Channels</Text>
            <Text style={styles.targetVal}>
              {campaign.distributionChannels.length > 0
                ? campaign.distributionChannels.join(', ')
                : 'Meta Ads, Google Display'}
            </Text>
          </View>
          <View style={styles.targetCol}>
            <Text style={styles.targetLabel}>Target Duration</Text>
            <Text style={styles.targetVal}>{campaign.durationDays || 14} days</Text>
          </View>
        </View>

        {campaign.locations && campaign.locations.length > 0 && (
          <View style={styles.targetingRow}>
            <Text style={styles.targetLabel}>Locations:</Text>
            <Text style={styles.targetVal}>{campaign.locations.join(', ')}</Text>
          </View>
        )}

        {campaign.interests && campaign.interests.length > 0 && (
          <View style={styles.targetingRow}>
            <Text style={styles.targetLabel}>Topic Interests:</Text>
            <Text style={styles.targetVal}>{campaign.interests.join(', ')}</Text>
          </View>
        )}
      </ReviewSection>

      {/* Section 6: Funding & Use of Funds */}
      <ReviewSection title="Funding & Fee Policy">
        <View style={styles.feeGrid}>
          <View style={styles.feeItem}>
            <Text style={styles.feeLabel}>Funding Goal</Text>
            <Text style={styles.feeVal}>{formatCurrency(campaign.goal)}</Text>
          </View>
          <View style={styles.feeItem}>
            <Text style={styles.feeLabel}>Direct Ads ({Config.feeStructure.advertisingPercentage}%)</Text>
            <Text style={styles.feeVal}>
              {formatCurrency(Math.round((campaign.goal * Config.feeStructure.advertisingPercentage) / 100))}
            </Text>
          </View>
          <View style={styles.feeItem}>
            <Text style={styles.feeLabel}>Estimated Reach</Text>
            <Text style={styles.feeVal}>
              {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)}
            </Text>
          </View>
        </View>
      </ReviewSection>

      <View style={styles.bottomSpacer} />

      {/* Decision Sheet for Requesting Changes / Rejection Reason */}
      <ReviewDecisionSheet
        visible={modalMode !== null}
        mode={modalMode}
        onClose={() => setModalMode(null)}
        onConfirm={handleConfirmDecision}
        defaultText={
          modalMode === 'CHANGES'
            ? 'Please provide a reliable supporting source for the statistic mentioned in the second paragraph.'
            : 'The campaign message does not meet platform neutrality or factual citation guidelines.'
        }
      />
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
  internalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral100,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  internalBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.navy900,
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  categoryBadge: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.navy950,
    lineHeight: 26,
  },
  creatorMeta: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    marginTop: 4,
  },
  creatorBold: {
    fontWeight: '700',
    color: Palette.navy950,
  },
  actionPanel: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 2,
    borderColor: Palette.primary200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionPanelTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  reviewActionsGrid: {
    gap: Spacing.sm,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtnHalf: {
    flex: 1,
  },
  approvedActionsWrap: {
    gap: Spacing.sm,
  },
  approvedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.success50,
    borderColor: Palette.success200,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  approvedNoticeText: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.success800,
    flex: 1,
    lineHeight: 16,
  },
  statusCalloutWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.amber50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  statusCalloutDanger: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.error50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  statusCalloutSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.success50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
  },
  statusCalloutTextWrap: {
    flex: 1,
  },
  statusCalloutTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  statusCalloutDesc: {
    ...Typography.caption,
    color: Palette.neutral600,
    marginTop: 2,
    lineHeight: 16,
  },
  coverPreview: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  sectionTextBold: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.neutral500,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 2,
  },
  sectionBodyText: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    lineHeight: 20,
  },
  storyHeadline: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    marginBottom: 4,
  },
  storyIntro: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
    color: Palette.neutral600,
    marginBottom: 8,
  },
  storyImageWrap: {
    marginTop: Spacing.sm,
  },
  storyImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
  },
  imageCaption: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral500,
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.amber50,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 8,
  },
  warningText: {
    ...Typography.caption,
    color: Palette.amber900,
    fontWeight: '600',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  sourceTextGroup: {
    flex: 1,
  },
  sourceTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  sourcePublisher: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  sourceUrl: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.primary700,
  },
  adCreativeContainer: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  adImage: {
    width: '100%',
    height: 140,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  adContent: {
    paddingHorizontal: 4,
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
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  adCtaPill: {
    backgroundColor: Palette.primary600,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  adCtaText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.pureWhite,
  },
  targetingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  targetCol: {
    flex: 1,
  },
  targetLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
    textTransform: 'uppercase',
  },
  targetVal: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    marginTop: 1,
  },
  targetingRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  feeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeItem: {
    flex: 1,
    alignItems: 'center',
  },
  feeLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Palette.neutral400,
    textTransform: 'uppercase',
  },
  feeVal: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    marginTop: 2,
  },
  notFoundWrap: {
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
    marginBottom: Spacing.md,
  },
  bottomSpacer: {
    height: Spacing.xxl * 2,
  },
});
