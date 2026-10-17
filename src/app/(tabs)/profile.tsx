import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { BorderRadius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/store/auth-store';

import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user } = useAuthStore();

  const handleInfoModal = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'Close' }]);
  };

  const handleAuthPlaceholder = (action: string) => {
    Alert.alert(
      `${action} (Phase 2)`,
      'User accounts, authentication, and contributor dashboards are coming in a future release phase.',
      [{ text: 'Got It' }]
    );
  };

  const accountSections = [
    {
      title: 'Creator & Review Management',
      items: [
        {
          icon: 'folder-outline' as const,
          label: 'My Campaigns',
          subtitle: 'Manage drafts, review status, funding, and distribution',
          onPress: () => router.push('/my-campaigns'),
          badge: 'Creator',
        },
        {
          icon: 'shield-checkmark-outline' as const,
          label: 'Reviewer Demo',
          subtitle: 'Internal prototype: inspect claims, approve, request changes',
          onPress: () => router.push('/reviewer'),
          badge: 'Demo Desk',
        },
        {
          icon: 'receipt-outline' as const,
          label: 'Backed Campaigns & Receipts',
          subtitle: 'View your contribution history and demo receipts',
          onPress: () => router.push('/(tabs)/activity'),
        },
      ],
    },
    {
      title: 'Platform Information',
      items: [
        {
          icon: 'information-circle-outline' as const,
          label: 'How Amplification Works',
          subtitle: 'Learn about community message distribution vs donations',
          onPress: () =>
            handleInfoModal(
              'How Amplification Works',
              'Campaign Amplify pools community funds exclusively for targeted digital ad placements to spread important public messages, research, and civic blueprints. Contributions directly buy impressions rather than donating cash.'
            ),
        },
        {
          icon: 'checkmark-circle-outline' as const,
          label: 'Verification & Editorial Standards',
          subtitle: 'Our vetting criteria for campaigns and citations',
          onPress: () =>
            handleInfoModal(
              'Editorial Standards',
              'Every campaign must cite verifiable public sources or peer-reviewed research. Reviewers inspect claims and ensure neutrality before any campaign enters funding.'
            ),
        },
        {
          icon: 'newspaper-outline' as const,
          label: 'Advertising Guidelines',
          subtitle: 'Content rules and publisher compliance standards',
          onPress: () =>
            handleInfoModal(
              'Advertising Guidelines',
              'All ads must adhere to ad network policies (Meta, Google Display). Deceptive claims, harassment, or commercial solicitations disguised as public messages are strictly rejected.'
            ),
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          icon: 'help-circle-outline' as const,
          label: 'Help & FAQ',
          subtitle: 'Frequently asked questions about backing and reach',
          onPress: () =>
            handleInfoModal(
              'Help & FAQ',
              'Q: Can I get a refund? A: Refund handling is represented in the lifecycle model but is not processed by a real payment provider in this prototype.'
            ),
        },
        {
          icon: 'lock-closed-outline' as const,
          label: 'Privacy Policy & Terms',
          subtitle: 'How we handle data and contributor privacy',
          onPress: () =>
            handleInfoModal(
              'Privacy & Terms',
              'This prototype does not persist card numbers, expiry dates, or CVVs. Payment fields are used only during local simulated checkout.'
            ),
        },
      ],
    },
  ];

  return (
    <ScreenContainer scrollable paddingHorizontal backgroundColor={Palette.warmWhite}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Guest Mode Card */}
      <View style={styles.guestCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={Palette.navy700} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Guest Contributor'}</Text>
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>GUEST MODE</Text>
            </View>
          </View>
        </View>

        <Text style={styles.guestDescription}>
          Sign in or create an account to manage your campaigns, track backed message distribution, and
          save campaigns for later.
        </Text>

        <View style={styles.authButtonsRow}>
          <AppButton
            title="Sign In"
            onPress={() => handleAuthPlaceholder('Sign In')}
            variant="primary"
            size="md"
            style={styles.authBtn}
          />
          <AppButton
            title="Create Account"
            onPress={() => handleAuthPlaceholder('Create Account')}
            variant="secondary"
            size="md"
            style={styles.authBtn}
          />
        </View>
      </View>

      {/* Menu Settings Sections */}
      {accountSections.map((section, idx) => (
        <View key={idx} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.menuCard}>
            {section.items.map((item, itemIdx) => (
              <Pressable
                key={itemIdx}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  itemIdx < section.items.length - 1 && styles.menuItemBorder,
                  pressed && styles.itemPressed,
                ]}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={18} color={Palette.navy800} />
                </View>
                <View style={styles.menuTextContainer}>
                  <View style={styles.menuLabelRow}>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    {'badge' in item && item.badge ? (
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.menuItemSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Palette.neutral400} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* App Version & Non-Donation Disclaimer */}
      <View style={styles.footerNote}>
        <Text style={styles.versionText}>Campaign Amplification Platform v1.0.0 (Phase 1)</Text>
        <Text style={styles.legalDisclaimer}>
          Amplify facilitates collective advertising and public message distribution. Contributions
          are allocated toward paid media distribution and do not constitute direct donations to
          individuals or charitable organizations.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Palette.navy950,
  },
  guestCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Typography.h2,
    fontSize: 18,
    color: Palette.navy950,
    marginBottom: 2,
  },
  guestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.neutral100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  guestBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral600,
  },
  guestDescription: {
    ...Typography.bodySmall,
    color: Palette.neutral600,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  authBtn: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.label,
    color: Palette.neutral500,
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: Palette.pureWhite,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  itemPressed: {
    backgroundColor: Palette.neutral50,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  menuLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  itemBadge: {
    backgroundColor: Palette.primary50,
    borderColor: Palette.primary100,
    borderWidth: 1,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  itemBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Palette.primary700,
    textTransform: 'uppercase',
  },
  menuItemLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Palette.navy950,
  },
  menuItemSub: {
    ...Typography.caption,
    color: Palette.neutral500,
  },
  footerNote: {
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  versionText: {
    ...Typography.caption,
    color: Palette.neutral400,
    fontWeight: '600',
    marginBottom: 6,
  },
  legalDisclaimer: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: Palette.neutral400,
    textAlign: 'center',
    maxWidth: 320,
  },
});
