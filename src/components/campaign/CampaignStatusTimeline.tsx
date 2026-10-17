import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CampaignStatus, CampaignStatusHistoryItem } from '@/types/campaign';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface TimelineStep {
  key: string;
  label: string;
  description: string;
}

const HAPPY_PATH_STEPS: TimelineStep[] = [
  {
    key: 'DRAFT',
    label: 'Draft Created',
    description: 'Campaign message, ad creative, and sources structured.',
  },
  {
    key: 'SUBMITTED_FOR_REVIEW',
    label: 'Submitted for Review',
    description: 'Campaign received in the editorial verification queue.',
  },
  {
    key: 'UNDER_REVIEW',
    label: 'Under Review',
    description: 'Verification team inspecting message claims and sources.',
  },
  {
    key: 'APPROVED',
    label: 'Approved',
    description: 'Passed editorial guidelines and verified for policy compliance.',
  },
  {
    key: 'FUNDING',
    label: 'Available for Funding',
    description: 'Publicly discoverable; backers contribute toward advertising budget.',
  },
  {
    key: 'DISTRIBUTION_PREPARATION',
    label: 'Distribution Prep',
    description: 'Ad network accounts and targeted placements configured.',
  },
  {
    key: 'PROMOTING',
    label: 'Live Promotion',
    description: 'Advertising campaigns actively distributing to selected audiences.',
  },
  {
    key: 'COMPLETED',
    label: 'Distribution Completed',
    description: 'Delivery cycle complete with validated impression metrics.',
  },
];

const STATUS_PROGRESSION: Record<CampaignStatus, number> = {
  DRAFT: 0,
  SUBMITTED_FOR_REVIEW: 1,
  UNDER_REVIEW: 2,
  CHANGES_REQUESTED: 2, // Exception at review
  APPROVED: 3,
  FUNDING: 4,
  FUNDING_GOAL_REACHED: 4,
  FUNDING_ENDED: 4,
  DISTRIBUTION_PREPARATION: 5,
  PROMOTING: 6,
  COMPLETED: 7,
  REJECTED: 2, // Exception at review
  CANCELLED: -1,
  REFUND_PENDING: -1,
  FAILED: -1,
};

interface CampaignStatusTimelineProps {
  currentStatus: CampaignStatus;
  statusHistory?: CampaignStatusHistoryItem[];
  reviewFeedback?: string;
  rejectionReason?: string;
}

