import React from 'react';
import {
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useContributionStore } from '@/store/contribution-store';
import { useCampaign } from '@/hooks/useCampaigns';
import {
  calculateFundingProgress,
  formatCurrency,
  formatReachRange,
} from '@/utils/formatters';

import { Config } from '@/constants/config';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ContributionSuccessScreen() {
  const router = useRouter();
  const { paymentId, contributionId } = useLocalSearchParams<{
    paymentId?: string;
    contributionId?: string;
  }>();

  const { getContributionById, getPaymentById } = useContributionStore();

  const contribution = contributionId ? getContributionById(contributionId) : undefined;
  const payment = paymentId ? getPaymentById(paymentId) : undefined;

  // Strict validation: Require actual contribution with SUCCESS status
  const isTransactionValid =
    contribution &&
    contribution.status === 'SUCCESS' &&
    (!payment || payment.status === 'SUCCESS');

  const campaignId = contribution?.campaignId || payment?.campaignId || '';
  const { data: campaign } = useCampaign(campaignId);

  if (!isTransactionValid) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
        </View>
        <EmptyState
          iconName="alert-circle-outline"
          title="Transaction Not Found"
          description="We could not locate a completed, verified contribution transaction for this session."
          actionTitle="Explore Active Campaigns"
          onAction={() => router.replace('/(tabs)/explore')}
        />
        <View style={styles.notFoundActions}>
          {campaignId ? (
            <AppButton
              title="Return to Campaign"
              onPress={() => router.replace(`/campaign/${campaignId}`)}
              variant="outline"
              size="md"
              fullWidth
            />
          ) : null}
        </View>
      </ScreenContainer>
    );
  }

  const referenceCode = payment?.reference || contribution.paymentReference || 'N/A';
  const amount = contribution.amount;
  const adBudget = contribution.advertisingAllocation;
  const minImpressions = contribution.estimatedImpressionsMin;
  const maxImpressions = contribution.estimatedImpressionsMax;

  const goal = campaign?.goal || 2500;
  const raised = campaign?.raised || amount;
  const { clampedPercentage } = calculateFundingProgress(raised, goal);

  const handleShareCampaign = async () => {
    try {
      await Share.share({
        message: `I just backed amplification for "${campaign?.title || 'this message'}"! Join me to fund its community distribution:`,
      });
    } catch {
      // Ignore dismiss
    }
  };

  const handleViewReceipt = () => {
    router.push({
      pathname: '/contribution/receipt',
      params: {
        contributionId: contribution.id,
        paymentId: payment?.id || '',
      },
    });
  };

  const handleViewCampaign = () => {
    if (campaignId) {
      router.replace(`/campaign/${campaignId}`);
    } else {
      router.replace('/(tabs)/explore');
    }
  };

  const handleExploreMore = () => {
    router.replace('/(tabs)/explore');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-sharp" size={42} color={Palette.pureWhite} />
        </View>

        <Text style={styles.title}>Contribution Successful</Text>
        <Text style={styles.subtitle}>
          Your contribution has been received and allocated directly to campaign message amplification.
        </Text>

        {/* Amount Pill */}
        <View style={styles.amountPill}>
          <Text style={styles.amountLabel}>AMOUNT SPONSORED</Text>
          <Text style={styles.amountText}>{formatCurrency(amount)}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.receiptCard}>
          <Text style={styles.cardHeader}>Amplification Impact Summary</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.itemLabel}>Campaign</Text>
            <Text style={styles.itemValue} numberOfLines={2}>
              {campaign?.title || contribution.campaignTitle || 'Community Message Amplification'}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.itemLabel}>Payment Reference</Text>
            <View style={styles.referenceBadge}>
              <Text style={styles.referenceText}>{referenceCode}</Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.itemLabel}>Direct Advertising Allocation</Text>
            <Text style={styles.itemHighlight}>
              {formatCurrency(adBudget)} ({Config.feeStructure.advertisingPercentage}%)
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.itemLabel}>Estimated Impressions</Text>
            <Text style={styles.itemHighlight}>
              {formatReachRange(minImpressions, maxImpressions)} impressions
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Updated Campaign Funding Progress */}
          <View style={styles.fundingSection}>
            <View style={styles.fundingRow}>
              <Text style={styles.fundingLabel}>Updated Campaign Funding</Text>
              <Text style={styles.fundingValue}>
                {formatCurrency(raised)} / {formatCurrency(goal)}
              </Text>
            </View>
            <ProgressBar
              progress={clampedPercentage}
              height={7}
              color={Palette.primary600}
              style={styles.fundingBar}
            />
            <Text style={styles.fundingPctText}>{clampedPercentage}% of target funded</Text>
          </View>
        </View>

        {/* Non-donation reminder */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={16} color={Palette.primary700} />
          <Text style={styles.disclaimerText}>
            Demo payment authorized. Contributions fund advertising placements and distribution rather than direct donations to the creator.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <AppButton
            title="View Receipt"
            onPress={handleViewReceipt}
            variant="outline"
            size="lg"
            fullWidth
            icon={<Ionicons name="receipt-outline" size={18} color={Palette.navy900} />}
          />

          <AppButton
            title="View Campaign"
            onPress={handleViewCampaign}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="arrow-forward" size={18} color={Palette.pureWhite} />}
            iconPosition="right"
          />

          <View style={styles.secondaryRow}>
            <Pressable
              onPress={handleShareCampaign}
              accessibilityRole="button"
              accessibilityLabel="Share campaign"
              style={styles.textBtn}>
              <Ionicons name="share-social-outline" size={16} color={Palette.primary700} />
              <Text style={styles.textBtnText}>Share Campaign</Text>
            </Pressable>

            <Pressable
              onPress={handleExploreMore}
              accessibilityRole="button"
              accessibilityLabel="Explore more campaigns"
              style={styles.textBtn}>
              <Text style={styles.textBtnText}>Explore More</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xxl * 2,
  },
  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Palette.success600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Palette.success600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    ...Typography.h1,
    fontSize: 24,
    color: Palette.navy950,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  amountPill: {
    backgroundColor: Palette.primary50,
    borderRadius: BorderRadius.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.primary100,
  },
  amountLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary700,
    letterSpacing: 0.5,
  },
  amountText: {
    ...Typography.h1,
    fontSize: 26,
    color: Palette.primary700,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.navy950,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  summaryItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  itemLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
  },
  itemValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
    marginTop: 1,
  },
  itemHighlight: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.primary700,
    marginTop: 1,
  },
  referenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginTop: 2,
  },
  referenceText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Palette.navy900,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.neutral200,
    marginVertical: Spacing.sm,
  },
  fundingSection: {
    paddingTop: Spacing.xs,
  },
  fundingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fundingLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral600,
  },
  fundingValue: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.navy950,
  },
  fundingBar: {
    marginVertical: 4,
  },
  fundingPctText: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.primary700,
    fontWeight: '600',
    textAlign: 'right',
  },
  disclaimerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  disclaimerText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral600,
    lineHeight: 15,
    flex: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.xs,
  },
  textBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textBtnText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primary700,
  },
  navBar: {
    paddingVertical: Spacing.sm,
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
  notFoundActions: {
    width: '100%',
    marginTop: Spacing.md,
  },
});
