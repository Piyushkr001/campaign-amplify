import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface ReportMetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  badge?: string;
  accent?: boolean;
}

export function ReportMetricCard({
  label,
  value,
  subValue,
  badge,
  accent = false,
}: ReportMetricCardProps) {
  return (
    <View style={[styles.card, accent && styles.accentCard]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
      {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
  },
  accentCard: {
    backgroundColor: Palette.primary50,
    borderColor: Palette.primary200,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Palette.neutral500,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.neutral600,
  },
  value: {
    ...Typography.h3,
    fontSize: 18,
    color: Palette.navy950,
  },
  accentValue: {
    color: Palette.primary800,
  },
  subValue: {
    ...Typography.caption,
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 2,
  },
});
