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
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { formatCurrency } from '@/utils/formatters';

const STEP_ROUTES: Record<number, string> = {
  1: '/create-campaign/basics',
  2: '/create-campaign/story',
  3: '/create-campaign/visuals',
  4: '/create-campaign/reach',
  5: '/create-campaign/submit',
};

const STEP_NAMES: Record<number, string> = {
  1: 'Basics',
  2: 'Story',
  3: 'Visuals',
  4: 'Reach',
  5: 'Submit',
};

export default function CreateEntryScreen() {
  const { draft, resetDraft, hasDraft } = useCampaignDraftStore();
  const { campaigns: submittedCampaigns } = useMyCampaignsStore();
  const hasActiveDraft = hasDraft();

  const handleCreateManually = () => {
    router.push('/create-campaign/basics');
  };

  const handleResumeDraft = () => {
    const targetRoute = STEP_ROUTES[draft.currentStep] || '/create-campaign/basics';
    router.push(targetRoute as any);
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
          Draft your campaign message and substantiated story. Once approved by our review team, backers can fund
          targeted advertising to distribute your message to new audiences.
        </Text>
      </View>

      {/* Resume Draft Banner if exists */}
      {hasActiveDraft && (
        <View style={styles.draftCard}>
          <View style={styles.draftHeader}>
            <View style={styles.draftIconBadge}>
              <Ionicons name="document-text-outline" size={16} color={Palette.warning700} />
            </View>
            <View style={styles.draftInfo}>
              <Text style={styles.draftTitle} numberOfLines={1}>
                {draft.title || 'Untitled Draft'}
              </Text>
              <Text style={styles.draftSubtitle}>
                Step {draft.currentStep} of 5 ({STEP_NAMES[draft.currentStep]}) saved
              </Text>
            </View>
          </View>

          <View style={styles.draftActions}>
            <AppButton
              title={`Resume at Step ${draft.currentStep}: ${STEP_NAMES[draft.currentStep]}`}
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

      {/* Submitted Campaigns Section (if any exist) */}
      {submittedCampaigns.length > 0 && (
        <View style={styles.submittedSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Your Submitted Campaigns</Text>
            <View style={styles.submittedBadge}>
              <Text style={styles.submittedBadgeText}>{submittedCampaigns.length} in review</Text>
            </View>
          </View>

          {submittedCampaigns.map((camp) => (
            <View key={camp.id} style={styles.submittedCard}>
              <View style={styles.submittedCardHeader}>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>SUBMITTED_FOR_REVIEW</Text>
                </View>
                <Text style={styles.submittedDate}>
                  {new Date(camp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.submittedTitle} numberOfLines={1}>
                {camp.title}
              </Text>
              <Text style={styles.submittedMeta}>
                Goal: {formatCurrency(camp.goal)} • {camp.category}
              </Text>
            </View>
          ))}
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
              <Text style={styles.optionTitle}>Start New Campaign</Text>
              <Ionicons name="chevron-forward" size={18} color={Palette.neutral400} />
            </View>
            <Text style={styles.optionDescription}>
              Complete the structured 5-step campaign builder: Basics, Story, Visuals, Reach, and
              Review.
            </Text>
          </View>
        </Pressable>

        {/* Option 2: Voice Creation (Explicitly marked for future phase) */}
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
              Verifiable claims backed by independent research and citations
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
              Transparent distribution budget (85% directly into advertising placements)
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Palette.success600} />
            <Text style={styles.checkText}>
              Clear disclosure that funds sponsor message distribution, not donations
            </Text>
          </View>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.bottomCta}>
        <AppButton
          title={hasActiveDraft ? 'Start a New Campaign Instead' : 'Start Campaign Builder'}
          onPress={handleCreateManually}
          variant={hasActiveDraft ? 'outline' : 'primary'}
          size="lg"
          fullWidth
          icon={<Ionicons name="arrow-forward" size={18} color={hasActiveDraft ? Palette.navy900 : Palette.pureWhite} />}
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
    borderColor: Palette.warning200,
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
    color: Palette.warning800,
    fontWeight: '600',
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
    color: Palette.error600,
    fontWeight: '600',
  },
  submittedSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionHeaderTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
  },
  submittedBadge: {
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  submittedBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.neutral600,
  },
  submittedCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  submittedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.warning50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.warning600,
  },
  statusPillText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.warning800,
  },
  submittedDate: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
  },
  submittedTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  submittedMeta: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 2,
  },
  optionsSection: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  cardPressed: {
    borderColor: Palette.primary600,
    backgroundColor: Palette.warmWhite,
  },
  optionDisabled: {
    backgroundColor: Palette.neutral50,
    borderColor: Palette.neutral200,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDisabled: {
    backgroundColor: Palette.neutral100,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
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
  optionDescription: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  checkTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
  },
  checkIntro: {
    ...Typography.caption,
    color: Palette.neutral500,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  checkList: {
    gap: Spacing.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  checkText: {
    ...Typography.caption,
    color: Palette.navy900,
    flex: 1,
    lineHeight: 16,
  },
  bottomCta: {
    marginBottom: Spacing.xxl * 2,
  },
});
