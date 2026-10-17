import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { formatCurrency } from '@/utils/formatters';
import { formatReachEstimate } from '@/utils/reach';

export default function CreateSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const { getCampaignById } = useMyCampaignsStore();

  const campaign = params.id ? getCampaignById(params.id) : undefined;
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleCreateAnother = () => {
    router.replace('/create-campaign/basics');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-sharp" size={38} color={Palette.pureWhite} />
        </View>

        <Text style={styles.title}>Campaign Submitted</Text>
        <Text style={styles.subtitle}>Your campaign has been submitted for review.</Text>

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>STATUS: SUBMITTED_FOR_REVIEW</Text>
        </View>

        {/* Campaign Snapshot Card */}
        {campaign ? (
          <View style={styles.campaignSnapshotCard}>
            {campaign.coverImage && (
              <Image source={{ uri: campaign.coverImage }} style={styles.snapshotCover} contentFit="cover" />
            )}
            <View style={styles.snapshotBody}>
              <Text style={styles.snapshotTitle}>{campaign.title}</Text>
              <Text style={styles.snapshotMeta}>
                Goal: {formatCurrency(campaign.goal)} • Estimated Reach:{' '}
                {formatReachEstimate(campaign.estimatedReachMin, campaign.estimatedReachMax)} views
              </Text>
              <Pressable
                onPress={() => setShowStatusModal(true)}
                accessibilityRole="button"
                accessibilityLabel="View campaign status details"
                style={styles.viewStatusLink}>
                <Ionicons name="information-circle-outline" size={14} color={Palette.primary700} />
                <Text style={styles.viewStatusLinkText}>View Review Details</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Review Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeading}>What Happens Next</Text>

          <View style={styles.timelineItem}>
            <View style={styles.dotActive}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={styles.timelineItemContent}>
              <Text style={styles.timelineItemTitle}>Citation & Source Review</Text>
              <Text style={styles.timelineItemDesc}>
                Editorial compliance reviewers audit attached source citations and messaging claims.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.dotPending}>
              <Text style={styles.stepNumPending}>2</Text>
            </View>
            <View style={styles.timelineItemContent}>
              <Text style={styles.timelineItemTitle}>Ad Creative Standards Check</Text>
              <Text style={styles.timelineItemDesc}>
                Visual assets and copy are checked against digital advertising guidelines.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.dotPending}>
              <Text style={styles.stepNumPending}>3</Text>
            </View>
            <View style={styles.timelineItemContent}>
              <Text style={styles.timelineItemTitle}>Community Amplification Starts</Text>
              <Text style={styles.timelineItemDesc}>
                Once approved, backers can fund message distribution across your chosen channels.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {campaign ? (
            <AppButton
              title="View Campaign Status"
              onPress={() => setShowStatusModal(true)}
              variant="outline"
              size="lg"
              fullWidth
              icon={<Ionicons name="receipt-outline" size={18} color={Palette.navy900} />}
            />
          ) : null}

          <AppButton
            title="Create Another Campaign"
            onPress={handleCreateAnother}
            variant="secondary"
            size="lg"
            fullWidth
            icon={<Ionicons name="add-circle-outline" size={18} color={Palette.navy900} />}
          />

          <AppButton
            title="Go Home"
            onPress={handleGoHome}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="home-outline" size={18} color={Palette.pureWhite} />}
          />
        </View>
      </View>

      {/* Campaign Status Modal */}
      {campaign ? (
        <Modal
          visible={showStatusModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowStatusModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Campaign Review Dossier</Text>
              <Pressable
                onPress={() => setShowStatusModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Palette.navy950} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalStatusBanner}>
                <View style={styles.statusDot} />
                <Text style={styles.modalStatusHeading}>SUBMITTED_FOR_REVIEW</Text>
              </View>

              <Text style={styles.modalSectionLabel}>Campaign Title</Text>
              <Text style={styles.modalSectionVal}>{campaign.title}</Text>

              <Text style={styles.modalSectionLabel}>Topic Category</Text>
              <Text style={styles.modalSectionVal}>{campaign.category}</Text>

              <Text style={styles.modalSectionLabel}>Funding Target</Text>
              <Text style={styles.modalSectionVal}>{formatCurrency(campaign.goal)}</Text>

              <Text style={styles.modalSectionLabel}>Estimated Audience Reach</Text>
              <Text style={styles.modalSectionVal}>
                {formatReachEstimate(campaign.estimatedReachMin, campaign.estimatedReachMax)} impressions
              </Text>

              <Text style={styles.modalSectionLabel}>Distribution Channels</Text>
              <Text style={styles.modalSectionVal}>
                {campaign.distributionChannels.join(', ') || 'Meta Ads, Google Display'}
              </Text>

              <Text style={styles.modalSectionLabel}>Supporting Sources</Text>
              {campaign.supportingSources.length === 0 ? (
                <Text style={styles.modalSectionVal}>None attached</Text>
              ) : (
                campaign.supportingSources.map((s, idx) => (
                  <View key={idx} style={styles.modalSourceRow}>
                    <Text style={styles.modalSourceTitle}>• {s.title}</Text>
                    <Text style={styles.modalSourceUrl}>{s.url}</Text>
                  </View>
                ))
              )}

              <View style={styles.noticeBox}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Palette.primary700} />
                <Text style={styles.noticeText}>
                  Your campaign is queued for verification. No live advertising spend occurs until our editorial board certifies the evidence and approves the creative.
                </Text>
              </View>

              <AppButton
                title="Close Dossier"
                onPress={() => setShowStatusModal(false)}
                variant="primary"
                size="md"
                fullWidth
                style={styles.modalActionBtn}
              />
            </ScrollView>
          </View>
        </Modal>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.success600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Palette.success600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    color: Palette.navy950,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.neutral600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
    maxWidth: 320,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.warning50,
    borderWidth: 1,
    borderColor: Palette.warning200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.warning600,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.warning800,
    letterSpacing: 0.5,
  },
  campaignSnapshotCard: {
    width: '100%',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  snapshotCover: {
    width: '100%',
    height: 120,
  },
  snapshotBody: {
    padding: Spacing.md,
  },
  snapshotTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    marginBottom: 4,
  },
  snapshotMeta: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: Spacing.xs,
  },
  viewStatusLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  viewStatusLinkText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.primary700,
  },
  timelineCard: {
    width: '100%',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timelineHeading: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    marginBottom: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  dotActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.primary700,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNum: {
    color: Palette.pureWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  dotPending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumPending: {
    color: Palette.neutral600,
    fontSize: 11,
    fontWeight: '700',
  },
  timelineItemContent: {
    flex: 1,
  },
  timelineItemTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
    marginBottom: 2,
  },
  timelineItemDesc: {
    ...Typography.caption,
    color: Palette.neutral500,
    lineHeight: 16,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Palette.warmWhite,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral200,
    backgroundColor: Palette.pureWhite,
  },
  modalTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.warning50,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.warning200,
    marginBottom: Spacing.md,
  },
  modalStatusHeading: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.warning800,
  },
  modalSectionLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.neutral500,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSectionVal: {
    ...Typography.body,
    color: Palette.navy950,
    marginTop: 2,
  },
  modalSourceRow: {
    marginTop: 4,
  },
  modalSourceTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
  },
  modalSourceUrl: {
    ...Typography.caption,
    color: Palette.primary700,
    marginLeft: 12,
  },
  noticeBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  noticeText: {
    ...Typography.caption,
    color: Palette.neutral600,
    flex: 1,
    lineHeight: 16,
  },
  modalActionBtn: {
    marginTop: Spacing.sm,
  },
});
