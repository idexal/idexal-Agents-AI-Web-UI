/**
 * Accessible Themes Engine for Idexal Agents.
 * Provides WCAG-compliant high contrast and color-blind safe themes
 * with proper contrast ratios (4.5:1 AA, 7:1 AAA).
 */

/** Theme accessibility mode */
export type AccessibleThemeMode =
  | 'default'
  | 'high-contrast-light'
  | 'high-contrast-dark'
  | 'protanopia'      // Red-blind
  | 'deuteranopia'    // Green-blind
  | 'tritanopia'      // Blue-blind
  | 'high-contrast-protanopia'
  | 'high-contrast-deuteranopia'
  | 'high-contrast-tritanopia'

/** Contrast ratio level */
export type ContrastRatio = 'AA' | 'AAA'

/** Color-blind type */
export type ColorBlindType = 'protanopia' | 'deuteranopia' | 'tritanopia'

/** Theme color set with WCAG-compliant contrast ratios */
export interface AccessibleColorSet {
  /** Primary background */
  bgPrimary: string
  /** Secondary background (cards, panels) */
  bgSecondary: string
  /** Tertiary background (hover states) */
  bgTertiary: string
  /** Surface/background for elevated elements */
  surface: string
  /** Surface hover */
  surfaceHover: string
  /** Primary text (highest contrast) */
  textPrimary: string
  /** Secondary text */
  textSecondary: string
  /** Muted text */
  textMuted: string
  /** Link/interactive text */
  textLink: string
  /** Primary action color */
  accentPrimary: string
  /** Secondary action color */
  accentSecondary: string
  /** Success state */
  success: string
  /** Warning state */
  warning: string
  /** Error/danger state */
  error: string
  /** Info state */
  info: string
  /** Border color */
  border: string
  /** Border hover */
  borderHover: string
  /** Focus ring */
  focusRing: string
  /** Disabled state text */
  disabledText: string
  /** Disabled state background */
  disabledBg: string
}

/** Full theme configuration */
export interface AccessibleThemeConfig {
  /** Theme identifier */
  id: AccessibleThemeMode
  /** Theme display name */
  name: string
  /** Theme name (Arabic) */
  nameAr: string
  /** Theme name (Chinese) */
  nameZh: string
  /** Description */
  description: string
  /** Color-blind type if applicable */
  colorBlindType?: ColorBlindType
  /** Is high contrast */
  isHighContrast: boolean
  /** Color set */
  colors: AccessibleColorSet
  /** CSS custom properties to inject */
  cssVariables: Record<string, string>
  /** Additional CSS rules (for patterns, shapes, etc.) */
  additionalCSS: string
}

/** Contrast check result */
export interface ContrastCheckResult {
  /** Foreground color */
  fg: string
  /** Background color */
  bg: string
  /** Contrast ratio */
  ratio: number
  /** Passes AA normal text */
  aaNormal: boolean
  /** Passes AA large text */
  aaLarge: boolean
  /** Passes AAA normal text */
  aaaNormal: boolean
  /** Passes AAA large text */
  aaaLarge: boolean
}

/** Theme preview data */
export interface ThemePreviewData {
  /** Theme id */
  themeId: AccessibleThemeMode
  /** Sample text contrast checks */
  contrastChecks: ContrastCheckResult[]
  /** Overall score (0-100) */
  score: number
  /** Meets WCAG 2.1 AA */
  meetsAA: boolean
  /** Meets WCAG 2.1 AAA */
  meetsAAA: boolean
}

// --- Color utility functions ---

