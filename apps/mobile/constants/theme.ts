import { tokens } from '@chopfast/ui';

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
    success: tokens.semantic.success,
    warning: tokens.semantic.warning,
    error: tokens.semantic.error,
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
