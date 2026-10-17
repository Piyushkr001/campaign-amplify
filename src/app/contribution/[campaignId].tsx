import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Layout, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCampaign } from '@/hooks/useCampaigns';
import { useContributionStore } from '@/store/contribution-store';
import {
  calculateFundingProgress,
  formatCurrency,
  formatReachRange,
} from '@/utils/formatters';
import { calculateUseOfFunds, estimateDirectReach } from '@/utils/reach';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

export default function ChooseContributionScreen() {
  const router = useRouter();
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { data: campaign, isLoading } = useCampaign(campaignId || '');
  const { setCurrentContribution } = useContributionStore();

  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customInput, setCustomInput] = useState<string>('50');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} backgroundColor={Palette.warmWhite}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading campaign...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!campaign) {
    return (
      <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.navRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
        </View>
        <ErrorState
          title="Campaign Not Found"
          message="Could not find the requested campaign for contribution."
          onRetry={() => router.replace('/(tabs)/explore')}
          retryText="Return to Explore"
        />
      </ScreenContainer>
    );
  }

  const { clampedPercentage } = calculateFundingProgress(campaign.raised, campaign.goal);

  // Central fee and reach calculation
  const funds = calculateUseOfFunds(selectedAmount);
  const impressions = estimateDirectReach(funds.advertising);

  const handleSelectPreset = (amount: number) => {
    setIsCustomMode(false);
    setSelectedAmount(amount);
    setCustomInput(amount.toString());
    setInputError(null);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleCustomChange = (text: string) => {
    setIsCustomMode(true);
    setCustomInput(text);

    const numericOnly = text.replace(/[^0-9]/g, '');
    const parsed = parseInt(numericOnly, 10);

    if (isNaN(parsed) || parsed <= 0) {
      setSelectedAmount(0);
      setInputError('Please enter a valid amount ($1 or more)');
    } else if (parsed > 50000) {
      setSelectedAmount(parsed);
      setInputError('For demo purposes, contributions are capped at $50,000');
    } else {
      setSelectedAmount(parsed);
      setInputError(null);
    }
  };

  const handleContinue = () => {
    if (selectedAmount < 1) {
      setInputError('Minimum contribution is $1');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    if (selectedAmount > 50000) {
      setInputError('Maximum contribution is $50,000');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Save temporary contribution in store
    setCurrentContribution({
      id: '',
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      amount: selectedAmount,
      platformFee: funds.platformFee,
      processingFee: funds.paymentProcessing,
      advertisingAllocation: funds.advertising,
      estimatedImpressionsMin: impressions.min,
      estimatedImpressionsMax: impressions.max,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    router.push({
      pathname: '/contribution/review',
      params: {
        campaignId: campaign.id,
        amount: selectedAmount.toString(),
      },
    });
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        {/* Nav Header */}
        <View style={styles.navRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to campaign detail"
            hitSlop={8}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
          <Text style={styles.navTitle}>Choose Contribution</Text>
          <View style={styles.navSpacer} />
        </View>

        {/* Campaign Summary Card */}
        <View style={styles.campaignHeaderCard}>
          <Image
            source={{ uri: campaign.coverImage }}
            style={styles.campaignThumb}
            contentFit="cover"
          />
          <View style={styles.campaignHeaderInfo}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{campaign.category}</Text>
            </View>
            <Text style={styles.campaignTitle} numberOfLines={2}>
              {campaign.title}
            </Text>
            <View style={styles.fundingSummaryRow}>
              <Text style={styles.fundingSummaryText}>
                {formatCurrency(campaign.raised)} of {formatCurrency(campaign.goal)}
              </Text>
              <Text style={styles.fundingPercentText}>{clampedPercentage}%</Text>
            </View>
            <ProgressBar
              progress={clampedPercentage}
              height={5}
              color={Palette.primary600}
              style={styles.miniProgress}
            />
          </View>
        </View>

        {/* Explanatory Distinction Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={18} color={Palette.primary700} />
          <Text style={styles.noticeText}>
            Your contribution supports the advertising distribution of this campaign message. It is not
            a direct donation to the campaign creator or cause.
          </Text>
        </View>

        {/* Preset Amounts Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Amplification Level</Text>
          <Text style={styles.sectionSubtitle}>
            Choose an amount to sponsor digital reach across target audiences:
          </Text>

          <View style={styles.presetsGrid}>
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = !isCustomMode && selectedAmount === amt;
              return (
                <Pressable
                  key={amt}
                  onPress={() => handleSelectPreset(amt)}
                  accessibilityRole="button"
                  accessibilityLabel={`Contribute ${formatCurrency(amt)}`}
                  style={[
                    styles.presetBtn,
                    isSelected && styles.presetBtnActive,
                  ]}>
                  <Text style={[styles.presetAmount, isSelected && styles.presetAmountActive]}>
                    {formatCurrency(amt)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Custom Amount Field */}
        <View style={styles.section}>
          <Text style={styles.customLabel}>Or enter custom amount ($):</Text>
          <AppInput
            placeholder="e.g. 75"
            value={customInput}
            onChangeText={handleCustomChange}
            keyboardType="numeric"
            error={inputError || undefined}
            leftIcon={<Text style={styles.dollarSymbol}>$</Text>}
          />
        </View>

        {/* Real-time Reach & Fee Impact Card */}
        {selectedAmount > 0 && (
          <View style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <View style={styles.impactIconBadge}>
                <Ionicons name="megaphone" size={16} color={Palette.pureWhite} />
              </View>
              <View style={styles.impactHeaderTitles}>
                <Text style={styles.impactSub}>Estimated Impressions</Text>
                <Text style={styles.impactValue}>
                  {formatReachRange(impressions.min, impressions.max)}
                </Text>
              </View>
            </View>

            <View style={styles.impactDivider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Direct Advertising Allocation (85%):</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(funds.advertising)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Fee (10%):</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(funds.platformFee)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Payment Processing (5%):</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(funds.paymentProcessing)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payment:</Text>
              <Text style={styles.totalValue}>{formatCurrency(selectedAmount)}</Text>
            </View>
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.bottomCta}>
          <AppButton
            title="Continue to Review"
            onPress={handleContinue}
            variant="primary"
            size="lg"
            fullWidth
            disabled={selectedAmount < 1 || !!inputError}
            icon={<Ionicons name="arrow-forward" size={18} color={Palette.pureWhite} />}
            iconPosition="right"
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Palette.neutral500,
  },
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
  campaignHeaderCard: {
    flexDirection: 'row',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  campaignThumb: {
    width: 76,
    height: 76,
    borderRadius: BorderRadius.sm,
    backgroundColor: Palette.neutral200,
  },
  campaignHeaderInfo: {
    flex: 1,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginBottom: 2,
  },
  categoryPillText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.neutral600,
  },
  campaignTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Palette.navy950,
    lineHeight: 18,
    marginBottom: 4,
  },
  fundingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundingSummaryText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  fundingPercentText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.primary700,
  },
  miniProgress: {
    marginTop: 3,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.primary50,
    borderWidth: 1,
    borderColor: Palette.primary100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  noticeText: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: Palette.primary900,
    flex: 1,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: Spacing.sm,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: Spacing.md,
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    borderColor: Palette.primary700,
    backgroundColor: Palette.primary50,
  },
  presetAmount: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
  },
  presetAmountActive: {
    color: Palette.primary700,
  },
  customLabel: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.navy900,
    marginBottom: 4,
  },
  dollarSymbol: {
    ...Typography.body,
    fontWeight: '700',
    color: Palette.neutral500,
    marginRight: 4,
  },
  impactCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  impactIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primary700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactHeaderTitles: {
    flex: 1,
  },
  impactSub: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  impactValue: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
  },
  impactDivider: {
    height: 1,
    backgroundColor: Palette.neutral100,
    marginVertical: Spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakdownLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral600,
  },
  breakdownValue: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy900,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.neutral200,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  totalValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.primary700,
  },
  bottomCta: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl * 2,
  },
});
