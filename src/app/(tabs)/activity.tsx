import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EmptyState } from '@/components/ui/EmptyState';

type ActivityTab = 'all' | 'backed' | 'updates';

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>
          Track real-time distribution progress and milestone alerts for campaigns you follow.
        </Text>
      </View>

      {/* Segmented Filter */}
      <View style={styles.segmentContainer}>
        {(
          [
            { label: 'All', key: 'all' },
            { label: 'My Backed', key: 'backed' },
            { label: 'Milestone Updates', key: 'updates' },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            style={[
              styles.segmentBtn,
              activeTab === tab.key && styles.segmentBtnActive,
            ]}>
            <Text
              style={[
                styles.segmentText,
                activeTab === tab.key && styles.segmentTextActive,
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Empty State */}
      <EmptyState
        iconName="notifications-outline"
        title="No activity yet"
        description="When you back campaign amplification or follow updates, real-time advertising reach reports and milestone notices will appear here."
        actionTitle="Explore Active Campaigns"
        onAction={() => router.push('/(tabs)/explore')}
        style={styles.emptyContainer}
      />

      {/* Trust Reminder Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>How Activity Tracking Works</Text>
        <Text style={styles.infoCardText}>
          When a campaign reaches its funding milestone, its digital advertising distribution kicks off.
          You receive notifications with transparent impression counts, distribution channels, and regional reach statistics.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Palette.navy950,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.neutral100,
    padding: 3,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
  },
  segmentBtnActive: {
    backgroundColor: Palette.pureWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.neutral500,
  },
  segmentTextActive: {
    color: Palette.navy950,
    fontWeight: '700',
  },
  emptyContainer: {
    marginVertical: Spacing.md,
  },
  infoCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  infoCardTitle: {
    ...Typography.h3,
    fontSize: 14,
    color: Palette.navy950,
    marginBottom: 4,
  },
  infoCardText: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.neutral500,
  },
});
