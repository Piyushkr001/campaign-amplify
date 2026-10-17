import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '@/constants/colors';
import { Typography } from '@/constants/typography';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 10);
  const tabHeight = 60 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary700,
        tabBarInactiveTintColor: Palette.neutral400,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabHeight,
            paddingBottom: bottomInset,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={typeof color === 'string' ? color : Palette.primary700}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore campaigns tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={22}
              color={typeof color === 'string' ? color : Palette.primary700}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarAccessibilityLabel: 'Create campaign tab',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.createIconBadge, focused && styles.createIconBadgeActive]}>
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={24}
                color={focused ? Palette.pureWhite : Palette.primary700}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarAccessibilityLabel: 'Campaign activity notifications tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={22}
              color={typeof color === 'string' ? color : Palette.primary700}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'User profile and settings tab',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={typeof color === 'string' ? color : Palette.primary700}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Palette.pureWhite,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral200,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabBarLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  createIconBadge: {
    padding: 2,
    borderRadius: 16,
  },
  createIconBadgeActive: {
    backgroundColor: Palette.primary700,
    borderRadius: 14,
    padding: 1,
  },
});
