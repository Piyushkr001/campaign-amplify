import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '@/constants/colors';
import { Layout, Spacing } from '@/constants/spacing';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  withSafeArea?: boolean;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
  keyboardAvoiding?: boolean;
  paddingHorizontal?: boolean | number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  withSafeArea = true,
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  backgroundColor = Palette.warmWhite,
  keyboardAvoiding = true,
  paddingHorizontal = true,
  contentContainerStyle,
  style,
  refreshing,
  onRefresh,
  header,
  footer,
}) => {
  const insets = useSafeAreaInsets();

  const safePaddingTop = withSafeArea && safeAreaEdges.includes('top') ? insets.top : 0;
  const safePaddingBottom = withSafeArea && safeAreaEdges.includes('bottom') ? insets.bottom : 0;
  const safePaddingLeft = withSafeArea && safeAreaEdges.includes('left') ? insets.left : 0;
  const safePaddingRight = withSafeArea && safeAreaEdges.includes('right') ? insets.right : 0;

  const horizontalPaddingVal =
    typeof paddingHorizontal === 'number'
      ? paddingHorizontal
      : paddingHorizontal
      ? Layout.screenPaddingHorizontal
      : 0;

  const containerInnerStyle: ViewStyle = {
    flex: 1,
    paddingTop: safePaddingTop,
    paddingBottom: safePaddingBottom,
    paddingLeft: safePaddingLeft,
    paddingRight: safePaddingRight,
    backgroundColor,
  };

  const bodyContent = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingHorizontal: horizontalPaddingVal,
          paddingBottom: Spacing.xxl + (safePaddingBottom > 0 ? 0 : Spacing.lg),
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.navy900}
            colors={[Palette.navy900]}
          />
        ) : undefined
      }>
      <View style={styles.contentWrapper}>{children}</View>
    </ScrollView>
  ) : (
    <View
      style={[
        styles.nonScrollContent,
        {
          paddingHorizontal: horizontalPaddingVal,
        },
        contentContainerStyle,
      ]}>
      <View style={styles.contentWrapper}>{children}</View>
    </View>
  );

  const containerContent = (
    <View style={[styles.root, containerInnerStyle, style]}>
      <StatusBar style="dark" />
      {header}
      {bodyContent}
      {footer}
    </View>
  );

  if (keyboardAvoiding && Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        {containerContent}
      </KeyboardAvoidingView>
    );
  }

  return containerContent;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  nonScrollContent: {
    flex: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    flex: 1,
  },
});
