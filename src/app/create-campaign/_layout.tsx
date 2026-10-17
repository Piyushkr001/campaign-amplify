import React from 'react';
import { Stack } from 'expo-router';
import { Palette } from '@/constants/colors';

export default function CreateCampaignLayout() {
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
