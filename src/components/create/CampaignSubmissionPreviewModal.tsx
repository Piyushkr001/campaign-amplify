import React from 'react';
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
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { CampaignDraft } from '@/types/campaign';
import { Config } from '@/constants/config';
import { formatCurrency } from '@/utils/formatters';
import { calculateUseOfFunds, estimateReach, formatReachEstimate } from '@/utils/reach';
import { AdCreativePreview } from './AdCreativePreview';

export interface CampaignSubmissionPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  draft: CampaignDraft;
}

export const CampaignSubmissionPreviewModal: React.FC<CampaignSubmissionPreviewModalProps> = ({
  visible,
  onClose,
  draft,
}) => {
  const goal = draft.fundingGoal || 2500;
  const reach = estimateReach(goal);
  const funds = calculateUseOfFunds(goal);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.previewTagBadge}>
            <Ionicons name="eye-outline" size={13} color={Palette.warning700} />
            <Text style={styles.previewTagText}>PREVIEW — NOT PUBLISHED</Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close campaign preview"
            style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={Palette.navy950} />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Cover Media */}
          {draft.coverImage && (
            <View style={styles.coverWrapper}>
              <Image source={{ uri: draft.coverImage }} style={styles.coverImage} contentFit="cover" />
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{draft.category}</Text>
              </View>
            </View>
          )}

          {/* Core Info */}
          <View style={styles.sectionCard}>
            <Text style={styles.title}>{draft.title || 'Untitled Campaign'}</Text>
            <View style={styles.creatorRow}>
              <Ionicons name="shield-checkmark" size={14} color={Palette.primary700} />
              <Text style={styles.creatorText}>By {draft.creatorName || 'Anonymous Creator'}</Text>
            </View>
            <Text style={styles.summary}>{draft.summary}</Text>
          </View>

          {/* Funding & Amplification Estimates */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Funding Goal & Reach</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Funding Target</Text>
                <Text style={styles.statValue}>{formatCurrency(goal)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Estimated Views</Text>
                <Text style={styles.statValue}>{formatReachEstimate(reach.min, reach.max)}</Text>
              </View>
            </View>

            {/* Funds breakdown */}
            <View style={styles.fundsCard}>
              <Text style={styles.fundsTitle}>Use of Funds Breakdown</Text>
              <View style={styles.fundRow}>
                <Text style={styles.fundLabel}>
                  Direct Paid Advertising ({Config.feeStructure.advertisingPercentage}%)
                </Text>
                <Text style={styles.fundAmount}>{formatCurrency(funds.advertising)}</Text>
              </View>
              <View style={styles.fundRow}>
                <Text style={styles.fundLabel}>
                  Platform Operations & Verification ({Config.feeStructure.platformFeePercentage}%)
                </Text>
                <Text style={styles.fundAmount}>{formatCurrency(funds.platformFee)}</Text>
              </View>
              <View style={styles.fundRow}>
                <Text style={styles.fundLabel}>
                  Payment Processing ({Config.feeStructure.paymentProcessingPercentage}%)
                </Text>
                <Text style={styles.fundAmount}>{formatCurrency(funds.paymentProcessing)}</Text>
              </View>
            </View>
          </View>

          {/* Editorial Story */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Editorial Story</Text>
            {draft.storyHeadline ? <Text style={styles.storyHeadline}>{draft.storyHeadline}</Text> : null}
            {draft.storyIntro ? <Text style={styles.storyIntro}>{draft.storyIntro}</Text> : null}
            <Text style={styles.storyContent}>{draft.storyContent || 'No story content provided.'}</Text>

            {/* Optional Story Visual */}
            {draft.storyImage && (
              <View style={styles.storyImageContainer}>
                <Image source={{ uri: draft.storyImage }} style={styles.storyImage} contentFit="cover" />
                {(draft.storyImageCaption || draft.storyImageCredit) && (
                  <View style={styles.storyCaptionWrapper}>
                    {draft.storyImageCaption ? (
                      <Text style={styles.storyCaptionText}>{draft.storyImageCaption}</Text>
                    ) : null}
                    {draft.storyImageCredit ? (
                      <Text style={styles.storyCreditText}>Credit: {draft.storyImageCredit}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Supporting Sources */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Supporting Sources ({draft.sources.length})</Text>
            {draft.sources.length === 0 ? (
              <Text style={styles.emptySourcesText}>No supporting sources added.</Text>
            ) : (
              draft.sources.map((src, index) => (
                <View key={src.id || index} style={styles.sourceItem}>
                  <View style={styles.sourceIndexBadge}>
                    <Text style={styles.sourceIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.sourceContent}>
                    <Text style={styles.sourceTitle}>{src.title}</Text>
                    {src.publisher ? <Text style={styles.sourcePublisher}>Publisher: {src.publisher}</Text> : null}
                    <Text style={styles.sourceUrl} numberOfLines={1}>
                      {src.url}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Advertising Creative */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Digital Ad Creative</Text>
            <AdCreativePreview
              imageUri={draft.adImage || draft.coverImage}
              headline={draft.adHeadline}
              description={draft.adDescription}
              ctaText={draft.adCTA}
              sponsorName={draft.creatorName || 'Amplify Campaign'}
            />
          </View>

          {/* Distribution Targeting */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Distribution Preferences</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Target Locations:</Text>
              <Text style={styles.detailValue}>{draft.locations.join(', ') || 'None specified'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interests:</Text>
              <Text style={styles.detailValue}>{draft.interests.join(', ') || 'None specified'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Channels:</Text>
              <Text style={styles.detailValue}>{draft.channels.join(', ') || 'None specified'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{draft.durationDays || 14} days</Text>
            </View>
            {draft.audienceDescription ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Audience Note:</Text>
                <Text style={styles.detailValue}>{draft.audienceDescription}</Text>
              </View>
            ) : null}
          </View>

          {/* Bottom Close Button */}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
            style={styles.bottomCloseBtn}>
            <Text style={styles.bottomCloseText}>Done Reviewing</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.warmWhite,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral200,
    backgroundColor: Palette.pureWhite,
  },
  previewTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.warning50,
    borderWidth: 1,
    borderColor: Palette.warning200,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  previewTagText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.warning800,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  coverWrapper: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.md,
    backgroundColor: Palette.neutral200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Palette.navy950,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    fontSize: 20,
    color: Palette.navy950,
    marginBottom: 6,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  creatorText: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    fontWeight: '600',
  },
  summary: {
    ...Typography.body,
    color: Palette.navy800,
    lineHeight: 22,
  },
  sectionHeading: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Palette.neutral200,
  },
  statLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: 2,
  },
  statValue: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.primary700,
  },
  fundsCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  fundsTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: Spacing.xs,
  },
  fundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral200,
  },
  fundLabel: {
    ...Typography.caption,
    color: Palette.neutral600,
    flex: 1,
  },
  fundAmount: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.navy900,
  },
  storyHeadline: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: 6,
  },
  storyIntro: {
    ...Typography.body,
    fontStyle: 'italic',
    color: Palette.navy800,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  storyContent: {
    ...Typography.body,
    color: Palette.navy900,
    lineHeight: 24,
  },
  storyImageContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Palette.neutral100,
  },
  storyImage: {
    width: '100%',
    height: 180,
  },
  storyCaptionWrapper: {
    padding: Spacing.xs,
    backgroundColor: Palette.neutral50,
  },
  storyCaptionText: {
    ...Typography.caption,
    color: Palette.neutral700,
  },
  storyCreditText: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral500,
    marginTop: 2,
  },
  emptySourcesText: {
    ...Typography.bodySmall,
    color: Palette.neutral400,
  },
  sourceItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  sourceIndexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIndexText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral600,
  },
  sourceContent: {
    flex: 1,
  },
  sourceTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  sourcePublisher: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  sourceUrl: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.primary700,
    marginTop: 1,
  },
  detailRow: {
    paddingVertical: 4,
  },
  detailLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.neutral500,
  },
  detailValue: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    marginTop: 1,
  },
  bottomCloseBtn: {
    backgroundColor: Palette.navy950,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  bottomCloseText: {
    ...Typography.button,
    color: Palette.pureWhite,
  },
});
