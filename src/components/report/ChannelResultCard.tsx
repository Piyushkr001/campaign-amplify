import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { CampaignChannelResult } from '@/types/campaign-report';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface ChannelResultCardProps {
  result: CampaignChannelResult;
}

export function ChannelResultCard({ result }: ChannelResultCardProps) {
  const getChannelIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram')) {
      return 'logo-instagram';
    }
    if (lower.includes('google') || lower.includes('display')) {
      return 'globe-outline';
    }
    if (lower.includes('youtube') || lower.includes('video')) {
      return 'logo-youtube';
    }
    if (lower.includes('newsletter') || lower.includes('email')) {
      return 'mail-outline';
    }
    return 'megaphone-outline';
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name={getChannelIcon(result.channel)} size={16} color={Palette.primary700} />
        </View>
        <Text style={styles.channelName} numberOfLines={1}>
          {result.channel}
        </Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Spend</Text>
          <Text style={styles.metricValue}>{formatCurrency(result.spend)}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Impressions</Text>
          <Text style={styles.metricValue}>{formatNumber(result.impressions)}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Clicks</Text>
          <Text style={styles.metricValue}>{formatNumber(result.clicks)}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>CTR</Text>
          <Text style={styles.metricValue}>{result.ctr.toFixed(2)}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.primary50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelName: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy950,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderColor: Palette.neutral100,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral400,
    textTransform: 'uppercase',
  },
  metricValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Palette.navy900,
    marginTop: 2,
  },
});
