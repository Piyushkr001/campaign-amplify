import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { AppButton } from '@/components/ui/AppButton';
import { useContributionStore } from '@/store/contribution-store';
import { useMyCampaignsStore } from '@/store/my-campaigns-store';
import { useAuthStore } from '@/store/auth-store';
import { formatCurrency, formatReachRange } from '@/utils/formatters';
import { CampaignStatus } from '@/types/campaign';
import { Config } from '@/constants/config';
import { useMyContributions } from '@/hooks/useContributions';
import { useMyActivity } from '@/hooks/useActivity';
import { ActivityEventType } from '@/types/activity-api';

type ActivityTab = 'all' | 'backed' | 'updates';

interface DisplayActivityEvent {
  id: string;
  campaignId?: string;
  campaignTitle?: string;
  contributionId?: string;
  type: string;
  title: string;
  description: string;
  date: string;
  badgeVariant: 'info' | 'success' | 'warning' | 'purple' | 'default';
  icon: keyof typeof Ionicons.glyphMap;
  amount?: number;
  advertisingAllocation?: number;
}

function getEventStyle(type: string): {
  icon: keyof typeof Ionicons.glyphMap;
  badgeVariant: DisplayActivityEvent['badgeVariant'];
} {
  switch (type) {
    case 'CAMPAIGN_DRAFT_CREATED':
      return { icon: 'create-outline', badgeVariant: 'info' };
    case 'CAMPAIGN_SUBMITTED':
      return { icon: 'send-outline', badgeVariant: 'info' };
    case 'REVIEW_STARTED':
      return { icon: 'search-outline', badgeVariant: 'info' };
    case 'CHANGES_REQUESTED':
      return { icon: 'alert-circle-outline', badgeVariant: 'warning' };
    case 'APPROVED':
    case 'CAMPAIGN_APPROVED':
      return { icon: 'checkmark-circle-outline', badgeVariant: 'success' };
    case 'FUNDING':
    case 'FUNDING_STARTED':
      return { icon: 'rocket-outline', badgeVariant: 'success' };
    case 'CONTRIBUTION_CONFIRMED':
    case 'CONTRIBUTION_SUCCESS':
      return { icon: 'receipt-outline', badgeVariant: 'success' };
    case 'PAYMENT_FAILED':
      return { icon: 'close-circle-outline', badgeVariant: 'warning' };
    case 'FUNDING_GOAL_REACHED':
      return { icon: 'trophy-outline', badgeVariant: 'success' };
    case 'FUNDING_ENDED':
      return { icon: 'time-outline', badgeVariant: 'info' };
    case 'DISTRIBUTION_PREPARATION':
    case 'DISTRIBUTION_PREPARATION_STARTED':
      return { icon: 'construct-outline', badgeVariant: 'info' };
    case 'PROMOTING':
    case 'PROMOTION_STARTED':
      return { icon: 'megaphone-outline', badgeVariant: 'purple' };
    case 'COMPLETED':
    case 'CAMPAIGN_COMPLETED':
      return { icon: 'checkmark-done-circle-outline', badgeVariant: 'default' };
    case 'REJECTED':
    case 'CAMPAIGN_REJECTED':
    case 'FAILED':
    case 'CAMPAIGN_FAILED':
      return { icon: 'close-circle-outline', badgeVariant: 'warning' };
    default:
      return { icon: 'information-circle-outline', badgeVariant: 'info' };
  }
}

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');
  const { user, isAuthenticated } = useAuthStore();
  const { contributions } = useContributionStore();
  const { campaigns } = useMyCampaignsStore();
  const { data: apiContributions } = useMyContributions();
  const {
    data: apiActivityData,
    isLoading: isActivityLoading,
    isError: isActivityError,
    refetch: refetchActivity,
  } = useMyActivity();

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

  // --- API MODE DATA ---
  let apiEvents: DisplayActivityEvent[] = [];
  if (Config.useApi && apiActivityData?.events) {
    apiEvents = apiActivityData.events.map((evt) => {
      const style = getEventStyle(evt.type);
      const meta = evt.metadata || {};
      return {
        id: evt.id,
        campaignId: evt.campaignId,
        campaignTitle: evt.campaignTitle,
        contributionId: evt.contributionId,
        type: evt.type,
        title: evt.title,
        description: evt.description || '',
        date: evt.createdAt,
        badgeVariant: style.badgeVariant,
        icon: style.icon,
        amount: typeof meta.amount === 'number' ? meta.amount : undefined,
        advertisingAllocation: typeof meta.advertisingAllocation === 'number' ? meta.advertisingAllocation : undefined,
      };
    });
  }

  // --- LOCAL MODE DATA ---
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

  const localLifecycleEvents: DisplayActivityEvent[] = [];
  campaigns.forEach((camp) => {
    (camp.statusHistory || []).forEach((hist) => {
      const style = getEventStyle(hist.toStatus);
      localLifecycleEvents.push({
        id: hist.id,
        campaignId: camp.id,
        campaignTitle: camp.title,
        type: hist.toStatus,
        title: hist.toStatus.replace(/_/g, ' '),
        description: hist.note || `Campaign status transitioned to ${hist.toStatus}.`,
        date: hist.createdAt,
        badgeVariant: style.badgeVariant,
        icon: style.icon,
      });
    });
  });

  if (localLifecycleEvents.length === 0) {
    localLifecycleEvents.push(
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
  localLifecycleEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Determine active display events based on mode and tab
  const activeEvents = Config.useApi ? apiEvents : (
    activeTab === 'backed'
      ? []
      : localLifecycleEvents
  );

  const filteredEvents = activeEvents.filter((evt) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'backed') {
      return (
        evt.type === 'CONTRIBUTION_CONFIRMED' ||
        evt.type === 'PAYMENT_FAILED' ||
        Boolean(evt.contributionId)
      );
    }
    if (activeTab === 'updates') {
      return (
        evt.type !== 'CONTRIBUTION_CONFIRMED' &&
        evt.type !== 'PAYMENT_FAILED'
      );
    }
    return true;
  });

  const backedCount = Config.useApi
    ? apiEvents.filter((e) => e.type === 'CONTRIBUTION_CONFIRMED' || Boolean(e.contributionId)).length
    : successfulContributions.length;

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
              {tab.key === 'backed' && backedCount > 0
                ? ` (${backedCount})`
                : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content based on mode & tab */}
      {Config.useApi ? (
        isActivityLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Palette.primary700} />
            <Text style={styles.loadingText}>Loading activity feed...</Text>
          </View>
        ) : isActivityError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={Palette.warning700} />
            <Text style={styles.errorTitle}>Failed to load activity</Text>
            <Text style={styles.errorText}>Unable to reach the server to fetch your activity timeline.</Text>
            <View style={{ marginTop: Spacing.sm }}>
              <AppButton title="Retry" onPress={() => refetchActivity()} variant="primary" size="sm" />
            </View>
          </View>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            iconName={activeTab === 'backed' ? 'receipt-outline' : 'notifications-outline'}
            title={activeTab === 'backed' ? 'No backed campaigns yet' : 'No activity yet'}
            description={
              activeTab === 'backed'
                ? 'When you back campaign amplification, your contributions and receipts will appear here.'
                : 'Activity milestones, review decisions, and distribution progress will be listed here.'
            }
            actionTitle="Explore Active Campaigns"
            onAction={() => router.push('/(tabs)/explore')}
            style={styles.emptyContainer}
          />
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map((evt) => (
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

                {evt.campaignTitle ? (
                  <Text style={styles.eventCampaignTitle}>{evt.campaignTitle}</Text>
                ) : null}
                <Text style={styles.eventDesc}>{evt.description}</Text>

                {evt.amount ? (
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBadge}>
                      <Ionicons name="card-outline" size={13} color={Palette.neutral600} />
                      <Text style={styles.metricText}>Amount: {formatCurrency(evt.amount)}</Text>
                    </View>
                    {evt.advertisingAllocation ? (
                      <View style={styles.metricBadge}>
                        <Ionicons name="megaphone-outline" size={13} color={Palette.primary700} />
                        <Text style={styles.metricText}>
                          Ad Budget: {formatCurrency(evt.advertisingAllocation)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.cardActions}>
                  {evt.contributionId ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/contribution/receipt',
                          params: { contributionId: evt.contributionId },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="View contribution receipt"
                      style={styles.receiptBtn}>
                      <Ionicons name="receipt-outline" size={14} color={Palette.primary700} />
                      <Text style={styles.receiptBtnText}>View Receipt</Text>
                    </Pressable>
                  ) : null}

                  {evt.campaignId ? (
                    <Pressable
                      onPress={() => router.push(`/campaign/${evt.campaignId}`)}
                      accessibilityRole="button"
                      accessibilityLabel="Inspect campaign"
                      style={styles.eventActionBtn}>
                      <Text style={styles.eventActionText}>View Campaign Progress</Text>
                      <Ionicons name="chevron-forward" size={12} color={Palette.primary700} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )
      ) : activeTab === 'backed' ? (
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
          {localLifecycleEvents.map((evt) => (
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
        /* 'all' tab in local mode */
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
            {localLifecycleEvents.map((evt) => (
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
  loadingContainer: {
    paddingVertical: Spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    padding: Spacing.xl,
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.warning200,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  errorTitle: {
    ...Typography.h3,
    color: Palette.navy950,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Palette.neutral600,
    textAlign: 'center',
    marginTop: 4,
  },
});

