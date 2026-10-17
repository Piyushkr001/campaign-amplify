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
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { formatCurrency } from '@/utils/formatters';

export default function CreateSubmitScreen() {
  const router = useRouter();
  const draft = useCampaignDraftStore();

  const [agreeFactual, setAgreeFactual] = useState(false);
  const [agreeDistribution, setAgreeDistribution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = agreeFactual && agreeDistribution;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.replace('/create-campaign/success');
    }, 600);
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 4"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.stepIndicator}>Step 5 of 5: Review</Text>
      </View>

      <Text style={styles.pageTitle}>Review & Submit</Text>
      <Text style={styles.pageSubtitle}>
        Review your campaign details before sending to the editorial team for compliance and verification.
      </Text>

      {/* Review Card */}
      <View style={styles.reviewCard}>
        <Text style={styles.reviewHeading}>Campaign Summary</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Headline</Text>
          <Text style={styles.detailValue}>{draft.title || 'Untitled Campaign'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{draft.category}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Creator</Text>
          <Text style={styles.detailValue}>{draft.creatorName || 'Anonymous Publisher'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target Budget</Text>
          <Text style={styles.detailValue}>{formatCurrency(draft.targetBudget)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target Demographics</Text>
          <Text style={styles.detailValue}>{draft.targetAudience}</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Message Summary</Text>
          <Text style={styles.summaryText}>
            {draft.summary || 'No summary text provided.'}
          </Text>
        </View>
      </View>

      {/* Mandatory Checkboxes */}
      <View style={styles.agreementsCard}>
        <Text style={styles.agreementsHeading}>Editorial Certifications</Text>

        <Pressable
          onPress={() => setAgreeFactual(!agreeFactual)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreeFactual }}
          style={styles.checkRow}>
          <View style={[styles.checkbox, agreeFactual && styles.checkboxActive]}>
            {agreeFactual && <Ionicons name="checkmark" size={14} color={Palette.pureWhite} />}
          </View>
          <Text style={styles.checkLabel}>
            I confirm this message is factual, contains no defamatory or hate speech, and conforms
            with platform advertising standards.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setAgreeDistribution(!agreeDistribution)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreeDistribution }}
          style={styles.checkRow}>
          <View style={[styles.checkbox, agreeDistribution && styles.checkboxActive]}>
            {agreeDistribution && <Ionicons name="checkmark" size={14} color={Palette.pureWhite} />}
          </View>
          <Text style={styles.checkLabel}>
            I acknowledge that 100% of community contributions fund paid digital advertising and
            distribution fees, and are NOT donations to my organization.
          </Text>
        </Pressable>
      </View>

      {/* Submit Button */}
      <View style={styles.bottomNav}>
        <AppButton
          title="Submit for Editorial Review"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={isSubmitting}
          icon={<Ionicons name="shield-checkmark" size={18} color={Palette.pureWhite} />}
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
  reviewCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reviewHeading: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  detailLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  detailValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
    marginTop: 2,
  },
  summaryBox: {
    paddingTop: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: 2,
  },
  summaryText: {
    ...Typography.bodySmall,
    color: Palette.navy800,
    lineHeight: 20,
  },
  agreementsCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  agreementsHeading: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: Spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Palette.neutral400,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.pureWhite,
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: Palette.primary700,
    borderColor: Palette.primary700,
  },
  checkLabel: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    flex: 1,
    lineHeight: 18,
  },
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
