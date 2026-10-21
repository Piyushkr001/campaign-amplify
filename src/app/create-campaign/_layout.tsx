import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Config } from '@/constants/config';
import { useAuthStore } from '@/store/auth-store';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CreateCampaignLayout() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  if (Config.useApi && isHydrated && (!isAuthenticated || user?.isGuest)) {
    return (
      <ScreenContainer scrollable={false} paddingHorizontal backgroundColor={Palette.warmWhite}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Palette.navy950} />
          </Pressable>
        </View>
        <EmptyState
          iconName="lock-closed-outline"
          title="Sign In Required"
          description="Sign in with your Campaign Amplify account to create and publish campaigns."
          actionTitle="Sign In"
          onAction={() => router.push('/auth/login')}
        />
      </ScreenContainer>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.warmWhite },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="basics" />
      <Stack.Screen name="story" />
      <Stack.Screen name="visuals" />
      <Stack.Screen name="reach" />
      <Stack.Screen name="submit" />
      <Stack.Screen name="success" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.neutral100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
