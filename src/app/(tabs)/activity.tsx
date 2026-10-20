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
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency, formatReachRange } from '@/utils/formatters';
import { CampaignStatus } from '@/types/campaign';
import { Config } from '@/constants/config';
import { useMyContributions } from '@/hooks/useContributions';

type ActivityTab = 'all' | 'backed' | 'updates';

interface LifecycleEvent {
  id: string;
  campaignId: string;
  campaignTitle: string;
  type: CampaignStatus | 'CONTRIBUTION_SUCCESS' | 'FUNDING_MILESTONE';
  title: string;
  description: string;
  date: string;
  badgeVariant: 'info' | 'success' | 'warning' | 'purple' | 'default';
  icon: keyof typeof Ionicons.glyphMap;
}

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');
  const { user, isAuthenticated } = useAuthStore();
  const { contributions } = useContributionStore();
  const { campaigns } = useMyCampaignsStore();
  const { data: apiContributions } = useMyContributions();

  if (Config.useApi && (!isAuthenticated || user?.isGuest)) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal backgroundColor={Palette.warmWhite}>
        <EmptyState
          iconName="lock-closed-outline"
          title="Sign In Required"
          description="Sign in to view your campaign activity, backed projects, and live updates."
          actionTitle="Sign In"
          onAction={() => router.push('/auth/login')}
        />
      </ScreenContainer>
    );
  }

  const userContributions = Config.useApi
    ? (apiContributions || []).map((ac) => {
        const adBudget = Math.round(ac.amount * 0.85);
        return {
          id: ac.id,
          campaignId: ac.campaignId,
          campaignTitle: ac.campaignTitle,
          amount: ac.amount,
          status: ac.status,
          createdAt: ac.createdAt,
          advertisingAllocation: adBudget,
          estimatedImpressionsMin: adBudget * 20,
          estimatedImpressionsMax: adBudget * 30,
        };
      })
    : contributions;

  const successfulContributions = userContributions.filter(
    (c) => c.status === 'SUCCESS' || c.status === 'CONFIRMED'
  );

  // Derive lifecycle events from creator campaign status history
  const lifecycleEvents: LifecycleEvent[] = [];

  campaigns.forEach((camp) => {
    (camp.statusHistory || []).forEach((hist) => {
      let title = 'Status Update';
      let badgeVariant: LifecycleEvent['badgeVariant'] = 'info';
      let icon: keyof typeof Ionicons.glyphMap = 'information-circle-outline';

      switch (hist.toStatus) {
        case 'SUBMITTED_FOR_REVIEW':
          title = 'Campaign Submitted for Review';
          badgeVariant = 'info';
          icon = 'send-outline';
          break;
        case 'UNDER_REVIEW':
          title = 'Verification Review Started';
          badgeVariant = 'info';
          icon = 'search-outline';
          break;
        case 'CHANGES_REQUESTED':
          title = 'Reviewer Requested Changes';
          badgeVariant = 'warning';
          icon = 'alert-circle-outline';
          break;
        case 'APPROVED':
          title = 'Campaign Approved';
          badgeVariant = 'success';
          icon = 'checkmark-circle-outline';
          break;
        case 'FUNDING':
          title = 'Campaign Available for Funding';
          badgeVariant = 'success';
          icon = 'rocket-outline';
          break;
        case 'PROMOTING':
          title = 'Promotion Active Across Ad Networks';
          badgeVariant = 'purple';
          icon = 'megaphone-outline';
          break;
        case 'COMPLETED':
          title = 'Campaign Distribution Completed';
          badgeVariant = 'default';
          icon = 'checkmark-done-circle-outline';
          break;
        case 'REJECTED':
          title = 'Campaign Not Approved';
          badgeVariant = 'warning';
          icon = 'close-circle-outline';
          break;
      }

      lifecycleEvents.push({
        id: hist.id,
        campaignId: camp.id,
        campaignTitle: camp.title,
        type: hist.toStatus,
        title,
        description: hist.note || `Campaign status transitioned to ${hist.toStatus}.`,
        date: hist.createdAt,
        badgeVariant,
        icon,
      });
    });
  });

  // Also include baseline simulated milestone events if no local events exist yet
  if (lifecycleEvents.length === 0) {
    lifecycleEvents.push(
      {
        id: 'seed-evt-1',
        campaignId: 'camp-6',
        campaignTitle: 'Understanding Renewable Energy Grid Economics',
        type: 'PROMOTING',
        title: 'Promotion Started on Video Networks',
        description: 'Targeted explainer distribution launched across YouTube educational inventory and tech networks.',
        date: '2026-10-15T10:00:00Z',
        badgeVariant: 'purple',
        icon: 'megaphone-outline',
      },
      {
        id: 'seed-evt-2',
        campaignId: 'camp-7',
        campaignTitle: 'Digital Privacy Rights for Everyone',
        type: 'PROMOTING',
        title: 'Funding Milestone Reached (100%)',
        description: 'Goal reached! Deployed privacy guides to regional ad networks and privacy newsletters.',
        date: '2026-10-14T14:30:00Z',
        badgeVariant: 'success',
        icon: 'trophy-outline',
      },
      {
        id: 'seed-evt-3',
        campaignId: 'camp-8',
        campaignTitle: 'Financial Literacy for Early Careers',
        type: 'COMPLETED',
        title: 'Campaign Distribution Completed',
        description: 'Campaign completed with 310,000 demo measured impressions among young career workers.',
        date: '2026-10-12T09:15:00Z',
        badgeVariant: 'default',
        icon: 'checkmark-done-circle-outline',
      }
    );
  }

  // Sort lifecycle events newest first
  lifecycleEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
      {activeTab === 'backed' ? (
        successfulContributions.length > 0 ? (
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
        ) : (
          <EmptyState
            iconName="receipt-outline"
            title="No backed campaigns yet"
            description="When you back campaign amplification, your contributions and demo receipts will appear here."
            actionTitle="Explore Active Campaigns"
            onAction={() => router.push('/(tabs)/explore')}
            style={styles.emptyContainer}
          />
        )
      ) : activeTab === 'updates' ? (
        <View style={styles.eventsList}>
          {lifecycleEvents.map((evt) => (
            <View key={evt.id} style={styles.eventCard}>
              <View style={styles.eventHeaderRow}>
                <View style={styles.eventTitleRow}>
                  <View style={styles.eventIconCircle}>
                    <Ionicons name={evt.icon} size={15} color={Palette.primary700} />
                  </View>
                  <Text style={styles.eventHeading}>{evt.title}</Text>
                </View>
                <Text style={styles.eventDate}>
                  {new Date(evt.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              <Text style={styles.eventCampaignTitle}>{evt.campaignTitle}</Text>
              <Text style={styles.eventDesc}>{evt.description}</Text>

              <Pressable
                onPress={() => router.push(`/campaign/${evt.campaignId}`)}
                accessibilityRole="button"
                accessibilityLabel="Inspect campaign"
                style={styles.eventActionBtn}>
                <Text style={styles.eventActionText}>View Campaign Progress</Text>
                <Ionicons name="chevron-forward" size={12} color={Palette.primary700} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        /* 'all' tab: Combines Recent Contributions & Lifecycle Events */
        <View style={styles.allTabContainer}>
          {successfulContributions.length > 0 && (
            <View style={styles.contributionsList}>
              <Text style={styles.sectionSubtitle}>Recent Contributions</Text>
              {successfulContributions.slice(0, 2).map((c) => (
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
          )}

          <Text style={styles.sectionSubtitle}>Campaign Lifecycle & Distribution Updates</Text>
          <View style={styles.eventsList}>
            {lifecycleEvents.map((evt) => (
              <View key={evt.id} style={styles.eventCard}>
                <View style={styles.eventHeaderRow}>
                  <View style={styles.eventTitleRow}>
                    <View style={styles.eventIconCircle}>
                      <Ionicons name={evt.icon} size={15} color={Palette.primary700} />
                    </View>
                    <Text style={styles.eventHeading}>{evt.title}</Text>
                  </View>
                  <Text style={styles.eventDate}>
                    {new Date(evt.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                <Text style={styles.eventCampaignTitle}>{evt.campaignTitle}</Text>
                <Text style={styles.eventDesc}>{evt.description}</Text>

                <Pressable
                  onPress={() => router.push(`/campaign/${evt.campaignId}`)}
                  accessibilityRole="button"
                  accessibilityLabel="Inspect campaign"
                  style={styles.eventActionBtn}>
                  <Text style={styles.eventActionText}>View Campaign Progress</Text>
                  <Ionicons name="chevron-forward" size={12} color={Palette.primary700} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
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
  allTabContainer: {
    marginBottom: Spacing.lg,
  },
  eventsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  eventCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  eventIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventHeading: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    fontSize: 13,
    flex: 1,
  },
  eventDate: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
  },
  eventCampaignTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.primary700,
    marginTop: 2,
    marginBottom: 2,
  },
  eventDesc: {
    ...Typography.caption,
    color: Palette.neutral600,
    lineHeight: 16,
    marginTop: 2,
  },
  eventActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  eventActionText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primary700,
  },
});
