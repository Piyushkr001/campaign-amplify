import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  buttonSmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
} as const;
