import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
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
import { CATEGORIES, CategoryName } from '@/constants/categories';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { CampaignStepIndicator } from '@/components/create/CampaignStepIndicator';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { CampaignBasicsSchema } from '@/schemas/campaign.schema';
import { pickImageFromLibrary } from '@/utils/image-picker';

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
];

export default function CreateBasicsScreen() {
  const router = useRouter();
  const {
    draft,
    updateField,
    updateFields,
    setCurrentStep,
    saveAsDraft,
    lastSavedAt,
    isSaving,
  } = useCampaignDraftStore();

  const [title, setTitle] = useState(draft.title || '');
  const [category, setCategory] = useState<CategoryName>(draft.category || 'Environment');
  const [creatorName, setCreatorName] = useState(draft.creatorName || '');
  const [summary, setSummary] = useState(draft.summary || '');
  const [coverImage, setCoverImage] = useState<string | undefined>(draft.coverImage);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveBannerText, setSaveBannerText] = useState<string | null>(null);

  // Sync draft if rehydrated
  useEffect(() => {
    if (draft.title && !title) setTitle(draft.title);
    if (draft.category && draft.category !== category) setCategory(draft.category);
    if (draft.creatorName && !creatorName) setCreatorName(draft.creatorName);
    if (draft.summary && !summary) setSummary(draft.summary);
    if (draft.coverImage && !coverImage) setCoverImage(draft.coverImage);
  }, [draft]);

  const handleTitleChange = (val: string) => {
    // Hard restrict to 60 chars per specification
    const sanitized = val.slice(0, 60);
    setTitle(sanitized);
    updateField('title', sanitized);
    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
  };

  const handleCategoryChange = (cat: CategoryName) => {
    setCategory(cat);
    updateField('category', cat);
    if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
  };

  const handleCreatorChange = (val: string) => {
    setCreatorName(val);
    updateField('creatorName', val);
    if (errors.creatorName) setErrors((prev) => ({ ...prev, creatorName: '' }));
  };

  const handleSummaryChange = (val: string) => {
    setSummary(val);
    updateField('summary', val);
    if (errors.summary) setErrors((prev) => ({ ...prev, summary: '' }));
  };

  const handlePickCoverImage = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      setCoverImage(uri);
      updateField('coverImage', uri);
    }
  };

  const handleSelectSampleCover = (uri: string) => {
    setCoverImage(uri);
    updateField('coverImage', uri);
  };

  const handleRemoveCover = () => {
    setCoverImage(undefined);
    updateField('coverImage', undefined);
  };

  const handleSaveDraft = () => {
    updateFields({
      title,
      category,
      creatorName,
      summary,
      coverImage,
    });
    saveAsDraft();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaveBannerText('Draft saved successfully');
    setTimeout(() => setSaveBannerText(null), 3000);
  };

  const handleNext = () => {
    const result = CampaignBasicsSchema.safeParse({
      title,
      category,
      creatorName,
      summary,
      coverImage,
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
      title,
      category,
      creatorName,
      summary,
      coverImage,
      currentStep: 2,
    });
    setCurrentStep(2);
    router.push('/create-campaign/story');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Step Indicator with Autosave Badge */}
      <CampaignStepIndicator
        currentStep={1}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Campaign Basics</Text>
          <Text style={styles.pageSubtitle}>
            Define your primary message headline, verified identity, and topic category.
          </Text>
        </View>
      </View>

      {/* Save confirmation toast banner */}
      {saveBannerText && (
        <View style={styles.saveBanner}>
          <Ionicons name="checkmark-circle" size={16} color={Palette.success600} />
          <Text style={styles.saveBannerText}>{saveBannerText}</Text>
        </View>
      )}

      {/* Form Fields */}
      <View style={styles.formSection}>
        {/* Title with live counter */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Campaign Headline *</Text>
          <Text style={[styles.charCounter, title.length >= 60 && styles.charCounterMax]}>
            {title.length} / 60
          </Text>
        </View>
        <AppInput
          placeholder="e.g. Clean Water Infrastructure for Eastern Villages"
          value={title}
          onChangeText={handleTitleChange}
          maxLength={60}
          error={errors.title}
          hint="Factual, high-impact headline (5–60 characters)."
        />

        {/* Category */}
        <Text style={styles.fieldLabel}>Topic Category *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={styles.categoryScrollWrapper}>
          {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              selected={category === cat}
              onPress={() => handleCategoryChange(cat)}
            />
          ))}
        </ScrollView>
        {errors.category ? <Text style={styles.inlineError}>{errors.category}</Text> : null}

        {/* Creator Name */}
        <AppInput
          label="Creator / Organization Name *"
          placeholder="e.g. WaterFirst Foundation or Dr. Sarah Jenkins"
          value={creatorName}
          onChangeText={handleCreatorChange}
          maxLength={80}
          error={errors.creatorName}
          hint="Official publishing entity or legal individual name for verified attribution."
        />

        {/* Short Summary */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Short Summary *</Text>
          <Text style={styles.charCounter}>{summary.length} / 240</Text>
        </View>
        <AppInput
          placeholder="Summarize the message essence and why broader audiences must hear it..."
          value={summary}
          onChangeText={handleSummaryChange}
          multiline
          numberOfLines={3}
          maxLength={240}
          error={errors.summary}
          hint="Brief overview shown on campaign cards and discovery feeds (20–240 chars)."
        />

        {/* Cover Image Selection */}
        <View style={styles.coverSection}>
          <View style={styles.fieldHeaderRow}>
            <Text style={styles.fieldLabel}>Campaign Cover Image (Optional)</Text>
            {coverImage ? (
              <Pressable onPress={handleRemoveCover} hitSlop={6}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>

          {coverImage ? (
            <View style={styles.coverPreviewContainer}>
              <Image source={{ uri: coverImage }} style={styles.coverPreview} contentFit="cover" />
              <Pressable
                onPress={handlePickCoverImage}
                style={styles.replaceBadge}
                accessibilityRole="button"
                accessibilityLabel="Replace cover image">
                <Ionicons name="camera" size={14} color={Palette.pureWhite} />
                <Text style={styles.replaceBadgeText}>Replace</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickCoverImage}
              accessibilityRole="button"
              accessibilityLabel="Upload cover photo from photo library"
              style={({ pressed }) => [styles.uploadBox, pressed && styles.btnPressed]}>
              <Ionicons name="cloud-upload-outline" size={28} color={Palette.primary700} />
              <Text style={styles.uploadTitle}>Choose Photo from Library</Text>
              <Text style={styles.uploadSubtitle}>High-resolution 16:9 landscape image recommended</Text>
            </Pressable>
          )}

          {/* Quick-pick presets */}
          <Text style={styles.presetLabel}>Or choose a curated visual:</Text>
          <View style={styles.presetRow}>
            {SAMPLE_COVERS.map((uri, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSelectSampleCover(uri)}
                accessibilityRole="button"
                accessibilityLabel={`Choose sample cover image ${idx + 1}`}
                style={[
                  styles.presetThumbWrapper,
                  coverImage === uri && styles.presetThumbSelected,
                ]}>
                <Image source={{ uri }} style={styles.presetThumb} contentFit="cover" />
                {coverImage === uri && (
                  <View style={styles.presetCheck}>
                    <Ionicons name="checkmark" size={12} color={Palette.pureWhite} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <AppButton
          title="Continue to Story (Step 2)"
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
    marginBottom: 4,
  },
  charCounter: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  charCounterMax: {
    color: Palette.warning600,
    fontWeight: '700',
  },
  inlineError: {
    ...Typography.caption,
    color: Palette.error600,
    marginBottom: Spacing.sm,
  },
  categoryScrollWrapper: {
    marginBottom: Spacing.md,
  },
  categoryScroll: {
    paddingVertical: 2,
  },
  coverSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  removeText: {
    ...Typography.caption,
    color: Palette.error600,
    fontWeight: '600',
  },
  coverPreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.sm,
    backgroundColor: Palette.neutral200,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  replaceBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  replaceBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.pureWhite,
    fontWeight: '700',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Palette.neutral300,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.neutral50,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  uploadTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.primary700,
  },
  uploadSubtitle: {
    ...Typography.caption,
    color: Palette.neutral500,
    fontSize: 11,
  },
  presetLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetThumbWrapper: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.neutral200,
    position: 'relative',
  },
  presetThumbSelected: {
    borderColor: Palette.primary700,
  },
  presetThumb: {
    width: '100%',
    height: '100%',
  },
  presetCheck: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Palette.primary700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
