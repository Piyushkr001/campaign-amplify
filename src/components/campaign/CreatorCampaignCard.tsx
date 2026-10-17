import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Campaign } from '@/types/campaign';
import { CampaignStatusBadge } from './CampaignStatusBadge';
import { CAMPAIGN_STATUS_CONFIG } from '@/constants/campaign-status';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  calculateFundingProgress,
  formatCurrency,
  formatReachRange,
} from '@/utils/formatters';

interface CreatorCampaignCardProps {
  campaign: Campaign;
  onPress: () => void;
  onPrimaryAction?: () => void;
}

export function CreatorCampaignCard({
  campaign,
  onPress,
  onPrimaryAction,
}: CreatorCampaignCardProps) {
  const config = CAMPAIGN_STATUS_CONFIG[campaign.status] || {
    creatorAction: 'View Details',
  };

  const { clampedPercentage } = calculateFundingProgress(campaign.raised, campaign.goal);
  const isFundingActive =
    campaign.status === 'FUNDING' ||
    campaign.status === 'FUNDING_GOAL_REACHED' ||
    campaign.status === 'PROMOTING' ||
    campaign.status === 'COMPLETED';

  const submittedDateFormatted = campaign.submittedAt || campaign.createdAt
    ? new Date(campaign.submittedAt || campaign.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Campaign: ${campaign.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {/* Top Media & Category / Status Header */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: campaign.coverImage }}
          style={styles.coverImage}
          contentFit="cover"
          transition={250}
        />
        <View style={styles.statusBadgeOverlay}>
          <CampaignStatusBadge status={campaign.status} size="sm" />
        </View>
        <View style={styles.categoryBadgeOverlay}>
          <Text style={styles.categoryText}>{campaign.category}</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>

        {/* Action Required Callout if CHANGES_REQUESTED */}
        {campaign.status === 'CHANGES_REQUESTED' && campaign.reviewFeedback && (
          <View style={styles.actionCallout}>
            <Ionicons name="alert-circle" size={14} color={Palette.amber700} />
            <Text style={styles.actionCalloutText} numberOfLines={1}>
              Feedback: {campaign.reviewFeedback}
            </Text>
          </View>
        )}

        {/* Metrics Section */}
        {isFundingActive ? (
          <View style={styles.metricsContainer}>
            <View style={styles.fundingNumbersRow}>
              <Text style={styles.raisedAmount}>{formatCurrency(campaign.raised)}</Text>
              <Text style={styles.goalAmount}>of {formatCurrency(campaign.goal)} goal</Text>
            </View>
            <ProgressBar
              progress={clampedPercentage}
              height={5}
              color={Palette.primary600}
              style={styles.progressBar}
            />
          </View>
        ) : (
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Funding Target:</Text>
            <Text style={styles.goalTarget}>{formatCurrency(campaign.goal)}</Text>
          </View>
        )}

        {/* Footer Meta Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="megaphone-outline" size={12} color={Palette.primary700} />
            <Text style={styles.metaText}>
              {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)} imp.
            </Text>
          </View>

          {submittedDateFormatted && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={Palette.neutral400} />
              <Text style={styles.metaText}>{submittedDateFormatted}</Text>
            </View>
          )}
        </View>

        {/* Primary Action Button */}
        <Pressable
          onPress={onPrimaryAction || onPress}
          accessibilityRole="button"
          accessibilityLabel={config.creatorAction}
          style={({ pressed }) => [
            styles.actionButton,
            campaign.status === 'CHANGES_REQUESTED' && styles.actionButtonWarning,
            pressed && styles.actionButtonPressed,
          ]}>
          <Text
            style={[
              styles.actionButtonText,
              campaign.status === 'CHANGES_REQUESTED' && styles.actionButtonTextWarning,
            ]}>
            {config.creatorAction}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={14}
            color={
              campaign.status === 'CHANGES_REQUESTED'
                ? Palette.amber800
                : Palette.primary700
            }
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  coverContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: Palette.neutral100,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  categoryBadgeOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  categoryText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.pureWhite,
  },
  body: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  actionCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
    marginVertical: 4,
  },
  actionCalloutText: {
    ...Typography.caption,
    color: Palette.amber900,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  metricsContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  fundingNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  raisedAmount: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.primary700,
  },
  goalAmount: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  progressBar: {
    marginTop: 6,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  goalLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  goalTarget: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy900,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral100,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral600,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Palette.primary50,
    borderColor: Palette.primary100,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 9,
  },
  actionButtonWarning: {
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.primary700,
    fontSize: 13,
  },
  actionButtonTextWarning: {
    color: Palette.amber800,
  },
});
