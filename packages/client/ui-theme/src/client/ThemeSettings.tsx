/**
 * Theme Settings Panel for Idexal Agents.
 * Comprehensive appearance customization interface.
 */

import React, { useState } from 'react'
import { useTheme, type Theme } from './DarkMode.ts'

/** Labels for the theme settings */
const THEME_LABELS = {
  en: {
    title: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    lightDesc: 'Use light theme',
    darkDesc: 'Use dark theme',
    systemDesc: 'Follow system preference',
    fontSize: 'Font Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    preview: 'Preview',
    previewText: 'The quick brown fox jumps over the lazy dog',
    accentColor: 'Accent Color',
    sidebar: 'Sidebar',
    sidebarBackground: 'Sidebar Background',
    compactMode: 'Compact Mode',
    compactDesc: 'Reduce spacing and padding',
    animations: 'Animations',
    animationsDesc: 'Enable smooth transitions',
    highContrast: 'High Contrast',
    highContrastDesc: 'Increase contrast for better visibility',
  },
  ar: {
    title: 'المظهر',
    theme: 'السمة',
    light: 'فاتح',
    dark: 'مظلم',
    system: 'النظام',
    lightDesc: 'استخدام السمة الفاتحة',
    darkDesc: 'استخدام السمة المظلمة',
    systemDesc: 'اتباع تفضيلات النظام',
    fontSize: 'حجم الخط',
    small: 'صغير',
    medium: 'متوسط',
    large: 'كبير',
    preview: 'معاينة',
    previewText: 'الثعلب البني السريع يقفز فوق الكلب الكسول',
    accentColor: 'لون التمييز',
    sidebar: 'الشريط الجانبي',
    sidebarBackground: 'خلفية الشريط الجانبي',
    compactMode: 'الوضع المدمج',
    compactDesc: 'تقليل المسافات والحشو',
    animations: 'الحركات',
    animationsDesc: 'تفعيل الانتقالات السلسة',
    highContrast: 'تباين عالي',
    highContrastDesc: 'زيادة التباين لرؤية أفضل',
  },
  zh: {
    title: '外观',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    system: '系统',
    lightDesc: '使用浅色主题',
    darkDesc: '使用深色主题',
    systemDesc: '跟随系统偏好',
    fontSize: '字体大小',
    small: '小',
    medium: '中',
    large: '大',
    preview: '预览',
    previewText: '快速的棕色狐狸跳过了懒狗',
    accentColor: '强调色',
    sidebar: '侧边栏',
    sidebarBackground: '侧边栏背景',
    compactMode: '紧凑模式',
    compactDesc: '减少间距和内边距',
    animations: '动画',
    animationsDesc: '启用平滑过渡',
    highContrast: '高对比度',
    highContrastDesc: '增加对比度以提高可见性',
  },
}

/** Accent color options */
const ACCENT_COLORS = [
  { name: 'Blue', value: '#3b82f6', light: '#dbeafe', dark: '#1e3a5f' },
  { name: 'Purple', value: '#8b5cf6', light: '#ede9fe', dark: '#3b0764' },
  { name: 'Pink', value: '#ec4899', light: '#fce7f3', dark: '#831843' },
  { name: 'Red', value: '#ef4444', light: '#fee2e2', dark: '#7f1d1d' },
  { name: 'Orange', value: '#f97316', light: '#ffedd5', dark: '#7c2d12' },
  { name: 'Yellow', value: '#eab308', light: '#fef9c3', dark: '#713f12' },
  { name: 'Green', value: '#22c55e', light: '#dcfce7', dark: '#14532d' },
  { name: 'Teal', value: '#14b8a6', light: '#ccfbf1', dark: '#134e4a' },
]

export interface ThemeSettingsProps {
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Callback when settings change */
  onChange?: (settings: ThemeSettingsState) => void
}

export interface ThemeSettingsState {
  theme: Theme
  fontSize: number
  accentColor: string
  compactMode: boolean
  animations: boolean
  highContrast: boolean
}

/**
 * Theme Settings Panel Component.
 */
