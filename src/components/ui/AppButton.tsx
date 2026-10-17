import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  enableHaptics?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  enableHaptics = true,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getContainerStyle = (pressed: boolean): StyleProp<ViewStyle> => {
    return [
      styles.base,
      fullWidth && styles.fullWidth,
      size === 'sm' && styles.sizeSm,
      size === 'md' && styles.sizeMd,
      size === 'lg' && styles.sizeLg,
      variant === 'primary' && styles.variantPrimary,
      variant === 'secondary' && styles.variantSecondary,
      variant === 'outline' && styles.variantOutline,
      variant === 'ghost' && styles.variantGhost,
      variant === 'danger' && styles.variantDanger,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
      style,
    ];
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    return [
      styles.textBase,
      size === 'sm' ? Typography.buttonSmall : Typography.button,
      variant === 'primary' && styles.textPrimary,
      variant === 'secondary' && styles.textSecondary,
      variant === 'outline' && styles.textOutline,
      variant === 'ghost' && styles.textGhost,
      variant === 'danger' && styles.textDanger,
      textStyle,
    ];
  };

  const getIndicatorColor = (): string => {
    switch (variant) {
      case 'secondary':
      case 'outline':
      case 'ghost':
        return Palette.navy900;
      case 'danger':
      case 'primary':
      default:
        return Palette.pureWhite;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={accessibilityLabel || title}
      style={({ pressed }) => getContainerStyle(pressed)}>
      {loading ? (
        <ActivityIndicator size="small" color={getIndicatorColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  sizeSm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    minHeight: 36,
  },
  sizeMd: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  sizeLg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 52,
  },
  variantPrimary: {
    backgroundColor: Palette.navy900,
  },
  variantSecondary: {
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Palette.neutral300,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  variantDanger: {
    backgroundColor: Palette.error600,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  textBase: {
    textAlign: 'center',
  },
  textPrimary: {
    color: Palette.pureWhite,
  },
  textSecondary: {
    color: Palette.navy900,
  },
  textOutline: {
    color: Palette.navy900,
  },
  textGhost: {
    color: Palette.navy800,
  },
  textDanger: {
    color: Palette.pureWhite,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.xs,
  },
});
