export const Palette = {
  // Deep Indigo / Navy
  navy950: '#0A0F1D',
  navy900: '#0F172A',
  navy800: '#1E293B',
  navy700: '#334155',
  navy600: '#475569',

  // Primary Accent (Indigo / Electric Blue)
  primary900: '#1E3A8A',
  primary800: '#1E40AF',
  primary700: '#1D4ED8',
  primary600: '#2563EB',
  primary500: '#3B82F6',
  primary100: '#DBEAFE',
  primary50: '#EFF6FF',

  // Neutrals / Surface
  pureWhite: '#FFFFFF',
  warmWhite: '#F8F9FA',
  neutral50: '#F8FAFC',
  neutral100: '#F1F5F9',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E1',
  neutral400: '#94A3B8',
  neutral500: '#64748B',
  neutral600: '#475569',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A',

  // Semantic
  success600: '#059669',
  success500: '#10B981',
  success100: '#D1FAE5',
  success50: '#ECFDF5',

  warning600: '#D97706',
  warning500: '#F59E0B',
  warning100: '#FEF3C7',
  warning50: '#FFFBEB',

  error600: '#DC2626',
  error500: '#EF4444',
  error100: '#FEE2E2',
  error50: '#FEF2F2',

  // Amplification Accent (Coral / Electric Gold)
  accentOrange: '#F97316',
  accentPurple: '#7C3AED',
  accentCyan: '#0EA5E9',
} as const;

export const Colors = {
  light: {
    // Brand
    primary: Palette.navy900,
    primaryLight: Palette.primary600,
    primarySubtle: Palette.primary50,
    accent: Palette.primary600,

    // Background & Surfaces
    background: Palette.warmWhite,
    surface: Palette.pureWhite,
    surfaceMuted: Palette.neutral100,
    surfaceElevated: Palette.pureWhite,
    card: Palette.pureWhite,

    // Text
    textPrimary: Palette.navy950,
    textSecondary: Palette.neutral500,
    textMuted: Palette.neutral400,
    textInverse: Palette.pureWhite,

    // Borders & Dividers
    border: Palette.neutral200,
    borderSubtle: Palette.neutral100,
    borderFocus: Palette.primary600,

    // Feedback
    success: Palette.success600,
    successBg: Palette.success50,
    warning: Palette.warning600,
    warningBg: Palette.warning50,
    error: Palette.error600,
    errorBg: Palette.error50,

    // Bottom Navigation
    tabBarBackground: Palette.pureWhite,
    tabBarBorder: Palette.neutral200,
    tabBarActive: Palette.primary700,
    tabBarInactive: Palette.neutral400,

    // Card & Shadow
    cardShadow: 'rgba(15, 23, 42, 0.06)',
    cardShadowHover: 'rgba(15, 23, 42, 0.12)',
  },
  dark: {
    // Brand
    primary: Palette.primary500,
    primaryLight: Palette.primary500,
    primarySubtle: Palette.navy800,
    accent: Palette.primary500,

    // Background & Surfaces
    background: Palette.navy950,
    surface: Palette.navy900,
    surfaceMuted: Palette.navy800,
    surfaceElevated: '#1A233A',
    card: Palette.navy900,

    // Text
    textPrimary: Palette.pureWhite,
    textSecondary: Palette.neutral400,
    textMuted: Palette.neutral500,
    textInverse: Palette.navy950,

    // Borders & Dividers
    border: Palette.navy700,
    borderSubtle: Palette.navy800,
    borderFocus: Palette.primary500,

    // Feedback
    success: Palette.success500,
    successBg: 'rgba(16, 185, 129, 0.15)',
    warning: Palette.warning500,
    warningBg: 'rgba(245, 158, 11, 0.15)',
    error: Palette.error500,
    errorBg: 'rgba(239, 68, 68, 0.15)',

    // Bottom Navigation
    tabBarBackground: Palette.navy900,
    tabBarBorder: Palette.navy800,
    tabBarActive: Palette.primary500,
    tabBarInactive: Palette.neutral500,

    // Card & Shadow
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    cardShadowHover: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export type ThemeColors = typeof Colors.light;
