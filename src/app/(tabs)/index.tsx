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
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CampaignCard } from '@/components/campaign/CampaignCard';
import { useFeaturedCampaigns } from '@/hooks/useCampaigns';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { estimateReach, formatReachEstimate } from '@/utils/reach';

export default function HomeScreen() {
  const { data: featuredCampaigns, isLoading, isError, refetch } = useFeaturedCampaigns();
  const demoReach = estimateReach(25);

  return (
    <ScreenContainer
      scrollable
      paddingHorizontal
      backgroundColor={Palette.warmWhite}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="megaphone" size={16} color={Palette.pureWhite} />
          </View>
          <View>
            <Text style={styles.brandTitle}>Amplify</Text>
            <Text style={styles.brandSubtitle}>Community Message Distribution</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/activity')}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
          style={({ pressed }) => [styles.headerIconBtn, pressed && styles.btnPressed]}>
          <Ionicons name="notifications-outline" size={20} color={Palette.navy900} />
          <View style={styles.activeDot} />
        </Pressable>
      </View>

      {/* 2. Hero Section */}
      <View style={styles.heroCard}>
        <View style={styles.heroTag}>
          <Ionicons name="sparkles-outline" size={12} color={Palette.primary700} />
          <Text style={styles.heroTagText}>COMMUNITY-FUNDED REACH</Text>
        </View>

        <Text style={styles.heroHeading}>
          Help important messages travel further.
        </Text>

        <Text style={styles.heroBody}>
          Community-funded amplification helps verified civic, educational, and public-interest
          campaigns reach audiences beyond the creator’s existing network.
        </Text>

        <View style={styles.heroActions}>
          <AppButton
            title="Explore Campaigns"
            onPress={() => router.push('/(tabs)/explore')}
            variant="primary"
            size="md"
            icon={<Ionicons name="compass-outline" size={16} color={Palette.pureWhite} />}
            style={styles.heroPrimaryBtn}
          />
          <AppButton
            title="Start a Campaign"
            onPress={() => router.push('/(tabs)/create')}
            variant="secondary"
            size="md"
            icon={<Ionicons name="add-circle-outline" size={16} color={Palette.navy900} />}
          />
        </View>
      </View>

      {/* 3. Reach Estimate Explanatory Card */}
      <View style={styles.reachEstimateCard}>
        <View style={styles.reachEstimateHeader}>
          <View style={styles.reachEstimateIcon}>
            <Ionicons name="stats-chart-outline" size={16} color={Palette.primary700} />
          </View>
          <Text style={styles.reachEstimateTitle}>Estimated Amplification Power</Text>
        </View>

        <View style={styles.reachEstimateHighlight}>
          <Text style={styles.reachEstimateFormula}>
            <Text style={styles.reachEstimateAmount}>$25 contribution</Text>
            {'  '}→{'  '}
            <Text style={styles.reachEstimateImpressions}>
              {formatReachEstimate(demoReach.min, demoReach.max)} impressions
            </Text>
          </Text>
        </View>

        <Text style={styles.reachEstimateDisclaimer}>
          Illustrative estimate only. Contributions fund digital advertising and verified
          distribution channels. They do not directly donate to the organization or cause.
        </Text>
      </View>

      {/* 4. Featured Campaigns */}
      <SectionHeader
        title="Featured Campaigns"
        subtitle="High-impact messages currently undergoing amplification"
        actionText="See All"
        onActionPress={() => router.push('/(tabs)/explore')}
        style={styles.featuredHeader}
      />

      {isLoading ? (
        <LoadingSkeleton count={2} />
      ) : isError ? (
        <ErrorState
          title="Could not load featured campaigns"
          message="Please check your network and try refreshing."
          onRetry={refetch}
        />
      ) : (
        featuredCampaigns?.slice(0, 3).map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))
      )}

      {/* 5. How It Works Section */}
      <View style={styles.howItWorksCard}>
        <View style={styles.howItWorksTitleRow}>
          <Ionicons name="layers-outline" size={18} color={Palette.navy900} />
          <Text style={styles.howItWorksTitle}>How Amplification Works</Text>
        </View>
        <Text style={styles.howItWorksSubtitle}>
          A transparent community advertising engine built for credible messaging.
        </Text>

        <View style={styles.stepsList}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Create</Text>
              <Text style={styles.stepDescription}>
                Creators assemble their public message, supporting sources, and target audience.
              </Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Review</Text>
              <Text style={styles.stepDescription}>
                Our editorial and fact-checking team verifies campaign claims and advertising materials.
              </Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Amplify</Text>
              <Text style={styles.stepDescription}>
                Community backers fund paid digital distribution to spread the message into new demographics.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 6. Final Trust & Discovery CTA */}
      <View style={styles.finalCtaCard}>
        <Text style={styles.finalCtaHeading}>Have a message that deserves attention?</Text>
        <Text style={styles.finalCtaBody}>
          Every message submitted undergoes verification to maintain a high-trust advertising standard.
        </Text>
        <AppButton
          title="Start Your Campaign Draft"
          onPress={() => router.push('/(tabs)/create')}
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
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Palette.navy900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Palette.navy950,
  },
  brandSubtitle: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  btnPressed: {
    opacity: 0.7,
  },
  activeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Palette.primary600,
  },
  heroCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    gap: 4,
    marginBottom: Spacing.sm,
  },
  heroTagText: {
    ...Typography.label,
    color: Palette.primary700,
  },
  heroHeading: {
    ...Typography.h1,
    fontSize: 24,
    lineHeight: 30,
    color: Palette.navy950,
    marginBottom: Spacing.xs,
  },
  heroBody: {
    ...Typography.body,
    color: Palette.neutral600,
    marginBottom: Spacing.lg,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  heroPrimaryBtn: {
    flex: 1,
    minWidth: 160,
  },
  reachEstimateCard: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  reachEstimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  reachEstimateIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reachEstimateTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy900,
  },
  reachEstimateHighlight: {
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  reachEstimateFormula: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  reachEstimateAmount: {
    fontWeight: '700',
    color: Palette.navy950,
  },
  reachEstimateImpressions: {
    fontWeight: '700',
    color: Palette.primary700,
  },
  reachEstimateDisclaimer: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
    marginTop: 4,
    lineHeight: 15,
  },
  featuredHeader: {
    marginTop: Spacing.sm,
  },
  howItWorksCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
  },
  howItWorksTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  howItWorksTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
  },
  howItWorksSubtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginBottom: Spacing.lg,
  },
  stepsList: {
    paddingLeft: Spacing.xs,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.navy900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.caption,
    color: Palette.pureWhite,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: 2,
  },
  stepDescription: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: Palette.neutral200,
    marginLeft: 13,
    marginVertical: 4,
  },
  finalCtaCard: {
    backgroundColor: Palette.neutral100,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  finalCtaHeading: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  finalCtaBody: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 290,
  },
});
