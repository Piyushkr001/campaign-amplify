import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { CampaignStepIndicator } from '@/components/create/CampaignStepIndicator';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { CampaignSource } from '@/types/campaign';
import { CampaignStorySchema } from '@/schemas/campaign.schema';
import { pickImageFromLibrary } from '@/utils/image-picker';
import { generateId } from '@/utils/id';

export default function CreateStoryScreen() {
  const router = useRouter();
  const {
    draft,
    updateField,
    updateFields,
    setCurrentStep,
    addSource,
    updateSource,
    removeSource,
    saveAsDraft,
    lastSavedAt,
    isSaving,
    hasHydrated,
  } = useCampaignDraftStore();

  const [storyHeadline, setStoryHeadline] = useState(draft.storyHeadline || '');
  const [storyIntro, setStoryIntro] = useState(draft.storyIntro || '');
  const [storyContent, setStoryContent] = useState(draft.storyContent || '');
  const [storyImage, setStoryImage] = useState<string | undefined>(draft.storyImage);
  const [storyImageCaption, setStoryImageCaption] = useState(draft.storyImageCaption || '');
  const [storyImageCredit, setStoryImageCredit] = useState(draft.storyImageCredit || '');
  const [suggestedAction, setSuggestedAction] = useState(draft.suggestedAction || '');

  // Local state for active new source input modal/row
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourcePublisher, setNewSourcePublisher] = useState('');
  const [sourceInputError, setSourceInputError] = useState('');
  const [showAddSourceRow, setShowAddSourceRow] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveBannerText, setSaveBannerText] = useState<string | null>(null);

  // Sync draft rehydration from AsyncStorage
  useEffect(() => {
    if (draft.storyHeadline && !storyHeadline) setStoryHeadline(draft.storyHeadline);
    if (draft.storyIntro && !storyIntro) setStoryIntro(draft.storyIntro);
    if (draft.storyContent && !storyContent) setStoryContent(draft.storyContent);
    if (draft.storyImage && !storyImage) setStoryImage(draft.storyImage);
    if (draft.storyImageCaption && !storyImageCaption) setStoryImageCaption(draft.storyImageCaption);
    if (draft.storyImageCredit && !storyImageCredit) setStoryImageCredit(draft.storyImageCredit);
    if (draft.suggestedAction && !suggestedAction) setSuggestedAction(draft.suggestedAction);
  }, [hasHydrated]);

  // Debounced autosave (600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFields({
        storyHeadline,
        storyIntro,
        storyContent,
        storyImage,
        storyImageCaption,
        storyImageCredit,
        suggestedAction,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [
    storyHeadline,
    storyIntro,
    storyContent,
    storyImage,
    storyImageCaption,
    storyImageCredit,
    suggestedAction,
  ]);

  // Navigation guard
  useEffect(() => {
    if (!draft.title && !draft.summary) {
      router.replace('/create-campaign/basics');
    }
  }, [draft.title, draft.summary, router]);

  const handlePickStoryImage = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      setStoryImage(uri);
      updateField('storyImage', uri);
    }
  };

  const handleRemoveStoryImage = () => {
    setStoryImage(undefined);
    updateField('storyImage', undefined);
  };

  const handleAddSource = () => {
    const trimmedTitle = newSourceTitle.trim();
    const trimmedUrl = newSourceUrl.trim();

    if (!trimmedTitle) {
      setSourceInputError('Source title is required.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setSourceInputError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setSourceInputError('');
    addSource({
      id: generateId('src'),
      title: trimmedTitle,
      url: trimmedUrl,
      publisher: newSourcePublisher.trim() || undefined,
    });

    setNewSourceTitle('');
    setNewSourceUrl('');
    setNewSourcePublisher('');
    setShowAddSourceRow(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleSaveDraft = () => {
    updateFields({
      storyHeadline,
      storyIntro,
      storyContent,
      storyImage,
      storyImageCaption,
      storyImageCredit,
      suggestedAction,
    });
    saveAsDraft();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaveBannerText('Story draft saved');
    setTimeout(() => setSaveBannerText(null), 3000);
  };

  const handleNext = () => {
    const result = CampaignStorySchema.safeParse({
      storyHeadline,
      storyIntro,
      storyContent,
      sources: draft.sources,
      storyImage,
      storyImageCaption: storyImageCaption || undefined,
      storyImageCredit: storyImageCredit || undefined,
      suggestedAction: suggestedAction || undefined,
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
    updateFields({
      storyHeadline,
      storyIntro,
      storyContent,
      storyImage,
      storyImageCaption,
      storyImageCredit,
      suggestedAction,
      currentStep: 3,
    });
    setCurrentStep(3);
    router.push('/create-campaign/visuals');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Step Indicator with Autosave */}
      <CampaignStepIndicator
        currentStep={2}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 1"
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Campaign Story & Evidence</Text>
          <Text style={styles.pageSubtitle}>
            Provide editorial depth, substantiated evidence, and independent citations.
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

      {/* Editorial Form */}
      <View style={styles.formSection}>
        {/* Story Headline */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Editorial Headline *</Text>
          <Text style={styles.charCounter}>{storyHeadline.length} / 100</Text>
        </View>
        <AppInput
          placeholder="e.g. Why Rural Water Infrastructure Lags Despite State Funding"
          value={storyHeadline}
          onChangeText={(val) => {
            setStoryHeadline(val);
            updateField('storyHeadline', val);
            if (errors.storyHeadline) setErrors((prev) => ({ ...prev, storyHeadline: '' }));
          }}
          maxLength={100}
          error={errors.storyHeadline}
          hint="Compelling headline framing the central public interest or investigative finding."
        />

        {/* Story Introduction */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Lead Introduction *</Text>
          <Text style={styles.charCounter}>{storyIntro.length} / 500</Text>
        </View>
        <AppInput
          placeholder="Set the stage with 2–3 sentences explaining why this matters right now..."
          value={storyIntro}
          onChangeText={(val) => {
            setStoryIntro(val);
            updateField('storyIntro', val);
            if (errors.storyIntro) setErrors((prev) => ({ ...prev, storyIntro: '' }));
          }}
          multiline
          numberOfLines={3}
          maxLength={500}
          error={errors.storyIntro}
          hint="Opening hook clarifying why existing public awareness is insufficient (min 20 chars)."
        />

        {/* Main Story Content */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Detailed Narrative & Context *</Text>
          <Text style={[styles.charCounter, storyContent.length < 100 && styles.charCounterWarn]}>
            {storyContent.length} chars (min 100)
          </Text>
        </View>
        <AppInput
          placeholder="Describe the full story, verifiable facts, investigative background, and specific community impact in detail..."
          value={storyContent}
          onChangeText={(val) => {
            setStoryContent(val);
            updateField('storyContent', val);
            if (errors.storyContent) setErrors((prev) => ({ ...prev, storyContent: '' }));
          }}
          multiline
          numberOfLines={7}
          error={errors.storyContent}
          hint="Objective, factual narrative supported by context (100–5000 chars)."
        />

        {/* Supporting Sources Section */}
        <View style={styles.sourcesSection}>
          <View style={styles.fieldHeaderRow}>
            <View>
              <Text style={styles.sectionSubheading}>Supporting Research & Sources</Text>
              <Text style={styles.sectionDesc}>
                Add verifiable references such as academic papers, government reports, or news articles.
              </Text>
            </View>
          </View>

          {/* Current Sources List */}
          {draft.sources.length === 0 ? (
            <View style={styles.emptySourcesBox}>
              <Ionicons name="document-text-outline" size={24} color={Palette.neutral400} />
              <Text style={styles.emptySourcesText}>No sources attached yet.</Text>
            </View>
          ) : (
            <View style={styles.sourcesList}>
              {draft.sources.map((src, idx) => (
                <View key={src.id} style={styles.sourceCard}>
                  <View style={styles.sourceCardHeader}>
                    <View style={styles.sourceNumberBadge}>
                      <Text style={styles.sourceNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceTitleText}>{src.title}</Text>
                      {src.publisher ? (
                        <Text style={styles.sourcePublisherText}>Publisher: {src.publisher}</Text>
                      ) : null}
                      <Text style={styles.sourceUrlText} numberOfLines={1}>
                        {src.url}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeSource(src.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove source ${src.title}`}
                      style={styles.removeSourceBtn}>
                      <Ionicons name="trash-outline" size={16} color={Palette.error600} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add source button or form */}
          {showAddSourceRow ? (
            <View style={styles.addSourceCard}>
              <Text style={styles.addSourceHeading}>Add Supporting Source</Text>

              <AppInput
                label="Source Title *"
                placeholder="e.g. WHO Regional Water Quality Report 2024"
                value={newSourceTitle}
                onChangeText={setNewSourceTitle}
              />

              <AppInput
                label="Source URL *"
                placeholder="https://example.org/report.pdf"
                value={newSourceUrl}
                onChangeText={setNewSourceUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <AppInput
                label="Publisher / Institution (Optional)"
                placeholder="e.g. World Health Organization"
                value={newSourcePublisher}
                onChangeText={setNewSourcePublisher}
              />

              {sourceInputError ? (
                <Text style={styles.sourceInputErrorText}>{sourceInputError}</Text>
              ) : null}

              <View style={styles.addSourceActions}>
                <AppButton
                  title="Add Source"
                  onPress={handleAddSource}
                  variant="primary"
                  size="sm"
                  icon={<Ionicons name="add" size={16} color={Palette.pureWhite} />}
                />
                <AppButton
                  title="Cancel"
                  onPress={() => {
                    setShowAddSourceRow(false);
                    setSourceInputError('');
                  }}
                  variant="ghost"
                  size="sm"
                />
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowAddSourceRow(true)}
              accessibilityRole="button"
              accessibilityLabel="Add another supporting source"
              style={({ pressed }) => [styles.addSourceBtn, pressed && styles.btnPressed]}>
              <Ionicons name="add-circle-outline" size={18} color={Palette.primary700} />
              <Text style={styles.addSourceBtnText}>+ Add Supporting Source</Text>
            </Pressable>
          )}
        </View>

        {/* Optional Story Visual */}
        <View style={styles.storyMediaSection}>
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Editorial Photo / Chart (Optional)</Text>
            {storyImage ? (
              <Pressable onPress={handleRemoveStoryImage} hitSlop={6}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>

          {storyImage ? (
            <View style={styles.storyImagePreviewWrapper}>
              <Image source={{ uri: storyImage }} style={styles.storyImagePreview} contentFit="cover" />
              <Pressable
                onPress={handlePickStoryImage}
                style={styles.replaceStoryImageBadge}
                accessibilityRole="button"
                accessibilityLabel="Replace story photo">
                <Ionicons name="camera" size={13} color={Palette.pureWhite} />
                <Text style={styles.replaceBadgeText}>Replace</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickStoryImage}
              accessibilityRole="button"
              accessibilityLabel="Upload story photo or chart"
              style={({ pressed }) => [styles.uploadStoryImageBtn, pressed && styles.btnPressed]}>
              <Ionicons name="image-outline" size={20} color={Palette.primary700} />
              <Text style={styles.uploadStoryImageText}>Add Narrative Photo or Infographic</Text>
            </Pressable>
          )}

          {storyImage ? (
            <>
              <AppInput
                label="Image Caption"
                placeholder="Brief explanatory caption shown below image"
                value={storyImageCaption}
                onChangeText={(val) => {
                  setStoryImageCaption(val);
                  updateField('storyImageCaption', val);
                }}
                maxLength={120}
              />
              <AppInput
                label="Photo Credit / Source"
                placeholder="e.g. Photo by John Doe / Getty Images"
                value={storyImageCredit}
                onChangeText={(val) => {
                  setStoryImageCredit(val);
                  updateField('storyImageCredit', val);
                }}
                maxLength={80}
              />
            </>
          ) : null}
        </View>

        {/* Suggested Audience Action */}
        <AppInput
          label="Suggested Audience Action (Optional)"
          placeholder="e.g. Read the complete research report or demand local water testing"
          value={suggestedAction}
          onChangeText={(val) => {
            setSuggestedAction(val);
            updateField('suggestedAction', val);
          }}
          maxLength={100}
          hint="What should readers who see this message do next?"
        />
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <AppButton
          title="Continue to Visuals (Step 3)"
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
  formSection: {
    marginBottom: Spacing.lg,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
  },
  charCounter: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  charCounterWarn: {
    color: Palette.warning600,
  },
  sourcesSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
  },
  sectionSubheading: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: 2,
  },
  sectionDesc: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: Spacing.sm,
  },
  emptySourcesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
  },
  emptySourcesText: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  sourcesList: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sourceCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.sm,
  },
  sourceCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sourceNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sourceNumberText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral600,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitleText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  sourcePublisherText: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  sourceUrlText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.primary700,
  },
  removeSourceBtn: {
    padding: 4,
  },
  addSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral300,
  },
  addSourceBtnText: {
    ...Typography.buttonSmall,
    color: Palette.primary700,
    fontWeight: '600',
  },
  addSourceCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral300,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  addSourceHeading: {
    ...Typography.h3,
    fontSize: 14,
    color: Palette.navy950,
    marginBottom: Spacing.sm,
  },
  sourceInputErrorText: {
    ...Typography.caption,
    color: Palette.error600,
    marginBottom: Spacing.xs,
  },
  addSourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  storyMediaSection: {
    marginBottom: Spacing.md,
  },
  removeText: {
    ...Typography.caption,
    color: Palette.error600,
    fontWeight: '600',
  },
  storyImagePreviewWrapper: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.sm,
    backgroundColor: Palette.neutral200,
  },
  storyImagePreview: {
    width: '100%',
    height: '100%',
  },
  replaceStoryImageBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
  },
  replaceBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.pureWhite,
    fontWeight: '700',
  },
  uploadStoryImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Palette.neutral300,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.neutral50,
    marginBottom: Spacing.sm,
  },
  uploadStoryImageText: {
    ...Typography.bodySmall,
    color: Palette.primary700,
    fontWeight: '600',
  },
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
