import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { CampaignSyncStatus } from '@/types/campaign';

export type StepNumber = 1 | 2 | 3 | 4 | 5;

const STEPS: { number: StepNumber; label: string }[] = [
  { number: 1, label: 'Basics' },
  { number: 2, label: 'Story' },
  { number: 3, label: 'Visuals' },
  { number: 4, label: 'Reach' },
  { number: 5, label: 'Submit' },
];

export interface CampaignStepIndicatorProps {
  currentStep: StepNumber;
  lastSavedAt?: string | null;
  syncStatus?: CampaignSyncStatus;
  onSaveDraft?: () => void;
  onRetrySync?: () => void;
}

export const CampaignStepIndicator: React.FC<CampaignStepIndicatorProps> = ({
  currentStep,
  lastSavedAt,
  syncStatus = 'LOCAL_ONLY',
  onSaveDraft,
  onRetrySync,
}) => {
  const getSaveTimeText = () => {
    if (!lastSavedAt) return 'Saved on device';
    try {
      const savedDate = new Date(lastSavedAt);
      const diffSec = Math.floor((Date.now() - savedDate.getTime()) / 1000);
      if (diffSec < 10) return 'Saved just now';
      if (diffSec < 60) return `Saved ${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `Saved ${diffMin}m ago`;
      return `Saved at ${savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Saved';
    }
  };

  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'PENDING':
        return (
          <View style={styles.syncBadge}>
            <View style={[styles.saveDot, styles.dotPending]} />
            <Text style={styles.saveStatusText}>Syncing...</Text>
          </View>
        );
      case 'SYNCED':
        return (
          <View style={styles.syncBadge}>
            <View style={[styles.saveDot, styles.dotSynced]} />
            <Text style={styles.saveStatusText}>Synced</Text>
          </View>
        );
      case 'ERROR':
        return (
          <View style={styles.syncBadge}>
            <View style={[styles.saveDot, styles.dotError]} />
            <Text style={[styles.saveStatusText, styles.textError]}>Sync failed</Text>
            {onRetrySync && (
              <Pressable
                onPress={onRetrySync}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Retry syncing to server"
                style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}>
                <Ionicons name="refresh" size={11} color={Palette.error700} />
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            )}
          </View>
        );
      case 'LOCAL_ONLY':
      default:
        return (
          <View style={styles.syncBadge}>
            <View style={[styles.saveDot, styles.dotLocal]} />
            <Text style={styles.saveStatusText}>{getSaveTimeText()}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Status Row: Step counter & Autosave status */}
      <View style={styles.statusRow}>
        <Text style={styles.stepCounterText}>
          Step {currentStep} of 5:{' '}
          <Text style={styles.stepCurrentLabel}>{STEPS[currentStep - 1].label}</Text>
        </Text>

        <View style={styles.saveStatusWrapper}>
          {renderSyncBadge()}

          {onSaveDraft && (
            <Pressable
              onPress={onSaveDraft}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Save current draft"
              style={({ pressed }) => [styles.saveDraftBtn, pressed && styles.btnPressed]}>
              <Ionicons name="cloud-done-outline" size={13} color={Palette.primary700} />
              <Text style={styles.saveDraftText}>Save Draft</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.trackContainer}>
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isUpcoming = step.number > currentStep;

          return (
            <React.Fragment key={step.number}>
              {/* Connector line before this node */}
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    step.number <= currentStep ? styles.connectorCompleted : styles.connectorUpcoming,
                  ]}
                />
              )}

              {/* Step Node */}
              <View style={styles.nodeWrapper}>
                <View
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.nodeCircleCompleted,
                    isCurrent && styles.nodeCircleCurrent,
                    isUpcoming && styles.nodeCircleUpcoming,
                  ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={11} color={Palette.pureWhite} />
                  ) : (
                    <Text
                      style={[
                        styles.nodeNumber,
                        isCurrent && styles.nodeNumberCurrent,
                        isUpcoming && styles.nodeNumberUpcoming,
                      ]}>
                      {step.number}
                    </Text>
                  )}
                </View>

                {/* Step Label */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.nodeLabel,
                    isCompleted && styles.nodeLabelCompleted,
                    isCurrent && styles.nodeLabelCurrent,
                    isUpcoming && styles.nodeLabelUpcoming,
                  ]}>
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepCounterText: {
    ...Typography.caption,
    color: Palette.neutral600,
    fontWeight: '500',
  },
  stepCurrentLabel: {
    color: Palette.navy950,
    fontWeight: '700',
  },
  saveStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLocal: {
    backgroundColor: Palette.neutral400,
  },
  dotPending: {
    backgroundColor: Palette.primary500,
  },
  dotSynced: {
    backgroundColor: Palette.success600,
  },
  dotError: {
    backgroundColor: Palette.error600,
  },
  saveStatusText: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral500,
  },
  textError: {
    color: Palette.error700,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Palette.error50,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: BorderRadius.pill,
    marginLeft: 3,
  },
  retryText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.error700,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.neutral100,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.pill,
    marginLeft: 6,
  },
  saveDraftText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Palette.primary700,
  },
  btnPressed: {
    opacity: 0.7,
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginTop: -14,
  },
  connectorCompleted: {
    backgroundColor: Palette.primary700,
  },
  connectorUpcoming: {
    backgroundColor: Palette.neutral200,
  },
  nodeWrapper: {
    alignItems: 'center',
    width: 48,
  },
  nodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nodeCircleCompleted: {
    backgroundColor: Palette.primary700,
  },
  nodeCircleCurrent: {
    backgroundColor: Palette.navy950,
    borderWidth: 2,
    borderColor: Palette.primary500,
  },
  nodeCircleUpcoming: {
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral300,
  },
  nodeNumber: {
    fontSize: 10,
    fontWeight: '700',
  },
  nodeNumberCurrent: {
    color: Palette.pureWhite,
  },
  nodeNumberUpcoming: {
    color: Palette.neutral500,
  },
  nodeLabel: {
    ...Typography.caption,
    fontSize: 10,
    textAlign: 'center',
  },
  nodeLabelCompleted: {
    color: Palette.neutral600,
    fontWeight: '500',
  },
  nodeLabelCurrent: {
    color: Palette.navy950,
    fontWeight: '700',
  },
  nodeLabelUpcoming: {
    color: Palette.neutral400,
  },
});
