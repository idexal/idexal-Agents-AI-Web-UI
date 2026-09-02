/**
 * Theme-aware styling hooks for Idexal Agents.
 * Provides utilities for creating theme-aware components.
 */

import { useMemo } from 'react'
import { useTheme } from './DarkMode.ts'

/** Light theme colors */
const LIGHT_COLORS = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#dbeafe',
  secondary: '#6b7280',
  secondaryLight: '#f3f4f6',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#06b6d4',
  infoLight: '#cffafe',
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
}

/** Dark theme colors */
const DARK_COLORS = {
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  primaryLight: '#1e3a5f',
  secondary: '#94a3b8',
  secondaryLight: '#334155',
  success: '#34d399',
  successLight: '#064e3b',
  warning: '#fbbf24',
  warningLight: '#451a03',
  error: '#f87171',
  errorLight: '#450a0a',
  info: '#22d3ee',
  infoLight: '#083344',
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  borderLight: '#1e293b',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
}

export type ThemeColors = typeof LIGHT_COLORS

/**
 * Hook to get current theme colors.
 */
export function useThemeColors(): ThemeColors {
  const { resolvedTheme } = useTheme()
  return useMemo(
    () => (resolvedTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS),
    [resolvedTheme]
  )
}

/**
 * Hook to get theme-aware styles.
 */
export function useThemeStyles() {
  const { resolvedTheme } = useTheme()
  const colors = useThemeColors()
  const isDark = resolvedTheme === 'dark'

  const styles = useMemo(
    () => ({
      isDark,
      colors,

      // Card styles
      card: {
        background: colors.bgPrimary,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: isDark ? colors.shadowMd : colors.shadow,
      } as React.CSSProperties,

      cardHover: {
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: colors.shadowMd,
        cursor: 'pointer',
        transition: 'all 0.2s',
      } as React.CSSProperties,

      // Button styles
      buttonPrimary: {
        background: colors.primary,
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 16px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.2s',
      } as React.CSSProperties,

      buttonSecondary: {
        background: colors.bgSecondary,
        color: colors.textPrimary,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '10px 16px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
      } as React.CSSProperties,

      buttonDanger: {
        background: colors.error,
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 16px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.2s',
      } as React.CSSProperties,

      // Input styles
      input: {
        background: colors.bgPrimary,
        color: colors.textPrimary,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
      } as React.CSSProperties,

      inputFocus: {
        background: colors.bgPrimary,
        color: colors.textPrimary,
        border: `2px solid ${colors.primary}`,
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '14px',
        outline: 'none',
      } as React.CSSProperties,

      // Text styles
      textPrimary: {
        color: colors.textPrimary,
        fontWeight: 500,
      } as React.CSSProperties,

      textSecondary: {
        color: colors.textSecondary,
      } as React.CSSProperties,

      textMuted: {
        color: colors.textMuted,
        fontSize: '13px',
      } as React.CSSProperties,

      // Badge styles
      badgeSuccess: {
        background: colors.successLight,
        color: colors.success,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
      } as React.CSSProperties,

      badgeWarning: {
        background: colors.warningLight,
        color: colors.warning,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
      } as React.CSSProperties,

      badgeError: {
        background: colors.errorLight,
        color: colors.error,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
      } as React.CSSProperties,

      // Divider
      divider: {
        height: '1px',
        background: colors.border,
        margin: '16px 0',
      } as React.CSSProperties,

      // Container
      container: {
        background: colors.bgPrimary,
        color: colors.textPrimary,
        minHeight: '100vh',
      } as React.CSSProperties,

      // Sidebar
      sidebar: {
        background: isDark ? colors.bgSecondary : colors.bgPrimary,
        borderRight: `1px solid ${colors.border}`,
      } as React.CSSProperties,
    }),
    [isDark, colors]
  )

  return styles
}

/**
 * Hook to create a theme-aware style with light/dark variants.
 */
export function useThemeVariant<T>(lightVariant: T, darkVariant: T): T {
  const { resolvedTheme } = useTheme()
  return useMemo(
    () => (resolvedTheme === 'dark' ? darkVariant : lightVariant),
    [resolvedTheme, lightVariant, darkVariant]
  )
}

/**
 * Hook to check if current theme is dark.
 */
export function useIsDarkMode(): boolean {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === 'dark'
}

/**
 * Hook to get theme-aware CSS class name.
 */
export function useThemeClass(baseClass: string): string {
  const { resolvedTheme } = useTheme()
  return `${baseClass} ${resolvedTheme}`
}

export default useThemeStyles
