import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface RevisionFeedbackBannerProps {
  feedback: string;
  campaignTitle?: string;
}

export function RevisionFeedbackBanner({
  feedback,
  campaignTitle,
}: RevisionFeedbackBannerProps) {
  if (!feedback) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.headerRow}>
        <Ionicons name="alert-circle" size={16} color={Palette.amber800} />
        <Text style={styles.bannerTitle}>
          Reviewer Requested Changes{campaignTitle ? ` — ${campaignTitle}` : ''}
        </Text>
      </View>
      <Text style={styles.bannerFeedback}>"{feedback}"</Text>
      <Text style={styles.bannerHint}>
        Make your revisions in the relevant step, then submit your changes in Step 5 to return to the review queue.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: Palette.amber50,
    borderWidth: 1,
    borderColor: Palette.amber200,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.amber900,
    fontSize: 12,
  },
  bannerFeedback: {
    ...Typography.bodySmall,
    color: Palette.amber950,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 4,
  },
  bannerHint: {
    ...Typography.caption,
    color: Palette.amber800,
    fontSize: 10,
    lineHeight: 14,
  },
});
