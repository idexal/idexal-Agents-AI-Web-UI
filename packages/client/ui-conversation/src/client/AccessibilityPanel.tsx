/**
 * Accessibility Panel UI for Idexal Agents.
 * Provides settings for all accessibility preferences with live preview.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getAccessibilityEngine,
  type AccessibilityPreferences,
  type AccessibilityAuditResult,
} from './Accessibility.ts'

type Language = 'en' | 'ar' | 'zh'

interface Translations {
  title: string
  visual: string
  reducedMotion: string
  reducedMotionDesc: string
  highContrast: string
  highContrastDesc: string
  largeText: string
  largeTextDesc: string
  fontSize: string
  lineHeight: string
  letterSpacing: string
  focusVisible: string
  focusVisibleDesc: string
  colorBlindFriendly: string
  colorBlindDesc: string
  navigation: string
  keyboardOnly: string
  keyboardOnlyDesc: string
  skipNavigation: string
  skipNavigationDesc: string
  autoFocusOnLoad: string
  autoFocusDesc: string
  trapFocusInModals: string
  trapFocusDesc: string
  screenReader: string
  screenReaderDesc: string
  screenReaderAuto: string
  screenReaderOn: string
  screenReaderOff: string
  announcements: string
  announcePageChanges: string
  announcePageChangesDesc: string
  announceStatusUpdates: string
  announceStatusUpdatesDesc: string
  audit: string
  auditButton: string
  auditRunning: string
  auditComplete: string
  auditResults: string
  errors: string
  warnings: string
  info: string
  fix: string
  noIssues: string
  resetDefaults: string
  save: string
  saved: string
}

const translations: Record<Language, Translations> = {
  en: {
    title: '♿ Accessibility Settings',
    visual: 'Visual',
    reducedMotion: 'Reduce Motion',
    reducedMotionDesc: 'Minimize animations and transitions',
    highContrast: 'High Contrast',
    highContrastDesc: 'Increase color contrast for better visibility',
    largeText: 'Large Text',
    largeTextDesc: 'Increase text size across the interface',
    fontSize: 'Font Size',
    lineHeight: 'Line Height',
    letterSpacing: 'Letter Spacing',
    focusVisible: 'Focus Indicators',
    focusVisibleDesc: 'Show visible focus rings on interactive elements',
    colorBlindFriendly: 'Color Blind Friendly',
    colorBlindDesc: 'Use color-blind safe palette and patterns',
    navigation: 'Navigation',
    keyboardOnly: 'Keyboard Only Mode',
    keyboardOnlyDesc: 'Optimize interface for keyboard-only navigation',
    skipNavigation: 'Skip Navigation Links',
    skipNavigationDesc: 'Show skip links to jump to main content',
    autoFocusOnLoad: 'Auto-Focus on Load',
    autoFocusDesc: 'Automatically focus the first element on page load',
    trapFocusInModals: 'Trap Focus in Modals',
    trapFocusDesc: 'Keep focus within dialog windows when open',
    screenReader: 'Screen Reader',
    screenReaderDesc: 'Optimize for screen reader usage',
    screenReaderAuto: 'Auto-detect',
    screenReaderOn: 'Always on',
    screenReaderOff: 'Off',
    announcements: 'Announcements',
    announcePageChanges: 'Announce Page Changes',
    announcePageChangesDesc: 'Notify screen readers when the page changes',
    announceStatusUpdates: 'Announce Status Updates',
    announceStatusUpdatesDesc: 'Notify screen readers of status changes',
    audit: 'Accessibility Audit',
    auditButton: 'Run Audit',
    auditRunning: 'Running audit...',
    auditComplete: 'Audit complete',
    auditResults: 'Audit Results',
    errors: 'Errors',
    warnings: 'Warnings',
    info: 'Info',
    fix: 'Fix',
    noIssues: 'No accessibility issues found! 🎉',
    resetDefaults: 'Reset to Defaults',
    save: 'Save Preferences',
    saved: 'Saved!',
  },
  ar: {
    title: '♿ إعدادات إمكانية الوصول',
    visual: 'المرئيات',
    reducedMotion: 'تقليل الحركة',
    reducedMotionDesc: 'تقليل الحركات والتأثيرات البصرية',
    highContrast: 'تباين عالي',
    highContrastDesc: 'زيادة تباين الألوان لرؤية أفضل',
    largeText: 'نص كبير',
    largeTextDesc: 'تكبير حجم النص في جميع الواجهات',
    fontSize: 'حجم الخط',
    lineHeight: 'ارتفاع السطر',
    letterSpacing: 'تباعد الأحرف',
    focusVisible: 'مؤشرات التركيز',
    focusVisibleDesc: 'إظهار حلقات تركيز مرئية على العناصر التفاعلية',
    colorBlindFriendly: 'صديق لعمى الألوان',
    colorBlindDesc: 'استخدام لوحة ألوان آمنة للعمى',
    navigation: 'التنقل',
    keyboardOnly: 'وضع لوحة المفاتيح فقط',
    keyboardOnlyDesc: 'تحسين الواجهة للتنقل بلوحة المفاتيح فقط',
    skipNavigation: 'روابط تخطي التنقل',
    skipNavigationDesc: 'إظهار روابط للتخطي إلى المحتوى الرئيسي',
    autoFocusOnLoad: 'تركيز تلقائي عند التحميل',
    autoFocusDesc: 'تركيز العنصر الأول تلقائياً عند تحميل الصفحة',
    trapFocusInModals: 'حبس التركيز في النوافذ المنبثقة',
    trapFocusDesc: 'حبس التركيز داخل النوافذ المنبثقة المفتوحة',
    screenReader: 'قارئ الشاشة',
    screenReaderDesc: 'تحسين الاستخدام مع قارئ الشاشة',
    screenReaderAuto: 'كشف تلقائي',
    screenReaderOn: 'مفعّل دائماً',
    screenReaderOff: 'معطّل',
    announcements: 'الإعلانات',
    announcePageChanges: 'إعلان تغييرات الصفحة',
    announcePageChangesDesc: 'إخطار قارئ الشاشة عند تغيير الصفحة',
    announceStatusUpdates: 'إعلان تحديثات الحالة',
    announceStatusUpdatesDesc: 'إخطار قارئ الشاشة بتحديثات الحالة',
    audit: 'تدقيق إمكانية الوصول',
    auditButton: 'تشغيل التدقيق',
    auditRunning: 'جاري التدقيق...',
    auditComplete: 'اكتمل التدقيق',
    auditResults: 'نتائج التدقيق',
    errors: 'أخطاء',
    warnings: 'تحذيرات',
    info: 'معلومات',
    fix: 'إصلاح',
    noIssues: 'لم يتم العثور على مشاكل! 🎉',
    resetDefaults: 'إعادة تعيين',
    save: 'حفظ التفضيلات',
    saved: 'تم الحفظ!',
  },
  zh: {
    title: '♿ 无障碍设置',
    visual: '视觉',
    reducedMotion: '减少动画',
    reducedMotionDesc: '最小化动画和过渡效果',
    highContrast: '高对比度',
    highContrastDesc: '增加颜色对比度以提高可见性',
    largeText: '大字体',
    largeTextDesc: '增大界面中的文字大小',
    fontSize: '字体大小',
    lineHeight: '行高',
    letterSpacing: '字间距',
    focusVisible: '焦点指示器',
    focusVisibleDesc: '在交互元素上显示可见的焦点环',
    colorBlindFriendly: '色盲友好',
    colorBlindDesc: '使用色盲安全调色板和图案',
    navigation: '导航',
    keyboardOnly: '仅键盘模式',
    keyboardOnlyDesc: '优化界面用于纯键盘导航',
    skipNavigation: '跳过导航链接',
    skipNavigationDesc: '显示跳转到主要内容的链接',
    autoFocusOnLoad: '加载时自动聚焦',
    autoFocusDesc: '页面加载时自动聚焦第一个元素',
    trapFocusInModals: '在弹窗中锁定焦点',
    trapFocusDesc: '打开对话框时将焦点保持在其中',
    screenReader: '屏幕阅读器',
    screenReaderDesc: '优化屏幕阅读器使用',
    screenReaderAuto: '自动检测',
    screenReaderOn: '始终开启',
    screenReaderOff: '关闭',
    announcements: '公告',
    announcePageChanges: '公告页面更改',
    announcePageChangesDesc: '页面更改时通知屏幕阅读器',
    announceStatusUpdates: '公告状态更新',
    announceStatusUpdatesDesc: '通知屏幕阅读器状态变化',
    audit: '无障碍审计',
    auditButton: '运行审计',
    auditRunning: '正在审计...',
    auditComplete: '审计完成',
    auditResults: '审计结果',
    errors: '错误',
    warnings: '警告',
    info: '信息',
    fix: '修复',
    noIssues: '未发现无障碍问题！ 🎉',
    resetDefaults: '重置为默认值',
    save: '保存设置',
    saved: '已保存！',
  },
}

export interface AccessibilityPanelProps {
  language?: Language
  onSave?: (prefs: AccessibilityPreferences) => void
  className?: string
}

export function AccessibilityPanel({
  language = 'en',
  onSave,
  className = '',
}: AccessibilityPanelProps) {
  const t = translations[language]
  const isRTL = language === 'ar'

  const engine = getAccessibilityEngine({ language })
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(engine.getPreferences())
  const [auditResults, setAuditResults] = useState<AccessibilityAuditResult[]>([])
  const [auditRunning, setAuditRunning] = useState(false)
  const [auditDone, setAuditDone] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    engine.setLanguage(language)
  }, [language, engine])

  const updatePref = useCallback(
    <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => {
      setPrefs((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSave = useCallback(() => {
    engine.setPreferences(prefs)
    setSaved(true)
    onSave?.(prefs)
    setTimeout(() => setSaved(false), 2000)
  }, [engine, prefs, onSave])

  const handleReset = useCallback(() => {
    engine.resetPreferences()
    setPrefs(engine.getPreferences())
  }, [engine])

  const runAudit = useCallback(() => {
    setAuditRunning(true)
    setAuditDone(false)
    setAuditResults([])

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const root = document.querySelector('main') || document.body
      const results = engine.auditElement(root as HTMLElement)
      setAuditResults(results)
      setAuditRunning(false)
      setAuditDone(true)
    }, 100)
  }, [engine])

  const errors = auditResults.filter((r) => r.severity === 'error')
  const warnings = auditResults.filter((r) => r.severity === 'warning')
  const infos = auditResults.filter((r) => r.severity === 'info')

  return (
    <div
      className={`a11y-panel ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="region"
      aria-labelledby="a11y-panel-title"
    >
      <h2 id="a11y-panel-title" className="a11y-title">{t.title}</h2>

      {/* Visual Settings */}
      <section className="a11y-section" aria-labelledby="a11y-visual-heading">
        <h3 id="a11y-visual-heading" className="a11y-section-heading">{t.visual}</h3>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-reduced-motion" className="a11y-option-label">
              {t.reducedMotion}
            </label>
            <span className="a11y-option-desc">{t.reducedMotionDesc}</span>
          </div>
          <button
            id="a11y-reduced-motion"
            role="switch"
            aria-checked={prefs.reducedMotion}
            className={`a11y-toggle ${prefs.reducedMotion ? 'active' : ''}`}
            onClick={() => updatePref('reducedMotion', !prefs.reducedMotion)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-high-contrast" className="a11y-option-label">
              {t.highContrast}
            </label>
            <span className="a11y-option-desc">{t.highContrastDesc}</span>
          </div>
          <button
            id="a11y-high-contrast"
            role="switch"
            aria-checked={prefs.highContrast}
            className={`a11y-toggle ${prefs.highContrast ? 'active' : ''}`}
            onClick={() => updatePref('highContrast', !prefs.highContrast)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-large-text" className="a11y-option-label">
              {t.largeText}
            </label>
            <span className="a11y-option-desc">{t.largeTextDesc}</span>
          </div>
          <button
            id="a11y-large-text"
            role="switch"
            aria-checked={prefs.largeText}
            className={`a11y-toggle ${prefs.largeText ? 'active' : ''}`}
            onClick={() => updatePref('largeText', !prefs.largeText)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-font-size" className="a11y-option-label">
              {t.fontSize}: {Math.round(prefs.fontSizeMultiplier * 100)}%
            </label>
          </div>
          <input
            id="a11y-font-size"
            type="range"
            min="0.8"
            max="2"
            step="0.1"
            value={prefs.fontSizeMultiplier}
            onChange={(e) => updatePref('fontSizeMultiplier', parseFloat(e.target.value))}
            className="a11y-slider"
            aria-valuemin={0.8}
            aria-valuemax={2}
            aria-valuenow={prefs.fontSizeMultiplier}
            aria-valuetext={`${Math.round(prefs.fontSizeMultiplier * 100)}%`}
          />
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-line-height" className="a11y-option-label">
              {t.lineHeight}: {prefs.lineHeightMultiplier.toFixed(1)}
            </label>
          </div>
          <input
            id="a11y-line-height"
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={prefs.lineHeightMultiplier}
            onChange={(e) => updatePref('lineHeightMultiplier', parseFloat(e.target.value))}
            className="a11y-slider"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={prefs.lineHeightMultiplier}
          />
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-letter-spacing" className="a11y-option-label">
              {t.letterSpacing}: {prefs.letterSpacingMultiplier.toFixed(1)}
            </label>
          </div>
          <input
            id="a11y-letter-spacing"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={prefs.letterSpacingMultiplier}
            onChange={(e) => updatePref('letterSpacingMultiplier', parseFloat(e.target.value))}
            className="a11y-slider"
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={prefs.letterSpacingMultiplier}
          />
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-focus-visible" className="a11y-option-label">
              {t.focusVisible}
            </label>
            <span className="a11y-option-desc">{t.focusVisibleDesc}</span>
          </div>
          <button
            id="a11y-focus-visible"
            role="switch"
            aria-checked={prefs.focusVisible}
            className={`a11y-toggle ${prefs.focusVisible ? 'active' : ''}`}
            onClick={() => updatePref('focusVisible', !prefs.focusVisible)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-color-blind" className="a11y-option-label">
              {t.colorBlindFriendly}
            </label>
            <span className="a11y-option-desc">{t.colorBlindDesc}</span>
          </div>
          <button
            id="a11y-color-blind"
            role="switch"
            aria-checked={prefs.colorBlindFriendly}
            className={`a11y-toggle ${prefs.colorBlindFriendly ? 'active' : ''}`}
            onClick={() => updatePref('colorBlindFriendly', !prefs.colorBlindFriendly)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Navigation Settings */}
      <section className="a11y-section" aria-labelledby="a11y-nav-heading">
        <h3 id="a11y-nav-heading" className="a11y-section-heading">{t.navigation}</h3>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-keyboard-only" className="a11y-option-label">
              {t.keyboardOnly}
            </label>
            <span className="a11y-option-desc">{t.keyboardOnlyDesc}</span>
          </div>
          <button
            id="a11y-keyboard-only"
            role="switch"
            aria-checked={prefs.keyboardOnly}
            className={`a11y-toggle ${prefs.keyboardOnly ? 'active' : ''}`}
            onClick={() => updatePref('keyboardOnly', !prefs.keyboardOnly)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-skip-nav" className="a11y-option-label">
              {t.skipNavigation}
            </label>
            <span className="a11y-option-desc">{t.skipNavigationDesc}</span>
          </div>
          <button
            id="a11y-skip-nav"
            role="switch"
            aria-checked={prefs.skipNavigation}
            className={`a11y-toggle ${prefs.skipNavigation ? 'active' : ''}`}
            onClick={() => updatePref('skipNavigation', !prefs.skipNavigation)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-auto-focus" className="a11y-option-label">
              {t.autoFocusOnLoad}
            </label>
            <span className="a11y-option-desc">{t.autoFocusDesc}</span>
          </div>
          <button
            id="a11y-auto-focus"
            role="switch"
            aria-checked={prefs.autoFocusOnLoad}
            className={`a11y-toggle ${prefs.autoFocusOnLoad ? 'active' : ''}`}
            onClick={() => updatePref('autoFocusOnLoad', !prefs.autoFocusOnLoad)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-trap-focus" className="a11y-option-label">
              {t.trapFocusInModals}
            </label>
            <span className="a11y-option-desc">{t.trapFocusDesc}</span>
          </div>
          <button
            id="a11y-trap-focus"
            role="switch"
            aria-checked={prefs.trapFocusInModals}
            className={`a11y-toggle ${prefs.trapFocusInModals ? 'active' : ''}`}
            onClick={() => updatePref('trapFocusInModals', !prefs.trapFocusInModals)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Screen Reader Settings */}
      <section className="a11y-section" aria-labelledby="a11y-sr-heading">
        <h3 id="a11y-sr-heading" className="a11y-section-heading">{t.screenReader}</h3>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <span className="a11y-option-label">{t.screenReaderDesc}</span>
          </div>
          <div
            role="radiogroup"
            aria-label={t.screenReader}
            className="a11y-radio-group"
          >
            {(['auto', 'on', 'off'] as const).map((mode) => (
              <label key={mode} className="a11y-radio-label">
                <input
                  type="radio"
                  name="screenReader"
                  value={mode}
                  checked={prefs.screenReader === mode}
                  onChange={() => updatePref('screenReader', mode)}
                  className="a11y-radio"
                />
                {mode === 'auto' ? t.screenReaderAuto : mode === 'on' ? t.screenReaderOn : t.screenReaderOff}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements Settings */}
      <section className="a11y-section" aria-labelledby="a11y-announce-heading">
        <h3 id="a11y-announce-heading" className="a11y-section-heading">{t.announcements}</h3>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-page-changes" className="a11y-option-label">
              {t.announcePageChanges}
            </label>
            <span className="a11y-option-desc">{t.announcePageChangesDesc}</span>
          </div>
          <button
            id="a11y-page-changes"
            role="switch"
            aria-checked={prefs.announcePageChanges}
            className={`a11y-toggle ${prefs.announcePageChanges ? 'active' : ''}`}
            onClick={() => updatePref('announcePageChanges', !prefs.announcePageChanges)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>

        <div className="a11y-option">
          <div className="a11y-option-info">
            <label htmlFor="a11y-status-updates" className="a11y-option-label">
              {t.announceStatusUpdates}
            </label>
            <span className="a11y-option-desc">{t.announceStatusUpdatesDesc}</span>
          </div>
          <button
            id="a11y-status-updates"
            role="switch"
            aria-checked={prefs.announceStatusUpdates}
            className={`a11y-toggle ${prefs.announceStatusUpdates ? 'active' : ''}`}
            onClick={() => updatePref('announceStatusUpdates', !prefs.announceStatusUpdates)}
          >
            <span className="a11y-toggle-thumb" />
          </button>
        </div>
      </section>

      {/* Audit Section */}
      <section className="a11y-section" aria-labelledby="a11y-audit-heading">
        <h3 id="a11y-audit-heading" className="a11y-section-heading">{t.audit}</h3>

        <button
          className="a11y-audit-btn"
          onClick={runAudit}
          disabled={auditRunning}
          aria-busy={auditRunning}
        >
          {auditRunning ? t.auditRunning : t.auditButton}
        </button>

        {auditDone && (
          <div className="a11y-audit-results" role="region" aria-label={t.auditResults}>
            {auditResults.length === 0 ? (
              <div className="a11y-audit-success" role="status">
                {t.noIssues}
              </div>
            ) : (
              <>
                <div className="a11y-audit-summary">
                  <span className="a11y-audit-count error">{errors.length} {t.errors}</span>
                  <span className="a11y-audit-count warning">{warnings.length} {t.warnings}</span>
                  <span className="a11y-audit-count info">{infos.length} {t.info}</span>
                </div>

                <ul className="a11y-audit-list" role="list">
                  {auditResults.map((result, idx) => (
                    <li
                      key={idx}
                      className={`a11y-audit-item ${result.severity}`}
                      role="listitem"
                    >
                      <span className="a11y-audit-severity">{result.severity}</span>
                      <span className="a11y-audit-rule">{result.rule}</span>
                      <span className="a11y-audit-desc">{result.description}</span>
                      <span className="a11y-audit-fix">
                        <strong>{t.fix}:</strong> {result.fix}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      {/* Action Buttons */}
      <div className="a11y-actions">
        <button
          className="a11y-btn secondary"
          onClick={handleReset}
        >
          {t.resetDefaults}
        </button>
        <button
          className="a11y-btn primary"
          onClick={handleSave}
          aria-live="polite"
        >
          {saved ? t.saved : t.save}
        </button>
      </div>

      <style>{`
        .a11y-panel {
          max-width: 640px;
          margin: 0 auto;
          padding: 24px;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
          color: var(--text-primary, #1a1a1a);
        }

        .a11y-title {
          margin: 0 0 24px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .a11y-section {
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .a11y-section-heading {
          margin: 0 0 16px;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .a11y-option {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .a11y-option:last-child {
          border-bottom: none;
        }

        .a11y-option-info {
          flex: 1;
          margin-right: 16px;
        }

        .a11y-option-label {
          display: block;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
          cursor: pointer;
        }

        .a11y-option-desc {
          display: block;
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
          margin-top: 2px;
        }

        .a11y-toggle {
          position: relative;
          width: 48px;
          height: 26px;
          background: var(--toggle-bg, #d1d5db);
          border: none;
          border-radius: 13px;
          cursor: pointer;
          transition: background 0.2s;
          padding: 0;
        }

        .a11y-toggle.active {
          background: var(--toggle-active-bg, #3b82f6);
        }

        .a11y-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .a11y-toggle.active .a11y-toggle-thumb {
          transform: translateX(22px);
        }

        .a11y-slider {
          width: 120px;
          height: 6px;
          accent-color: var(--accent-color, #3b82f6);
        }

        .a11y-radio-group {
          display: flex;
          gap: 16px;
        }

        .a11y-radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .a11y-radio {
          accent-color: var(--accent-color, #3b82f6);
        }

        .a11y-audit-btn {
          width: 100%;
          padding: 12px;
          background: var(--accent-color, #3b82f6);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .a11y-audit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .a11y-audit-results {
          margin-top: 16px;
        }

        .a11y-audit-success {
          padding: 16px;
          background: var(--success-bg, #ecfdf5);
          color: var(--success-color, #10b981);
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
        }

        .a11y-audit-summary {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .a11y-audit-count {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .a11y-audit-count.error { color: #ef4444; }
        .a11y-audit-count.warning { color: #f59e0b; }
        .a11y-audit-count.info { color: #3b82f6; }

        .a11y-audit-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .a11y-audit-item {
          padding: 12px;
          margin-bottom: 8px;
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
          border-left: 3px solid;
        }

        .a11y-audit-item.error { border-left-color: #ef4444; }
        .a11y-audit-item.warning { border-left-color: #f59e0b; }
        .a11y-audit-item.info { border-left-color: #3b82f6; }

        .a11y-audit-severity {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-right: 8px;
        }

        .a11y-audit-rule {
          font-size: 0.75rem;
          color: var(--text-secondary, #666);
          margin-right: 8px;
        }

        .a11y-audit-desc {
          display: block;
          margin-top: 4px;
          font-size: 0.875rem;
        }

        .a11y-audit-fix {
          display: block;
          margin-top: 4px;
          font-size: 0.8125rem;
          color: var(--text-secondary, #666);
        }

        .a11y-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .a11y-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .a11y-btn.primary {
          background: var(--accent-color, #3b82f6);
          color: white;
        }

        .a11y-btn.primary:hover {
          background: var(--accent-hover, #2563eb);
        }

        .a11y-btn.secondary {
          background: transparent;
          border-color: var(--border-color, #d1d5db);
          color: var(--text-primary, #1a1a1a);
        }

        .a11y-btn.secondary:hover {
          background: var(--bg-secondary, #f3f4f6);
        }

        @media (prefers-reduced-motion: reduce) {
          .a11y-toggle-thumb {
            transition: none;
          }
        }
      `}</style>
    </div>
  )
}

export default AccessibilityPanel
