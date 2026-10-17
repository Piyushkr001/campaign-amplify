import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { CATEGORIES, CategoryName } from '@/constants/categories';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';
import { CampaignBasicsSchema } from '@/schemas/campaign.schema';

export default function CreateBasicsScreen() {
  const router = useRouter();
  const draft = useCampaignDraftStore();

  const [title, setTitle] = useState(draft.title);
  const [category, setCategory] = useState<CategoryName>(draft.category || 'Environment');
  const [creatorName, setCreatorName] = useState(draft.creatorName);
  const [summary, setSummary] = useState(draft.summary);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const result = CampaignBasicsSchema.safeParse({
      title,
      category,
      creatorName,
      summary,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || 'general';
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    draft.updateField('title', title);
    draft.updateField('category', category);
    draft.updateField('creatorName', creatorName);
    draft.updateField('summary', summary);
    draft.setCurrentStep(2);

    router.push('/create-campaign/story');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Header with Step Tracker */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.stepIndicator}>Step 1 of 5: Basics</Text>
      </View>

      <Text style={styles.pageTitle}>Campaign Basics</Text>
      <Text style={styles.pageSubtitle}>
        Define the core topic, verified creator identity, and primary message headline.
      </Text>

      {/* Form Fields */}
      <View style={styles.formSection}>
        <AppInput
          label="Campaign Headline *"
          placeholder="e.g. Clean Water Infrastructure for Eastern Villages"
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          error={errors.title}
          hint="Clear, factual summary of the campaign topic (min 5 characters)."
        />

        <Text style={styles.categoryLabel}>Category *</Text>
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
              onPress={() => setCategory(cat)}
            />
          ))}
        </ScrollView>

        <AppInput
          label="Creator / Organization Name *"
          placeholder="e.g. WaterFirst Foundation or Independent Research Collective"
          value={creatorName}
          onChangeText={(val) => {
            setCreatorName(val);
            if (errors.creatorName) setErrors((prev) => ({ ...prev, creatorName: '' }));
          }}
          error={errors.creatorName}
          hint="Must match official entity or individual legal publishing name."
        />

        <AppInput
          label="Short Summary *"
          placeholder="Summarize what this campaign communicates and who needs to hear it..."
          value={summary}
          onChangeText={(val) => {
            setSummary(val);
            if (errors.summary) setErrors((prev) => ({ ...prev, summary: '' }));
          }}
          multiline
          numberOfLines={3}
          error={errors.summary}
          hint="Brief overview shown on cards and preview feeds (20–240 chars)."
        />
      </View>

      {/* Navigation Buttons */}
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
  formSection: {
    marginBottom: Spacing.xl,
  },
  categoryLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
    marginBottom: Spacing.xs,
  },
  categoryScrollWrapper: {
    marginBottom: Spacing.md,
  },
  categoryScroll: {
    paddingVertical: 2,
  },
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
