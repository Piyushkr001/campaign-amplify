import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';

export default function CreateSuccessScreen() {
  const router = useRouter();
  const resetDraft = useCampaignDraftStore((state) => state.resetDraft);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Reset draft store on successful submission
    resetDraft();
  }, [resetDraft]);

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleExplore = () => {
    router.replace('/(tabs)/explore');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={40} color={Palette.pureWhite} />
        </View>

        <Text style={styles.title}>Submitted for Review</Text>
        <Text style={styles.subtitle}>
          Your campaign message has entered the editorial review queue. Our compliance team verifies
          factual claims and ad creative specifications within 24–48 hours.
        </Text>

        {/* Process Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeading}>What Happens Next</Text>

          <View style={styles.timelineItem}>
            <View style={styles.dotActive} />
            <View style={styles.timelineItemContent}>
              <Text style={styles.timelineItemTitle}>1. Citation & Claim Audit</Text>
              <Text style={styles.timelineItemDesc}>
                Editors cross-reference your submitted sources with independent reports.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.dotPending} />
            <View style={styles.timelineItemContent}>
              <Text style={styles.timelineItemTitle}>2. Ad Creative Optimization</Text>
              <Text style={styles.timelineItemDesc}>
                Visuals are formatted for target digital ad networks and social feeds.
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.dotPending} />
            <View style={styles.timelineItemContent}>
              <Text style={styles.timelineItemTitle}>3. Live Amplification</Text>
              <Text style={styles.timelineItemDesc}>
                Once approved, community backers can fund message distribution.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <AppButton
            title="Explore Active Campaigns"
            onPress={handleExplore}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.primaryBtn}
          />

          <AppButton
            title="Back to Home"
            onPress={handleGoHome}
            variant="secondary"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Palette.success600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Palette.success600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    ...Typography.h1,
    color: Palette.navy950,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.neutral600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    maxWidth: 320,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.primary600,
    marginTop: 4,
  },
  dotPending: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.neutral300,
    marginTop: 4,
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
  primaryBtn: {
    marginBottom: 4,
  },
});
