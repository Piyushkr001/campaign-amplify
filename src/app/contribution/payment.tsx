import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { AppInput } from '@/components/ui/AppInput';
import { useCampaign } from '@/hooks/useCampaigns';
import { useContributionStore } from '@/store/contribution-store';
import { useCampaignFundingStore } from '@/store/campaign-funding-store';
import { useCampaignRuntimeStore } from '@/store/campaign-runtime-store';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { queryClient } from '@/services/query-client';
import { campaignKeys } from '@/constants/query-keys';
import { formatCurrency } from '@/utils/formatters';
import { calculateUseOfFunds, estimateDirectReach } from '@/utils/reach';

export default function SimulatedPaymentScreen() {
  const router = useRouter();
  const { campaignId, amount } = useLocalSearchParams<{
    campaignId: string;
    amount?: string;
  }>();

  const { data: campaign } = useCampaign(campaignId || '');
  const {
    currentContribution,
    createContribution,
    createPayment,
    updatePaymentStatus,
    updateContributionStatus,
    completeContribution,
    failContribution,
    cancelContribution,
  } = useContributionStore();

  const contributionAmount = amount
    ? parseInt(amount, 10)
    : currentContribution?.amount || 50;

  // IMPORTANT: Card credentials exist strictly in local component state.
  // NEVER persisted in Zustand or AsyncStorage.
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Demo simulation choice: success vs failure vs cancel
  const [simulateOutcome, setSimulateOutcome] = useState<'SUCCESS' | 'FAILED' | 'CANCELLED'>('SUCCESS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setExpiry('12/28');
    setCvv('123');
    setCardholderName('Jane Backer');
    setErrors({});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 16);
    const parts = cleaned.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : cleaned);
    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: '' }));
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
    if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: '' }));
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 4);
    setCvv(cleaned);
    if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: '' }));
  };

  const validatePaymentForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const digitsOnly = cardNumber.replace(/\s/g, '');

    // Strict 16-digit demo card requirement
    if (digitsOnly.length !== 16) {
      newErrors.cardNumber = 'Please enter an exact 16-digit demo card number';
    }

    if (!expiry || expiry.length < 5) {
      newErrors.expiry = 'MM/YY required';
    } else {
      const [mmStr, yyStr] = expiry.split('/');
      const mm = parseInt(mmStr, 10);
      const yy = parseInt(yyStr, 10);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (isNaN(mm) || mm < 1 || mm > 12) {
        newErrors.expiry = 'Invalid month (01-12)';
      } else if (isNaN(yy) || yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        newErrors.expiry = 'Card is expired';
      }
    }

    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      newErrors.cvv = '3-4 digits required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProcessPayment = () => {
    if (!validatePaymentForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Ensure we have a contribution record
    const funds = calculateUseOfFunds(contributionAmount);
    const reach = estimateDirectReach(funds.advertising);

    let activeContribution = currentContribution;
    if (!activeContribution || !activeContribution.id) {
      activeContribution = createContribution({
        campaignId: campaignId || '',
        campaignTitle: campaign?.title,
        amount: contributionAmount,
        platformFee: funds.platformFee,
        processingFee: funds.paymentProcessing,
        advertisingAllocation: funds.advertising,
        estimatedImpressionsMin: reach.min,
        estimatedImpressionsMax: reach.max,
      });
    }

    // 1. Create payment record (PENDING) with masked safe metadata only (never save card number or CVV)
    const cardLast4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
    const payment = createPayment(
      activeContribution.id,
      campaignId || '',
      contributionAmount,
      cardLast4
    );

    // 2. Transition BOTH payment and contribution to PROCESSING
    updatePaymentStatus(payment.id, 'PROCESSING');
    updateContributionStatus(activeContribution.id, 'PROCESSING');

    // 3. Simulate gateway round-trip delay
    setTimeout(() => {
      if (simulateOutcome === 'SUCCESS') {
        // Mark payment as SUCCESS
        updatePaymentStatus(payment.id, 'SUCCESS');

        // Mark contribution as SUCCESS with payment reference
        completeContribution(activeContribution.id, payment.reference);

        // Update campaign funding locally ONLY upon SUCCESS!
        useCampaignFundingStore.getState().addFunding(campaignId || '', contributionAmount);

        // Check if campaign funding goal was reached
        const targetCampaignId = campaignId || '';
        const currentRaised = campaign?.raised || 0;
        const goal = campaign?.goal || 0;
        const newRaised = currentRaised + contributionAmount;

        if (campaign && campaign.status === 'FUNDING' && newRaised >= goal) {
          const isCreatorCampaign = useMyCampaignsStore.getState().getCampaignById(targetCampaignId);
          if (isCreatorCampaign) {
            useMyCampaignsStore
              .getState()
              .transitionCampaign(targetCampaignId, 'FUNDING_GOAL_REACHED', {
                actor: 'SYSTEM',
                note: 'Campaign reached 100% of its amplification funding goal!',
              });
          } else {
            // Seeded/Mock campaign: apply runtime status override
            useCampaignRuntimeStore.getState().setOverride(targetCampaignId, {
              statusOverride: 'FUNDING_GOAL_REACHED',
              fundingGoalReachedAt: new Date().toISOString(),
            });
          }
        }

        // Invalidate TanStack query cache so all screens reflect new funding
        queryClient.invalidateQueries({ queryKey: campaignKeys.all });
        if (campaignId) {
          queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        router.replace({
          pathname: '/contribution/success',
          params: {
            paymentId: payment.id,
            contributionId: activeContribution.id,
          },
        });
      } else if (simulateOutcome === 'FAILED') {
        // Payment failed simulation
        updatePaymentStatus(
          payment.id,
          'FAILED',
          'Simulated test card decline (Card declined by issuing bank).'
        );
        failContribution(activeContribution.id);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

        router.replace({
          pathname: '/contribution/failed',
          params: {
            paymentId: payment.id,
            contributionId: activeContribution.id,
            campaignId: campaignId || '',
          },
        });
      } else {
        // CANCELLED simulation: funding is NOT touched!
        updatePaymentStatus(
          payment.id,
          'CANCELLED',
          'Simulated payment was cancelled by contributor.'
        );
        cancelContribution(activeContribution.id);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

        router.replace({
          pathname: '/contribution/failed',
          params: {
            paymentId: payment.id,
            contributionId: activeContribution.id,
            campaignId: campaignId || '',
          },
        });
      }
      setIsProcessing(false);
    }, 1400);
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        {/* Nav Header */}
        <View style={styles.navRow}>
          <Pressable
            onPress={() => !isProcessing && router.back()}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel="Back to review"
            hitSlop={8}
            style={[styles.backBtn, isProcessing && styles.btnDisabled]}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
          <Text style={styles.navTitle}>Simulated Checkout</Text>
          <View style={styles.navSpacer} />
        </View>

        {/* Demo Watermark Banner */}
        <View style={styles.demoBanner}>
          <Ionicons name="shield-checkmark" size={18} color={Palette.primary700} />
          <View style={styles.demoBannerText}>
            <Text style={styles.demoBannerTitle}>Demo Sandbox Payment</Text>
            <Text style={styles.demoBannerDesc}>
              No real credit card will be charged. This environment tests end-to-end contribution flows.
            </Text>
          </View>
        </View>

        {/* Autofill test card helper */}
        <Pressable
          onPress={handleFillTestCard}
          accessibilityRole="button"
          accessibilityLabel="Auto-fill test card details"
          style={styles.autofillBtn}>
          <Ionicons name="flash-outline" size={16} color={Palette.primary700} />
          <Text style={styles.autofillBtnText}>Auto-Fill Demo Test Card (4242...)</Text>
        </Pressable>

        {/* Payment Card Form */}
        <View style={styles.formCard}>
          <View style={styles.formCardHeader}>
            <Text style={styles.formTitle}>Card Details</Text>
            <View style={styles.cardsRow}>
              <Ionicons name="card" size={20} color={Palette.navy900} />
            </View>
          </View>

          {/* Card Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <AppInput
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChangeText={formatCardNumber}
              keyboardType="numeric"
              maxLength={19}
              error={errors.cardNumber}
              leftIcon={<Ionicons name="card-outline" size={18} color={Palette.neutral500} />}
            />
          </View>

          {/* Row: Expiry and CVV */}
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Expiry</Text>
              <AppInput
                placeholder="MM/YY"
                value={expiry}
                onChangeText={formatExpiry}
                keyboardType="numeric"
                maxLength={5}
                error={errors.expiry}
                leftIcon={<Ionicons name="calendar-outline" size={18} color={Palette.neutral500} />}
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>CVV</Text>
              <AppInput
                placeholder="123"
                value={cvv}
                onChangeText={handleCvvChange}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                error={errors.cvv}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Palette.neutral500} />}
              />
            </View>
          </View>

          {/* Cardholder Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cardholder Name (Optional)</Text>
            <AppInput
              placeholder="e.g. Jane Backer"
              value={cardholderName}
              onChangeText={setCardholderName}
              leftIcon={<Ionicons name="person-outline" size={18} color={Palette.neutral500} />}
            />
          </View>
        </View>

        {/* Demo Simulation Switcher */}
        <View style={styles.simulationCard}>
          <Text style={styles.simTitle}>Demo Simulation Controls</Text>
          <Text style={styles.simDesc}>
            Choose how the simulated sandbox transaction should respond:
          </Text>

          <View style={styles.simButtonsRow}>
            <Pressable
              onPress={() => setSimulateOutcome('SUCCESS')}
              accessibilityRole="radio"
              accessibilityState={{ checked: simulateOutcome === 'SUCCESS' }}
              style={[
                styles.simBtn,
                simulateOutcome === 'SUCCESS' && styles.simBtnActiveSuccess,
              ]}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={simulateOutcome === 'SUCCESS' ? Palette.success700 : Palette.neutral500}
              />
              <Text
                style={[
                  styles.simBtnText,
                  simulateOutcome === 'SUCCESS' && styles.simBtnTextActiveSuccess,
                ]}>
                Success
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSimulateOutcome('FAILED')}
              accessibilityRole="radio"
              accessibilityState={{ checked: simulateOutcome === 'FAILED' }}
              style={[
                styles.simBtn,
                simulateOutcome === 'FAILED' && styles.simBtnActiveFail,
              ]}>
              <Ionicons
                name="close-circle"
                size={14}
                color={simulateOutcome === 'FAILED' ? Palette.error600 : Palette.neutral500}
              />
              <Text
                style={[
                  styles.simBtnText,
                  simulateOutcome === 'FAILED' && styles.simBtnTextActiveFail,
                ]}>
                Decline
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSimulateOutcome('CANCELLED')}
              accessibilityRole="radio"
              accessibilityState={{ checked: simulateOutcome === 'CANCELLED' }}
              style={[
                styles.simBtn,
                simulateOutcome === 'CANCELLED' && styles.simBtnActiveCancel,
              ]}>
              <Ionicons
                name="stop-circle-outline"
                size={14}
                color={simulateOutcome === 'CANCELLED' ? Palette.amber600 : Palette.neutral500}
              />
              <Text
                style={[
                  styles.simBtnText,
                  simulateOutcome === 'CANCELLED' && styles.simBtnTextActiveCancel,
                ]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Order Summary Line */}
        <View style={styles.summaryLineCard}>
          <Text style={styles.summaryLineLabel}>Total Charge:</Text>
          <Text style={styles.summaryLineAmount}>{formatCurrency(contributionAmount)}</Text>
        </View>

        {/* Processing Indicator or Submit Button */}
        {isProcessing ? (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Palette.primary700} />
            <Text style={styles.processingTitle}>Securing simulated payment channel...</Text>
            <Text style={styles.processingSubtitle}>
              Connecting to demo sandbox and registering message sponsorship.
            </Text>
          </View>
        ) : (
          <View style={styles.bottomCta}>
            <AppButton
              title={`Authorize ${formatCurrency(contributionAmount)} Demo Payment`}
              onPress={handleProcessPayment}
              variant="primary"
              size="lg"
              fullWidth
              icon={<Ionicons name="lock-closed" size={18} color={Palette.pureWhite} />}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
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
  btnDisabled: {
    opacity: 0.4,
  },
  navTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
  },
  navSpacer: {
    width: 36,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.primary50,
    borderWidth: 1,
    borderColor: Palette.primary100,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  demoBannerText: {
    flex: 1,
  },
  demoBannerTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Palette.primary900,
    marginBottom: 2,
  },
  demoBannerDesc: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: Palette.primary800,
  },
  autofillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.neutral100,
    borderRadius: BorderRadius.pill,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    gap: 6,
    marginBottom: Spacing.md,
  },
  autofillBtnText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.primary700,
  },
  formCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  formTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy900,
    marginBottom: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  simulationCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  simTitle: {
    ...Typography.h3,
    fontSize: 13,
    color: Palette.navy950,
    marginBottom: 2,
  },
  simDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    marginBottom: Spacing.sm,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Palette.neutral200,
    gap: 6,
  },
  simBtnActiveSuccess: {
    borderColor: Palette.success600,
    backgroundColor: Palette.success50,
  },
  simBtnActiveFail: {
    borderColor: Palette.error600,
    backgroundColor: Palette.error50,
  },
  simBtnActiveCancel: {
    borderColor: Palette.amber600,
    backgroundColor: Palette.amber50,
  },
  simBtnText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.neutral600,
  },
  simBtnTextActiveSuccess: {
    color: Palette.success700,
    fontWeight: '700',
  },
  simBtnTextActiveFail: {
    color: Palette.error600,
    fontWeight: '700',
  },
  simBtnTextActiveCancel: {
    color: Palette.amber600,
    fontWeight: '700',
  },
  summaryLineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryLineLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Palette.navy950,
  },
  summaryLineAmount: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.primary700,
  },
  processingCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl * 2,
  },
  processingTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginTop: Spacing.xs,
  },
  processingSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    textAlign: 'center',
  },
  bottomCta: {
    marginBottom: Spacing.xxl * 2,
  },
});
