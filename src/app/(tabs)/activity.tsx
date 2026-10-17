import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { useContributionStore } from '@/store/contribution-store';
import { formatCurrency, formatReachRange } from '@/utils/formatters';

type ActivityTab = 'all' | 'backed' | 'updates';

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');
  const { contributions } = useContributionStore();

  const successfulContributions = contributions.filter((c) => c.status === 'SUCCESS');

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
              {tab.key === 'backed' && successfulContributions.length > 0
                ? ` (${successfulContributions.length})`
                : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content based on tab */}
      {activeTab === 'backed' && successfulContributions.length > 0 ? (
        <View style={styles.contributionsList}>
          {successfulContributions.map((c) => (
            <View key={c.id} style={styles.contributionCard}>
              <View style={styles.contributionHeader}>
                <View style={styles.amountPill}>
                  <Text style={styles.amountText}>{formatCurrency(c.amount)}</Text>
                </View>
                <Text style={styles.contributionDate}>
                  {new Date(c.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              <Text style={styles.campaignTitle} numberOfLines={2}>
                {c.campaignTitle || 'Campaign Amplification'}
              </Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricBadge}>
                  <Ionicons name="megaphone-outline" size={13} color={Palette.primary700} />
                  <Text style={styles.metricText}>
                    {formatReachRange(c.estimatedImpressionsMin, c.estimatedImpressionsMax)} impressions
                  </Text>
                </View>
                <View style={styles.metricBadge}>
                  <Ionicons name="card-outline" size={13} color={Palette.neutral600} />
                  <Text style={styles.metricText}>
                    Ad Budget: {formatCurrency(c.advertisingAllocation)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/contribution/receipt',
                      params: { contributionId: c.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="View contribution receipt"
                  style={styles.receiptBtn}>
                  <Ionicons name="receipt-outline" size={14} color={Palette.primary700} />
                  <Text style={styles.receiptBtnText}>View Receipt</Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push(`/campaign/${c.campaignId}`)}
                  accessibilityRole="button"
                  accessibilityLabel="View campaign details"
                  style={styles.viewCampaignBtn}>
                  <Text style={styles.viewCampaignText}>Campaign Details</Text>
                  <Ionicons name="arrow-forward" size={12} color={Palette.neutral700} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : activeTab === 'all' && successfulContributions.length > 0 ? (
        <View style={styles.contributionsList}>
          <Text style={styles.sectionSubtitle}>Recent Contributions</Text>
          {successfulContributions.slice(0, 3).map((c) => (
            <View key={c.id} style={styles.contributionCard}>
              <View style={styles.contributionHeader}>
                <View style={styles.amountPill}>
                  <Text style={styles.amountText}>{formatCurrency(c.amount)}</Text>
                </View>
                <Text style={styles.contributionDate}>
                  {new Date(c.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              <Text style={styles.campaignTitle} numberOfLines={2}>
                {c.campaignTitle || 'Campaign Amplification'}
              </Text>

              <View style={styles.cardActions}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/contribution/receipt',
                      params: { contributionId: c.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="View contribution receipt"
                  style={styles.receiptBtn}>
                  <Ionicons name="receipt-outline" size={14} color={Palette.primary700} />
                  <Text style={styles.receiptBtnText}>View Receipt</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        /* Empty State */
        <EmptyState
          iconName="notifications-outline"
          title="No activity yet"
          description={
            activeTab === 'backed'
              ? 'You have not backed any campaigns yet. When you back a message, your amplification contributions and receipts will show here.'
              : 'When you back campaign amplification or follow updates, advertising reach reports and milestone notices will appear here.'
          }
          actionTitle="Explore Active Campaigns"
          onAction={() => router.push('/(tabs)/explore')}
          style={styles.emptyContainer}
        />
      )}

      {/* Trust Reminder Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>How Campaign Milestones Work</Text>
        <Text style={styles.infoCardText}>
          When a campaign reaches its funding milestone, it advances to distribution preparation for network setup and editorial review before active promotion begins.
          You receive transparent updates with estimated impressions, active placement channels, and regional reach statistics.
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
  contributionsList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Palette.neutral500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  contributionCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
  },
  contributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  amountPill: {
    backgroundColor: Palette.primary50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  amountText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.primary700,
  },
  contributionDate: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
  },
  campaignTitle: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: Spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  metricText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.navy900,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Palette.neutral100,
    paddingTop: Spacing.xs,
    marginTop: Spacing.xs,
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Palette.primary50,
  },
  receiptBtnText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primary700,
  },
  viewCampaignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewCampaignText: {
    ...Typography.caption,
    fontSize: 12,
    color: Palette.neutral700,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl * 2,
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
