import React from 'react';
import {
  Pressable,
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

export default function ContributionFailedScreen() {
  const router = useRouter();
  const { paymentId, campaignId } = useLocalSearchParams<{
    paymentId?: string;
    campaignId?: string;
  }>();

  const { getPaymentById } = useContributionStore();
  const payment = paymentId ? getPaymentById(paymentId) : undefined;

  const targetCampaignId = campaignId || payment?.campaignId || '';

  const handleTryAgain = () => {
    router.replace({
      pathname: '/contribution/payment',
      params: {
        campaignId: targetCampaignId,
        amount: payment?.amount ? payment.amount.toString() : '50',
      },
    });
  };

  const handleChangeAmount = () => {
    if (targetCampaignId) {
      router.replace({
        pathname: '/contribution/[campaignId]',
        params: { campaignId: targetCampaignId },
      });
    } else {
      router.replace('/(tabs)/explore');
    }
  };

  const handleReturnToCampaign = () => {
    if (targetCampaignId) {
      router.replace(`/campaign/${targetCampaignId}`);
    } else {
      router.replace('/(tabs)/explore');
    }
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.errorCircle}>
          <Ionicons name="close-sharp" size={42} color={Palette.pureWhite} />
        </View>

        <Text style={styles.title}>Payment Unsuccessful</Text>
        <Text style={styles.subtitle}>
          Your simulated payment could not be processed. No campaign funding was added, and no charges were made.
        </Text>

        {/* Diagnostic Card */}
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle-outline" size={18} color={Palette.error600} />
            <Text style={styles.errorTitle}>Transaction Status</Text>
          </View>
          <Text style={styles.errorMessage}>
            {payment?.errorMessage || 'Simulated test card decline (Card declined by issuing bank).'}
          </Text>
          {payment?.reference ? (
            <Text style={styles.errorRef}>Attempt Reference: {payment.reference}</Text>
          ) : null}
        </View>

        {/* Reassurance Banner */}
        <View style={styles.reassuranceCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Palette.neutral600} />
          <Text style={styles.reassuranceText}>
            You were not charged. You can test again with simulated success or modify your contribution amount.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <AppButton
            title="Try Again with Test Card"
            onPress={handleTryAgain}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="refresh-outline" size={18} color={Palette.pureWhite} />}
          />

          <AppButton
            title="Change Contribution Amount"
            onPress={handleChangeAmount}
            variant="outline"
            size="md"
            fullWidth
          />

          <Pressable
            onPress={handleReturnToCampaign}
            accessibilityRole="button"
            accessibilityLabel="Return to campaign"
            style={styles.returnBtn}>
            <Text style={styles.returnBtnText}>Return to Campaign</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.xl * 1.5,
    alignItems: 'center',
    paddingBottom: Spacing.xxl * 2,
  },
  errorCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Palette.error600,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Palette.error600,
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
    marginBottom: Spacing.lg,
  },
  errorCard: {
    width: '100%',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  errorTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.error600,
    textTransform: 'uppercase',
  },
  errorMessage: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    marginTop: 2,
  },
  errorRef: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 4,
  },
  reassuranceCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  reassuranceText: {
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
  returnBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  returnBtnText: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.neutral600,
  },
});
