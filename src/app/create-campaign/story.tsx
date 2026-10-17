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
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useCampaignDraftStore } from '@/store/campaign-draft-store';

export default function CreateStoryScreen() {
  const router = useRouter();
  const draft = useCampaignDraftStore();

  const [story, setStory] = useState(draft.story);
  const [citations, setCitations] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (story.trim().length < 50) {
      setError('Please provide at least 50 characters explaining why this message needs amplification.');
      return;
    }

    draft.updateField('story', story);
    draft.setCurrentStep(3);
    router.push('/create-campaign/visuals');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 1"
          hitSlop={8}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <Text style={styles.stepIndicator}>Step 2 of 5: Story</Text>
      </View>

      <Text style={styles.pageTitle}>Campaign Story & Citations</Text>
      <Text style={styles.pageSubtitle}>
        Detail the broader context and provide factual sources that substantiate your message.
      </Text>

      {/* Story Form */}
      <View style={styles.formSection}>
        <AppInput
          label="Detailed Message Story *"
          placeholder="Describe the background, why existing audiences haven't heard this, and what action or awareness this campaign drives..."
          value={story}
          onChangeText={(val) => {
            setStory(val);
            if (error) setError('');
          }}
          multiline
          numberOfLines={6}
          error={error}
          hint="Must be factual and objective. Avoid sensationalism or personal attacks."
        />

        <AppInput
          label="Supporting Research or Citation URL (Optional)"
          placeholder="https://example.org/study-or-report"
          value={citations}
          onChangeText={setCitations}
          hint="Links to reports, official statistics, or peer-reviewed findings."
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
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
