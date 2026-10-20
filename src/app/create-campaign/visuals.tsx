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
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { CampaignStepIndicator } from '@/components/create/CampaignStepIndicator';
import { AdCreativePreview } from '@/components/create/AdCreativePreview';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { CampaignVisualsSchema } from '@/schemas/campaign.schema';
import { Config } from '@/constants/config';
import { CampaignService } from '@/services/campaign.service';
import { pickImageFromLibrary } from '@/utils/image-picker';

const CTA_OPTIONS = ['Learn More', 'Read Report', 'Support Message', 'Take Action', 'View Findings'];

export default function CreateVisualsScreen() {
  const router = useRouter();
  const {
    draft,
    updateField,
    updateFields,
    setCurrentStep,
    setSyncStatus,
    saveAsDraft,
    lastSavedAt,
    hasHydrated,
  } = useCampaignDraftStore();

  const [coverImage, setCoverImage] = useState<string | undefined>(draft.coverImage);
  const [adImage, setAdImage] = useState<string | undefined>(draft.adImage || draft.coverImage);
  const [adHeadline, setAdHeadline] = useState(
    draft.adHeadline || (draft.title ? draft.title.slice(0, 60) : '')
  );
  const [adDescription, setAdDescription] = useState(
    draft.adDescription || (draft.summary ? draft.summary.slice(0, 150) : '')
  );
  const [adCTA, setAdCTA] = useState(draft.adCTA || 'Learn More');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveBannerText, setSaveBannerText] = useState<string | null>(null);

  // Sync draft rehydration from AsyncStorage
  useEffect(() => {
    if (draft.coverImage && !coverImage) setCoverImage(draft.coverImage);
    if (draft.adImage && !adImage) setAdImage(draft.adImage);
    if (draft.adHeadline && !adHeadline) setAdHeadline(draft.adHeadline);
    if (draft.adDescription && !adDescription) setAdDescription(draft.adDescription);
    if (draft.adCTA && !adCTA) setAdCTA(draft.adCTA);
  }, [hasHydrated]);

  // Debounced autosave (600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFields({
        coverImage,
        adImage,
        adHeadline,
        adDescription,
        adCTA,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [coverImage, adImage, adHeadline, adDescription, adCTA]);

  // Navigation guard
  useEffect(() => {
    if (!draft.title && !draft.summary) {
      router.replace('/create-campaign/basics');
    }
  }, [draft.title, draft.summary, router]);

  const handlePickCoverImage = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      setCoverImage(uri);
      updateField('coverImage', uri);
      // Auto-populate ad image if empty
      if (!adImage) {
        setAdImage(uri);
        updateField('adImage', uri);
      }
    }
  };

  const handlePickAdImage = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      setAdImage(uri);
      updateField('adImage', uri);
    }
  };

  const handleUseCoverAsAdImage = () => {
    if (coverImage) {
      setAdImage(coverImage);
      updateField('adImage', coverImage);
    }
  };

  const handleSaveDraft = async () => {
    updateFields({
      coverImage,
      adImage,
      adHeadline,
      adDescription,
      adCTA,
    });
    saveAsDraft();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (Config.useApi) {
      try {
        setSyncStatus('PENDING');
        let serverId = draft.id;
        if (!serverId) {
          const newDraft = await CampaignService.createDraft(draft.title || 'Untitled Draft');
          serverId = newDraft.id;
          updateFields({ id: serverId, mode: 'NEW' });
        }
        await CampaignService.saveVisuals(serverId, {
          coverImage,
          adImage,
          adHeadline,
          adDescription,
          adCTA,
        });
        setSyncStatus('SYNCED');
        setSaveBannerText('Creative saved to cloud & device');
      } catch (err: any) {
        console.warn('[CreateVisuals] Cloud sync failed:', err);
        setSyncStatus('ERROR', err?.message || 'Server sync failed');
        setSaveBannerText('Saved on this device (offline mode)');
      }
    } else {
      setSaveBannerText('Visuals & Ad draft saved');
    }
    setTimeout(() => setSaveBannerText(null), 3000);
  };

  const handleNext = async () => {
    const result = CampaignVisualsSchema.safeParse({
      coverImage,
      adImage,
      adHeadline,
      adDescription,
      adCTA,
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
      coverImage,
      adImage,
      adHeadline,
      adDescription,
      adCTA,
      currentStep: 4,
    });
    setCurrentStep(4);

    if (Config.useApi) {
      setSyncStatus('PENDING');
      try {
        let serverId = draft.id;
        if (!serverId) {
          const newDraft = await CampaignService.createDraft(draft.title || 'Untitled Draft');
          serverId = newDraft.id;
          updateFields({ id: serverId, mode: 'NEW' });
        }
        await CampaignService.saveVisuals(serverId, {
          coverImage,
          adImage,
          adHeadline,
          adDescription,
          adCTA,
        });
        setSyncStatus('SYNCED');
      } catch (err: any) {
        console.warn('[CreateVisuals] Server sync failed during step navigation:', err);
        setSyncStatus('ERROR', err?.message || 'Failed to sync Step 3 to server');
      }
    }

    router.push('/create-campaign/reach');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Step Indicator */}
      <CampaignStepIndicator
        currentStep={3}
        lastSavedAt={lastSavedAt}
        syncStatus={draft.syncStatus}
        onSaveDraft={handleSaveDraft}
        onRetrySync={handleSaveDraft}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 2"
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Campaign & Ad Visuals</Text>
          <Text style={styles.pageSubtitle}>
            Configure your campaign cover and the paid advertising creative shown in external feeds.
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

      {/* SECTION 1: Campaign Page Visual */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>1. Campaign Cover Visual</Text>
            <Text style={styles.sectionSubtitle}>
              Displayed prominently at the top of your public campaign details page.
            </Text>
          </View>
        </View>

        {coverImage ? (
          <View style={styles.coverPreviewContainer}>
            <Image source={{ uri: coverImage }} style={styles.coverPreview} contentFit="cover" />
            <Pressable
              onPress={handlePickCoverImage}
              style={styles.replaceBtn}
              accessibilityRole="button"
              accessibilityLabel="Replace campaign cover image">
              <Ionicons name="camera" size={13} color={Palette.pureWhite} />
              <Text style={styles.replaceBtnText}>Replace Cover</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handlePickCoverImage}
            accessibilityRole="button"
            accessibilityLabel="Select campaign cover image"
            style={({ pressed }) => [styles.uploadBox, pressed && styles.btnPressed]}>
            <Ionicons name="image-outline" size={26} color={Palette.primary700} />
            <Text style={styles.uploadTitle}>Select Campaign Cover</Text>
            <Text style={styles.uploadSubtitle}>Choose high-resolution image from your photo library</Text>
          </Pressable>
        )}
      </View>

      {/* SECTION 2: Advertising Creative Fields */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>2. Advertising Creative Specification</Text>
            <Text style={styles.sectionSubtitle}>
              The concise visual and copy formatted for Meta feeds, Google display cards, and publisher networks.
            </Text>
          </View>
        </View>

        {/* Ad Image Picker */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Ad Creative Image *</Text>
          {coverImage && adImage !== coverImage ? (
            <Pressable onPress={handleUseCoverAsAdImage} hitSlop={6}>
              <Text style={styles.actionLinkText}>Use Campaign Cover</Text>
            </Pressable>
          ) : null}
        </View>

        {adImage ? (
          <View style={styles.adImagePreviewContainer}>
            <Image source={{ uri: adImage }} style={styles.adImagePreview} contentFit="cover" />
            <Pressable
              onPress={handlePickAdImage}
              style={styles.replaceBtn}
              accessibilityRole="button"
              accessibilityLabel="Replace ad creative image">
              <Ionicons name="camera" size={13} color={Palette.pureWhite} />
              <Text style={styles.replaceBtnText}>Change Image</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={handlePickAdImage}
            accessibilityRole="button"
            accessibilityLabel="Pick ad creative image"
            style={({ pressed }) => [styles.uploadBox, pressed && styles.btnPressed]}>
            <Ionicons name="megaphone-outline" size={26} color={Palette.primary700} />
            <Text style={styles.uploadTitle}>Choose Ad Creative Image</Text>
            <Text style={styles.uploadSubtitle}>1.91:1 landscape or 1:1 square image</Text>
          </Pressable>
        )}

        {/* Ad Headline */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Ad Headline *</Text>
          <Text style={styles.charCounter}>{adHeadline.length} / 60</Text>
        </View>
        <AppInput
          placeholder="e.g. Why Rural Water Infrastructure Needs Urgent Attention"
          value={adHeadline}
          onChangeText={(val) => {
            const trimmed = val.slice(0, 60);
            setAdHeadline(trimmed);
            updateField('adHeadline', trimmed);
            if (errors.adHeadline) setErrors((prev) => ({ ...prev, adHeadline: '' }));
          }}
          maxLength={60}
          error={errors.adHeadline}
          hint="Clear, punchy headline to capture attention in feeds (max 60 chars)."
        />

        {/* Ad Description */}
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Ad Description / Body *</Text>
          <Text style={styles.charCounter}>{adDescription.length} / 150</Text>
        </View>
        <AppInput
          placeholder="e.g. Back this evidence-supported campaign to distribute community findings to regional audiences."
          value={adDescription}
          onChangeText={(val) => {
            const trimmed = val.slice(0, 150);
            setAdDescription(trimmed);
            updateField('adDescription', trimmed);
            if (errors.adDescription) setErrors((prev) => ({ ...prev, adDescription: '' }));
          }}
          multiline
          numberOfLines={3}
          maxLength={150}
          error={errors.adDescription}
          hint="Short, persuasive copy that introduces the topic (max 150 chars)."
        />

        {/* Call to Action selector */}
        <Text style={styles.fieldLabel}>Call to Action (CTA) Text *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ctaScroll}
          style={styles.ctaScrollWrapper}>
          {CTA_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => {
                setAdCTA(opt);
                updateField('adCTA', opt);
                if (errors.adCTA) setErrors((prev) => ({ ...prev, adCTA: '' }));
              }}
              accessibilityRole="button"
              accessibilityLabel={`Select call to action: ${opt}`}
              style={[
                styles.ctaChip,
                adCTA === opt && styles.ctaChipActive,
              ]}>
              <Text
                style={[
                  styles.ctaChipText,
                  adCTA === opt && styles.ctaChipTextActive,
                ]}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {errors.adCTA ? <Text style={styles.inlineError}>{errors.adCTA}</Text> : null}
      </View>

      {/* SECTION 3: Live Creative Preview */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>3. Live Creative Preview</Text>
        <Text style={styles.sectionSubtitle}>
          How your sponsored community message looks to targeted audiences across mobile devices.
        </Text>

        <View style={styles.previewWrapper}>
          <AdCreativePreview
            imageUri={adImage || coverImage}
            headline={adHeadline}
            description={adDescription}
            ctaText={adCTA}
            sponsorName={draft.creatorName || 'Amplify Campaign'}
          />
        </View>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <AppButton
          title="Continue to Reach (Step 4)"
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
  sectionTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
    marginBottom: 2,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Palette.neutral500,
    lineHeight: 16,
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
  actionLinkText: {
    ...Typography.caption,
    color: Palette.primary700,
    fontWeight: '600',
  },
  inlineError: {
    ...Typography.caption,
    color: Palette.error600,
    marginBottom: Spacing.sm,
  },
  coverPreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Palette.neutral200,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  adImagePreviewContainer: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Palette.neutral200,
    marginBottom: Spacing.sm,
  },
  adImagePreview: {
    width: '100%',
    height: '100%',
  },
  replaceBtn: {
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
  replaceBtnText: {
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
    gap: 4,
    marginBottom: Spacing.sm,
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
  ctaScrollWrapper: {
    marginBottom: Spacing.sm,
  },
  ctaScroll: {
    paddingVertical: 2,
    gap: 6,
  },
  ctaChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  ctaChipActive: {
    backgroundColor: Palette.primary700,
    borderColor: Palette.primary700,
  },
  ctaChipText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy900,
  },
  ctaChipTextActive: {
    color: Palette.pureWhite,
  },
  previewWrapper: {
    marginTop: Spacing.sm,
  },
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
