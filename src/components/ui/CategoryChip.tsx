import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  selected,
  onPress,
  iconName,
  count,
  style,
}) => {
  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Category ${label}${count !== undefined ? `, ${count} campaigns` : ''}`}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && styles.chipPressed,
        style,
      ]}>
      {iconName && (
        <Ionicons
          name={iconName}
          size={15}
          color={selected ? Palette.pureWhite : Palette.navy700}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelUnselected,
        ]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.badge, selected ? styles.badgeSelected : styles.badgeUnselected]}>
          <Text style={[styles.badgeText, selected ? styles.badgeTextSelected : styles.badgeTextUnselected]}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    marginRight: Spacing.xs,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: Palette.pureWhite,
    borderColor: Palette.neutral200,
  },
  chipSelected: {
    backgroundColor: Palette.navy900,
    borderColor: Palette.navy900,
  },
  chipPressed: {
    opacity: 0.8,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  labelUnselected: {
    color: Palette.navy800,
  },
  labelSelected: {
    color: Palette.pureWhite,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
  },
  badgeUnselected: {
    backgroundColor: Palette.neutral100,
  },
  badgeSelected: {
    backgroundColor: Palette.navy700,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextUnselected: {
    color: Palette.neutral600,
  },
  badgeTextSelected: {
    color: Palette.pureWhite,
  },
});
