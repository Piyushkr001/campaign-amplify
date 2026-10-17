import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface AppInputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  placeholderTextColor = Palette.neutral400,
  editable = true,
  onFocus,
  onBlur,
  multiline,
  numberOfLines = 1,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error
    ? Palette.error500
    : isFocused
    ? Palette.primary600
    : Palette.neutral200;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          { borderColor },
          !editable && styles.disabledInput,
          multiline && { minHeight: numberOfLines * 24 + 20, alignItems: 'flex-start' },
        ]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          placeholderTextColor={placeholderTextColor}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          {...rest}
        />

        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy900,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.pureWhite,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  disabledInput: {
    backgroundColor: Palette.neutral100,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Palette.navy950,
    paddingVertical: Spacing.sm,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Palette.error600,
    marginTop: Spacing.xxs,
  },
  hintText: {
    ...Typography.caption,
    color: Palette.neutral500,
    marginTop: Spacing.xxs,
  },
});
