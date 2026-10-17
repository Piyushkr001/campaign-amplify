import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { formatCompactNumber, formatCurrency } from '@/utils/formatters';

const BUDGET_PRESETS = [2500, 5000, 10000, 25000];

export default function CreateReachScreen() {
  const router = useRouter();
  const draft = useCampaignDraftStore();

  const [budget, setBudget] = useState<number>(draft.targetBudget || 5000);
  const [audience, setAudience] = useState<string>(
    draft.targetAudience || 'Educators, civic leaders & regional community'
  );

  const minImpressions = budget * 20;
  const maxImpressions = budget * 30;

  const handleNext = () => {
    draft.updateField('targetBudget', budget);
    draft.updateField('targetAudience', audience);
    draft.setCurrentStep(5);
    router.push('/create-campaign/submit');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 3"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.stepIndicator}>Step 4 of 5: Reach</Text>
      </View>

      <Text style={styles.pageTitle}>Reach & Amplification Goal</Text>
      <Text style={styles.pageSubtitle}>
        Set your funding target and define the demographics you want this campaign message to reach.
      </Text>

      {/* Budget Goal Presets */}
      <Text style={styles.sectionLabel}>Select Funding Target for Paid Distribution *</Text>
      <View style={styles.budgetRow}>
        {BUDGET_PRESETS.map((amount) => (
          <Pressable
            key={amount}
            onPress={() => setBudget(amount)}
            accessibilityRole="button"
            accessibilityLabel={`Target budget ${formatCurrency(amount)}`}
            style={[
              styles.budgetPill,
              budget === amount && styles.budgetPillActive,
            ]}>
            <Text
              style={[
                styles.budgetText,
                budget === amount && styles.budgetTextActive,
              ]}>
              {formatCurrency(amount)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Real-time Estimated Reach Box */}
      <View style={styles.reachCalcCard}>
        <View style={styles.reachHeader}>
          <Ionicons name="megaphone" size={18} color={Palette.primary700} />
          <Text style={styles.reachTitle}>Projected Message Distribution</Text>
        </View>

        <Text style={styles.reachRange}>
          {formatCompactNumber(minImpressions)}–{formatCompactNumber(maxImpressions)}
          <Text style={styles.reachUnit}> estimated impressions</Text>
        </Text>

        <Text style={styles.reachDisclaimer}>
          Illustrative estimate only. Actual reach depends on auction bidding rates, geographic
          targeting, and publisher inventory. All funds go toward distribution.
        </Text>
      </View>

      {/* Target Audience Definition */}
      <AppInput
        label="Target Audience & Demographics *"
        placeholder="e.g. Young adults (18-35), teachers, regional commuters..."
        value={audience}
        onChangeText={setAudience}
        hint="Defines the ad targeting parameters for the distribution phase."
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <AppButton
          title="Continue to Review & Submit (Step 5)"
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name="arrow-forward" size={18} color={Palette.pureWhite} />}
          iconPosition="right"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
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
  stepIndicator: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.primary700,
  },
  pageTitle: {
    ...Typography.h1,
    fontSize: 22,
    color: Palette.navy950,
    marginBottom: 4,
  },
  pageSubtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
    marginBottom: Spacing.xs,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  budgetPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Palette.pureWhite,
    borderWidth: 1.5,
    borderColor: Palette.neutral200,
    borderRadius: BorderRadius.md,
  },
  budgetPillActive: {
    borderColor: Palette.primary600,
    backgroundColor: Palette.primary50,
  },
  budgetText: {
    ...Typography.buttonSmall,
    color: Palette.navy800,
  },
  budgetTextActive: {
    color: Palette.primary700,
    fontWeight: '700',
  },
  reachCalcCard: {
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reachTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.navy900,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reachRange: {
    ...Typography.h1,
    fontSize: 22,
    color: Palette.navy950,
    marginBottom: 4,
  },
  reachUnit: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    fontWeight: '400',
  },
  reachDisclaimer: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    lineHeight: 16,
  },
  bottomNav: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
});
