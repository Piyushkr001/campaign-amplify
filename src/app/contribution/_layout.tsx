import React from 'react';
import { Stack } from 'expo-router';
import { Palette } from '@/constants/colors';

export default function ContributionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.warmWhite },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="[campaignId]" options={{ title: 'Choose Contribution' }} />
      <Stack.Screen name="review" options={{ title: 'Review Contribution' }} />
      <Stack.Screen name="payment" options={{ title: 'Payment' }} />
      <Stack.Screen name="success" options={{ title: 'Contribution Successful', gestureEnabled: false }} />
      <Stack.Screen name="failed" options={{ title: 'Payment Failed', gestureEnabled: false }} />
      <Stack.Screen name="receipt" options={{ title: 'Contribution Receipt' }} />
    </Stack>
  );
}
