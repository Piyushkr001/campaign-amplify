import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';

export interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const CampaignCardSkeleton: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  return (
    <View style={[styles.cardContainer, style]}>
      {/* Cover Image Skeleton */}
      <SkeletonBox height={180} borderRadius={BorderRadius.md} />

      <View style={styles.cardContent}>
        {/* Category & days badge row */}
        <View style={styles.rowBetween}>
          <SkeletonBox width={80} height={22} borderRadius={BorderRadius.pill} />
          <SkeletonBox width={70} height={16} />
        </View>

        {/* Title */}
        <SkeletonBox width="90%" height={24} style={styles.titleSpacing} />
        <SkeletonBox width="60%" height={24} style={styles.titleSpacing} />

        {/* Creator */}
        <SkeletonBox width="45%" height={16} style={styles.creatorSpacing} />

        {/* Progress Bar */}
        <SkeletonBox width="100%" height={8} borderRadius={4} style={styles.progressSpacing} />

        {/* Funding numbers */}
        <View style={styles.rowBetween}>
          <SkeletonBox width="35%" height={18} />
          <SkeletonBox width="35%" height={18} />
        </View>

        {/* Button */}
        <SkeletonBox width="100%" height={44} borderRadius={BorderRadius.md} style={styles.buttonSpacing} />
      </View>
    </View>
  );
};

export const LoadingSkeleton: React.FC<{ count?: number; style?: StyleProp<ViewStyle> }> = ({
  count = 2,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <CampaignCardSkeleton key={index} style={styles.skeletonItem} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  skeletonBase: {
    backgroundColor: Palette.neutral200,
  },
  cardContainer: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardContent: {
    padding: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleSpacing: {
    marginBottom: 6,
  },
  creatorSpacing: {
    marginBottom: Spacing.md,
  },
  progressSpacing: {
    marginBottom: Spacing.sm,
  },
  buttonSpacing: {
    marginTop: Spacing.md,
  },
  skeletonItem: {
    marginBottom: Spacing.md,
  },
});
