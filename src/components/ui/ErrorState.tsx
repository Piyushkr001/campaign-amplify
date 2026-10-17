import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { AppButton } from './AppButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = "We couldn't load the requested campaign information. Please check your connection and try again.",
  onRetry,
  retryText = 'Try Again',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={32} color={Palette.error600} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <View style={styles.actionContainer}>
          <AppButton
            title={retryText}
            onPress={onRetry}
            variant="primary"
            size="md"
            icon={<Ionicons name="refresh-outline" size={16} color={Palette.pureWhite} />}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.card,
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    marginVertical: Spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.error50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Palette.navy950,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.body,
    color: Palette.neutral500,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: Spacing.lg,
  },
});
