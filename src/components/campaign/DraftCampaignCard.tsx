import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { CampaignDraft } from '@/types/campaign';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ProgressBar } from '@/components/ui/ProgressBar';

const STEP_ROUTES: Record<number, Href> = {
  1: '/create-campaign/basics',
  2: '/create-campaign/story',
  3: '/create-campaign/visuals',
  4: '/create-campaign/reach',
  5: '/create-campaign/submit',
};

const STEP_LABELS: Record<number, string> = {
  1: 'Basics & Category',
  2: 'Story & Sources',
  3: 'Visuals & Creative',
  4: 'Targeting & Reach',
  5: 'Review & Submit',
};

interface DraftCampaignCardProps {
  draft: CampaignDraft;
  onDiscard?: () => void;
}

export function DraftCampaignCard({ draft, onDiscard }: DraftCampaignCardProps) {
  const router = useRouter();
  const isRevision = draft.mode === 'REVISION';
  const step = draft.currentStep || 1;
  const stepProgress = Math.round((step / 5) * 100);

  const handleContinue = () => {
    const route = STEP_ROUTES[step] || '/create-campaign/basics';
    router.push(route);
  };

  const handleConfirmDiscard = () => {
    if (!onDiscard) return;
    Alert.alert(
      'Discard Active Draft?',
      isRevision
        ? 'Discarding this revision draft will restore the campaign status in the dashboard.'
        : 'All unsaved campaign content in this active draft will be cleared.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard Draft',
          style: 'destructive',
          onPress: onDiscard,
        },
      ]
    );
  };

  const formattedSavedDate = draft.lastSavedAt
    ? new Date(draft.lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <View style={[styles.card, isRevision && styles.cardRevision]}>
      {/* Badge Bar */}
      <View style={styles.badgeBar}>
        <View style={styles.badgesGroup}>
          <View style={[styles.typeBadge, isRevision ? styles.badgeWarning : styles.badgePrimary]}>
            <Ionicons
              name={isRevision ? 'build-outline' : 'document-text-outline'}
              size={12}
              color={isRevision ? Palette.amber800 : Palette.primary700}
            />
            <Text style={[styles.typeBadgeText, isRevision ? styles.textWarning : styles.textPrimary]}>
              {isRevision ? 'Revision in Progress' : 'Active Draft'}
            </Text>
          </View>

          {isRevision && (
            <View style={styles.changesRequestedBadge}>
              <Text style={styles.changesRequestedText}>Addressing Feedback</Text>
            </View>
          )}
        </View>

        {onDiscard && (
          <Pressable
            onPress={handleConfirmDiscard}
            accessibilityRole="button"
            accessibilityLabel="Discard draft"
            hitSlop={8}
            style={styles.discardBtn}>
            <Ionicons name="trash-outline" size={16} color={Palette.neutral400} />
          </Pressable>
        )}
      </View>

      {/* Main Content Info */}
      <View style={styles.mainContent}>
        {draft.coverImage ? (
          <Image source={{ uri: draft.coverImage }} style={styles.draftCover} contentFit="cover" />
        ) : (
          <View style={styles.placeholderCover}>
            <Ionicons name="image-outline" size={24} color={Palette.neutral400} />
          </View>
        )}

        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={2}>
            {draft.title.trim().length > 0 ? draft.title : 'Untitled Campaign Draft'}
          </Text>
          <Text style={styles.categoryText}>
            {draft.category} • by {draft.creatorName.trim().length > 0 ? draft.creatorName : 'Creator'}
          </Text>
        </View>
      </View>

      {/* Progress & Step Info */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.stepNameText}>
            Step {step} of 5: {STEP_LABELS[step]}
          </Text>
          <Text style={styles.percentText}>{stepProgress}%</Text>
        </View>
        <ProgressBar
          progress={stepProgress}
          height={4}
          color={isRevision ? Palette.amber600 : Palette.primary600}
        />
      </View>

      {/* Footer CTA & Metadata */}
      <View style={styles.footerRow}>
        <View style={styles.lastSavedWrap}>
          {formattedSavedDate ? (
            <Text style={styles.lastSavedText}>Last saved at {formattedSavedDate}</Text>
          ) : (
            <Text style={styles.lastSavedText}>Draft saved locally</Text>
          )}
        </View>

        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue editing campaign draft"
          style={({ pressed }) => [
            styles.continueBtn,
            isRevision && styles.continueBtnRevision,
            pressed && styles.continueBtnPressed,
          ]}>
          <Text
            style={[
              styles.continueBtnText,
              isRevision && styles.continueBtnTextRevision,
            ]}>
            Continue Editing
          </Text>
          <Ionicons
            name="arrow-forward"
            size={14}
            color={isRevision ? Palette.amber900 : Palette.pureWhite}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: Palette.primary200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: Palette.primary700,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardRevision: {
    borderColor: Palette.amber200,
    backgroundColor: Palette.amber50,
  },
  badgeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  badgePrimary: {
    backgroundColor: Palette.primary50,
  },
  badgeWarning: {
    backgroundColor: Palette.amber100,
  },
  typeBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  textPrimary: {
    color: Palette.primary800,
  },
  textWarning: {
    color: Palette.amber900,
  },
  changesRequestedBadge: {
    backgroundColor: Palette.amber200,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  changesRequestedText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.amber950,
  },
  discardBtn: {
    padding: 4,
  },
  mainContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  draftCover: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
  },
  placeholderCover: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 2,
  },
  categoryText: {
    ...Typography.caption,
    color: Palette.neutral500,
    fontSize: 11,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNameText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.neutral600,
  },
  percentText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.navy900,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral100,
  },
  lastSavedWrap: {
    flex: 1,
  },
  lastSavedText: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary600,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  continueBtnRevision: {
    backgroundColor: Palette.amber200,
    borderWidth: 1,
    borderColor: Palette.amber200,
  },
  continueBtnPressed: {
    opacity: 0.85,
  },
  continueBtnText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.pureWhite,
  },
  continueBtnTextRevision: {
    color: Palette.amber950,
  },
});
