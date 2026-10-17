import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';

interface ReviewFeedbackCardProps {
  feedback: string;
  requestedAt?: string;
  onEditCampaign?: () => void;
  onViewCampaign?: () => void;
}

export function ReviewFeedbackCard({
  feedback,
  requestedAt,
  onEditCampaign,
  onViewCampaign,
}: ReviewFeedbackCardProps) {
  const formattedDate = requestedAt
    ? new Date(requestedAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <Ionicons name="alert-circle" size={18} color={Palette.amber700} />
          <Text style={styles.headerTitle}>Action Required</Text>
        </View>
        {formattedDate && <Text style={styles.dateText}>{formattedDate}</Text>}
      </View>

      <Text style={styles.subHeading}>Reviewer Feedback & Instructions:</Text>

      <View style={styles.feedbackQuoteBox}>
        <Ionicons name="chatbox-ellipses-outline" size={16} color={Palette.amber800} style={styles.quoteIcon} />
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>

      <Text style={styles.helpText}>
        Update the indicated campaign fields or supporting citations to comply with platform standards, then resubmit for approval.
      </Text>

      <View style={styles.actionsRow}>
        {onEditCampaign && (
          <AppButton
            title="Edit Campaign"
            onPress={onEditCampaign}
            variant="primary"
            size="md"
            icon={<Ionicons name="create-outline" size={16} color={Palette.pureWhite} />}
            style={styles.actionBtn}
          />
        )}
        {onViewCampaign && (
          <AppButton
            title="View Campaign"
            onPress={onViewCampaign}
            variant="outline"
            size="md"
            style={styles.actionBtn}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.amber50,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.amber200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.amber900,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  dateText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.amber800,
  },
  subHeading: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.amber950,
    marginTop: 2,
    marginBottom: 6,
  },
  feedbackQuoteBox: {
    flexDirection: 'row',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.amber200,
    padding: Spacing.sm,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  quoteIcon: {
    marginTop: 2,
  },
  feedbackText: {
    ...Typography.bodySmall,
    color: Palette.navy950,
    lineHeight: 18,
    flex: 1,
  },
  helpText: {
    ...Typography.caption,
    color: Palette.amber900,
    lineHeight: 15,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