export function CampaignStatusTimeline({
  currentStatus,
  statusHistory = [],
  reviewFeedback,
  rejectionReason,
}: CampaignStatusTimelineProps) {
  const currentStepIndex = STATUS_PROGRESSION[currentStatus] ?? 0;
  const isChangesRequested = currentStatus === 'CHANGES_REQUESTED';
  const isRejected = currentStatus === 'REJECTED';
  const isCancelled = currentStatus === 'CANCELLED';
  const isFailed = currentStatus === 'FAILED';

  // Helper to find recorded date for a status in history
  const getHistoryDate = (statusKey: string) => {
    const entry = statusHistory.find(
      (h) => h.toStatus === statusKey || (statusKey === 'DRAFT' && h.toStatus === 'DRAFT')
    );
    if (!entry) return null;
    return new Date(entry.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timelineTitle}>Lifecycle Progression</Text>
      <Text style={styles.timelineSubtitle}>
        Transparent record of campaign verification, funding, and distribution.
      </Text>

      {/* Exception Banner for non-happy-path statuses */}
      {isChangesRequested && (
        <View style={styles.exceptionCardWarning}>
          <View style={styles.exceptionHeader}>
            <Ionicons name="alert-circle" size={18} color={Palette.amber700} />
            <Text style={styles.exceptionTitleWarning}>Action Required — Changes Requested</Text>
          </View>
          <Text style={styles.exceptionTextWarning}>
            {reviewFeedback || 'The review team requested adjustments before approving this campaign.'}
          </Text>
        </View>
      )}

      {isRejected && (
        <View style={styles.exceptionCardDanger}>
          <View style={styles.exceptionHeader}>
            <Ionicons name="close-circle" size={18} color={Palette.error600} />
            <Text style={styles.exceptionTitleDanger}>Campaign Not Approved</Text>
          </View>
          <Text style={styles.exceptionTextDanger}>
            {rejectionReason || 'This campaign did not meet the platform editorial guidelines.'}
          </Text>
        </View>
      )}

      {isCancelled && (
        <View style={styles.exceptionCardNeutral}>
          <View style={styles.exceptionHeader}>
            <Ionicons name="ban-outline" size={18} color={Palette.neutral600} />
            <Text style={styles.exceptionTitleNeutral}>Campaign Cancelled</Text>
          </View>
          <Text style={styles.exceptionTextNeutral}>
            This campaign was cancelled and is archived.
          </Text>
        </View>
      )}

      {isFailed && (
        <View style={styles.exceptionCardDanger}>
          <View style={styles.exceptionHeader}>
            <Ionicons name="warning-outline" size={18} color={Palette.error600} />
            <Text style={styles.exceptionTitleDanger}>Distribution Encountered Issues</Text>
          </View>
          <Text style={styles.exceptionTextDanger}>
            Campaign ad network distribution encountered delivery failure.
          </Text>
        </View>
      )}

      {/* Steps List */}
      <View style={styles.stepsList}>
        {HAPPY_PATH_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex && !isRejected;
          const isCurrent = idx === currentStepIndex && !isChangesRequested && !isRejected;
          const isPending = idx > currentStepIndex || isRejected || isChangesRequested;

          const dateLabel = getHistoryDate(step.key);

          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Vertical line connector */}
              {idx < HAPPY_PATH_STEPS.length - 1 && (
                <View
                  style={[
                    styles.verticalLine,
                    isCompleted ? styles.lineCompleted : styles.linePending,
                  ]}
                />
              )}

              {/* Status Indicator Icon */}
              <View
                style={[
                  styles.iconCircle,
                  isCompleted && styles.iconCompleted,
                  isCurrent && styles.iconCurrent,
                  isPending && styles.iconPending,
                ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={Palette.pureWhite} />
                ) : isCurrent ? (
                  <View style={styles.currentDot} />
                ) : (
                  <View style={styles.pendingDot} />
                )}
              </View>

              {/* Content text */}
              <View style={styles.stepContent}>
                <View style={styles.stepHeadingRow}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCompleted && styles.labelCompleted,
                      isCurrent && styles.labelCurrent,
                      isPending && styles.labelPending,
                    ]}>
                    {step.label}
                  </Text>
                  {dateLabel ? <Text style={styles.stepDate}>{dateLabel}</Text> : null}
                </View>
                <Text
                  style={[
                    styles.stepDesc,
                    isCurrent && styles.descCurrent,
                    isPending && styles.descPending,
                  ]}>
                  {step.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  timelineTitle: {
    ...Typography.h3,
    fontSize: 16,
    color: Palette.navy950,
  },
  timelineSubtitle: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  exceptionCardWarning: {
    backgroundColor: Palette.amber50,
    borderWidth: 1,
    borderColor: Palette.amber200,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exceptionCardDanger: {
    backgroundColor: Palette.error50,
    borderWidth: 1,
    borderColor: Palette.error200,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exceptionCardNeutral: {
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exceptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  exceptionTitleWarning: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.amber800,
  },
  exceptionTitleDanger: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.error700,
  },
  exceptionTitleNeutral: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.neutral700,
  },
  exceptionTextWarning: {
    ...Typography.caption,
    color: Palette.amber900,
    lineHeight: 16,
  },
  exceptionTextDanger: {
    ...Typography.caption,
    color: Palette.error700,
    lineHeight: 16,
  },
  exceptionTextNeutral: {
    ...Typography.caption,
    color: Palette.neutral600,
    lineHeight: 16,
  },

  stepsList: {
    marginTop: Spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    position: 'relative',
    paddingBottom: Spacing.md,
  },
  verticalLine: {
    position: 'absolute',
    top: 18,
    left: 10,
    bottom: 0,
    width: 2,
  },
  lineCompleted: {
    backgroundColor: Palette.primary600,
  },
  linePending: {
    backgroundColor: Palette.neutral200,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    zIndex: 2,
  },
  iconCompleted: {
    backgroundColor: Palette.primary600,
  },
  iconCurrent: {
    backgroundColor: Palette.pureWhite,
    borderWidth: 2,
    borderColor: Palette.primary600,
  },
  iconPending: {
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral300,
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary600,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.neutral300,
  },
  stepContent: {
    flex: 1,
  },
  stepHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  labelCompleted: {
    color: Palette.navy900,
  },
  labelCurrent: {
    color: Palette.primary700,
    fontWeight: '700',
  },
  labelPending: {
    color: Palette.neutral400,
  },
  stepDate: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
  },
  stepDesc: {
    ...Typography.caption,
    color: Palette.neutral600,
    marginTop: 2,
    lineHeight: 15,
  },
  descCurrent: {
    color: Palette.navy900,
  },
  descPending: {
    color: Palette.neutral400,
  },
});
