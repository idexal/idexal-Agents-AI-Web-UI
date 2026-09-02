/**
 * Accessible Themes Settings Section for Idexal Agents.
 * Provides high contrast and color-blind safe theme selection with live preview.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAccessibleThemesEngine,
  type AccessibleThemeMode,
  type AccessibleThemeConfig,
  type ContrastCheckResult,
} from './AccessibleThemes'

type Language = 'en' | 'ar' | 'zh'

const T: Record<Language, Record<string, string>> = {
  en: {
    title: 'Accessible Themes',
    subtitle: 'High contrast and color-blind safe themes for better visibility',
    description: 'Choose a theme optimized for your visual needs. All themes meet WCAG 2.1 contrast requirements.',
    currentTheme: 'Current Theme',
    default: 'System Default',
    defaultDesc: 'Use the default Idexal theme',
    highContrastLight: 'High Contrast Light',
    highContrastLightDesc: 'Maximum contrast on light background (WCAG AAA)',
    highContrastDark: 'High Contrast Dark',
    highContrastDarkDesc: 'Maximum contrast on dark background (WCAG AAA)',
    protanopia: 'Protanopia Safe (Red-Blind)',
    protanopiaDesc: 'Optimized for users who cannot distinguish red and green',
    deuteranopia: 'Deuteranopia Safe (Green-Blind)',
    deuteranopiaDesc: 'Optimized for users who cannot distinguish green hues',
    tritanopia: 'Tritanopia Safe (Blue-Blind)',
    tritanopiaDesc: 'Optimized for users who cannot distinguish blue hues',
    highContrastProtanopia: 'High Contrast + Red-Blind',
    highContrastProtanopiaDesc: 'Maximum contrast with red-blind safe colors',
    highContrastDeuteranopia: 'High Contrast + Green-Blind',
    highContrastDeuteranopiaDesc: 'Maximum contrast with green-blind safe colors',
    highContrastTritanopia: 'High Contrast + Blue-Blind',
    highContrastTritanopiaDesc: 'Maximum contrast with blue-blind safe colors',
    contrastCheck: 'Contrast Check',
    ratio: 'Ratio',
    passesAA: 'Passes AA',
    passesAAA: 'Passes AAA',
    yes: 'Yes',
    no: 'No',
    score: 'Accessibility Score',
    preview: 'Preview',
    sampleText: 'Sample text on background',
    sampleSecondary: 'Secondary text',
    sampleMuted: 'Muted text',
    sampleLink: 'Link text',
    successLabel: 'Success',
    warningLabel: 'Warning',
    errorLabel: 'Error',
    infoLabel: 'Info',
    accentLabel: 'Accent',
    export: 'Export Theme CSS',
    autoDetect: 'Auto-detect system preferences',
    noTheme: 'No custom theme applied',
    applied: 'Applied',
    recommended: 'Recommended',
    colorBlindType: 'Color Blind Type',
    wcagLevel: 'WCAG Level',
    systemPref: 'System Preference',
    contrastRatios: 'Contrast Ratios',
    fgColor: 'Text',
    bgColor: 'Background',
  },
  ar: {
    title: 'سمات إمكانية الوصول',
    subtitle: 'سمات عالية التباين وآمنة لعمى الألوان لرؤية أفضل',
    description: 'اختر سمة محسّنة لاحتياجاتك البصرية. جميع السمات تلبي متطلبات تباين WCAG 2.1.',
    currentTheme: 'السمة الحالية',
    default: 'النظام الافتراضي',
    defaultDesc: 'استخدام سمة Idexal الافتراضية',
    highContrastLight: 'تباين عالي - فاتح',
    highContrastLightDesc: 'أقصى تباين على خلفية فاتحة (WCAG AAA)',
    highContrastDark: 'تباين عالي - داكن',
    highContrastDarkDesc: 'أقصى تباين على خلفية داكنة (WCAG AAA)',
    protanopia: 'آمن لـ Protanopia (عمى الأحمر)',
    protanopiaDesc: 'محسّن للمستخدمين الذين لا يستطيعون التمييز بين الأحمر والأخضر',
    deuteranopia: 'آمن لـ Deuteranopia (عمى الأخضر)',
    deuteranopiaDesc: 'محسّن للمستخدمين الذين لا يستطيعون التمييز بين درجات الخضر',
    tritanopia: 'آمن لـ Tritanopia (عمى الأزرق)',
    tritanopiaDesc: 'محسّن للمستخدمين الذين لا يستطيعون التمييز بين درجات الأزرق',
    highContrastProtanopia: 'تباين عالي + عمى الأحمر',
    highContrastProtanopiaDesc: 'أقصى تباين مع ألوان آمنة لعمى الأحمر',
    highContrastDeuteranopia: 'تباين عالي + عمى الأخضر',
    highContrastDeuteranopiaDesc: 'أقصى تباين مع ألوان آمنة لعمى الأخضر',
    highContrastTritanopia: 'تباين عالي + عمى الأزرق',
    highContrastTritanopiaDesc: 'أقصى تباين مع ألوان آمنة لعمى الأزرق',
    contrastCheck: 'فحص التباين',
    ratio: 'النسبة',
    passesAA: 'يتجاوز AA',
    passesAAA: 'يتجاوز AAA',
    yes: 'نعم',
    no: 'لا',
    score: 'نقاط إمكانية الوصول',
    preview: 'معاينة',
    sampleText: 'نص عينة على الخلفية',
    sampleSecondary: 'نص ثانوي',
    sampleMuted: 'نص باهت',
    sampleLink: 'نص الرابط',
    successLabel: 'نجاح',
    warningLabel: 'تحذير',
    errorLabel: 'خطأ',
    infoLabel: 'معلومات',
    accentLabel: 'تمييز',
    export: 'تصدير CSS السمة',
    autoDetect: 'الكشف التلقائي عن تفضيلات النظام',
    noTheme: 'لم يتم تطبيق سمة مخصصة',
    applied: 'تم التطبيق',
    recommended: 'موصى به',
    colorBlindType: 'نوع عمى الألوان',
    wcagLevel: 'مستوى WCAG',
    systemPref: 'تفضيل النظام',
    contrastRatios: 'نسب التباين',
    fgColor: 'النص',
    bgColor: 'الخلفية',
  },
  zh: {
    title: '无障碍主题',
    subtitle: '高对比度和色盲安全主题，提升可见性',
    description: '选择针对您的视觉需求优化的主题。所有主题满足 WCAG 2.1 对比度要求。',
    currentTheme: '当前主题',
    default: '系统默认',
    defaultDesc: '使用默认 Idexal 主题',
    highContrastLight: '高对比度 - 浅色',
    highContrastLightDesc: '浅色背景上的最大对比度 (WCAG AAA)',
    highContrastDark: '高对比度 - 深色',
    highContrastDarkDesc: '深色背景上的最大对比度 (WCAG AAA)',
    protanopia: '红色盲安全',
    protanopiaDesc: '为无法区分红色和绿色的用户优化',
    deuteranopia: '绿色盲安全',
    deuteranopiaDesc: '为无法区分绿色色调的用户优化',
    tritanopia: '蓝色盲安全',
    tritanopiaDesc: '为无法区分蓝色色调的用户优化',
    highContrastProtanopia: '高对比度 + 红色盲',
    highContrastProtanopiaDesc: '最大对比度配合红色盲安全颜色',
    highContrastDeuteranopia: '高对比度 + 绿色盲',
    highContrastDeuteranopiaDesc: '最大对比度配合绿色盲安全颜色',
    highContrastTritanopia: '高对比度 + 蓝色盲',
    highContrastTritanopiaDesc: '最大对比度配合蓝色盲安全颜色',
    contrastCheck: '对比度检查',
    ratio: '比率',
    passesAA: '通过 AA',
    passesAAA: '通过 AAA',
    yes: '是',
    no: '否',
    score: '无障碍评分',
    preview: '预览',
    sampleText: '背景上的示例文本',
    sampleSecondary: '次要文本',
    sampleMuted: '淡化文本',
    sampleLink: '链接文本',
    successLabel: '成功',
    warningLabel: '警告',
    errorLabel: '错误',
    infoLabel: '信息',
    accentLabel: '强调',
    export: '导出主题 CSS',
    autoDetect: '自动检测系统偏好',
    noTheme: '未应用自定义主题',
    applied: '已应用',
    recommended: '推荐',
    colorBlindType: '色盲类型',
    wcagLevel: 'WCAG 级别',
    systemPref: '系统偏好',
    contrastRatios: '对比度比率',
    fgColor: '文本',
    bgColor: '背景',
  },
}

/** Get display name for a theme */
function getThemeName(id: AccessibleThemeMode, _lang: Language, t: Record<string, string>): string {
  const nameMap: Record<AccessibleThemeMode, string> = {
    default: t['default'] ?? 'Default',
    'high-contrast-light': t['highContrastLight'] ?? 'High Contrast Light',
    'high-contrast-dark': t['highContrastDark'] ?? 'High Contrast Dark',
    protanopia: t['protanopia'] ?? 'Protanopia Safe',
    deuteranopia: t['deuteranopia'] ?? 'Deuteranopia Safe',
    tritanopia: t['tritanopia'] ?? 'Tritanopia Safe',
    'high-contrast-protanopia': t['highContrastProtanopia'] ?? 'High Contrast + Protanopia',
    'high-contrast-deuteranopia': t['highContrastDeuteranopia'] ?? 'High Contrast + Deuteranopia',
    'high-contrast-tritanopia': t['highContrastTritanopia'] ?? 'High Contrast + Tritanopia',
  }
  return nameMap[id] ?? id
}

