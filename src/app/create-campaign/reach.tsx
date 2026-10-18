import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { CampaignReachSchema } from '@/schemas/campaign.schema';
import { Config } from '@/constants/config';
import { CampaignService } from '@/services/campaign.service';

const PRESET_LOCATIONS = ['India', 'Delhi NCR', 'Uttar Pradesh', 'Mumbai', 'Bengaluru', 'Global'];
const PRESET_INTERESTS = [
  'Environment',
  'Clean Energy',
  'Public Health',
  'Education',
  'Science',
  'Civic Policy',
  'Community Development',
  'Consumer Rights',
];
const PRESET_CHANNELS = [
  'Meta',
  'Google Display',
  'YouTube',
  'Digital Publications',
  'Search',
];
const DURATION_PRESETS = [7, 14, 21, 30];

export default function CreateReachScreen() {
  const router = useRouter();
  const {
    draft,
    updateField,
    updateFields,
    setCurrentStep,
    saveAsDraft,
    lastSavedAt,
    hasHydrated,
  } = useCampaignDraftStore();

  const [locations, setLocations] = useState<string[]>(
    draft.locations.length > 0 ? draft.locations : ['India', 'Delhi NCR']
  );
  const [customLocation, setCustomLocation] = useState('');
  const [interests, setInterests] = useState<string[]>(
    draft.interests.length > 0 ? draft.interests : ['Environment', 'Sustainability']
  );
  const [channels, setChannels] = useState<string[]>(
    draft.channels.length > 0 ? draft.channels : ['Meta', 'Google Display']
  );
  const [durationDays, setDurationDays] = useState<number>(draft.durationDays || 14);
  const [audienceDescription, setAudienceDescription] = useState(
    draft.audienceDescription || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveBannerText, setSaveBannerText] = useState<string | null>(null);

  // Sync draft rehydration from AsyncStorage
  useEffect(() => {
    if (draft.locations?.length > 0) setLocations(draft.locations);
    if (draft.interests?.length > 0) setInterests(draft.interests);
    if (draft.channels?.length > 0) setChannels(draft.channels);
    if (draft.durationDays) setDurationDays(draft.durationDays);
    if (draft.audienceDescription && !audienceDescription) {
      setAudienceDescription(draft.audienceDescription);
    }
  }, [hasHydrated]);

  // Debounced autosave (600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFields({
        locations,
        interests,
        channels,
        durationDays,
        audienceDescription,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [locations, interests, channels, durationDays, audienceDescription]);

  // Navigation guard
  useEffect(() => {
    if (!draft.title && !draft.summary) {
      router.replace('/create-campaign/basics');
    }
  }, [draft.title, draft.summary, router]);

  const toggleLocation = (loc: string) => {
    let next: string[];
    if (locations.includes(loc)) {
      next = locations.filter((l) => l !== loc);
    } else {
      next = [...locations, loc];
    }
    setLocations(next);
    updateField('locations', next);
    if (errors.locations) setErrors((prev) => ({ ...prev, locations: '' }));
  };

  const handleAddCustomLocation = () => {
    const trimmed = customLocation.trim();
    if (trimmed && !locations.includes(trimmed)) {
      const next = [...locations, trimmed];
      setLocations(next);
      updateField('locations', next);
      setCustomLocation('');
      if (errors.locations) setErrors((prev) => ({ ...prev, locations: '' }));
    }
  };

  const toggleInterest = (interest: string) => {
    let next: string[];
    if (interests.includes(interest)) {
      next = interests.filter((i) => i !== interest);
    } else {
      next = [...interests, interest];
    }
    setInterests(next);
    updateField('interests', next);
    if (errors.interests) setErrors((prev) => ({ ...prev, interests: '' }));
  };

  const toggleChannel = (channel: string) => {
    let next: string[];
    if (channels.includes(channel)) {
      next = channels.filter((c) => c !== channel);
    } else {
      next = [...channels, channel];
    }
    setChannels(next);
    updateField('channels', next);
    if (errors.channels) setErrors((prev) => ({ ...prev, channels: '' }));
  };

  const handleDurationSelect = (days: number) => {
    setDurationDays(days);
    updateField('durationDays', days);
  };

  const handleSaveDraft = async () => {
    updateFields({
      locations,
      interests,
      channels,
      durationDays,
      audienceDescription,
    });
    saveAsDraft();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (Config.useApi && draft.id) {
      try {
        await CampaignService.saveReach(draft.id, {
          locations,
          interests,
          channels,
          audienceDescription,
          durationDays,
        });
        setSaveBannerText('Reach settings saved to cloud & device');
      } catch (err) {
        console.warn('[CreateReach] Cloud sync failed:', err);
        setSaveBannerText('Saved on this device (offline mode)');
      }
    } else {
      setSaveBannerText('Reach preferences saved');
    }
    setTimeout(() => setSaveBannerText(null), 3000);
  };

  const handleNext = () => {
    const result = CampaignReachSchema.safeParse({
      locations,
      interests,
      channels,
      audienceDescription,
      durationDays,
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
      locations,
      interests,
      channels,
      audienceDescription,
      durationDays,
      currentStep: 5,
    });
    setCurrentStep(5);

    if (Config.useApi && draft.id) {
      CampaignService.saveReach(draft.id, {
        locations,
        interests,
        channels,
        audienceDescription,
        durationDays,
      }).catch((err) => console.warn('[CreateReach] Background sync warning:', err));
    }

    router.push('/create-campaign/submit');
  };

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Step Indicator */}
      <CampaignStepIndicator
        currentStep={4}
        lastSavedAt={lastSavedAt}
        onSaveDraft={handleSaveDraft}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to step 3"
          hitSlop={8}
          style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
          <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.pageTitle}>Reach & Distribution</Text>
          <Text style={styles.pageSubtitle}>
            Specify geographic targets, audience affinity interests, and ad network preferences.
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

      {/* 1. Target Locations */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Target Geographic Locations *</Text>
        <Text style={styles.fieldSubLabel}>Select regions where your message will be amplified.</Text>

        <View style={styles.chipsContainer}>
          {PRESET_LOCATIONS.map((loc) => {
            const isSelected = locations.includes(loc);
            return (
              <Pressable
                key={loc}
                onPress={() => toggleLocation(loc)}
                accessibilityRole="button"
                accessibilityLabel={`Target location ${loc}`}
                style={[styles.chip, isSelected && styles.chipActive]}>
                <Ionicons
                  name={isSelected ? 'location' : 'location-outline'}
                  size={13}
                  color={isSelected ? Palette.pureWhite : Palette.navy800}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{loc}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom Location input */}
        <View style={styles.customInputRow}>
          <View style={styles.customInputWrapper}>
            <AppInput
              placeholder="Add city, state, or region..."
              value={customLocation}
              onChangeText={setCustomLocation}
              onSubmitEditing={handleAddCustomLocation}
            />
          </View>
          <Pressable
            onPress={handleAddCustomLocation}
            accessibilityRole="button"
            accessibilityLabel="Add custom location"
            style={styles.addCustomBtn}>
            <Ionicons name="add" size={18} color={Palette.pureWhite} />
          </Pressable>
        </View>
        {errors.locations ? <Text style={styles.inlineError}>{errors.locations}</Text> : null}
      </View>

      {/* 2. Audience Interests */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Audience Affinity Interests *</Text>
        <Text style={styles.fieldSubLabel}>Target users following specific civic and public-interest topics.</Text>

        <View style={styles.chipsContainer}>
          {PRESET_INTERESTS.map((interest) => {
            const isSelected = interests.includes(interest);
            return (
              <Pressable
                key={interest}
                onPress={() => toggleInterest(interest)}
                accessibilityRole="button"
                accessibilityLabel={`Audience interest ${interest}`}
                style={[styles.chip, isSelected && styles.chipActive]}>
                <Ionicons
                  name={isSelected ? 'checkmark' : 'add'}
                  size={13}
                  color={isSelected ? Palette.pureWhite : Palette.navy800}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{interest}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.interests ? <Text style={styles.inlineError}>{errors.interests}</Text> : null}
      </View>

      {/* 3. Distribution Channels Preferences */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Distribution Channel Preferences *</Text>
        <Text style={styles.fieldSubLabel}>
          Select preferred digital advertising networks. Final placement mix is optimized during review.
        </Text>

        <View style={styles.channelsList}>
          {PRESET_CHANNELS.map((ch) => {
            const isSelected = channels.includes(ch);
            return (
              <Pressable
                key={ch}
                onPress={() => toggleChannel(ch)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`Channel ${ch}`}
                style={[styles.channelItem, isSelected && styles.channelItemActive]}>
                <View style={[styles.channelCheckbox, isSelected && styles.channelCheckboxActive]}>
                  {isSelected && <Ionicons name="checkmark" size={13} color={Palette.pureWhite} />}
                </View>
                <Text style={[styles.channelText, isSelected && styles.channelTextActive]}>{ch}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.channels ? <Text style={styles.inlineError}>{errors.channels}</Text> : null}

        <View style={styles.channelDisclaimerBox}>
          <Ionicons name="information-circle-outline" size={14} color={Palette.neutral500} />
          <Text style={styles.channelDisclaimerText}>
            Creator preferences only. Final distribution settings may be adjusted during campaign review to maximize reach.
          </Text>
        </View>
      </View>

      {/* 4. Campaign Duration */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Campaign Run Duration *</Text>
        <Text style={styles.fieldSubLabel}>Choose how long the amplification campaign will actively run.</Text>

        <View style={styles.durationRow}>
          {DURATION_PRESETS.map((days) => (
            <Pressable
              key={days}
              onPress={() => handleDurationSelect(days)}
              accessibilityRole="button"
              accessibilityLabel={`${days} days duration`}
              style={[
                styles.durationPill,
                durationDays === days && styles.durationPillActive,
              ]}>
              <Text
                style={[
                  styles.durationText,
                  durationDays === days && styles.durationTextActive,
                ]}>
                {days} Days
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 5. Audience Description */}
      <View style={styles.sectionCard}>
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldLabel}>Intended Audience Context *</Text>
          <Text style={styles.charCounter}>{audienceDescription.length} / 300</Text>
        </View>
        <AppInput
          placeholder="e.g. Regional educators, public health workers, civic advocates, and local policy researchers..."
          value={audienceDescription}
          onChangeText={(val) => {
            const trimmed = val.slice(0, 300);
            setAudienceDescription(trimmed);
            updateField('audienceDescription', trimmed);
            if (errors.audienceDescription) setErrors((prev) => ({ ...prev, audienceDescription: '' }));
          }}
          multiline
          numberOfLines={3}
          maxLength={300}
          error={errors.audienceDescription}
          hint="Describe the key profile of people who need to discover this message (min 10 chars)."
        />
      </View>

      {/* 6. Audience Preview Summary */}
      <View style={styles.previewSummaryCard}>
        <View style={styles.previewHeader}>
          <Ionicons name="people" size={18} color={Palette.primary700} />
          <Text style={styles.previewTitle}>Intended Audience Preview</Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.previewRowLabel}>Locations:</Text>
          <Text style={styles.previewRowVal}>{locations.join(', ') || 'None selected'}</Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.previewRowLabel}>Interests:</Text>
          <Text style={styles.previewRowVal}>{interests.join(', ') || 'None selected'}</Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.previewRowLabel}>Channels:</Text>
          <Text style={styles.previewRowVal}>{channels.join(', ') || 'None selected'}</Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.previewRowLabel}>Duration:</Text>
          <Text style={styles.previewRowVal}>{durationDays} Days</Text>
        </View>

        <View style={styles.reachDisclaimerBox}>
          <Text style={styles.reachDisclaimerText}>
            Audience size and final delivery depend on advertising costs, inventory, targeting, and campaign performance.
          </Text>
        </View>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <AppButton
          title="Continue to Submit & Review (Step 5)"
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
    marginBottom: 2,
  },
  fieldSubLabel: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginBottom: Spacing.sm,
  },
  charCounter: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  chipActive: {
    backgroundColor: Palette.primary700,
    borderColor: Palette.primary700,
  },
  chipText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.navy900,
  },
  chipTextActive: {
    color: Palette.pureWhite,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customInputWrapper: {
    flex: 1,
  },
  addCustomBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.navy950,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  inlineError: {
    ...Typography.caption,
    color: Palette.error600,
    marginTop: -8,
    marginBottom: Spacing.xs,
  },
  channelsList: {
    gap: 8,
    marginBottom: Spacing.sm,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  channelItemActive: {
    backgroundColor: Palette.warmWhite,
    borderColor: Palette.primary600,
  },
  channelCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Palette.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.pureWhite,
  },
  channelCheckboxActive: {
    backgroundColor: Palette.primary700,
    borderColor: Palette.primary700,
  },
  channelText: {
    ...Typography.bodySmall,
    color: Palette.navy900,
    fontWeight: '500',
  },
  channelTextActive: {
    fontWeight: '700',
    color: Palette.primary700,
  },
  channelDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
  },
  channelDisclaimerText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    flex: 1,
    lineHeight: 15,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  durationPillActive: {
    backgroundColor: Palette.navy950,
    borderColor: Palette.navy950,
  },
  durationText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.navy900,
  },
  durationTextActive: {
    color: Palette.pureWhite,
    fontWeight: '700',
  },
  previewSummaryCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  previewTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    gap: 6,
  },
  previewRowLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.neutral600,
    width: 80,
  },
  previewRowVal: {
    ...Typography.caption,
    color: Palette.navy900,
    flex: 1,
  },
  reachDisclaimerBox: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral200,
  },
  reachDisclaimerText: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral500,
    lineHeight: 14,
  },
  bottomNav: {
    marginBottom: Spacing.xxl,
  },
});
