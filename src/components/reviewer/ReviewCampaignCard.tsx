import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Campaign } from '@/types/campaign';
import { CampaignStatusBadge } from '@/components/campaign/CampaignStatusBadge';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { formatCurrency, formatReachRange } from '@/utils/formatters';

interface ReviewCampaignCardProps {
  campaign: Campaign;
  onPressReview: () => void;
}

export function ReviewCampaignCard({ campaign, onPressReview }: ReviewCampaignCardProps) {
  const submittedDate = campaign.submittedAt || campaign.createdAt
    ? new Date(campaign.submittedAt || campaign.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <View style={styles.card}>
      {/* Header: Cover thumbnail & meta */}
      <View style={styles.headerRow}>
        <Image
          source={{ uri: campaign.coverImage }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.headerInfo}>
          <View style={styles.statusRow}>
            <CampaignStatusBadge status={campaign.status} size="sm" />
            <Text style={styles.categoryText}>{campaign.category}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={styles.creatorText} numberOfLines={1}>
            Creator: {campaign.creator}
          </Text>
        </View>
      </View>

      {/* Meta Bar */}
      <View style={styles.metaBar}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Funding Goal</Text>
          <Text style={styles.metaValue}>{formatCurrency(campaign.goal)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Estimated Reach</Text>
          <Text style={styles.metaValue}>
            {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Submitted</Text>
          <Text style={styles.metaValue}>{submittedDate}</Text>
        </View>
      </View>

      {/* Source Count Indicator */}
      <View style={styles.sourcesIndicatorRow}>
        <Ionicons name="document-text-outline" size={14} color={Palette.primary700} />
        <Text style={styles.sourcesIndicatorText}>
          {campaign.supportingSources.length} Supporting Source
          {campaign.supportingSources.length === 1 ? '' : 's'} Attached
        </Text>
      </View>

      {/* Action Button */}
      <Pressable
        onPress={onPressReview}
        accessibilityRole="button"
        accessibilityLabel={`Review campaign ${campaign.title}`}
        style={({ pressed }) => [styles.reviewBtn, pressed && styles.reviewBtnPressed]}>
        <Text style={styles.reviewBtnText}>Inspect & Review Campaign</Text>
        <Ionicons name="arrow-forward" size={14} color={Palette.pureWhite} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.neutral100,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryText: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral500,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    lineHeight: 18,
  },
  creatorText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Palette.neutral400,
    textTransform: 'uppercase',
  },
  metaValue: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.navy900,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: Palette.neutral200,
  },
  sourcesIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  sourcesIndicatorText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.primary700,
    fontWeight: '600',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.navy900,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    gap: 6,
  },
  reviewBtnPressed: {
    opacity: 0.85,
  },
  reviewBtnText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.pureWhite,
  },
});
