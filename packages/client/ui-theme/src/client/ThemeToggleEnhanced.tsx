/**
 * Enhanced Theme Toggle for Idexal Agents.
 * Beautiful, animated theme toggle with system preference detection.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useDarkMode, type Theme } from './DarkModeEnhanced.ts'

/** Labels */
const TOGGLE_LABELS = {
  en: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    toggleTheme: 'Toggle theme',
    systemMode: 'System mode',
    currentTheme: 'Current theme',
  },
  ar: {
    light: 'فاتح',
    dark: 'مظلم',
    system: 'النظام',
    toggleTheme: 'تبديل المظهر',
    systemMode: 'وضع النظام',
    currentTheme: 'المظهر الحالي',
  },
  zh: {
    light: '浅色',
    dark: '深色',
    system: '系统',
    toggleTheme: '切换主题',
    systemMode: '系统模式',
    currentTheme: '当前主题',
  },
}

export interface ThemeToggleEnhancedProps {
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Toggle style */
  style?: 'dropdown' | 'pill' | 'icon' | 'list'
  /** Show label */
  showLabel?: boolean
  /** Show system option */
  showSystemOption?: boolean
  /** Compact mode */
  compact?: boolean
  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void
}

/**
 * Enhanced Theme Toggle Component.
 */
export function ThemeToggleEnhanced({
  language = 'en',
  style = 'dropdown',
  showLabel = true,
  showSystemOption = true,
  compact = false,
  onThemeChange,
}: ThemeToggleEnhancedProps) {
  const labels = TOGGLE_LABELS[language] ?? TOGGLE_LABELS.en
  const { theme, resolvedTheme, setTheme, toggleTheme, isSystemDark } = useDarkMode()
  
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeSelect = (newTheme: Theme) => {
    setTheme(newTheme)
    setIsOpen(false)
    onThemeChange?.(newTheme)
  }

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: labels.light, icon: <SunIcon /> },
    { value: 'dark', label: labels.dark, icon: <MoonIcon /> },
    ...(showSystemOption ? [{ value: 'system' as Theme, label: labels.system, icon: <SystemIcon /> }] : []),
  ]

  const currentTheme = themes.find(t => t.value === theme) ?? themes[0]!

  // Icon-only style
  if (style === 'icon' || compact) {
    return (
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={toggleTheme}
          aria-label={labels.toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: compact ? '32px' : '40px',
            height: compact ? '32px' : '40px',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #e5e7eb)',
            background: 'var(--color-bg-secondary, #f9fafb)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: compact ? '16px' : '20px' }}>
            {resolvedTheme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>
      </div>
    )
  }

  // Pill style
  if (style === 'pill') {
    return (
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--color-bg-secondary, #f3f4f6)',
          borderRadius: '24px',
          padding: '4px',
          border: '1px solid var(--color-border, #e5e7eb)',
        }}
      >
        {themes.map(t => (
          <button
            key={t.value}
            onClick={() => handleThemeSelect(t.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              background: theme === t.value ? 'var(--color-bg-primary, #ffffff)' : 'transparent',
              color: theme === t.value ? 'var(--color-text-primary, #111827)' : 'var(--color-text-secondary, #6b7280)',
              boxShadow: theme === t.value ? 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '14px' }}>{t.icon}</span>
            {showLabel && <span>{t.label}</span>}
          </button>
        ))}
      </div>
    )
  }

  // List style
  if (style === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {themes.map(t => (
          <button
            key={t.value}
            onClick={() => handleThemeSelect(t.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: theme === t.value ? '2px solid var(--color-primary, #3b82f6)' : '1px solid var(--color-border, #e5e7eb)',
              background: theme === t.value ? 'var(--color-primary-light, #dbeafe)' : 'var(--color-bg-primary, #ffffff)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '20px' }}>{t.icon}</span>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>
                {t.label}
              </div>
              {t.value === 'system' && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
                  {isSystemDark ? labels.dark : labels.light}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    )
  }

  // Dropdown style (default)
  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={labels.toggleTheme}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--color-border, #e5e7eb)',
          background: 'var(--color-bg-secondary, #f9fafb)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: '16px' }}>{currentTheme.icon}</span>
        {showLabel && (
          <span style={{ fontSize: '14px', color: 'var(--color-text-primary, #111827)' }}>
            {currentTheme.label}
          </span>
        )}
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--color-bg-primary, #ffffff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {themes.map(t => (
            <button
              key={t.value}
              onClick={() => handleThemeSelect(t.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: theme === t.value ? 'var(--color-bg-secondary, #f3f4f6)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{t.icon}</span>
              <span style={{ flex: 1, fontSize: '14px', color: 'var(--color-text-primary, #111827)' }}>
                {t.label}
              </span>
              {theme === t.value && <CheckIcon />}
              {t.value === 'system' && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #9ca3af)' }}>
                  ({isSystemDark ? labels.dark : labels.light})
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Sun Icon */
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

/** Moon Icon */
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/** System Icon */
function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

/** Check Icon */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/** Chevron Icon */
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
        transition: 'transform 0.2s',
        color: 'var(--color-text-muted, #9ca3af)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default ThemeToggleEnhanced
