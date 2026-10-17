import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface ReviewSectionProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
}

export function ReviewSection({ title, badge, children }: ReviewSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badge: {
    backgroundColor: Palette.primary50,
    borderColor: Palette.primary100,
    borderWidth: 1,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary700,
  },
  body: {
    marginTop: 2,
  },
});
