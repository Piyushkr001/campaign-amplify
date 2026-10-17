import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CampaignStatus, CampaignStatusHistoryItem } from '@/types/campaign';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface TimelineStepItem {
  key: string;
  label: string;
  description: string;
  state: 'completed' | 'current' | 'pending' | 'warning' | 'error' | 'neutral';
  date?: string | null;
}

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
  // Helper to find recorded date for a status in history
  const getHistoryDate = (statusKey: string): string | null => {
    const entry = statusHistory.find(
      (h) => h.toStatus === statusKey || (statusKey === 'DRAFT' && h.toStatus === 'DRAFT')
    );
    if (!entry) return null;
    return new Date(entry.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const isChangesRequested = currentStatus === 'CHANGES_REQUESTED';
  const isRejected = currentStatus === 'REJECTED';
  const isCancelled = currentStatus === 'CANCELLED';
  const isFailed = currentStatus === 'FAILED';

  // Build the dynamic steps array tailored to currentStatus
  const getSteps = (): TimelineStepItem[] => {
    if (isChangesRequested) {
      return [
        {
          key: 'DRAFT',
          label: 'Draft Created',
          description: 'Campaign message, ad creative, and sources structured.',
          state: 'completed',
          date: getHistoryDate('DRAFT'),
        },
        {
          key: 'SUBMITTED_FOR_REVIEW',
          label: 'Submitted for Review',
          description: 'Campaign received in the editorial verification queue.',
          state: 'completed',
          date: getHistoryDate('SUBMITTED_FOR_REVIEW'),
        },
        {
          key: 'UNDER_REVIEW',
          label: 'Review Started',
          description: 'Verification team inspected message claims and sources.',
          state: 'completed',
          date: getHistoryDate('UNDER_REVIEW'),
        },
        {
          key: 'CHANGES_REQUESTED',
          label: 'Changes Requested',
          description: reviewFeedback || 'Reviewer requested adjustments before campaign approval.',
          state: 'warning',
          date: getHistoryDate('CHANGES_REQUESTED'),
        },
        {
          key: 'RESUBMISSION',
          label: 'Resubmission for Review',
          description: 'Creator updates claims or citations and submits revisions.',
          state: 'pending',
          date: null,
        },
        {
          key: 'APPROVED',
          label: 'Editorial Approval',
          description: 'Verification team confirms compliance with advertising guidelines.',
          state: 'pending',
          date: null,
        },
        {
          key: 'FUNDING',
          label: 'Available for Funding',
          description: 'Campaign published publicly for community backer contributions.',
          state: 'pending',
          date: null,
        },
      ];
    }

    if (isRejected) {
      return [
        {
          key: 'DRAFT',
          label: 'Draft Created',
          description: 'Campaign message and sources initialized.',
          state: 'completed',
          date: getHistoryDate('DRAFT'),
        },
        {
          key: 'SUBMITTED_FOR_REVIEW',
          label: 'Submitted for Review',
          description: 'Campaign received in editorial verification queue.',
          state: 'completed',
          date: getHistoryDate('SUBMITTED_FOR_REVIEW'),
        },
        {
          key: 'UNDER_REVIEW',
          label: 'Review Started',
          description: 'Verification team vetted claims against platform policy.',
          state: 'completed',
          date: getHistoryDate('UNDER_REVIEW'),
        },
        {
          key: 'REJECTED',
          label: 'Campaign Not Approved',
          description: rejectionReason || 'Does not meet platform neutrality or sourcing standards.',
          state: 'error',
          date: getHistoryDate('REJECTED'),
        },
      ];
    }

    if (isCancelled) {
      return [
        {
          key: 'DRAFT',
          label: 'Draft Created',
          description: 'Campaign message initialized.',
          state: 'completed',
          date: getHistoryDate('DRAFT'),
        },
        {
          key: 'CANCELLED',
          label: 'Campaign Cancelled',
          description: 'Campaign was closed or archived by creator.',
          state: 'neutral',
          date: getHistoryDate('CANCELLED'),
        },
      ];
    }

    if (isFailed) {
      return [
        {
          key: 'DRAFT',
          label: 'Draft Created',
          description: 'Campaign structured.',
          state: 'completed',
          date: getHistoryDate('DRAFT'),
        },
        {
          key: 'SUBMITTED_FOR_REVIEW',
          label: 'Submitted for Review',
          description: 'Campaign submitted for review.',
          state: 'completed',
          date: getHistoryDate('SUBMITTED_FOR_REVIEW'),
        },
        {
          key: 'FUNDING',
          label: 'Funding',
          description: 'Community contributions sponsored message amplification.',
          state: 'completed',
          date: getHistoryDate('FUNDING'),
        },
        {
          key: 'FAILED',
          label: 'Distribution Interrupted',
          description: 'Targeted ad delivery encountered delivery failure.',
          state: 'error',
          date: getHistoryDate('FAILED'),
        },
      ];
    }

    // Standard progression for happy path
    const HAPPY_STEPS = [
      {
        key: 'DRAFT',
        label: 'Draft Created',
        description: 'Campaign message, ad creative, and sources structured.',
      },
      {
        key: 'SUBMITTED_FOR_REVIEW',
        label: 'Submitted for Review',
        description: 'Campaign received in the editorial review queue.',
      },
      {
        key: 'UNDER_REVIEW',
        label: 'Under Review',
        description: 'Review team inspecting message claims and citations.',
      },
      {
        key: 'APPROVED',
        label: 'Approved',
        description: 'Passed editorial guidelines and approved for platform compliance.',
      },
      {
        key: 'FUNDING',
        label: 'Available for Funding',
        description: 'Publicly discoverable; backers contribute toward advertising budget.',
      },
      {
        key: 'DISTRIBUTION_PREPARATION',
        label: 'Distribution Prep',
        description: 'Ad accounts and targeted placements configured.',
      },
      {
        key: 'PROMOTING',
        label: 'Live Promotion',
        description: 'Advertising campaigns actively distributing to selected audiences.',
      },
      {
        key: 'COMPLETED',
        label: 'Distribution Completed',
        description: 'Delivery cycle complete with prototype distribution report.',
      },
    ];

    const PROGRESSION_INDEX: Record<string, number> = {
      DRAFT: 0,
      SUBMITTED_FOR_REVIEW: 1,
      UNDER_REVIEW: 2,
      APPROVED: 3,
      FUNDING: 4,
      FUNDING_GOAL_REACHED: 4,
      FUNDING_ENDED: 4,
      DISTRIBUTION_PREPARATION: 5,
      PROMOTING: 6,
      COMPLETED: 7,
    };

    const currentIdx = PROGRESSION_INDEX[currentStatus] ?? 0;

    return HAPPY_STEPS.map((step, idx) => {
      let state: TimelineStepItem['state'] = 'pending';
      if (idx < currentIdx) {
        state = 'completed';
      } else if (idx === currentIdx) {
        state = 'current';
      }
      return {
        key: step.key,
        label: step.label,
        description: step.description,
        state,
        date: getHistoryDate(step.key),
      };
    });
  };

  const steps = getSteps();

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
        {steps.map((step, idx) => {
          const isCompleted = step.state === 'completed';
          const isCurrent = step.state === 'current';
          const isWarning = step.state === 'warning';
          const isError = step.state === 'error';
          const isNeutral = step.state === 'neutral';
          const isPending = step.state === 'pending';

          const isLineActive = isCompleted;

          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Vertical line connector */}
              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.verticalLine,
                    isLineActive ? styles.lineCompleted : styles.linePending,
                  ]}
                />
              )}

              {/* Status Indicator Icon */}
              <View
                style={[
                  styles.iconCircle,
                  isCompleted && styles.iconCompleted,
                  isCurrent && styles.iconCurrent,
                  isWarning && styles.iconWarning,
                  isError && styles.iconError,
                  isNeutral && styles.iconNeutral,
                  isPending && styles.iconPending,
                ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={Palette.pureWhite} />
                ) : isCurrent ? (
                  <View style={styles.currentDot} />
                ) : isWarning ? (
                  <Ionicons name="alert" size={12} color={Palette.pureWhite} />
                ) : isError ? (
                  <Ionicons name="close" size={12} color={Palette.pureWhite} />
                ) : isNeutral ? (
                  <Ionicons name="remove" size={12} color={Palette.neutral600} />
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
                      isWarning && styles.labelWarning,
                      isError && styles.labelError,
                      isPending && styles.labelPending,
                    ]}>
                    {step.label}
                  </Text>
                  {step.date ? <Text style={styles.stepDate}>{step.date}</Text> : null}
                </View>
                <Text
                  style={[
                    styles.stepDesc,
                    isCurrent && styles.descCurrent,
                    isWarning && styles.descWarning,
                    isError && styles.descError,
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
  iconWarning: {
    backgroundColor: Palette.amber600,
  },
  iconError: {
    backgroundColor: Palette.error600,
  },
  iconNeutral: {
    backgroundColor: Palette.neutral200,
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
  labelWarning: {
    color: Palette.amber900,
    fontWeight: '700',
  },
  labelError: {
    color: Palette.error700,
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
  descWarning: {
    color: Palette.amber900,
  },
  descError: {
    color: Palette.error700,
  },
  descPending: {
    color: Palette.neutral400,
  },
});
