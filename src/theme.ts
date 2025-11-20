export const COLORS = {
  primary: '#3A66FF',
  gold: '#E6C15A',
  red: '#D93B48',
  black: '#0F1218',
  white: '#FFFFFF',
  border: '#3A66FF',
  shadow: 'rgba(0,0,0,0.35)',
} as const;

export const CARD = {
  ratio: 1.6,
  borderWidth: 3,
  borderRadius: 18,
} as const;

export const SPACING = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
} as const;

export const palette = {
  light: {
    ...COLORS,
    background: '#FFFFFF',
    surface: '#F5F7FA',
    surfaceAlt: '#E8ECF5',
    surfaceMuted: '#D7DFEF',
    text: '#0F1218',
    textSecondary: '#6C727F',
    border: COLORS.primary,
  },
  dark: {
    ...COLORS,
    background: '#020617',
    surface: '#030712',
    surfaceAlt: '#111827',
    surfaceMuted: '#1E293B',
    text: '#FFFFFF',
    textSecondary: '#A0A6B1',
    border: COLORS.primary,
  },
} as const;

export type Theme = 'light' | 'dark' | 'auto';
export type ThemeColors = (typeof palette)[keyof typeof palette];
