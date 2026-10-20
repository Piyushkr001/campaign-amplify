import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { CampaignStepIndicator } from '@/components/create/CampaignStepIndicator';
import { CampaignSubmissionPreviewModal } from '@/components/create/CampaignSubmissionPreviewModal';
import { AdCreativePreview } from '@/components/create/AdCreativePreview';
import { RevisionFeedbackBanner } from '@/components/create/RevisionFeedbackBanner';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { Config } from '@/constants/config';
import { CampaignService } from '@/services/campaign.service';
import { formatApiError } from '@/services/api-errors';
import { formatCurrency } from '@/utils/formatters';
import { calculateUseOfFunds, estimateReach, formatReachEstimate } from '@/utils/reach';
import { queryClient } from '@/services/query-client';
import { campaignKeys, reviewKeys } from '@/constants/query-keys';
import {
  CampaignBasicsSchema,
  CampaignReachSchema,
  CampaignStorySchema,
  CampaignSubmitSchema,
  CampaignVisualsSchema,
} from '@/schemas/campaign.schema';

const GOAL_PRESETS = [1000, 2500, 5000, 10000, 25000];

export default function CreateSubmitScreen() {
  const router = useRouter();
  const {
    draft,
    updateField,
    updateFields,
    setCurrentStep,
    setSyncStatus,
    saveAsDraft,
    resetDraft,
    lastSavedAt,
  } = useCampaignDraftStore();
  const { addFromDraft, updateFromDraft, transitionCampaign, getCampaignById } =
    useMyCampaignsStore();

  const isRevision = draft.mode === 'REVISION';
  const existingCampaign = draft.id ? getCampaignById(draft.id) : undefined;

  const [fundingGoal, setFundingGoal] = useState<number>(draft.fundingGoal || 2500);
  const [customGoalInput, setCustomGoalInput] = useState<string>(
    draft.fundingGoal ? draft.fundingGoal.toString() : '2500'
  );
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    !GOAL_PRESETS.includes(draft.fundingGoal || 2500)
  );

  const [agreePolicies, setAgreePolicies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveBannerText, setSaveBannerText] = useState<string | null>(null);

  // Navigation guard
  useEffect(() => {
    if (!draft.title && !draft.summary) {
      router.replace('/create-campaign/basics');
    }
  }, [draft.title, draft.summary, router]);

  // Derived real-time reach calculation from single source of truth
  const reach = estimateReach(fundingGoal);
  const funds = calculateUseOfFunds(fundingGoal);

  const handleSelectPreset = (amount: number) => {
    setIsCustomMode(false);
    setFundingGoal(amount);
    setCustomGoalInput(amount.toString());
    updateField('fundingGoal', amount);
    if (errors.fundingGoal) setErrors((prev) => ({ ...prev, fundingGoal: '' }));
  };

  const handleCustomGoalChange = (val: string) => {
    setIsCustomMode(true);
    setCustomGoalInput(val);
    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setFundingGoal(parsed);
      updateField('fundingGoal', parsed);
      if (errors.fundingGoal) setErrors((prev) => ({ ...prev, fundingGoal: '' }));
    }
  };

  const handleSaveDraft = async () => {
    updateFields({ fundingGoal });
    saveAsDraft();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (Config.useApi) {
      try {
        setSyncStatus('PENDING');
        const serverId = await CampaignService.syncFullDraftToServer({ ...draft, fundingGoal });
        updateFields({ id: serverId });
        setSyncStatus('SYNCED');
        setSaveBannerText('Draft synced to server with review preferences');
      } catch (err: any) {
        console.warn('[CreateSubmit] Sync failed:', err);
        setSyncStatus('ERROR', err?.message || 'Server sync failed');
        setSaveBannerText('Saved locally on device (cloud sync pending)');
      }
    } else {
      setSaveBannerText('Draft saved with review preferences');
    }
    setTimeout(() => setSaveBannerText(null), 3000);
  };

  const promptStepCorrection = (stepName: string, errorMessage: string, route: Href) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const title = `${stepName} Section Incomplete`;
    const message = `${errorMessage}\n\nPlease review and complete the ${stepName} section before submitting.`;
    const buttonText = `Review ${stepName}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const proceed = window.confirm(`${title}\n\n${message}\n\nClick OK to open ${buttonText}.`);
      if (proceed) {
        router.push(route);
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: buttonText, onPress: () => router.push(route) },
      ]);
    }
  };

  const handleSubmit = async () => {
    // Step 1: Basics
    const basicsResult = CampaignBasicsSchema.safeParse({
      title: draft.title,
      category: draft.category,
      creatorName: draft.creatorName,
      summary: draft.summary,
      coverImage: draft.coverImage,
    });
    if (!basicsResult.success) {
      const issue = basicsResult.error.issues[0];
      promptStepCorrection('Basics', issue.message, '/create-campaign/basics');
      return;
    }

    // Step 2: Story
    const storyResult = CampaignStorySchema.safeParse({
      storyHeadline: draft.storyHeadline,
      storyIntro: draft.storyIntro,
      storyContent: draft.storyContent,
      sources: draft.sources,
      storyImage: draft.storyImage,
      storyImageCaption: draft.storyImageCaption,
      storyImageCredit: draft.storyImageCredit,
      suggestedAction: draft.suggestedAction,
    });
    if (!storyResult.success) {
      const issue = storyResult.error.issues[0];
      promptStepCorrection('Story', issue.message, '/create-campaign/story');
      return;
    }

    // Step 3: Visuals
    const visualsResult = CampaignVisualsSchema.safeParse({
      coverImage: draft.coverImage,
      adImage: draft.adImage,
      adHeadline: draft.adHeadline,
      adDescription: draft.adDescription,
      adCTA: draft.adCTA,
    });
    if (!visualsResult.success) {
      const issue = visualsResult.error.issues[0];
      promptStepCorrection('Visuals & Ad Creative', issue.message, '/create-campaign/visuals');
      return;
    }

    // Step 4: Reach
    const reachResult = CampaignReachSchema.safeParse({
      locations: draft.locations,
      interests: draft.interests,
      channels: draft.channels,
      audienceDescription: draft.audienceDescription,
      durationDays: draft.durationDays,
    });
    if (!reachResult.success) {
      const issue = reachResult.error.issues[0];
      promptStepCorrection('Reach & Targeting', issue.message, '/create-campaign/reach');
      return;
    }

    // Step 5: Submit
    const result = CampaignSubmitSchema.safeParse({
      fundingGoal,
      agreePolicies,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'general';
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (Config.useApi) {
        // Backend API authoritative submission: NEVER silently fall back to local!
        setSyncStatus('PENDING');
        try {
          // Phase 11: Ensure server has latest Basics, Story, Visuals, and Reach
          const serverId = await CampaignService.syncFullDraftToServer({
            ...draft,
            fundingGoal,
          });
          updateFields({ id: serverId });

          const result = await CampaignService.submitCampaign(serverId, { fundingGoal });
          setSyncStatus('SYNCED');

          // Phase 6 & Phase 28: Mirror submitted campaign to local cache using SAME server UUID
          if (isRevision) {
            updateFromDraft(serverId, { ...draft, fundingGoal, id: serverId });
            transitionCampaign(serverId, 'SUBMITTED_FOR_REVIEW', {
              actor: 'CREATOR',
              note: 'Campaign revisions resubmitted by creator for editorial review.',
            });
          } else {
            addFromDraft({ ...draft, fundingGoal, id: serverId });
          }

          // Invalidate creator and review queries so lists reconcile immediately with backend
          queryClient.invalidateQueries({ queryKey: campaignKeys.creator.all });
          queryClient.invalidateQueries({ queryKey: reviewKeys.all });
          queryClient.invalidateQueries({ queryKey: campaignKeys.all });

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          resetDraft();

          router.replace({
            pathname: '/create-campaign/success',
            params: {
              id: result.id || serverId,
              title: draft.title,
              resubmitted: isRevision ? 'true' : undefined,
            },
          });
          return;
        } catch (apiErr: any) {
          setIsSubmitting(false);
          setSyncStatus('ERROR', apiErr?.message || 'Server sync or submission failed');
          const formatted = formatApiError(apiErr);
          Alert.alert(
            'Server Submission Required',
            `${formatted.message}\n\nYour work is safely preserved on this device. Please check your connection and retry.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry Submit', onPress: () => handleSubmit() },
            ]
          );
          return;
        }
      }

      // Local prototype mode ONLY (Config.useApi === false)
      if (isRevision && draft.id) {
        // Local prototype revision flow
        const updatedCampaign = updateFromDraft(draft.id, {
          ...draft,
          fundingGoal,
        });

        if (!updatedCampaign) {
          setIsSubmitting(false);
          Alert.alert(
            'Revision Failed',
            'Unable to update the original campaign record. Your changes have been preserved in your draft.'
          );
          return;
        }

        const transitionResult = transitionCampaign(draft.id, 'SUBMITTED_FOR_REVIEW', {
          actor: 'CREATOR',
          note: 'Campaign revisions resubmitted by creator for editorial review.',
        });

        if (!transitionResult.success) {
          setIsSubmitting(false);
          Alert.alert(
            'Resubmission Failed',
            transitionResult.error || 'The lifecycle transition could not be completed. Your draft remains saved.'
          );
          return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        resetDraft();

        router.replace({
          pathname: '/create-campaign/success',
          params: {
            id: draft.id,
            title: updatedCampaign.title || draft.title,
            resubmitted: 'true',
          },
        });
      } else {
        // Local prototype new campaign creation flow
        const submittedCampaign = addFromDraft({
          ...draft,
          fundingGoal,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        resetDraft();

        router.replace({
          pathname: '/create-campaign/success',
          params: { id: submittedCampaign.id, title: submittedCampaign.title },
        });
      }
    } catch (err) {
      console.error('Submission error:', err);
      Alert.alert('Submission Error', 'Failed to submit campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Step Indicator */}
      <CampaignStepIndicator
        currentStep={5}
        lastSavedAt={lastSavedAt}
        syncStatus={draft.syncStatus}
        onSaveDraft={handleSaveDraft}
        onRetrySync={handleSaveDraft}
      />

      {/* Contextual Revision Feedback Banner */}
      {isRevision && existingCampaign?.reviewFeedback ? (
        <RevisionFeedbackBanner
          feedback={existingCampaign.reviewFeedback}
          campaignTitle={existingCampaign.title}
        />
      ) : null}

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 4"
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Review & Submit</Text>
          <Text style={styles.pageSubtitle}>
            Set your campaign funding goal, audit editorial claims, and submit for compliance review.
          </Text>
        </View>
      </View>

      {/* Save Banner */}
      {saveBannerText && (
        <View style={styles.saveBanner}>
          <Ionicons name="checkmark-circle" size={16} color={Palette.success600} />
          <Text style={styles.saveBannerText}>{saveBannerText}</Text>
        </View>
      )}

      {/* SECTION 1: Explicit Funding Goal Selection */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>1. Campaign Amplification Funding Goal *</Text>
          <Text style={styles.sectionSub}>
            Select the total community sponsorship target to fund advertising distribution.
          </Text>
        </View>

        {/* Presets */}
        <View style={styles.presetRow}>
          {GOAL_PRESETS.map((amt) => {
            const isSelected = !isCustomMode && fundingGoal === amt;
            return (
              <Pressable
                key={amt}
                onPress={() => handleSelectPreset(amt)}
                accessibilityRole="button"
                accessibilityLabel={`Funding target ${formatCurrency(amt)}`}
                style={[styles.presetPill, isSelected && styles.presetPillActive]}>
                <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                  {formatCurrency(amt)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom amount */}
        <View style={styles.customAmountWrapper}>
          <Text style={styles.customLabel}>Or enter custom funding target ($):</Text>
          <AppInput
            placeholder="e.g. 7500"
            value={customGoalInput}
            onChangeText={handleCustomGoalChange}
            keyboardType="numeric"
            error={errors.fundingGoal}
          />
        </View>

        {/* Real-time Estimated Reach Box */}
        <View style={styles.reachEstimateBox}>
          <View style={styles.reachTopRow}>
            <View style={styles.reachIconWrapper}>
              <Ionicons name="megaphone" size={16} color={Palette.pureWhite} />
            </View>
            <View>
              <Text style={styles.reachBoxTitle}>Estimated Message Delivery</Text>
              <Text style={styles.reachRangeText}>
                {formatReachEstimate(reach.min, reach.max)}
                <Text style={styles.reachUnit}> potential views</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Use of Funds Policy Breakdown */}
        <View style={styles.fundsCard}>
          <Text style={styles.fundsHeading}>Use of Funds Breakdown</Text>
          <Text style={styles.fundsPolicyDesc}>
            Contributions support campaign amplification, including advertising distribution and applicable platform/payment processing costs.
          </Text>

          <View style={styles.fundRow}>
            <Text style={styles.fundLabel}>
              Direct Paid Ad Placement ({Config.feeStructure.advertisingPercentage}%)
            </Text>
            <Text style={styles.fundValue}>{formatCurrency(funds.advertising)}</Text>
          </View>
          <View style={styles.fundRow}>
            <Text style={styles.fundLabel}>
              Platform Operations & Review ({Config.feeStructure.platformFeePercentage}%)
            </Text>
            <Text style={styles.fundValue}>{formatCurrency(funds.platformFee)}</Text>
          </View>
          <View style={styles.fundRow}>
            <Text style={styles.fundLabel}>
              Payment Processing ({Config.feeStructure.paymentProcessingPercentage}%)
            </Text>
            <Text style={styles.fundValue}>{formatCurrency(funds.paymentProcessing)}</Text>
          </View>
        </View>
      </View>

      {/* SECTION 2: Complete Campaign Review Overview */}
      <View style={styles.sectionCard}>
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.sectionHeading}>2. Complete Campaign Overview</Text>
          <Pressable
            onPress={() => setShowPreviewModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Open full campaign preview modal"
            style={styles.openFullPreviewBtn}>
            <Ionicons name="eye-outline" size={14} color={Palette.primary700} />
            <Text style={styles.openFullPreviewText}>Full Preview</Text>
          </Pressable>
        </View>

        {/* Media snippet */}
        {draft.coverImage && (
          <View style={styles.coverThumbnailWrapper}>
            <Image source={{ uri: draft.coverImage }} style={styles.coverThumbnail} contentFit="cover" />
          </View>
        )}

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Headline</Text>
          <Text style={styles.summaryValue}>{draft.title || 'Untitled Campaign'}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Category & Creator</Text>
          <Text style={styles.summaryValue}>
            {draft.category} • By {draft.creatorName || 'Anonymous Publisher'}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Short Summary</Text>
          <Text style={styles.summaryText}>{draft.summary}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Editorial Story</Text>
          <Text style={styles.summaryValue}>{draft.storyHeadline || 'Story Headline'}</Text>
          <Text style={styles.storyIntroText} numberOfLines={2}>
            {draft.storyIntro || 'Lead intro paragraph...'}
          </Text>
        </View>

        {/* Supporting sources summary with Edit link */}
        <View style={styles.summaryItem}>
          <View style={styles.sourcesHeaderRow}>
            <Text style={styles.summaryLabel}>Supporting Sources ({draft.sources.length})</Text>
            <Pressable
              onPress={() => router.push('/create-campaign/story')}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Edit sources in Story step">
              <Text style={styles.editLinkText}>Edit in Story</Text>
            </Pressable>
          </View>
          {draft.sources.length === 0 ? (
            <Text style={styles.noSourcesWarn}>
              No supporting research links attached. Adding references helps provide context for review.
            </Text>
          ) : (
            draft.sources.slice(0, 3).map((s, idx) => (
              <View key={s.id || idx} style={styles.sourcePreviewRow}>
                <Ionicons name="link-outline" size={12} color={Palette.primary700} />
                <Text style={styles.sourcePreviewTitle} numberOfLines={1}>
                  {s.title}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Ad creative summary */}
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Ad Creative Hook</Text>
          <Text style={styles.summaryValue}>{draft.adHeadline || draft.title}</Text>
          <Text style={styles.adDescText} numberOfLines={2}>
            {draft.adDescription || draft.summary}
          </Text>
        </View>

        {/* Targeting summary */}
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Targeting Parameters</Text>
          <Text style={styles.summaryValue}>
            Locations: {draft.locations.join(', ') || 'General'}
          </Text>
          <Text style={styles.targetingSub}>
            Channels: {draft.channels.join(', ') || 'All Networks'} • Duration: {draft.durationDays || 14} days
          </Text>
        </View>
      </View>

      {/* SECTION 3: Editorial Certifications & Policy */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>3. Editorial Certifications</Text>

        <Pressable
          onPress={() => {
            const next = !agreePolicies;
            setAgreePolicies(next);
            if (errors.agreePolicies) setErrors((prev) => ({ ...prev, agreePolicies: '' }));
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreePolicies }}
          style={styles.policyRow}>
          <View style={[styles.checkbox, agreePolicies && styles.checkboxActive]}>
            {agreePolicies && <Ionicons name="checkmark" size={14} color={Palette.pureWhite} />}
          </View>
          <Text style={styles.policyLabel}>
            I confirm that the campaign information is accurate and I agree to the campaign submission and distribution policies.
          </Text>
        </Pressable>
        {errors.agreePolicies ? <Text style={styles.inlineError}>{errors.agreePolicies}</Text> : null}
      </View>

      {/* SECTION 4: Actions (Back, Save Draft, Preview, Submit) */}
      <View style={styles.actionContainer}>
        {/* Secondary buttons row */}
        <View style={styles.secondaryRow}>
          <AppButton
            title="Preview Campaign"
            onPress={() => setShowPreviewModal(true)}
            variant="outline"
            size="md"
            icon={<Ionicons name="eye-outline" size={16} color={Palette.navy900} />}
            style={styles.secondaryBtn}
          />
          <AppButton
            title="Save as Draft"
            onPress={handleSaveDraft}
            variant="secondary"
            size="md"
            icon={<Ionicons name="cloud-outline" size={16} color={Palette.navy900} />}
            style={styles.secondaryBtn}
          />
        </View>

        {/* Primary submit action */}
        <AppButton
          title={isRevision ? 'Submit Requested Changes' : 'Submit for Review'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!agreePolicies || isSubmitting}
          loading={isSubmitting}
          icon={<Ionicons name="shield-checkmark" size={18} color={Palette.pureWhite} />}
        />
      </View>

      {/* Complete Campaign Preview Modal */}
      <CampaignSubmissionPreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        draft={{ ...draft, fundingGoal }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
    marginTop: 2,
  },
  btnPressed: {
    opacity: 0.7,
  },
  headerTitles: {
    flex: 1,
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
    lineHeight: 18,
  },
  saveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.success50,
    borderWidth: 1,
    borderColor: Palette.success200,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  saveBannerText: {
    ...Typography.bodySmall,
    color: Palette.success700,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: 2,
  },
  sectionSub: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  presetPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  presetPillActive: {
    backgroundColor: Palette.primary700,
    borderColor: Palette.primary700,
  },
  presetText: {
    ...Typography.buttonSmall,
    fontSize: 12,
    color: Palette.navy900,
    fontWeight: '600',
  },
  presetTextActive: {
    color: Palette.pureWhite,
    fontWeight: '700',
  },
  customAmountWrapper: {
    marginBottom: Spacing.md,
  },
  customLabel: {
    ...Typography.caption,
    color: Palette.neutral600,
    marginBottom: 4,
  },
  reachEstimateBox: {
    backgroundColor: Palette.navy950,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reachTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reachIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachBoxTitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral300,
  },
  reachRangeText: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.pureWhite,
  },
  reachUnit: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.neutral400,
    fontWeight: '400',
  },
  fundsCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  fundsHeading: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 2,
  },
  fundsPolicyDesc: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral600,
    lineHeight: 15,
    marginBottom: Spacing.xs,
  },
  fundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral200,
  },
  fundLabel: {
    ...Typography.caption,
    color: Palette.neutral600,
  },
  fundValue: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.navy900,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  openFullPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Palette.neutral100,
  },
  openFullPreviewText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.primary700,
    fontWeight: '600',
  },
  coverThumbnailWrapper: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Palette.neutral200,
    marginBottom: Spacing.sm,
  },
  coverThumbnail: {
    width: '100%',
    height: '100%',
  },
  summaryItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  summaryLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
    marginTop: 1,
  },
  summaryText: {
    ...Typography.bodySmall,
    color: Palette.neutral700,
    lineHeight: 18,
    marginTop: 1,
  },
  storyIntroText: {
    ...Typography.caption,
    fontStyle: 'italic',
    color: Palette.neutral600,
    marginTop: 2,
  },
  sourcesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLinkText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.primary700,
    fontWeight: '600',
  },
  noSourcesWarn: {
    ...Typography.caption,
    color: Palette.warning700,
    marginTop: 2,
  },
  sourcePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  sourcePreviewTitle: {
    ...Typography.caption,
    color: Palette.navy800,
    flex: 1,
  },
  adDescText: {
    ...Typography.caption,
    color: Palette.neutral600,
    marginTop: 2,
  },
  targetingSub: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 2,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
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
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Palette.primary700,
    borderColor: Palette.primary700,
  },
  policyLabel: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    flex: 1,
    lineHeight: 18,
  },
  inlineError: {
    ...Typography.caption,
    color: Palette.error600,
    marginTop: 4,
  },
  actionContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl * 2,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
  },
});
