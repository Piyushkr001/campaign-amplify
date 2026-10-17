import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Palette } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {actionText && onActionPress && (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionText}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}>
          <Text style={styles.actionText}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    color: Palette.navy950,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Palette.neutral500,
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionPressed: {
    opacity: 0.6,
  },
  actionText: {
    ...Typography.buttonSmall,
    color: Palette.primary600,
    fontWeight: '600',
  },
});
