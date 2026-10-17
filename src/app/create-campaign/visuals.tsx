import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';

const SAMPLE_COVERS = [
  'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
];

export default function CreateVisualsScreen() {
  const router = useRouter();
  const draft = useCampaignDraftStore();

  const [selectedImage, setSelectedImage] = useState<string>(
    draft.coverImage || SAMPLE_COVERS[0]
  );

  const handleNext = () => {
    draft.updateField('coverImage', selectedImage);
    draft.setCurrentStep(4);
    router.push('/create-campaign/reach');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 2"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.stepIndicator}>Step 3 of 5: Visuals</Text>
      </View>

      <Text style={styles.pageTitle}>Campaign & Ad Visuals</Text>
      <Text style={styles.pageSubtitle}>
        Choose high-resolution imagery for your campaign cover and digital advertising creatives.
      </Text>

      {/* Selected Cover Preview */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: selectedImage }}
          style={styles.previewImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>Active Creative Preview</Text>
        </View>
      </View>

      {/* Preset Visuals Selector */}
      <Text style={styles.selectorHeading}>Select a High-Res Cover Visual</Text>
      <View style={styles.grid}>
        {SAMPLE_COVERS.map((url, idx) => (
          <Pressable
            key={idx}
            onPress={() => setSelectedImage(url)}
            accessibilityRole="button"
            accessibilityLabel={`Choose visual option ${idx + 1}`}
            style={[
              styles.thumbnailWrapper,
              selectedImage === url && styles.thumbnailSelected,
            ]}>
            <Image source={{ uri: url }} style={styles.thumbnail} contentFit="cover" />
            {selectedImage === url && (
              <View style={styles.checkIconBadge}>
                <Ionicons name="checkmark" size={14} color={Palette.pureWhite} />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Guidelines Note */}
      <View style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={16} color={Palette.primary700} />
        <Text style={styles.noteText}>
          Images must not contain sensationalist text overlays, deceptive clickbait framing, or
          copyrighted brand marks.
        </Text>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <AppButton
          title="Continue to Reach & Budget (Step 4)"
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
  previewContainer: {
    width: '100%',
    height: 190,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    backgroundColor: Palette.neutral200,
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  previewBadgeText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  selectorHeading: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  thumbnailWrapper: {
    width: '48%',
    height: 90,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.neutral200,
    position: 'relative',
  },
  thumbnailSelected: {
    borderColor: Palette.primary600,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  checkIconBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.primary600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  noteText: {
    ...Typography.caption,
    color: Palette.neutral600,
    flex: 1,
    lineHeight: 16,
  },
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
