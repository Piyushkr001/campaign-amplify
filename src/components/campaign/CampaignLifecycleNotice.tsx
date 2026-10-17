import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CampaignStatus } from '@/types/campaign';
import { CAMPAIGN_STATUS_CONFIG } from '@/constants/campaign-status';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface CampaignLifecycleNoticeProps {
  status: CampaignStatus;
  note?: string;
}

export function CampaignLifecycleNotice({ status, note }: CampaignLifecycleNoticeProps) {
  const config = CAMPAIGN_STATUS_CONFIG[status];
  if (!config) return null;

  const getNoticeTheme = () => {
    switch (config.badgeVariant) {
      case 'success':
        return {
          icon: 'checkmark-circle-outline' as const,
          bg: Palette.success50,
          border: Palette.success100,
          iconColor: Palette.success700,
          textColor: Palette.success800,
        };
      case 'warning':
        return {
          icon: 'alert-circle-outline' as const,
          bg: Palette.amber50,
          border: Palette.amber200,
          iconColor: Palette.amber700,
          textColor: Palette.amber900,
        };
      case 'error':
        return {
          icon: 'close-circle-outline' as const,
          bg: Palette.error50,
          border: Palette.error200,
          iconColor: Palette.error600,
          textColor: Palette.error700,
        };
      case 'purple':
        return {
          icon: 'radio-outline' as const,
          bg: '#F3E8FF',
          border: '#E9D5FF',
          iconColor: '#7E22CE',
          textColor: '#581C87',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle-outline' as const,
          bg: Palette.info50,
          border: Palette.info100,
          iconColor: Palette.info700,
          textColor: Palette.info800,
        };
    }
  };

  const theme = getNoticeTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Ionicons name={theme.icon} size={18} color={theme.iconColor} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.textColor }]}>{config.label}</Text>
        <Text style={[styles.desc, { color: theme.textColor }]}>
          {note || config.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  icon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
    fontSize: 12,
  },
  desc: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
});
