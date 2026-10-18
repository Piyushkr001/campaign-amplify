import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface ReportDisclaimerProps {
  isDemoData?: boolean;
}

export function ReportDisclaimer({ isDemoData = true }: ReportDisclaimerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <Ionicons name="information-circle-outline" size={18} color={Palette.primary700} />
        <Text style={styles.badgeTitle}>Methodology & Prototype Notice</Text>
      </View>
      <Text style={styles.text}>
        Estimated impressions use the prototype assumption of approximately 20–30 impressions per
        advertising dollar (85% advertising allocation).
      </Text>
      {isDemoData ? (
        <Text style={[styles.text, styles.demoText]}>
          These delivery metrics are seeded prototype data used to demonstrate campaign reporting.
          They are not connected to a live advertising provider.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.neutral50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  badgeTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
  },
  text: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 18,
    color: Palette.neutral600,
  },
  demoText: {
    marginTop: Spacing.xs,
    color: Palette.primary900,
    fontWeight: '500',
  },
});