/** Get description for a theme */
function getThemeDescription(id: AccessibleThemeMode, t: Record<string, string>): string {
  const descMap: Record<AccessibleThemeMode, string> = {
    default: t['defaultDesc'] ?? '',
    'high-contrast-light': t['highContrastLightDesc'] ?? '',
    'high-contrast-dark': t['highContrastDarkDesc'] ?? '',
    protanopia: t['protanopiaDesc'] ?? '',
    deuteranopia: t['deuteranopiaDesc'] ?? '',
    tritanopia: t['tritanopiaDesc'] ?? '',
    'high-contrast-protanopia': t['highContrastProtanopiaDesc'] ?? '',
    'high-contrast-deuteranopia': t['highContrastDeuteranopiaDesc'] ?? '',
    'high-contrast-tritanopia': t['highContrastTritanopiaDesc'] ?? '',
  }
  return descMap[id] ?? ''
}

/** Contrast ratio badge */
function ContrastBadge({ check, t }: { check: ContrastCheckResult; t: Record<string, string> }) {
  const ratioStr = check.ratio.toFixed(1)
  const bgColor = check.aaaNormal ? '#059669' : check.aaNormal ? '#d97706' : '#dc2626'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 8,
      background: 'var(--dsw-alias-bg-secondary, #f8fafc)',
      border: '1px solid var(--dsw-alias-border, #e2e8f0)',
      fontSize: 13,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: bgColor, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 11,
      }}>
        {ratioStr}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {check.fg} on {check.bg}
        </span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>
          AA: {check.aaNormal ? t.yes : t.no} | AAA: {check.aaaNormal ? t.yes : t.no}
        </span>
      </div>
    </div>
  )
}

