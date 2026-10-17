import React from 'react';
import { Stack } from 'expo-router';
import { Palette } from '@/constants/colors';

export default function MyCampaignsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.warmWhite },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
