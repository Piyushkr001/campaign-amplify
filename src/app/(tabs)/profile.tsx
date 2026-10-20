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
  const { user, isAuthenticated, signOut } = useAuthStore();
  const isGuest = !isAuthenticated || !user || user.isGuest;
  const isReviewerOrAdmin = user?.role === 'REVIEWER' || user?.role === 'ADMIN';

  const handleInfoModal = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: 'Close' }]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  // Build management items conditionally:
  // Reviewer Demo is strictly hidden from normal USERs (Requirement 45)
  const managementItems = [
    {
      icon: 'folder-outline' as const,
      label: 'My Campaigns',
      subtitle: 'Manage drafts, review status, funding, and distribution',
      onPress: () => {
        if (isGuest) {
          router.push('/auth/login');
        } else {
          router.push('/my-campaigns');
        }
      },
      badge: 'Creator',
    },
    ...(isReviewerOrAdmin
      ? [
          {
            icon: 'shield-checkmark-outline' as const,
            label: 'Reviewer Queue',
            subtitle: 'Inspect claims, approve, request changes, start funding',
            onPress: () => router.push('/reviewer'),
            badge: user?.role === 'ADMIN' ? 'Admin' : 'Reviewer',
          },
        ]
      : []),
    {
      icon: 'receipt-outline' as const,
      label: 'Backed Campaigns & Receipts',
      subtitle: 'View your contribution history and demo receipts',
      onPress: () => {
        if (isGuest) {
          router.push('/auth/login');
        } else {
          router.push('/(tabs)/activity');
        }
      },
    },
  ];

  const accountSections = [
    {
      title: 'Creator & Review Management',
      items: managementItems,
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

      {/* Account Card (Guest vs Authenticated) */}
      <View style={styles.guestCard}>
        <View style={styles.avatarRow}>
          <View
            style={[
              styles.avatarCircle,
              !isGuest && styles.avatarCircleAuth,
              user?.role === 'REVIEWER' && styles.avatarCircleReviewer,
              user?.role === 'ADMIN' && styles.avatarCircleAdmin,
            ]}>
            <Ionicons
              name={isGuest ? 'person' : 'person-circle'}
              size={28}
              color={
                isGuest
                  ? Palette.navy700
                  : user?.role === 'REVIEWER'
                  ? Palette.purple700
                  : user?.role === 'ADMIN'
                  ? Palette.amber800
                  : Palette.primary700
              }
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {isGuest ? 'Guest Contributor' : user?.displayName || user?.name || 'Campaign Contributor'}
            </Text>
            {isGuest ? (
              <View style={styles.guestBadge}>
                <Text style={styles.guestBadgeText}>GUEST MODE</Text>
              </View>
            ) : (
              <View style={styles.userRoleRow}>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View
                  style={[
                    styles.roleBadge,
                    user?.role === 'REVIEWER' && styles.roleBadgeReviewer,
                    user?.role === 'ADMIN' && styles.roleBadgeAdmin,
                  ]}>
                  <Text
                    style={[
                      styles.roleBadgeText,
                      user?.role === 'REVIEWER' && styles.roleBadgeTextReviewer,
                      user?.role === 'ADMIN' && styles.roleBadgeTextAdmin,
                    ]}>
                    {user?.role}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {isGuest ? (
          <>
            <Text style={styles.guestDescription}>
              Sign in or create an account to create campaigns, track backed message distribution, and
              access community tools.
            </Text>
            <View style={styles.authButtonsRow}>
              <AppButton
                title="Sign In"
                onPress={() => router.push('/auth/login')}
                variant="primary"
                size="md"
                style={styles.authBtn}
              />
              <AppButton
                title="Create Account"
                onPress={() => router.push('/auth/register')}
                variant="secondary"
                size="md"
                style={styles.authBtn}
              />
            </View>
          </>
        ) : (
          <View style={styles.authenticatedRow}>
            <AppButton
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              size="sm"
              style={styles.signOutBtn}
            />
          </View>
        )}
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
                      <View
                        style={[
                          styles.itemBadge,
                          item.badge === 'Reviewer' && styles.itemBadgeReviewer,
                          item.badge === 'Admin' && styles.itemBadgeAdmin,
                        ]}>
                        <Text
                          style={[
                            styles.itemBadgeText,
                            item.badge === 'Reviewer' && styles.itemBadgeTextReviewer,
                            item.badge === 'Admin' && styles.itemBadgeTextAdmin,
                          ]}>
                          {item.badge}
                        </Text>
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
        <Text style={styles.versionText}>Campaign Amplification Platform v1.1.0 (JWT + RBAC)</Text>
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
  avatarCircleAuth: {
    backgroundColor: Palette.primary50,
  },
  avatarCircleReviewer: {
    backgroundColor: Palette.purple50,
  },
  avatarCircleAdmin: {
    backgroundColor: Palette.amber50,
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
  userEmail: {
    fontSize: 12,
    color: Palette.neutral500,
  },
  userRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Palette.primary50,
    borderWidth: 1,
    borderColor: Palette.primary200,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.pill,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primary700,
  },
  roleBadgeReviewer: {
    backgroundColor: Palette.purple50,
    borderColor: Palette.purple200,
  },
  roleBadgeTextReviewer: {
    color: Palette.purple700,
  },
  roleBadgeAdmin: {
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
  },
  roleBadgeTextAdmin: {
    color: Palette.amber800,
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
  authenticatedRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signOutBtn: {
    minWidth: 100,
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
  itemBadgeReviewer: {
    backgroundColor: Palette.purple50,
    borderColor: Palette.purple200,
  },
  itemBadgeTextReviewer: {
    color: Palette.purple700,
  },
  itemBadgeAdmin: {
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
  },
  itemBadgeTextAdmin: {
    color: Palette.amber800,
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