/** Theme preview card */
function ThemePreviewCard({ config, t }: { config: AccessibleThemeConfig; t: Record<string, string> }) {
  const { colors } = config

  return (
    <div style={{
      border: '2px solid var(--dsw-alias-border, #e2e8f0)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Preview header */}
      <div style={{ padding: 16, background: colors.bgPrimary, borderBottom: `2px solid ${colors.border}` }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{
            background: colors.accentPrimary, color: '#fff',
            padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600,
          }}>
            {config.name}
          </span>
          {config.isHighContrast && (
            <span style={{
              background: colors.warning, color: '#000',
              padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            }}>
              WCAG AAA
            </span>
          )}
          {config.colorBlindType && (
            <span style={{
              background: colors.info, color: '#fff',
              padding: '4px 8px', borderRadius: 6, fontSize: 11,
            }}>
              {config.colorBlindType}
            </span>
          )}
        </div>
        <p style={{ margin: 0, color: colors.textPrimary, fontSize: 15 }}>
          {t.sampleText}
        </p>
        <p style={{ margin: '4px 0 0', color: colors.textSecondary, fontSize: 13 }}>
          {t.sampleSecondary}
        </p>
        <p style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: 12 }}>
          {t.sampleMuted}
        </p>
        <p style={{ margin: '4px 0 0', color: colors.textLink, fontSize: 13, textDecoration: 'underline' }}>
          {t.sampleLink}
        </p>
      </div>

      {/* Status colors preview */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        background: colors.bgSecondary,
        borderTop: `1px solid ${colors.border}`,
      }}>
        <span style={{ color: colors.success, fontWeight: 700 }}>✓ {t.successLabel}</span>
        <span style={{ color: colors.warning, fontWeight: 700 }}>▲ {t.warningLabel}</span>
        <span style={{ color: colors.error, fontWeight: 700 }}>✗ {t.errorLabel}</span>
        <span style={{ color: colors.info, fontWeight: 700 }}>● {t.infoLabel}</span>
        <span style={{ color: colors.accentPrimary, fontWeight: 700 }}>★ {t.accentLabel}</span>
      </div>
    </div>
  )
}

