import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export function SessionErrorBanner() {
  const insets = useSafeAreaInsets();
  const { sessionError, hydrateAuth, clearSessionError, isLoading } = useAuthStore();

  if (!sessionError) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Spacing.xs) }]}>
      <View style={styles.contentRow}>
        <Ionicons name="cloud-offline-outline" size={20} color={Palette.warning700} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Unable to verify your session</Text>
          <Text style={styles.description}>{sessionError}</Text>
        </View>
        <Pressable
          onPress={clearSessionError}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss session error"
          style={styles.closeBtn}>
          <Ionicons name="close" size={18} color={Palette.neutral500} />
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => hydrateAuth()}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Retry session verification"
          style={({ pressed }) => [
            styles.retryBtn,
            pressed && styles.retryBtnPressed,
            isLoading && styles.retryBtnDisabled,
          ]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Palette.primary700} />
          ) : (
            <>
              <Ionicons name="refresh" size={14} color={Palette.primary700} />
              <Text style={styles.retryText}>Retry</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.warning50,
    borderBottomWidth: 1,
    borderBottomColor: Palette.warning200,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginTop: 2,
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.warning800,
  },
  description: {
    ...Typography.caption,
    color: Palette.neutral700,
    marginTop: 2,
  },
  closeBtn: {
    padding: 2,
    marginLeft: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.pureWhite,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Palette.warning200,
  },
  retryBtnPressed: {
    opacity: 0.8,
    backgroundColor: Palette.warning100,
  },
  retryBtnDisabled: {
    opacity: 0.6,
  },
  retryText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Palette.primary700,
  },
});
