import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Palette } from '@/constants/colors';
import { BorderRadius } from '@/constants/spacing';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = Palette.primary600,
  trackColor = Palette.neutral200,
  style,
  accessibilityLabel,
}) => {
  const clamped = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      accessibilityLabel={accessibilityLabel || `${Math.round(clamped)}% funded`}
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: height / 2,
        },
        style,
      ]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.pill,
  },
});
