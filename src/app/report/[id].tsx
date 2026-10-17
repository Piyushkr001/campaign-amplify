import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { useCampaign } from '@/hooks/useCampaigns';
import { formatCurrency, formatReachRange } from '@/utils/formatters';

export default function CampaignReportPlaceholderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: campaign } = useCampaign(id || '');

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
        <Text style={styles.navTitle}>Campaign Report</Text>
        <View style={styles.spacer} />
      </View>

      {/* Main Container */}
      <View style={styles.contentCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-text-outline" size={36} color={Palette.primary700} />
        </View>

        <Text style={styles.title}>Distribution & Analytics Report</Text>
        <Text style={styles.subtitle}>
          Full campaign impressions, click-through rates, and publisher delivery receipts.
        </Text>

        <View style={styles.phaseNotice}>
          <Ionicons name="sparkles-outline" size={16} color={Palette.primary700} />
          <Text style={styles.phaseNoticeText}>
            Phase 2 Analytics Roadmap: Deep impression analytics and ad network performance exports are scheduled for the next release.
          </Text>
        </View>

        {/* Campaign Snapshot */}
        {campaign ? (
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotHeading}>Campaign Delivery Snapshot</Text>
            <Text style={styles.campaignTitle}>{campaign.title}</Text>
            <Text style={styles.creatorName}>Organized by {campaign.creator}</Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Funded</Text>
                <Text style={styles.metricValue}>{formatCurrency(campaign.raised)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Backers</Text>
                <Text style={styles.metricValue}>{campaign.backerCount}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Impressions</Text>
                <Text style={styles.metricValue}>
                  {formatReachRange(campaign.estimatedReachMin, campaign.estimatedReachMax)}
                </Text>
              </View>
            </View>

            <View style={styles.channelsRow}>
              <Text style={styles.channelsLabel}>Verified Placements:</Text>
              <Text style={styles.channelsVal}>
                {campaign.distributionChannels.join(', ')}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            title="Return to Campaign"
            onPress={() => (id ? router.replace(`/campaign/${id}`) : router.back())}
            variant="primary"
            size="lg"
            fullWidth
          />
          <AppButton
            title="Explore Other Campaigns"
            onPress={() => router.replace('/(tabs)/explore')}
            variant="outline"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
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
  spacer: {
    width: 36,
  },
  contentCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.navy950,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  phaseNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.primary50,
    borderColor: Palette.primary100,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
    marginBottom: Spacing.md,
    width: '100%',
  },
  phaseNoticeText: {
    ...Typography.caption,
    color: Palette.primary900,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  snapshotCard: {
    width: '100%',
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  snapshotHeading: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral400,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  campaignTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  creatorName: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: Spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Palette.neutral200,
    marginVertical: Spacing.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Palette.neutral400,
    textTransform: 'uppercase',
  },
  metricValue: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.navy900,
    marginTop: 2,
  },
  channelsRow: {
    marginTop: Spacing.xs,
  },
  channelsLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
  },
  channelsVal: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.navy900,
    fontWeight: '600',
    marginTop: 1,
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
});
