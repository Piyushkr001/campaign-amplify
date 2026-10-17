import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';

export default function CreateEntryScreen() {
  const { title, currentStep, resetDraft } = useCampaignDraftStore();
  const hasActiveDraft = title.trim().length > 0;

  const handleCreateManually = () => {
    router.push('/create-campaign/basics');
  };

  const handleResumeDraft = () => {
    router.push('/create-campaign/basics');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Title & Description */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="megaphone-outline" size={14} color={Palette.primary700} />
          <Text style={styles.badgeText}>AMPLIFICATION BUILDER</Text>
        </View>

        <Text style={styles.title}>Start a Campaign</Text>
        <Text style={styles.subtitle}>
          Draft your campaign message and story. Once approved by our review team, backers can fund
          targeted advertising to distribute your message to new audiences.
        </Text>
      </View>

      {/* Resume Draft Banner if exists */}
      {hasActiveDraft && (
        <View style={styles.draftCard}>
          <View style={styles.draftHeader}>
            <View style={styles.draftIconBadge}>
              <Ionicons name="document-text-outline" size={16} color={Palette.warning600} />
            </View>
            <View style={styles.draftInfo}>
              <Text style={styles.draftTitle} numberOfLines={1}>
                {title || 'Untitled Draft'}
              </Text>
              <Text style={styles.draftSubtitle}>Step {currentStep} of 5 saved</Text>
            </View>
          </View>

          <View style={styles.draftActions}>
            <AppButton
              title="Resume Draft"
              onPress={handleResumeDraft}
              variant="primary"
              size="sm"
              icon={<Ionicons name="arrow-forward" size={14} color={Palette.pureWhite} />}
              iconPosition="right"
            />
            <Pressable
              onPress={resetDraft}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Discard Draft"
              style={styles.discardBtn}>
              <Text style={styles.discardText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Primary Creation Options */}
      <View style={styles.optionsSection}>
        {/* Option 1: Create Manually */}
        <Pressable
          onPress={handleCreateManually}
          accessibilityRole="button"
          accessibilityLabel="Create Manually. Standard step-by-step campaign builder"
          style={({ pressed }) => [styles.optionCard, pressed && styles.cardPressed]}>
          <View style={styles.optionIconContainer}>
            <Ionicons name="create-outline" size={24} color={Palette.navy900} />
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>Create Manually</Text>
              <Ionicons name="chevron-forward" size={18} color={Palette.neutral400} />
            </View>
            <Text style={styles.optionDescription}>
              Complete the structured 5-step campaign builder: Basics, Story, Visuals, Reach, and
              Review.
            </Text>
          </View>
        </Pressable>

        {/* Option 2: Create with Voice (Future phase placeholder) */}
        <View style={[styles.optionCard, styles.optionDisabled]}>
          <View style={[styles.optionIconContainer, styles.optionIconDisabled]}>
            <Ionicons name="mic-outline" size={24} color={Palette.neutral400} />
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionTitleRow}>
              <Text style={[styles.optionTitle, styles.textDisabled]}>Create with Your Voice</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>COMING IN LATER PHASE</Text>
              </View>
            </View>
            <Text style={[styles.optionDescription, styles.textDisabled]}>
              Describe your message verbally and let an AI interview format your campaign.
              Available in future update.
            </Text>
          </View>
        </View>
      </View>

      {/* Campaign Standards & Verification Checklist */}
      <View style={styles.checklistCard}>
        <View style={styles.checkHeader}>
          <Ionicons name="shield-checkmark" size={18} color={Palette.success600} />
          <Text style={styles.checkTitle}>Campaign Quality Standards</Text>
        </View>
        <Text style={styles.checkIntro}>
          To maintain high trust for community backers, all messages must meet editorial criteria:
        </Text>

        <View style={styles.checkList}>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Palette.success600} />
            <Text style={styles.checkText}>
              Verifiable claims backed by citations or public records
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Palette.success600} />
            <Text style={styles.checkText}>
              Non-partisan, non-inflammatory civic or public-interest focus
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Palette.success600} />
            <Text style={styles.checkText}>
              Transparent distribution budget (minimum 80% directly into advertising placements)
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Palette.success600} />
            <Text style={styles.checkText}>
              Clear disclosure that funds go toward distribution, not personal or organizational donations
            </Text>
          </View>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.bottomCta}>
        <AppButton
          title="Start Step 1: Basics"
          onPress={handleCreateManually}
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
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
    marginBottom: Spacing.xs,
  },
  badgeText: {
    ...Typography.label,
    color: Palette.primary700,
  },
  title: {
    ...Typography.h1,
    color: Palette.navy950,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.neutral600,
    lineHeight: 22,
  },
  draftCard: {
    backgroundColor: Palette.warning50,
    borderWidth: 1,
    borderColor: Palette.warning100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  draftIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.warning100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftInfo: {
    flex: 1,
  },
  draftTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
  },
  draftSubtitle: {
    ...Typography.caption,
    color: Palette.warning600,
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  discardBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  discardText: {
    ...Typography.buttonSmall,
    color: Palette.neutral500,
  },
  optionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: Palette.neutral50,
  },
  optionDisabled: {
    backgroundColor: Palette.neutral100,
    borderColor: Palette.neutral200,
    opacity: 0.85,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDisabled: {
    backgroundColor: Palette.neutral200,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  optionTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
  },
  optionDescription: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    lineHeight: 18,
  },
  textDisabled: {
    color: Palette.neutral400,
  },
  comingSoonBadge: {
    backgroundColor: Palette.neutral200,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  comingSoonText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.neutral600,
  },
  checklistCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xxs,
  },
  checkTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
  },
  checkIntro: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: Spacing.sm,
  },
  checkList: {
    gap: Spacing.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkText: {
    ...Typography.bodySmall,
    color: Palette.navy800,
    flex: 1,
    lineHeight: 18,
  },
  bottomCta: {
    marginBottom: Spacing.xxl,
  },
});
