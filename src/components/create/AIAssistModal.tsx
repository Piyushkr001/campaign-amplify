import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';

interface AIAssistModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  onApply?: () => void;
  applyLabel?: string;
  children?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export const AIAssistModal: React.FC<AIAssistModalProps> = ({
  visible,
  title,
  subtitle = 'Assistive suggestions for your campaign draft',
  isLoading,
  error,
  onClose,
  onApply,
  applyLabel = 'Apply to Draft',
  children,
  secondaryActions,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="sparkles" size={18} color={Palette.primary700} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}>
              <Ionicons name="close" size={20} color={Palette.neutral600} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Palette.primary700} />
                <Text style={styles.loadingTitle}>Generating Draft...</Text>
                <Text style={styles.loadingDesc}>
                  Synthesizing honest, amplification-focused campaign copy matching editorial guidelines.
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color={Palette.error700} />
                <Text style={styles.errorTitle}>Generation Notice</Text>
                <Text style={styles.errorDesc}>{error}</Text>
              </View>
            ) : (
              <>
                {children}

                {/* Safety & Editorial Notice */}
                <View style={styles.disclaimerBox}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={Palette.success700} />
                  <Text style={styles.disclaimerText}>
                    AI suggestions are strictly assistive. You retain complete editorial control. Review, verify facts, and modify copy before publishing.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          {!isLoading && (
            <View style={styles.footer}>
              {secondaryActions ? (
                <View style={styles.secondaryContainer}>{secondaryActions}</View>
              ) : null}

              <View style={styles.primaryRow}>
                <AppButton
                  title="Discard"
                  variant="ghost"
                  onPress={onClose}
                  style={styles.cancelBtn}
                />
                {!error && onApply && (
                  <AppButton
                    title={applyLabel}
                    variant="primary"
                    onPress={onApply}
                    style={styles.applyBtn}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 16, 26, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  container: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    width: '100%',
    maxHeight: '85%',
    shadowColor: Palette.navy950,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  headerIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.pill,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: Palette.navy950,
  },
  subtitle: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: 1,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  btnPressed: {
    opacity: 0.7,
  },
  contentScroll: {
    maxHeight: 460,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingTitle: {
    ...Typography.h3,
    color: Palette.navy950,
    marginTop: Spacing.md,
  },
  loadingDesc: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  errorTitle: {
    ...Typography.h3,
    color: Palette.error700,
    marginTop: Spacing.xs,
  },
  errorDesc: {
    ...Typography.bodySmall,
    color: Palette.neutral700,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Palette.success50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  disclaimerText: {
    flex: 1,
    ...Typography.caption,
    color: Palette.success800,
    lineHeight: 16,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral100,
    backgroundColor: Palette.warmWhite,
  },
  secondaryContainer: {
    marginBottom: Spacing.sm,
  },
  primaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  applyBtn: {
    flex: 1,
  },
});
