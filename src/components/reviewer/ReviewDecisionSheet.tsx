import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';

export interface ReviewDecisionSheetProps {
  visible: boolean;
  mode: 'CHANGES' | 'REJECT' | null;
  onClose: () => void;
  onConfirm: (feedback: string) => void;
  defaultText?: string;
}

export function ReviewDecisionSheet({
  visible,
  mode,
  onClose,
  onConfirm,
  defaultText = '',
}: ReviewDecisionSheetProps) {
  const [text, setText] = useState(defaultText);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setText(defaultText);
      setError('');
    }
  }, [visible, defaultText]);

  if (!visible || !mode) return null;

  const isChanges = mode === 'CHANGES';

  const handleConfirm = () => {
    if (!text.trim()) {
      setError('Please provide feedback or an explanation for the creator.');
      return;
    }
    onConfirm(text.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View
                style={[
                  styles.iconBadge,
                  isChanges ? styles.iconBadgeWarning : styles.iconBadgeDanger,
                ]}>
                <Ionicons
                  name={isChanges ? 'alert-circle' : 'close-circle'}
                  size={18}
                  color={isChanges ? Palette.amber700 : Palette.error600}
                />
              </View>
              <Text style={styles.sheetTitle}>
                {isChanges ? 'Request Creator Revisions' : 'Reject Campaign'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Palette.neutral600} />
            </Pressable>
          </View>

          <Text style={styles.sheetDescription}>
            {isChanges
              ? 'Specify what claims, citations, or ad copy require adjustment before this campaign can be approved for funding.'
              : 'Provide an honest explanation of why this campaign cannot be approved under platform editorial and advertising policies.'}
          </Text>

          <AppInput
            label={isChanges ? 'Review Feedback for Creator *' : 'Reason for Rejection *'}
            placeholder={
              isChanges
                ? 'e.g. Please link a direct citation for the statistic in the second paragraph...'
                : 'e.g. Does not comply with advertising neutrality guidelines...'
            }
            value={text}
            onChangeText={(val) => {
              setText(val);
              if (error) setError('');
            }}
            multiline
            numberOfLines={4}
            error={error}
            containerStyle={styles.inputSpacing}
          />

          <View style={styles.actionRow}>
            <AppButton
              title="Cancel"
              onPress={onClose}
              variant="outline"
              size="md"
              style={styles.cancelBtn}
            />
            <AppButton
              title={isChanges ? 'Send Feedback' : 'Confirm Rejection'}
              onPress={handleConfirm}
              variant={isChanges ? 'primary' : 'danger'}
              size="md"
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 15, 29, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Palette.pureWhite,
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.neutral300,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeWarning: {
    backgroundColor: Palette.amber50,
  },
  iconBadgeDanger: {
    backgroundColor: Palette.error50,
  },
  sheetTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDescription: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  inputSpacing: {
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 2,
  },
});