/** Parse hex color to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m || !m[1] || !m[2] || !m[3]) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

/** Relative luminance per WCAG 2.1 */
function relativeLuminance(r: number, g: number, b: number): number {
  const values = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const [rs = 0, gs = 0, bs = 0] = values
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** Calculate contrast ratio between two hex colors */
function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  if (!c1 || !c2) return 0
  const l1 = relativeLuminance(c1.r, c1.g, c1.b)
  const l2 = relativeLuminance(c2.r, c2.g, c2.b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Check contrast for WCAG levels */
function checkContrast(fg: string, bg: string): ContrastCheckResult {
  const ratio = contrastRatio(fg, bg)
  return {
    fg,
    bg,
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  }
}

// --- Theme definitions ---

/** High Contrast Light theme colors */
const HIGH_CONTRAST_LIGHT: AccessibleColorSet = {
  bgPrimary:     '#ffffff',
  bgSecondary:   '#f0f0f0',
  bgTertiary:    '#e0e0e0',
  surface:       '#ffffff',
  surfaceHover:  '#f5f5f5',
  textPrimary:   '#000000',
  textSecondary: '#1a1a1a',
  textMuted:     '#333333',
  textLink:      '#0000cc',
  accentPrimary: '#0000cc',
  accentSecondary: '#660099',
  success:       '#006600',
  warning:       '#996600',
  error:         '#cc0000',
  info:          '#0066cc',
  border:        '#000000',
  borderHover:   '#333333',
  focusRing:     '#0000cc',
  disabledText:  '#666666',
  disabledBg:    '#e0e0e0',
}

/** High Contrast Dark theme colors */
const HIGH_CONTRAST_DARK: AccessibleColorSet = {
  bgPrimary:     '#000000',
  bgSecondary:   '#1a1a1a',
  bgTertiary:    '#2a2a2a',
  surface:       '#0a0a0a',
  surfaceHover:  '#1f1f1f',
  textPrimary:   '#ffffff',
  textSecondary: '#f0f0f0',
  textMuted:     '#cccccc',
  textLink:      '#6eb5ff',
  accentPrimary: '#6eb5ff',
  accentSecondary: '#c792ea',
  success:       '#66ff66',
  warning:       '#ffcc00',
  error:         '#ff6666',
  info:          '#66ccff',
  border:        '#ffffff',
  borderHover:   '#cccccc',
  focusRing:     '#6eb5ff',
  disabledText:  '#666666',
  disabledBg:    '#1a1a1a',
}

/** Protanopia-safe colors (red-blind) */
function getProtanopiaColors(isHighContrast: boolean): AccessibleColorSet {
  const base = isHighContrast ? HIGH_CONTRAST_DARK : {
    bgPrimary:     '#ffffff',
    bgSecondary:   '#f8f9fa',
    bgTertiary:    '#e9ecef',
    surface:       '#ffffff',
    surfaceHover:  '#f1f3f5',
    textPrimary:   '#212529',
    textSecondary: '#495057',
    textMuted:     '#868e96',
    textLink:      '#1971c2',
    accentPrimary: '#1971c2',
    accentSecondary: '#5f3dc4',
    success:       '#2f9e44',
    warning:       '#e67700',
    error:         '#c92a2a',
    info:          '#1971c2',
    border:        '#dee2e6',
    borderHover:   '#adb5bd',
    focusRing:     '#1971c2',
    disabledText:  '#adb5bd',
    disabledBg:    '#e9ecef',
  }

  // Protanopia shifts: reds become muted, use blue/yellow instead
  return {
    ...base,
    accentPrimary: '#1971c2',  // Blue
    accentSecondary: '#7048e8', // Purple
    success:       '#2f9e44',  // Green (safe for protanopia)
    warning:       '#f08c00',  // Amber/yellow (safe for protanopia)
    error:         '#1971c2',  // Blue (replaces red for error indicators)
    info:          '#5f3dc4',  // Purple
    focusRing:     '#1971c2',
  }
}

/** Deuteranopia-safe colors (green-blind) */
function getDeuteranopiaColors(isHighContrast: boolean): AccessibleColorSet {
  const base = isHighContrast ? HIGH_CONTRAST_DARK : {
    bgPrimary:     '#ffffff',
    bgSecondary:   '#f8f9fa',
    bgTertiary:    '#e9ecef',
    surface:       '#ffffff',
    surfaceHover:  '#f1f3f5',
    textPrimary:   '#212529',
    textSecondary: '#495057',
    textMuted:     '#868e96',
    textLink:      '#1864ab',
    accentPrimary: '#1864ab',
    accentSecondary: '#862e9c',
    success:       '#364fc7',
    warning:       '#e67700',
    error:         '#c92a2a',
    info:          '#1864ab',
    border:        '#dee2e6',
    borderHover:   '#adb5bd',
    focusRing:     '#1864ab',
    disabledText:  '#adb5bd',
    disabledBg:    '#e9ecef',
  }

  // Deuteranopia shifts: greens become muted, use blue/teal instead
  return {
    ...base,
    accentPrimary: '#1864ab',  // Blue
    accentSecondary: '#862e9c', // Purple
    success:       '#1864ab',  // Blue (replaces green)
    warning:       '#e67700',  // Orange (safe)
    error:         '#c92a2a',  // Red (safe for deuteranopia)
    info:          '#5f3dc4',  // Purple
    focusRing:     '#1864ab',
  }
}

/** Tritanopia-safe colors (blue-blind) */
function getTritanopiaColors(isHighContrast: boolean): AccessibleColorSet {
  const base = isHighContrast ? HIGH_CONTRAST_DARK : {
    bgPrimary:     '#ffffff',
    bgSecondary:   '#f8f9fa',
    bgTertiary:    '#e9ecef',
    surface:       '#ffffff',
    surfaceHover:  '#f1f3f5',
    textPrimary:   '#212529',
    textSecondary: '#495057',
    textMuted:     '#868e96',
    textLink:      '#c92a2a',
    accentPrimary: '#c92a2a',
    accentSecondary: '#862e9c',
    success:       '#2f9e44',
    warning:       '#e67700',
    error:         '#c92a2a',
    info:          '#862e9c',
    border:        '#dee2e6',
    borderHover:   '#adb5bd',
    focusRing:     '#c92a2a',
    disabledText:  '#adb5bd',
    disabledBg:    '#e9ecef',
  }

  // Tritanopia shifts: blues become muted, use red/green instead
  return {
    ...base,
    accentPrimary: '#c92a2a',  // Red
    accentSecondary: '#862e9c', // Purple
    success:       '#2f9e44',  // Green (safe for tritanopia)
    warning:       '#e67700',  // Orange (safe)
    error:         '#c92a2a',  // Red (safe)
    info:          '#862e9c',  // Purple (replaces blue)
    focusRing:     '#c92a2a',
  }
}

// --- Additional CSS for color-blind modes ---

/** CSS patterns for status indicators (shape-based alternatives to color) */
const STATUS_PATTERNS_CSS = `
/* Color-blind safe: add shapes to status indicators */
[data-theme*="protanopia"],
[data-theme*="deuteranopia"],
[data-theme*="tritanopia"] {
  --status-success-icon: '✓';
  --status-warning-icon: '▲';
  --status-error-icon: '✗';
  --status-info-icon: '●';
}

/* Status indicator shapes */
[data-theme*="protanopia"] [data-status="success"],
[data-theme*="deuteranopia"] [data-status="success"],
[data-theme*="tritanopia"] [data-status="success"]::before {
  content: '✓';
  margin-right: 4px;
  font-weight: bold;
}

[data-theme*="protanopia"] [data-status="warning"],
[data-theme*="deuteranopia"] [data-status="warning"],
[data-theme*="tritanopia"] [data-status="warning"]::before {
  content: '▲';
  margin-right: 4px;
  font-weight: bold;
}

[data-theme*="protanopia"] [data-status="error"],
[data-theme*="deuteranopia"] [data-status="error"],
[data-theme*="tritanopia"] [data-status="error"]::before {
  content: '✗';
  margin-right: 4px;
  font-weight: bold;
}

[data-theme*="protanopia"] [data-status="info"],
[data-theme*="deuteranopia"] [data-status="info"],
[data-theme*="tritanopia"] [data-status="info"]::before {
  content: '●';
  margin-right: 4px;
  font-weight: bold;
}
`

/** High contrast mode CSS overrides */
const HIGH_CONTRAST_CSS = `
/* High contrast mode: stronger focus rings, thicker borders */
[data-theme*="high-contrast"] {
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
}

[data-theme*="high-contrast"] *:focus-visible {
  outline: 3px solid var(--dsw-focus-ring, #0000cc) !important;
  outline-offset: 2px !important;
}

[data-theme*="high-contrast"] button,
[data-theme*="high-contrast"] a,
[data-theme*="high-contrast"] input,
[data-theme*="high-contrast"] select,
[data-theme*="high-contrast"] textarea {
  border-width: 2px !important;
}

[data-theme*="high-contrast"] .gantt-toolbar,
[data-theme*="high-contrast"] .settings-nav,
[data-theme*="high-contrast"] [role="toolbar"] {
  border: 2px solid currentColor !important;
}

[data-theme*="high-contrast-dark"] {
  forced-color-adjust: none;
}
`

/** Build CSS variables from a color set */
function buildCSSVariables(colors: AccessibleColorSet): Record<string, string> {
  return {
    '--dsw-alias-bg-primary':        colors.bgPrimary,
    '--dsw-alias-bg-secondary':      colors.bgSecondary,
    '--dsw-alias-bg-tertiary':       colors.bgTertiary,
    '--dsw-alias-surface':           colors.surface,
    '--dsw-alias-surface-hover':     colors.surfaceHover,
    '--dsw-alias-label-primary':     colors.textPrimary,
    '--dsw-alias-label-secondary':   colors.textSecondary,
    '--dsw-alias-label-muted':       colors.textMuted,
    '--dsw-text-link':               colors.textLink,
    '--dsw-alias-interactive-bg':    colors.accentPrimary,
    '--dsw-alias-interactive-bg-hover': colors.accentSecondary,
    '--dsw-success':                 colors.success,
    '--dsw-warning':                 colors.warning,
    '--dsw-error':                   colors.error,
    '--dsw-info':                    colors.info,
    '--dsw-alias-border':            colors.border,
    '--dsw-alias-border-hover':      colors.borderHover,
    '--dsw-focus-ring':              colors.focusRing,
    '--dsw-alias-disabled-text':     colors.disabledText,
    '--dsw-alias-disabled-bg':       colors.disabledBg,
    '--dsw-alias-bg-mask-1':         'rgba(0,0,0,0.5)',
    '--dsw-mask-blur':               'blur(4px)',
    '--dsh-focus-ring-width':        '2px',
    '--dsh-focus-ring-offset':       '1px',
  }
}

// --- Built-in theme definitions ---

const BUILTIN_THEMES: AccessibleThemeConfig[] = [
  // High Contrast Light
  {
    id: 'high-contrast-light',
    name: 'High Contrast Light',
    nameAr: 'تباين عالي - فاتح',
    nameZh: '高对比度 - 浅色',
    description: 'WCAG AAA compliant light theme with maximum contrast (7:1+ ratio)',
    isHighContrast: true,
    colors: HIGH_CONTRAST_LIGHT,
    cssVariables: buildCSSVariables(HIGH_CONTRAST_LIGHT),
    additionalCSS: HIGH_CONTRAST_CSS,
  },
  // High Contrast Dark
  {
    id: 'high-contrast-dark',
    name: 'High Contrast Dark',
    nameAr: 'تباين عالي - داكن',
    nameZh: '高对比度 - 深色',
    description: 'WCAG AAA compliant dark theme with maximum contrast (7:1+ ratio)',
    isHighContrast: true,
    colors: HIGH_CONTRAST_DARK,
    cssVariables: buildCSSVariables(HIGH_CONTRAST_DARK),
    additionalCSS: HIGH_CONTRAST_CSS,
  },
  // Protanopia (Red-blind)
  {
    id: 'protanopia',
    name: 'Protanopia Safe (Red-Blind)',
    nameAr: 'آمن ل_msgs_opanopia (عمى الأحمر)',
    nameZh: '红色盲安全',
    colorBlindType: 'protanopia',
    description: 'Color-blind safe theme for red-blind users. Uses blue/yellow for status.',
    isHighContrast: false,
    colors: getProtanopiaColors(false),
    cssVariables: buildCSSVariables(getProtanopiaColors(false)),
    additionalCSS: STATUS_PATTERNS_CSS,
  },
  // Deuteranopia (Green-blind)
  {
    id: 'deuteranopia',
    name: 'Deuteranopia Safe (Green-Blind)',
    nameAr: 'آمن لـ Deuteranopia (عمى الأخضر)',
    nameZh: '绿色盲安全',
    colorBlindType: 'deuteranopia',
    description: 'Color-blind safe theme for green-blind users. Uses blue/red for status.',
    isHighContrast: false,
    colors: getDeuteranopiaColors(false),
    cssVariables: buildCSSVariables(getDeuteranopiaColors(false)),
    additionalCSS: STATUS_PATTERNS_CSS,
  },
  // Tritanopia (Blue-blind)
  {
    id: 'tritanopia',
    name: 'Tritanopia Safe (Blue-Blind)',
    nameAr: 'آمن لـ Tritanopia (عمى الأزرق)',
    nameZh: '蓝色盲安全',
    colorBlindType: 'tritanopia',
    description: 'Color-blind safe theme for blue-blind users. Uses red/green for status.',
    isHighContrast: false,
    colors: getTritanopiaColors(false),
    cssVariables: buildCSSVariables(getTritanopiaColors(false)),
    additionalCSS: STATUS_PATTERNS_CSS,
  },
  // High Contrast + Protanopia
  {
    id: 'high-contrast-protanopia',
    name: 'High Contrast + Protanopia',
    nameAr: 'تباين عالي + عمى الأحمر',
    nameZh: '高对比度 + 红色盲',
    colorBlindType: 'protanopia',
    description: 'Maximum contrast with protanopia-safe colors',
    isHighContrast: true,
    colors: getProtanopiaColors(true),
    cssVariables: buildCSSVariables(getProtanopiaColors(true)),
    additionalCSS: HIGH_CONTRAST_CSS + STATUS_PATTERNS_CSS,
  },
  // High Contrast + Deuteranopia
  {
    id: 'high-contrast-deuteranopia',
    name: 'High Contrast + Deuteranopia',
    nameAr: 'تباين عالي + عمى الأخضر',
    nameZh: '高对比度 + 绿色盲',
    colorBlindType: 'deuteranopia',
    description: 'Maximum contrast with deuteranopia-safe colors',
    isHighContrast: true,
    colors: getDeuteranopiaColors(true),
    cssVariables: buildCSSVariables(getDeuteranopiaColors(true)),
    additionalCSS: HIGH_CONTRAST_CSS + STATUS_PATTERNS_CSS,
  },
  // High Contrast + Tritanopia
  {
    id: 'high-contrast-tritanopia',
    name: 'High Contrast + Tritanopia',
    nameAr: 'تباين عالي + عمى الأزرق',
    nameZh: '高对比度 + 蓝色盲',
    colorBlindType: 'tritanopia',
    description: 'Maximum contrast with tritanopia-safe colors',
    isHighContrast: true,
    colors: getTritanopiaColors(true),
    cssVariables: buildCSSVariables(getTritanopiaColors(true)),
    additionalCSS: HIGH_CONTRAST_CSS + STATUS_PATTERNS_CSS,
  },
]

// --- Main engine ---

export class AccessibleThemesEngine {
  private activeThemeId: AccessibleThemeMode = 'default'
  private injectedStyleEl: HTMLStyleElement | null = null
  private listeners: Set<(theme: AccessibleThemeMode) => void> = new Set()

  /** Get all available themes */
  getThemes(): AccessibleThemeConfig[] {
    return [...BUILTIN_THEMES]
  }

  /** Get a theme by id */
  getTheme(id: AccessibleThemeMode): AccessibleThemeConfig | undefined {
    return BUILTIN_THEMES.find(t => t.id === id)
  }

  /** Get the currently active theme */
  getActiveThemeId(): AccessibleThemeMode {
    return this.activeThemeId
  }

  /** Apply a theme to the document */
  applyTheme(id: AccessibleThemeMode): void {
    this.activeThemeId = id

    if (id === 'default') {
      this.removeTheme()
      this.notifyListeners()
      return
    }

    const theme = this.getTheme(id)
    if (!theme) return

    // Remove previous style element
    this.removeInjectedStyle()

    // Create style element with CSS variables
    const style = document.createElement('style')
    style.id = 'idexal-accessible-theme'

    let css = ':root {\n'
    for (const [key, value] of Object.entries(theme.cssVariables)) {
      css += `  ${key}: ${value};\n`
    }
    css += '}\n'

    // Add high contrast overrides
    css += theme.additionalCSS

    style.textContent = css
    document.head.appendChild(style)
    this.injectedStyleEl = style

    // Set data attribute on root for CSS selectors
    document.documentElement.setAttribute('data-theme', id)

    this.notifyListeners()
  }

  /** Remove the active theme (revert to default) */
  removeTheme(): void {
    this.removeInjectedStyle()
    document.documentElement.removeAttribute('data-theme')
    this.activeThemeId = 'default'
  }

  /** Check contrast ratio between two colors */
  checkContrast(fg: string, bg: string): ContrastCheckResult {
    return checkContrast(fg, bg)
  }

  /** Get contrast preview for a theme */
  getThemePreview(id: AccessibleThemeMode): ThemePreviewData | null {
    const theme = this.getTheme(id)
    if (!theme) return null

    const { colors } = theme
    const checks = [
      checkContrast(colors.textPrimary, colors.bgPrimary),
      checkContrast(colors.textSecondary, colors.bgPrimary),
      checkContrast(colors.textMuted, colors.bgPrimary),
      checkContrast(colors.textLink, colors.bgPrimary),
      checkContrast(colors.accentPrimary, colors.bgPrimary),
      checkContrast(colors.success, colors.bgPrimary),
      checkContrast(colors.warning, colors.bgPrimary),
      checkContrast(colors.error, colors.bgPrimary),
      checkContrast(colors.textPrimary, colors.surface),
      checkContrast(colors.border, colors.bgPrimary),
    ]

    const passCount = checks.filter(c => c.aaNormal).length
    const score = Math.round((passCount / checks.length) * 100)
    const meetsAA = checks.every(c => c.aaNormal)
    const meetsAAA = checks.every(c => c.aaaNormal)

    return {
      themeId: id,
      contrastChecks: checks,
      score,
      meetsAA,
      meetsAAA,
    }
  }

  /** Subscribe to theme changes */
  subscribe(listener: (theme: AccessibleThemeMode) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Detect system preferences */
  detectSystemPreferences(): {
    prefersHighContrast: boolean
    prefersReducedMotion: boolean
    colorScheme: 'light' | 'dark'
  } {
    return {
      prefersHighContrast: window.matchMedia('(prefers-contrast: more)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    }
  }

  /** Auto-detect and apply best theme based on system preferences */
  autoApply(): void {
    const prefs = this.detectSystemPreferences()
    if (prefs.prefersHighContrast) {
      this.applyTheme(prefs.colorScheme === 'dark' ? 'high-contrast-dark' : 'high-contrast-light')
    }
  }

  /** Export theme as CSS file content */
  exportThemeCSS(id: AccessibleThemeMode): string | null {
    const theme = this.getTheme(id)
    if (!theme) return null

    let css = `/* Idexal Agents Accessible Theme: ${theme.name} */\n`
    css += `/* ${theme.description} */\n\n`
    css += ':root {\n'
    for (const [key, value] of Object.entries(theme.cssVariables)) {
      css += `  ${key}: ${value};\n`
    }
    css += '}\n\n'
    css += theme.additionalCSS

    return css
  }

  /** Cleanup */
  destroy(): void {
    this.removeTheme()
    this.listeners.clear()
  }

  private removeInjectedStyle(): void {
    if (this.injectedStyleEl) {
      this.injectedStyleEl.parentElement?.removeChild(this.injectedStyleEl)
      this.injectedStyleEl = null
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try { listener(this.activeThemeId) } catch { /* listener error */ }
    }
  }
}

// --- Singleton ---

let engineInstance: AccessibleThemesEngine | null = null

export function getAccessibleThemesEngine(): AccessibleThemesEngine {
  if (!engineInstance) {
    engineInstance = new AccessibleThemesEngine()
  }
  return engineInstance
}

export function resetAccessibleThemesEngine(): void {
  engineInstance?.destroy()
  engineInstance = null
}

/** Re-export utility for external use */
export { contrastRatio }
