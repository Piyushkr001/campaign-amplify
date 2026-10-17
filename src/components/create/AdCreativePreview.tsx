import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface AdCreativePreviewProps {
  imageUri?: string | null;
  headline: string;
  description: string;
  ctaText?: string;
  sponsorName?: string;
}

export const AdCreativePreview: React.FC<AdCreativePreviewProps> = ({
  imageUri,
  headline,
  description,
  ctaText = 'Learn More',
  sponsorName = 'Amplify Partner Network',
}) => {
  return (
    <View style={styles.container}>
      {/* Network Header */}
      <View style={styles.headerRow}>
        <View style={styles.sponsorRow}>
          <View style={styles.sponsorBadge}>
            <Ionicons name="megaphone" size={10} color={Palette.pureWhite} />
          </View>
          <View>
            <Text style={styles.sponsorLabel}>SPONSORED COMMUNITY MESSAGE</Text>
            <Text style={styles.sponsorSource}>{sponsorName}</Text>
          </View>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color={Palette.neutral400} />
      </View>

      {/* Creative Media */}
      <View style={styles.mediaContainer}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderMedia}>
            <Ionicons name="image-outline" size={32} color={Palette.neutral400} />
            <Text style={styles.placeholderText}>No Ad Creative Visual Selected</Text>
          </View>
        )}
      </View>

      {/* Copy & CTA Bottom Bar */}
      <View style={styles.body}>
        <View style={styles.copyArea}>
          <Text style={styles.headline} numberOfLines={2}>
            {headline || 'Your Ad Headline Will Appear Here'}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {description || 'Summary description of the message and call to awareness.'}
          </Text>
        </View>

        <View style={styles.ctaButtonWrapper}>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>{ctaText}</Text>
            <Ionicons name="arrow-forward" size={12} color={Palette.pureWhite} />
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.footerDisclaimer}>
        <Text style={styles.disclaimerText}>
          Illustrative placement preview. Final creative formatting adapts to Meta, Google, and partner networks.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
    backgroundColor: Palette.warmWhite,
  },
  sponsorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sponsorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Palette.primary700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorLabel: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.primary700,
    letterSpacing: 0.5,
  },
  sponsorSource: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral600,
  },
  mediaContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Palette.neutral100,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderMedia: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.neutral100,
    gap: 6,
  },
  placeholderText: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  body: {
    padding: Spacing.md,
    backgroundColor: Palette.pureWhite,
  },
  copyArea: {
    marginBottom: Spacing.sm,
  },
  headline: {
    ...Typography.h3,
    fontSize: 15,
    color: Palette.navy950,
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    lineHeight: 18,
  },
  ctaButtonWrapper: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.primary700,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
  },
  ctaText: {
    ...Typography.buttonSmall,
    fontSize: 12,
    color: Palette.pureWhite,
    fontWeight: '700',
  },
  footerDisclaimer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Palette.neutral50,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral100,
  },
  disclaimerText: {
    ...Typography.caption,
    fontSize: 10,
    color: Palette.neutral500,
    lineHeight: 14,
  },
});