export function ThemeSettings({
  language = 'en',
  onChange,
}: ThemeSettingsProps) {
  const labels = THEME_LABELS[language] ?? THEME_LABELS.en
  const { theme, setTheme } = useTheme()

  const [fontSize, setFontSize] = useState(14)
  const [accentColor, setAccentColor] = useState('#3b82f6')
  const [compactMode, setCompactMode] = useState(false)
  const [animations, setAnimations] = useState(true)
  const [highContrast, setHighContrast] = useState(false)

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    onChange?.({
      theme: newTheme,
      fontSize,
      accentColor,
      compactMode,
      animations,
      highContrast,
    })
  }

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    document.documentElement.style.fontSize = `${size}px`
    onChange?.({
      theme,
      fontSize: size,
      accentColor,
      compactMode,
      animations,
      highContrast,
    })
  }

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    document.documentElement.style.setProperty('--color-accent', color)
    onChange?.({
      theme,
      fontSize,
      accentColor: color,
      compactMode,
      animations,
      highContrast,
    })
  }

  const containerStyle: React.CSSProperties = {
    padding: '24px',
    background: 'var(--color-bg-primary, #ffffff)',
    borderRadius: '12px',
    maxWidth: '480px',
    direction: language === 'ar' ? 'rtl' : 'ltr',
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text-primary, #111827)',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const themeOptionStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: isSelected
      ? 'var(--color-primary-light, #dbeafe)'
      : 'var(--color-bg-secondary, #f9fafb)',
    border: `2px solid ${isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flex: 1,
  })

  const fontSizeButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    background: isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-bg-secondary, #f9fafb)',
    color: isSelected ? '#ffffff' : 'var(--color-text-primary, #111827)',
    border: `1px solid ${isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  })

  const toggleStyle = (isChecked: boolean): React.CSSProperties => ({
    position: 'relative',
    width: '44px',
    height: '24px',
    background: isChecked ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  })

  const toggleKnobStyle = (isChecked: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '2px',
    left: isChecked ? '22px' : '2px',
    width: '20px',
    height: '20px',
    background: '#ffffff',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'left 0.2s',
  })

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-text-primary, #111827)' }}>
        {labels.title}
      </h2>

      {/* Theme Selection */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.theme}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={themeOptionStyle(theme === 'light')}
            onClick={() => handleThemeChange('light')}
          >
            <span style={{ fontSize: '24px' }}>☀️</span>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>{labels.light}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>{labels.lightDesc}</div>
            </div>
          </button>
          <button
            style={themeOptionStyle(theme === 'dark')}
            onClick={() => handleThemeChange('dark')}
          >
            <span style={{ fontSize: '24px' }}>🌙</span>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>{labels.dark}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>{labels.darkDesc}</div>
            </div>
          </button>
          <button
            style={themeOptionStyle(theme === 'system')}
            onClick={() => handleThemeChange('system')}
          >
            <span style={{ fontSize: '24px' }}>💻</span>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>{labels.system}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>{labels.systemDesc}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.fontSize}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={fontSizeButtonStyle(fontSize === 12)}
            onClick={() => handleFontSizeChange(12)}
          >
            <span style={{ fontSize: '12px' }}>A</span>
            {labels.small}
          </button>
          <button
            style={fontSizeButtonStyle(fontSize === 14)}
            onClick={() => handleFontSizeChange(14)}
          >
            <span style={{ fontSize: '14px' }}>A</span>
            {labels.medium}
          </button>
          <button
            style={fontSizeButtonStyle(fontSize === 16)}
            onClick={() => handleFontSizeChange(16)}
          >
            <span style={{ fontSize: '16px' }}>A</span>
            {labels.large}
          </button>
        </div>
      </div>

      {/* Accent Color */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.accentColor}</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: color.value,
                border: accentColor === color.value ? '3px solid var(--color-text-primary, #111827)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                transform: accentColor === color.value ? 'scale(1.1)' : 'scale(1)',
              }}
              onClick={() => handleAccentColorChange(color.value)}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>{labels.compactMode}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>{labels.compactDesc}</div>
          </div>
          <button
            style={toggleStyle(compactMode)}
            onClick={() => {
              setCompactMode(!compactMode)
              onChange?.({ theme, fontSize, accentColor, compactMode: !compactMode, animations, highContrast })
            }}
          >
            <div style={toggleKnobStyle(compactMode)} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>{labels.animations}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>{labels.animationsDesc}</div>
          </div>
          <button
            style={toggleStyle(animations)}
            onClick={() => {
              setAnimations(!animations)
              onChange?.({ theme, fontSize, accentColor, compactMode, animations: !animations, highContrast })
            }}
          >
            <div style={toggleKnobStyle(animations)} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>{labels.highContrast}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>{labels.highContrastDesc}</div>
          </div>
          <button
            style={toggleStyle(highContrast)}
            onClick={() => {
              setHighContrast(!highContrast)
              onChange?.({ theme, fontSize, accentColor, compactMode, animations, highContrast: !highContrast })
            }}
          >
            <div style={toggleKnobStyle(highContrast)} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.preview}</div>
        <div
          style={{
            padding: '16px',
            background: 'var(--color-bg-secondary, #f9fafb)',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #e5e7eb)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary, #111827)' }}>
            {labels.preview}
          </div>
          <div style={{ color: 'var(--color-text-secondary, #6b7280)', lineHeight: 1.6 }}>
            {labels.previewText}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '6px 12px',
                background: 'var(--color-primary, #3b82f6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Primary
            </button>
            <button
              style={{
                padding: '6px 12px',
                background: 'var(--color-success, #10b981)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Success
            </button>
            <button
              style={{
                padding: '6px 12px',
                background: 'var(--color-error, #ef4444)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Error
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSettings
