import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useCampaign } from '@/hooks/useCampaigns';
import { useContributionStore } from '@/store/contribution-store';
import {
  calculateFundingProgress,
  formatCurrency,
  formatReachRange,
} from '@/utils/formatters';
import { calculateUseOfFunds, estimateDirectReach } from '@/utils/reach';

export default function ContributionReviewScreen() {
  const router = useRouter();
  const { campaignId, amount } = useLocalSearchParams<{
    campaignId: string;
    amount?: string;
  }>();

  const { data: campaign } = useCampaign(campaignId || '');
  const { currentContribution } = useContributionStore();

  const contributionAmount = amount ? parseInt(amount, 10) : currentContribution?.amount || 50;

  // Total Payment = Contribution Amount
  // Internally split into: Advertising (85%), Platform (10%), Processing (5%)
  const funds = calculateUseOfFunds(contributionAmount);
  const reach = estimateDirectReach(funds.advertising);

  const goal = campaign?.goal || 2500;
  const currentRaised = campaign?.raised || 0;
  const newRaised = currentRaised + contributionAmount;
  const { clampedPercentage: currentPercent } = calculateFundingProgress(currentRaised, goal);
  const { clampedPercentage: newPercent } = calculateFundingProgress(newRaised, goal);

  const handleContinueToPayment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({
      pathname: '/contribution/payment',
      params: {
        campaignId: campaignId || '',
        amount: contributionAmount.toString(),
      },
    });
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Nav Header */}
      <View style={styles.navRow}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to amount selection"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.navTitle}>Review Contribution</Text>
        <View style={styles.navSpacer} />
      </View>

      {/* Step Indicator Pill */}
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>STEP 2 OF 3: VERIFY BREAKDOWN</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.reviewCard}>
        <Text style={styles.campaignLabel}>CAMPAIGN MESSAGE</Text>
        <Text style={styles.campaignTitle}>{campaign?.title || 'Community Amplification Campaign'}</Text>
        <Text style={styles.creatorMeta}>
          By {campaign?.creator || 'Community Creator'} • {campaign?.category || 'Civic'}
        </Text>

        <View style={styles.divider} />

        {/* Amount Highlight */}
        <View style={styles.amountHighlightBox}>
          <Text style={styles.amountLabel}>Total Contribution</Text>
          <Text style={styles.amountNumber}>{formatCurrency(contributionAmount)}</Text>
          <Text style={styles.amountSubtext}>
            100% of this payment is allocated strictly according to platform policy:
          </Text>
        </View>

        {/* Detailed Breakdown Table */}
        <View style={styles.breakdownTable}>
          <View style={styles.tableRow}>
            <View style={styles.tableRowTitleGroup}>
              <View style={[styles.dotIndicator, { backgroundColor: Palette.primary600 }]} />
              <View>
                <Text style={styles.rowTitle}>Advertising Allocation (85%)</Text>
                <Text style={styles.rowDesc}>Direct media buying on Meta & Google Ads</Text>
              </View>
            </View>
            <Text style={styles.rowValue}>{formatCurrency(funds.advertising)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.tableRowTitleGroup}>
              <View style={[styles.dotIndicator, { backgroundColor: Palette.neutral500 }]} />
              <View>
                <Text style={styles.rowTitle}>Platform Fee (10%)</Text>
                <Text style={styles.rowDesc}>Message review & infrastructure</Text>
              </View>
            </View>
            <Text style={styles.rowValue}>{formatCurrency(funds.platformFee)}</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.tableRowTitleGroup}>
              <View style={[styles.dotIndicator, { backgroundColor: Palette.neutral400 }]} />
              <View>
                <Text style={styles.rowTitle}>Payment Processing (5%)</Text>
                <Text style={styles.rowDesc}>Merchant banking & processing fees</Text>
              </View>
            </View>
            <Text style={styles.rowValue}>{formatCurrency(funds.paymentProcessing)}</Text>
          </View>

          <View style={[styles.tableRow, styles.totalTableRow]}>
            <Text style={styles.totalRowLabel}>Total Payment Charged</Text>
            <Text style={styles.totalRowValue}>{formatCurrency(contributionAmount)}</Text>
          </View>
        </View>
      </View>

      {/* Estimated Reach Impact Card */}
      <View style={styles.reachCard}>
        <View style={styles.reachHeader}>
          <View style={styles.reachIconWrapper}>
            <Ionicons name="sparkles" size={16} color={Palette.pureWhite} />
          </View>
          <View>
            <Text style={styles.reachCardSub}>Projected Advertising Reach</Text>
            <Text style={styles.reachCardValue}>
              {formatReachRange(reach.min, reach.max)} Estimated Impressions
            </Text>
          </View>
        </View>
        <Text style={styles.reachNote}>
          Based on the ${funds.advertising} ad budget and prevailing CPM costs across target networks.
        </Text>
      </View>

      {/* Campaign Funding Progress Simulation */}
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Campaign Funding Impact</Text>
          <Text style={styles.progressPct}>
            {currentPercent}% → {newPercent}%
          </Text>
        </View>
        <ProgressBar progress={newPercent} height={6} color={Palette.primary600} style={styles.progressTrack} />
        <Text style={styles.progressSub}>
          Current: {formatCurrency(currentRaised)} • After your contribution: {formatCurrency(newRaised)} of {formatCurrency(goal)} goal
        </Text>
      </View>

      {/* Mandatory Non-Donation Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Ionicons name="shield-outline" size={18} color={Palette.warning800} />
        <Text style={styles.disclaimerText}>
          This payment funds campaign amplification rather than directly supporting the organization or
          cause. Funds are applied strictly to ad distribution and platform operations.
        </Text>
      </View>

      {/* Refund & Demo Policy */}
      <View style={styles.policyCard}>
        <Text style={styles.policyTitle}>Demo Simulation Policy</Text>
        <Text style={styles.policyText}>
          In this prototype demo, payments are simulated. No real credit card charges will occur. Successful contributions locally update campaign funding totals and issue a verifiable receipt.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.bottomCta}>
        <AppButton
          title={`Pay ${formatCurrency(contributionAmount)} (Simulated)`}
          onPress={handleContinueToPayment}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="card-outline" size={18} color={Palette.pureWhite} />}
        />

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Change contribution amount"
          style={styles.changeAmountBtn}>
          <Text style={styles.changeAmountText}>Change Amount</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
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
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
  },
  navSpacer: {
    width: 36,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.md,
  },
  stepBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary700,
  },
  reviewCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  campaignLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral400,
    letterSpacing: 0.5,
  },
  campaignTitle: {
    ...Typography.h2,
    fontSize: 17,
    color: Palette.navy950,
    marginTop: 2,
    marginBottom: 2,
  },
  creatorMeta: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.neutral100,
    marginVertical: Spacing.md,
  },
  amountHighlightBox: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  amountLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  amountNumber: {
    ...Typography.h1,
    fontSize: 28,
    color: Palette.primary700,
    marginVertical: 2,
  },
  amountSubtext: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    textAlign: 'center',
  },
  breakdownTable: {
    gap: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tableRowTitleGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  rowTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
  },
  rowDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  rowValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  totalTableRow: {
    borderTopWidth: 1,
    borderTopColor: Palette.neutral200,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  totalRowLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Palette.navy950,
  },
  totalRowValue: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.primary700,
  },
  reachCard: {
    backgroundColor: Palette.navy950,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  reachIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachCardSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral300,
  },
  reachCardValue: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.pureWhite,
  },
  reachNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
    lineHeight: 15,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy950,
  },
  progressPct: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.primary700,
  },
  progressTrack: {
    marginVertical: Spacing.xs,
  },
  progressSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.warning50,
    borderWidth: 1,
    borderColor: Palette.warning200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  disclaimerText: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: Palette.warning800,
    flex: 1,
  },
  policyCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  policyTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.navy900,
    marginBottom: 2,
  },
  policyText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral600,
    lineHeight: 15,
  },
  bottomCta: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl * 2,
  },
  changeAmountBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeAmountText: {
    ...Typography.buttonSmall,
    color: Palette.neutral600,
  },
});