/** Main component */
export function AccessibleThemesSection() {
  const [lang] = useState<Language>('en')
  const t = T[lang]
  const engine = useMemo(() => getAccessibleThemesEngine(), [])
  const themes = useMemo(() => engine.getThemes(), [engine])
  const [activeTheme, setActiveTheme] = useState<AccessibleThemeMode>(engine.getActiveThemeId())
  const [previewTheme, setPreviewTheme] = useState<AccessibleThemeMode | null>(null)
  const [autoDetect, setAutoDetect] = useState(false)

  // Subscribe to theme changes
  useEffect(() => {
    return engine.subscribe((theme: AccessibleThemeMode) => {
      setActiveTheme(theme)
    })
  }, [engine])

  // Auto-detect on mount
  useEffect(() => {
    if (autoDetect) {
      engine.autoApply()
    }
  }, [autoDetect, engine])

  const handleApply = useCallback((id: AccessibleThemeMode) => {
    engine.applyTheme(id)
    setActiveTheme(id)
    setPreviewTheme(null)
  }, [engine])

  const handleExport = useCallback(() => {
    if (previewTheme) {
      const css = engine.exportThemeCSS(previewTheme)
      if (css) {
        const blob = new Blob([css], { type: 'text/css' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `idexal-theme-${previewTheme}.css`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
  }, [engine, previewTheme])

  const preview = previewTheme ? engine.getThemePreview(previewTheme) : null

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>{t.title}</h3>
      <p style={{ margin: '0 0 16px', fontSize: 13, opacity: 0.7 }}>{t.subtitle}</p>

      {/* Auto-detect toggle */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10,
        background: 'var(--dsw-alias-bg-secondary, #f8fafc)',
        marginBottom: 16, cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={autoDetect}
          onChange={(e) => setAutoDetect(e.target.checked)}
          aria-label={t.autoDetect}
        />
        <span style={{ fontSize: 13 }}>{t.autoDetect}</span>
      </label>

      {/* Current theme indicator */}
      <div style={{
        padding: '10px 14px', borderRadius: 10, marginBottom: 16,
        background: 'var(--dsw-alias-bg-secondary, #f8fafc)',
        border: '2px solid var(--dsw-alias-interactive-bg, #6366f1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{t.currentTheme}:</span>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: 'var(--dsw-alias-interactive-bg, #6366f1)',
        }}>
          {activeTheme === 'default' ? t.default : getThemeName(activeTheme, lang, t)}
        </span>
      </div>

      {/* Theme grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        {/* Default theme */}
        <div
          style={{
            padding: 12, borderRadius: 10, cursor: 'pointer',
            border: `2px solid ${activeTheme === 'default' ? 'var(--dsw-alias-interactive-bg, #6366f1)' : 'var(--dsw-alias-border, #e2e8f0)'}`,
            background: 'var(--dsw-alias-bg-secondary, #f8fafc)',
            transition: 'border-color 0.15s',
          }}
          onClick={() => handleApply('default')}
          role="button"
          tabIndex={0}
          aria-label={t.default}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleApply('default') }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.default}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{t.defaultDesc}</div>
          {activeTheme === 'default' && (
            <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: 'var(--dsw-alias-interactive-bg, #6366f1)' }}>
              ✓ {t.applied}
            </div>
          )}
        </div>

        {/* Accessible themes */}
        {themes.map((theme: AccessibleThemeConfig) => (
          <div
            key={theme.id}
            style={{
              padding: 12, borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${activeTheme === theme.id ? 'var(--dsw-alias-interactive-bg, #6366f1)' : 'var(--dsw-alias-border, #e2e8f0)'}`,
              background: 'var(--dsw-alias-bg-secondary, #f8fafc)',
              transition: 'border-color 0.15s',
            }}
            onClick={() => handleApply(theme.id)}
            onMouseEnter={() => setPreviewTheme(theme.id)}
            onMouseLeave={() => setPreviewTheme(null)}
            role="button"
            tabIndex={0}
            aria-label={getThemeName(theme.id, lang, t)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleApply(theme.id) }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{getThemeName(theme.id, lang, t)}</span>
              {theme.isHighContrast && (
                <span style={{
                  background: theme.colors.warning, color: '#000',
                  padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                }}>
                  AAA
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{getThemeDescription(theme.id, t)}</div>

            {/* Color swatches */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[theme.colors.accentPrimary, theme.colors.success, theme.colors.warning, theme.colors.error, theme.colors.info].map((c, i) => (
                <div key={i} style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: c, border: '1px solid rgba(0,0,0,0.1)',
                }} />
              ))}
            </div>

            {activeTheme === theme.id && (
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: 'var(--dsw-alias-interactive-bg, #6366f1)' }}>
                ✓ {t.applied}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview section */}
      {previewTheme && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>{t.preview}</h4>
          <ThemePreviewCard
            config={themes.find((th: AccessibleThemeConfig) => th.id === previewTheme) ?? themes[0]!}
            t={t}
          />

          {preview && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                  {t.contrastRatios}
                </h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 12,
                    background: preview.meetsAA ? '#059669' : '#dc2626',
                    color: '#fff', fontWeight: 600,
                  }}>
                    {t.passesAA}: {preview.meetsAA ? t.yes : t.no}
                  </span>
                  <span style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 12,
                    background: preview.meetsAAA ? '#059669' : '#d97706',
                    color: '#fff', fontWeight: 600,
                  }}>
                    {t.passesAAA}: {preview.meetsAAA ? t.yes : t.no}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {preview.contrastChecks.map((check: ContrastCheckResult, i: number) => (
                  <ContrastBadge key={i} check={check} t={t} />
                ))}
              </div>
              <button
                onClick={handleExport}
                style={{
                  marginTop: 12, padding: '8px 16px', borderRadius: 8,
                  background: 'var(--dsw-alias-interactive-bg, #6366f1)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                {t.export}
              </button>
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: 20, fontSize: 12, opacity: 0.5 }}>{t.description}</p>
    </div>
  )
}

export default AccessibleThemesSection
