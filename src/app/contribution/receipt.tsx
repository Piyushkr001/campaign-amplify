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
import { useContributionStore } from '@/store/contribution-store';
import { useCampaign } from '@/hooks/useCampaigns';
import { formatCurrency, formatReachRange } from '@/utils/formatters';

import { Config } from '@/constants/config';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/auth-store';
import { useContributionReceipt } from '@/hooks/useContributions';
import { ActivityIndicator } from 'react-native';

export default function ContributionReceiptScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { contributionId, paymentId } = useLocalSearchParams<{
    contributionId?: string;
    paymentId?: string;
  }>();

  const { getContributionById, getPaymentById } = useContributionStore();

  if (Config.useApi && (!isAuthenticated || user?.isGuest)) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
        </View>
        <EmptyState
          iconName="lock-closed-outline"
          title="Sign In Required"
          description="Sign in to view your official campaign sponsorship receipt."
          actionTitle="Sign In"
          onAction={() => router.push('/auth/login')}
        />
      </ScreenContainer>
    );
  }

  const { data: apiReceipt, isLoading: isApiLoading } = useContributionReceipt(contributionId || '');
  const localContribution = (!Config.useApi && contributionId) ? getContributionById(contributionId) : undefined;
  const localPayment = (!Config.useApi && paymentId) ? getPaymentById(paymentId) : undefined;

  // Strict validation: In API mode verify backend receipt, in local mode verify store
  const isTransactionValid = Config.useApi
    ? !!apiReceipt
    : localContribution &&
      (localContribution.status === 'SUCCESS' || localContribution.status === 'CONFIRMED') &&
      (!localPayment || localPayment.status === 'SUCCESS');

  const campaignId = apiReceipt?.campaign.id || (Config.useApi ? '' : (localContribution?.campaignId || localPayment?.campaignId || ''));
  const { data: campaign } = useCampaign(campaignId);

  if (Config.useApi && isApiLoading) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
          <ActivityIndicator size="large" color={Palette.primary700} />
          <Text style={{ ...Typography.bodySmall, color: Palette.neutral500, marginTop: Spacing.sm }}>
            Retrieving official sponsorship receipt...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!isTransactionValid) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
        </View>
        <EmptyState
          iconName="receipt-outline"
          title="Transaction Not Found"
          description="We could not locate a completed, verified transaction receipt for this session."
          actionTitle="Explore Active Campaigns"
          onAction={() => router.replace('/(tabs)/explore')}
        />
        <View style={styles.bottomActions}>
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

  const amount = apiReceipt ? apiReceipt.amount : localContribution?.amount || 0;
  const adBudget = apiReceipt ? apiReceipt.allocation.advertising : localContribution?.advertisingAllocation || 0;
  const platformFee = apiReceipt ? apiReceipt.allocation.platformFee : localContribution?.platformFee || 0;
  const processingFee = apiReceipt ? apiReceipt.allocation.paymentProcessing : localContribution?.processingFee || 0;
  const reference =
    apiReceipt?.receiptReference ||
    apiReceipt?.payment.reference ||
    localPayment?.reference ||
    localContribution?.paymentReference ||
    'DEMO-RECEIPT';
  const timestamp = apiReceipt
    ? apiReceipt.confirmedAt || apiReceipt.createdAt
    : localContribution?.completedAt || localContribution?.createdAt || new Date().toISOString();
  const dateFormatted = new Date(timestamp).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const minImp = apiReceipt ? apiReceipt.allocation.estimatedImpressionsMin : localContribution?.estimatedImpressionsMin || 0;
  const maxImp = apiReceipt ? apiReceipt.allocation.estimatedImpressionsMax : localContribution?.estimatedImpressionsMax || 0;
  const displayTitle = apiReceipt?.campaign.title || campaign?.title || localContribution?.campaignTitle || 'Campaign Message';
  const displayCreator = apiReceipt?.campaign.creator || campaign?.creator || 'Community Campaigner';
  const disclaimerText = apiReceipt?.disclaimer || 'Demo Payment — No real money was charged. Contributions support campaign amplification and distribution. This is not a direct charitable donation to the organization or cause.';

  const handleShareReceipt = async () => {
    try {
      await Share.share({
        message: `Contribution Receipt (Demo) for "${displayTitle}": Total ${formatCurrency(amount)} sponsored. Reference: ${reference}`,
      });
    } catch {
      // Ignore dismiss
    }
  };

  const handleBackToCampaign = () => {
    if (campaignId) {
      router.replace(`/campaign/${campaignId}`);
    } else {
      router.replace('/(tabs)/explore');
    }
  };

  const handleViewInActivity = () => {
    router.replace('/(tabs)/activity');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Nav Header */}
      <View style={styles.navRow}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.navTitle}>Contribution Receipt — Demo</Text>
        <Pressable
          onPress={handleShareReceipt}
          accessibilityRole="button"
          accessibilityLabel="Share receipt"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="share-outline" size={18} color={Palette.navy950} />
        </Pressable>
      </View>

      {/* Printable / Formal Receipt Card */}
      <View style={styles.receiptContainer}>
        {/* Top Header of Receipt */}
        <View style={styles.receiptBrandRow}>
          <View>
            <Text style={styles.brandName}>CAMPAIGN AMPLIFY</Text>
            <Text style={styles.receiptSubtitle}>Demo Payment Receipt</Text>
          </View>
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={12} color={Palette.success700} />
            <Text style={styles.statusPillText}>PAID (DEMO)</Text>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* Reference and Date Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Payment Reference</Text>
            <Text style={styles.metaValueMono}>{reference}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Transaction Date</Text>
            <Text style={styles.metaValue}>{dateFormatted}</Text>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* Campaign Info */}
        <View style={styles.campaignSection}>
          <Text style={styles.metaLabel}>Funded Campaign</Text>
          <Text style={styles.campaignTitleText}>
            {displayTitle}
          </Text>
          <Text style={styles.creatorText}>
            Creator: {displayCreator}
          </Text>
        </View>

        <View style={styles.dashedDivider} />

        {/* Itemized Allocation Breakdown */}
        <View style={styles.itemsTable}>
          <Text style={styles.sectionHeading}>Itemized Allocation</Text>

          <View style={styles.lineItem}>
            <Text style={styles.lineDesc}>
              Paid Advertising Distribution ({Config.feeStructure.advertisingPercentage}%)
            </Text>
            <Text style={styles.lineAmount}>{formatCurrency(adBudget)}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.lineDesc}>
              Platform Operations & Review ({Config.feeStructure.platformFeePercentage}%)
            </Text>
            <Text style={styles.lineAmount}>{formatCurrency(platformFee)}</Text>
          </View>
          <View style={styles.lineItem}>
            <Text style={styles.lineDesc}>
              Payment Processing ({Config.feeStructure.paymentProcessingPercentage}%)
            </Text>
            <Text style={styles.lineAmount}>{formatCurrency(processingFee)}</Text>
          </View>

          <View style={styles.totalLine}>
            <Text style={styles.totalText}>Total Payment</Text>
            <Text style={styles.totalPrice}>{formatCurrency(amount)}</Text>
          </View>
        </View>

        <View style={styles.dashedDivider} />

        {/* Reach Impact */}
        <View style={styles.reachSection}>
          <Text style={styles.metaLabel}>Projected Audience Reach</Text>
          <Text style={styles.reachRangeText}>
            {formatReachRange(minImp, maxImp)} Estimated Impressions
          </Text>
          <Text style={styles.reachNote}>
            Calculated based on ${adBudget} media allocation and targeted channel inventory.
          </Text>
        </View>

        {/* Important Platform Legal Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerHeading}>IMPORTANT NOTICE</Text>
          <Text style={styles.disclaimerBody}>
            {disclaimerText}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.bottomActions}>
        <AppButton
          title="Back to Campaign"
          onPress={handleBackToCampaign}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="arrow-back" size={18} color={Palette.pureWhite} />}
        />

        <AppButton
          title="View in Activity"
          onPress={handleViewInActivity}
          variant="outline"
          size="md"
          fullWidth
          icon={<Ionicons name="notifications-outline" size={16} color={Palette.navy900} />}
        />
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
  receiptContainer: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral300,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  receiptBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandName: {
    ...Typography.h2,
    fontSize: 16,
    color: Palette.navy950,
    letterSpacing: 0.5,
  },
  receiptSubtitle: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral500,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.success50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Palette.success200,
  },
  statusPillText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.success700,
  },
  dashedDivider: {
    height: 1,
    backgroundColor: Palette.neutral200,
    marginVertical: Spacing.md,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  metaValueMono: {
    ...Typography.bodySmall,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Palette.navy900,
  },
  campaignSection: {
    paddingVertical: 2,
  },
  campaignTitleText: {
    ...Typography.body,
    fontWeight: '700',
    color: Palette.navy950,
    marginTop: 2,
    marginBottom: 2,
  },
  creatorText: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  itemsTable: {
    gap: 6,
  },
  sectionHeading: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 4,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  lineDesc: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.neutral600,
  },
  lineAmount: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.navy900,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.neutral300,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  totalText: {
    ...Typography.body,
    fontWeight: '700',
    color: Palette.navy950,
  },
  totalPrice: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.primary700,
  },
  reachSection: {
    paddingVertical: 2,
  },
  reachRangeText: {
    ...Typography.body,
    fontWeight: '700',
    color: Palette.primary700,
    marginTop: 2,
  },
  reachNote: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 2,
  },
  disclaimerBox: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  disclaimerHeading: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.neutral500,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  disclaimerBody: {
    ...Typography.caption,
    fontSize: 10,
    lineHeight: 14,
    color: Palette.neutral600,
  },
  bottomActions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl * 2,
  },
});
