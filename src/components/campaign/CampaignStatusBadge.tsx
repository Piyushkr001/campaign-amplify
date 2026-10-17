import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CampaignStatus } from '@/types/campaign';
import { CAMPAIGN_STATUS_CONFIG } from '@/constants/campaign-status';
import { Palette } from '@/constants/colors';
import { BorderRadius } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function CampaignStatusBadge({
  status,
  size = 'md',
  style,
}: CampaignStatusBadgeProps) {
  const config = CAMPAIGN_STATUS_CONFIG[status] || {
    label: status,
    badgeVariant: 'neutral',
  };

  const getVariantStyles = () => {
    switch (config.badgeVariant) {
      case 'success':
        return {
          container: styles.badgeSuccess,
          text: styles.textSuccess,
          dot: styles.dotSuccess,
        };
      case 'warning':
        return {
          container: styles.badgeWarning,
          text: styles.textWarning,
          dot: styles.dotWarning,
        };
      case 'error':
        return {
          container: styles.badgeError,
          text: styles.textError,
          dot: styles.dotError,
        };
      case 'info':
        return {
          container: styles.badgeInfo,
          text: styles.textInfo,
          dot: styles.dotInfo,
        };
      case 'purple':
        return {
          container: styles.badgePurple,
          text: styles.textPurple,
          dot: styles.dotPurple,
        };
      case 'neutral':
      default:
        return {
          container: styles.badgeNeutral,
          text: styles.textNeutral,
          dot: styles.dotNeutral,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.baseBadge,
        size === 'sm' && styles.badgeSm,
        size === 'lg' && styles.badgeLg,
        vStyles.container,
        style,
      ]}>
      <View style={[styles.dot, vStyles.dot]} />
      <Text
        style={[
          styles.baseText,
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
          vStyles.text,
        ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  badgeLg: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  baseText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  textSm: {
    fontSize: 10,
  },
  textLg: {
    fontSize: 12,
  },

  // Variants
  badgeSuccess: {
    backgroundColor: Palette.success50,
    borderColor: Palette.success100,
    borderWidth: 1,
  },
  textSuccess: {
    color: Palette.success700,
  },
  dotSuccess: {
    backgroundColor: Palette.success600,
  },

  badgeWarning: {
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
    borderWidth: 1,
  },
  textWarning: {
    color: Palette.amber800,
  },
  dotWarning: {
    backgroundColor: Palette.amber600,
  },

  badgeError: {
    backgroundColor: Palette.error50,
    borderColor: Palette.error200,
    borderWidth: 1,
  },
  textError: {
    color: Palette.error700,
  },
  dotError: {
    backgroundColor: Palette.error600,
  },

  badgeInfo: {
    backgroundColor: Palette.info50,
    borderColor: Palette.info100,
    borderWidth: 1,
  },
  textInfo: {
    color: Palette.info700,
  },
  dotInfo: {
    backgroundColor: Palette.info600,
  },

  badgePurple: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E9D5FF',
    borderWidth: 1,
  },
  textPurple: {
    color: '#7E22CE',
  },
  dotPurple: {
    backgroundColor: '#9333EA',
  },

  badgeNeutral: {
    backgroundColor: Palette.neutral100,
    borderColor: Palette.neutral200,
    borderWidth: 1,
  },
  textNeutral: {
    color: Palette.neutral700,
  },
  dotNeutral: {
    backgroundColor: Palette.neutral500,
  },
});
