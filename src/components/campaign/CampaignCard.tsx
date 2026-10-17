import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { Campaign } from '@/types/campaign';
import {
  calculateFundingProgress,
  formatCurrency,
  formatDaysRemaining,
  formatReachRange,
} from '@/utils/formatters';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppButton } from '@/components/ui/AppButton';

export interface CampaignCardProps {
  campaign: Campaign;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  style,
  onPress,
}) => {
  const { percentage, clampedPercentage } = calculateFundingProgress(
    campaign.raised,
    campaign.goal
  );

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/campaign/${campaign.id}` as any);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`Campaign: ${campaign.title} by ${campaign.creator}. ${percentage}% funded.`}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}>
      {/* Cover Image with Category Badge & Days Tag */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: campaign.coverImage }}
          style={styles.coverImage}
          contentFit="cover"
          transition={250}
          accessibilityLabel={`${campaign.title} cover image`}
        />

        <View style={styles.badgeOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{campaign.category}</Text>
          </View>

          <View style={styles.daysBadge}>
            <Ionicons name="time-outline" size={12} color={Palette.pureWhite} />
            <Text style={styles.daysBadgeText}>
              {formatDaysRemaining(campaign.daysRemaining)}
            </Text>
          </View>
        </View>
      </View>

      {/* Content Body */}
      <View style={styles.body}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>

        {/* Creator */}
        <View style={styles.creatorRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={Palette.primary600} />
          <Text style={styles.creatorText} numberOfLines={1}>
            {campaign.creator}
          </Text>
        </View>

        {/* Summary */}
        <Text style={styles.summary} numberOfLines={2}>
          {campaign.summary}
        </Text>

        {/* Reach Module */}
        <View style={styles.reachContainer}>
          <View style={styles.reachIconWrapper}>
            <Ionicons name="megaphone-outline" size={14} color={Palette.primary700} />
          </View>
          <View style={styles.reachTextWrapper}>
            <Text style={styles.reachLabel}>Estimated Impressions</Text>
            <Text style={styles.reachValue}>
              {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)} impressions
            </Text>
          </View>
        </View>

        {/* Funding Stats */}
        <View style={styles.progressSection}>
          <ProgressBar
            progress={clampedPercentage}
            height={7}
            color={Palette.primary600}
            trackColor={Palette.neutral200}
          />

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.raisedAmount}>
                {formatCurrency(campaign.raised)}
              </Text>
              <Text style={styles.goalLabel}>
                amplified of {formatCurrency(campaign.goal)}
              </Text>
            </View>

            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>{percentage}%</Text>
              <Text style={styles.percentageSub}>of goal</Text>
            </View>
          </View>
        </View>

        {/* Action Button Wrapper */}
        <View style={styles.actionContainer} pointerEvents="none">
          <AppButton
            title="Back This Campaign"
            onPress={handlePress}
            variant="primary"
            size="md"
            fullWidth
            icon={<Ionicons name="arrow-forward" size={16} color={Palette.pureWhite} />}
            iconPosition="right"
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardPressed: {
    opacity: 0.96,
    borderColor: Palette.neutral300,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Palette.neutral100,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontWeight: '600',
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  daysBadgeText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontSize: 11,
  },
  body: {
    padding: Spacing.md,
  },
  title: {
    ...Typography.h2,
    fontSize: 18,
    lineHeight: 24,
    color: Palette.navy950,
    marginBottom: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  creatorText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy700,
  },
  summary: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.neutral600,
    marginBottom: Spacing.md,
  },
  reachContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  reachIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  reachTextWrapper: {
    flex: 1,
  },
  reachLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  reachValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy900,
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  raisedAmount: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
  },
  goalLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 1,
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentageText: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.primary700,
    fontWeight: '700',
  },
  percentageSub: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  actionContainer: {
    marginTop: 2,
  },
});
