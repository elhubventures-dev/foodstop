import { tokens } from '@chopfast/ui';

export const Colors = {
  light: {
    text: tokens.colors.neutrals.textPrimary,
    background: tokens.colors.neutrals.bg,
    tint: tokens.colors.primary.main,
    icon: tokens.colors.neutrals.textSecondary,
    tabIconDefault: tokens.colors.neutrals.textMuted,
    tabIconSelected: tokens.colors.primary.main,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tokens.colors.primary.light,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tokens.colors.primary.light,
  },
} as const;

export const Fonts = {
  rounded: tokens.typography.fonts.body,
  mono: tokens.typography.fonts.mono,
} as const;

export const Theme = {
  colors: {
    primary: tokens.colors.primary.main,
    primaryLight: tokens.colors.primary.light,
    primaryDark: tokens.colors.primary.dark,
    secondary: tokens.colors.secondary.main,
    accent: tokens.colors.accent.main,
    background: tokens.colors.neutrals.bg,
    surface: tokens.colors.neutrals.surface,
    text: tokens.colors.neutrals.textPrimary,
    textSecondary: tokens.colors.neutrals.textSecondary,
    textMuted: tokens.colors.neutrals.textMuted,
    border: tokens.colors.neutrals.border,
    success: tokens.colors.semantic.success,
    warning: tokens.colors.semantic.warning,
    error: tokens.colors.semantic.error,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  }
};


