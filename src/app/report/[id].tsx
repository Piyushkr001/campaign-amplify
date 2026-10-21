import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { Config } from '@/constants/config';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { useCampaign } from '@/hooks/useCampaigns';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useCampaignReport } from '@/hooks/useReport';
import { getOrGenerateCampaignReport } from '@/data/campaign-reports';
import { ReportMetricCard } from '@/components/report/ReportMetricCard';
import { ChannelResultCard } from '@/components/report/ChannelResultCard';
import { ReportDisclaimer } from '@/components/report/ReportDisclaimer';
import { formatCurrency, formatNumber, formatReachRange } from '@/utils/formatters';

export default function CampaignReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch from TanStack Query (public) or from user store (creator/local demo)
  const { data: publicCampaign } = useCampaign(id || '');
  const userCampaign = useMyCampaignsStore((s) => s.campaigns.find((c) => c.id === id));
  const campaign = publicCampaign || userCampaign;

  // Access rules: reports are only available for PROMOTING or COMPLETED campaigns
  const hasDistribution =
    Boolean(campaign) && (campaign!.status === 'PROMOTING' || campaign!.status === 'COMPLETED');

  // Server-backed report in API mode
  const isApiEnabled = Config.useApi && Boolean(campaign?.id) && hasDistribution;
  const {
    data: apiReport,
    isLoading: isReportLoading,
    isError: isReportError,
    refetch: refetchReport,
  } = useCampaignReport(campaign?.id || '', isApiEnabled);

  if (!campaign) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
          <Text style={styles.navTitle}>Campaign Report</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={48} color={Palette.neutral400} />
          <Text style={styles.emptyTitle}>Campaign Not Found</Text>
          <Text style={styles.emptyText}>
            Unable to locate campaign reporting records for this identifier.
          </Text>
          <AppButton
            title="Back to Campaigns"
            onPress={() => router.replace('/(tabs)/explore')}
            variant="outline"
            size="md"
          />
        </View>
      </ScreenContainer>
    );
  }

  if (!hasDistribution) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
          <Text style={styles.navTitle}>Campaign Report</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.pendingCard}>
          <View style={styles.pendingIconCircle}>
            <Ionicons name="time-outline" size={40} color={Palette.primary700} />
          </View>
          <Text style={styles.pendingTitle}>Report Not Yet Available</Text>
          <Text style={styles.pendingSubtitle}>
            Detailed distribution analytics and publisher delivery data become available once a
            campaign completes funding and begins advertising promotion.
          </Text>
          <View style={styles.currentStatusBadge}>
            <Text style={styles.currentStatusLabel}>Current Status:</Text>
            <Text style={styles.currentStatusValue}>{campaign.status.replace(/_/g, ' ')}</Text>
          </View>

          <View style={styles.pendingActions}>
            <AppButton
              title="Return to Campaign"
              onPress={() => router.replace(`/campaign/${campaign.id}`)}
              variant="primary"
              size="md"
              fullWidth
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Loading state in API mode
  if (Config.useApi && isReportLoading && !apiReport) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
          <Text style={styles.navTitle}>Campaign Report</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Palette.primary700} />
          <Text style={styles.loadingText}>Loading campaign distribution report...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state in API mode (when no cached data exists)
  if (Config.useApi && isReportError && !apiReport) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
          <Text style={styles.navTitle}>Campaign Report</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.emptyCard}>
          <Ionicons name="alert-circle-outline" size={48} color={Palette.amber600} />
          <Text style={styles.emptyTitle}>Unable to Load Report</Text>
          <Text style={styles.emptyText}>
            We encountered a problem retrieving the distribution report from the server.
          </Text>
          <AppButton
            title="Retry"
            onPress={() => refetchReport()}
            variant="primary"
            size="md"
          />
        </View>
      </ScreenContainer>
    );
  }

  // Fetch or generate mathematical prototype report (API report in API mode, deterministic local fallback in local mode)
  const localReport = getOrGenerateCampaignReport(campaign);
  const report = (Config.useApi && apiReport) ? apiReport : localReport;
  const isInterim = campaign.status === 'PROMOTING';
  const unspentBudget = Math.max(0, report.advertisingAllocation - report.advertisingSpend);

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Top Navigation */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.navTitle}>
          {isInterim ? 'Distribution Progress' : 'Final Campaign Report'}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* Campaign Header */}
      <View style={styles.headerCard}>
        <View style={styles.statusBadgeRow}>
          <View
            style={[
              styles.statusBadge,
              isInterim ? styles.statusBadgeActive : styles.statusBadgeCompleted,
            ]}>
            <View
              style={[
                styles.statusDot,
                isInterim ? styles.statusDotActive : styles.statusDotCompleted,
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                isInterim ? styles.statusBadgeTextActive : styles.statusBadgeTextCompleted,
              ]}>
              {isInterim ? 'Promotion In Progress' : 'Distribution Completed'}
            </Text>
          </View>
          <Text style={styles.categoryBadge}>{campaign.category.toUpperCase()}</Text>
        </View>

        <Text style={styles.campaignTitle}>{campaign.title}</Text>
        <Text style={styles.creatorMeta}>Organized by {campaign.creator}</Text>

        <View style={styles.durationRow}>
          <Ionicons name="calendar-outline" size={14} color={Palette.neutral500} />
          <Text style={styles.durationText}>
            Distribution Duration: {report.durationDays} days
            {report.startedAt
              ? ` • Started ${new Date(report.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
              : ''}
            {report.completedAt
              ? ` • Completed ${new Date(report.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
              : isInterim
              ? ' • In Delivery'
              : ''}
          </Text>
        </View>
      </View>

      {/* Section 1: Funding & Use of Funds Summary */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Funding & Ad Budget Breakdown</Text>
        <Text style={styles.sectionSubtitle}>
          Community contributions strictly fund message amplification and advertising distribution.
        </Text>

        <View style={styles.metricsRow}>
          <ReportMetricCard
            label="Total Funds Raised"
            value={formatCurrency(report.fundsRaised)}
            subValue={`${campaign.backerCount} backers`}
            accent
          />
          <ReportMetricCard
            label="Ad Allocation"
            value={formatCurrency(report.advertisingAllocation)}
            subValue={`${Config.feeStructure.advertisingPercentage}% dedicated`}
          />
        </View>

        <View style={styles.metricsRow}>
          <ReportMetricCard
            label="Advertising Spend"
            value={formatCurrency(report.advertisingSpend)}
            subValue={isInterim ? 'In progress' : 'Delivered'}
          />
          <ReportMetricCard
            label="Unspent Budget"
            value={formatCurrency(unspentBudget)}
            subValue={isInterim ? 'Allocated' : 'Complete'}
          />
        </View>

        {/* Fee Disclosures */}
        <View style={styles.feeBreakdown}>
          <View style={styles.feeItem}>
            <Text style={styles.feeLabel}>
              Platform Operations ({Config.feeStructure.platformFeePercentage}%)
            </Text>
            <Text style={styles.feeValue}>{formatCurrency(report.platformFee)}</Text>
          </View>
          <View style={styles.feeItem}>
            <Text style={styles.feeLabel}>
              Payment Processing ({Config.feeStructure.paymentProcessingPercentage}%)
            </Text>
            <Text style={styles.feeValue}>{formatCurrency(report.processingFee)}</Text>
          </View>
        </View>
      </View>

      {/* Section 2: Estimated Before Distribution */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Estimated Before Distribution</Text>
          <View style={styles.estBadge}>
            <Text style={styles.estBadgeText}>Pre-Launch Estimate</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          These values were estimates calculated before campaign distribution based on platform
          impression benchmarks.
        </Text>

        <View style={styles.estimateBox}>
          <Text style={styles.estimateLabel}>Estimated Impressions</Text>
          <Text style={styles.estimateValue}>
            {formatReachRange(report.estimatedImpressionsMin, report.estimatedImpressionsMax)}
          </Text>
          <Text style={styles.estimateNote}>
            Estimated impressions use the prototype assumption of approximately 20–30 impressions
            per advertising dollar across targeted channels.
          </Text>
        </View>
      </View>

      {/* Section 3: Measured Demo Results */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Measured Demo Results</Text>
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>Prototype Demo Data</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          These delivery metrics are seeded prototype data used to demonstrate campaign reporting.
          They are not connected to a live advertising provider.
        </Text>

        <View style={styles.metricsRow}>
          <ReportMetricCard
            label="Demo Impressions"
            value={formatNumber(report.measuredImpressions || 0)}
            subValue="Ad views rendered"
            badge="Demo"
          />
          <ReportMetricCard
            label="Demo Reach"
            value={formatNumber(report.measuredReach || 0)}
            subValue="Unique audience"
            badge="Demo"
          />
        </View>

        <View style={styles.metricsRow}>
          <ReportMetricCard
            label="Demo Clicks"
            value={formatNumber(report.clicks || 0)}
            subValue="Direct interactions"
            badge="Demo"
          />
          <ReportMetricCard
            label="Demo CTR"
            value={`${(report.ctr || 0).toFixed(2)}%`}
            subValue="Click-through rate"
            badge="Demo"
          />
        </View>
      </View>

      {/* Section 4: Channel Performance */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Configured Channel Performance</Text>
        <Text style={styles.sectionSubtitle}>
          Breakdown of allocated ad spend and prototype impression delivery across configured ad
          networks.
        </Text>

        {report.channelResults.map((channelResult, index) => (
          <ChannelResultCard key={`${channelResult.channel}-${index}`} result={channelResult} />
        ))}
      </View>

      {/* Section 5: Methodology & Prototype Disclaimer */}
      <ReportDisclaimer isDemoData={report.isDemoData} />

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <AppButton
          title="Return to Campaign"
          onPress={() => router.replace(`/campaign/${campaign.id}`)}
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
  headerCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  statusBadgeActive: {
    backgroundColor: Palette.primary50,
  },
  statusBadgeCompleted: {
    backgroundColor: Palette.success50,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: Palette.primary600,
  },
  statusDotCompleted: {
    backgroundColor: Palette.success700,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: Palette.primary800,
  },
  statusBadgeTextCompleted: {
    color: Palette.success700,
  },
  categoryBadge: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral500,
  },
  campaignTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
    marginBottom: 4,
  },
  creatorMeta: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.neutral500,
    marginBottom: Spacing.xs,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderColor: Palette.neutral100,
  },
  durationText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  sectionCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  feeBreakdown: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    gap: 4,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  feeValue: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy900,
  },
  estBadge: {
    backgroundColor: Palette.primary50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  estBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.primary800,
  },
  demoBadge: {
    backgroundColor: Palette.amber50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Palette.amber200,
  },
  demoBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.amber900,
  },
  estimateBox: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  estimateLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral400,
    textTransform: 'uppercase',
  },
  estimateValue: {
    ...Typography.h2,
    fontSize: 22,
    color: Palette.navy950,
    marginVertical: 4,
  },
  estimateNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    textAlign: 'center',
  },
  bottomActions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  pendingCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  pendingIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  pendingTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  pendingSubtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.xl,
  },
  currentStatusLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  currentStatusValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.navy900,
  },
  pendingActions: {
    width: '100%',
  },
  emptyCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Palette.navy950,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    textAlign: 'center',
  },
  loadingCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    textAlign: 'center',
  },
});
