/**
 * Custom Theme Builder Engine for Idexal Agents.
 * Visual theme builder with real-time preview, color palette generation,
 * and export capabilities.
 */

/** Color format */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsla'

/** Theme mode */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** Color token */
export type ColorToken =
  | 'primary'
  | 'primary-hover'
  | 'primary-active'
  | 'secondary'
  | 'secondary-hover'
  | 'background'
  | 'surface'
  | 'surface-hover'
  | 'text'
  | 'text-secondary'
  | 'text-muted'
  | 'border'
  | 'border-hover'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'accent'
  | 'shadow'

/** Color value */
export interface ColorValue {
  /** Color in hex */
  hex: string
  /** Color in RGB */
  rgb: { r: number; g: number; b: number }
  /** Color in HSL */
  hsl: { h: number; s: number; l: number }
}

/** Theme configuration */
export interface ThemeConfiguration {
  /** Theme name */
  name: string
  /** Theme mode */
  mode: ThemeMode
  /** Color tokens */
  colors: Record<ColorToken, ColorValue>
  /** Border radius */
  borderRadius: {
    small: string
    medium: string
    large: string
    full: string
  }
  /** Spacing */
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  /** Font */
  fontFamily: {
    sans: string
    mono: string
  }
  /** Font sizes */
  fontSize: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  /** Shadows */
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  /** Transitions */
  transitions: {
    fast: string
    normal: string
    slow: string
  }
}

/** Color palette */
export interface ColorPalette {
  /** Base color */
  base: ColorValue
  /** Lighter shades */
  light: ColorValue[]
  /** Darker shades */
  dark: ColorValue[]
  /** Complementary */
  complementary: ColorValue
  /** Analogous */
  analogous: ColorValue[]
  /** Triadic */
  triadic: ColorValue[]
  /** Split-complementary */
  splitComplementary: ColorValue[]
}

/** Theme builder config */
export interface ThemeBuilderConfig {
  /** Default mode */
  defaultMode: ThemeMode
  /** Allow custom colors */
  allowCustomColors: boolean
  /** Export formats */
  exportFormats: ColorFormat[]
  /** Max palette size */
  maxPaletteSize: number
  /** Auto-generate complementary */
  autoGenerateComplementary: boolean
}

/**
 * Custom Theme Builder Engine.
 */
export class ThemeBuilderEngine {
  private config: ThemeBuilderConfig
  private currentTheme: ThemeConfiguration
  private customColors: Map<ColorToken, ColorValue> = new Map()
  private listeners: Set<(theme: ThemeConfiguration) => void> = new Set()

  constructor(_config: Partial<ThemeBuilderConfig> = {}) {
    this.config = {
      defaultMode: _config.defaultMode ?? 'auto',
      allowCustomColors: _config.allowCustomColors ?? true,
      exportFormats: _config.exportFormats ?? ['hex', 'rgb', 'hsl'],
      maxPaletteSize: _config.maxPaletteSize ?? 10,
      autoGenerateComplementary: _config.autoGenerateComplementary ?? true,
    }

    this.currentTheme = this.getDefaultTheme()
  }

  /**
   * Get default theme.
   */
  private getDefaultTheme(): ThemeConfiguration {
    return {
      name: 'Idexal Default',
      mode: 'auto',
      colors: {
        primary: this.hexToColor('#6366f1'),
        'primary-hover': this.hexToColor('#4f46e5'),
        'primary-active': this.hexToColor('#4338ca'),
        secondary: this.hexToColor('#8b5cf6'),
        'secondary-hover': this.hexToColor('#7c3aed'),
        background: this.hexToColor('#ffffff'),
        surface: this.hexToColor('#f8fafc'),
        'surface-hover': this.hexToColor('#f1f5f9'),
        text: this.hexToColor('#0f172a'),
        'text-secondary': this.hexToColor('#475569'),
        'text-muted': this.hexToColor('#94a3b8'),
        border: this.hexToColor('#e2e8f0'),
        'border-hover': this.hexToColor('#cbd5e1'),
        success: this.hexToColor('#10b981'),
        warning: this.hexToColor('#f59e0b'),
        error: this.hexToColor('#ef4444'),
        info: this.hexToColor('#3b82f6'),
        accent: this.hexToColor('#ec4899'),
        shadow: this.hexToColor('#000000'),
      },
      borderRadius: {
        small: '4px',
        medium: '8px',
        large: '12px',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      fontFamily: {
        sans: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.15)',
      },
      transitions: {
        fast: '150ms ease',
        normal: '300ms ease',
        slow: '500ms ease',
      },
    }
  }

  /**
   * Generate dark theme from light theme.
   */
  generateDarkTheme(lightTheme: ThemeConfiguration): ThemeConfiguration {
    const dark = { ...lightTheme }
    dark.name = lightTheme.name + ' Dark'
    dark.mode = 'dark'

    // Invert background and text
    dark.colors.background = this.hexToColor('#0f172a')
    dark.colors.surface = this.hexToColor('#1e293b')
    dark.colors['surface-hover'] = this.hexToColor('#334155')
    dark.colors.text = this.hexToColor('#f8fafc')
    dark.colors['text-secondary'] = this.hexToColor('#94a3b8')
    dark.colors['text-muted'] = this.hexToColor('#64748b')
    dark.colors.border = this.hexToColor('#334155')
    dark.colors['border-hover'] = this.hexToColor('#475569')

    // Adjust shadows for dark mode
    dark.shadows = {
      sm: '0 1px 2px rgba(0,0,0,0.3)',
      md: '0 4px 6px rgba(0,0,0,0.4)',
      lg: '0 10px 15px rgba(0,0,0,0.5)',
      xl: '0 20px 25px rgba(0,0,0,0.6)',
    }

    return dark
  }

  /**
   * Generate color palette from a base color.
   */
  generatePalette(baseHex: string): ColorPalette {
    const base = this.hexToColor(baseHex)
    const { h, s, l } = base.hsl

    // Generate lighter shades
    const lightCount = Math.min(5, this.config.maxPaletteSize)
    const light: ColorValue[] = []
    for (let i = 1; i <= lightCount; i++) {
      light.push(this.hslToColor(h, s, Math.min(95, l + i * 10)))
    }

    // Generate darker shades
    const dark: ColorValue[] = []
    for (let i = 1; i <= lightCount; i++) {
      dark.push(this.hslToColor(h, s, Math.max(5, l - i * 10)))
    }

    // Complementary (opposite on wheel)
    const complementary = this.hslToColor((h + 180) % 360, s, l)

    // Analogous (adjacent colors)
    const analogous = [
      this.hslToColor((h + 30) % 360, s, l),
      this.hslToColor((h - 30 + 360) % 360, s, l),
    ]

    // Triadic (120 degrees apart)
    const triadic = [
      this.hslToColor((h + 120) % 360, s, l),
      this.hslToColor((h + 240) % 360, s, l),
    ]

    // Split-complementary
    const splitComplementary = [
      this.hslToColor((h + 150) % 360, s, l),
      this.hslToColor((h + 210) % 360, s, l),
    ]

    return { base, light, dark, complementary, analogous, triadic, splitComplementary }
  }

  /**
   * Set a color token.
   */
  setColorToken(token: ColorToken, hex: string): void {
    if (!this.config.allowCustomColors) return
    const color = this.hexToColor(hex)
    this.currentTheme.colors[token] = color
    this.customColors.set(token, color)
    this.notifyListeners(this.currentTheme)
  }

  /**
   * Get current theme.
   */
  getTheme(): ThemeConfiguration {
    return { ...this.currentTheme }
  }

  /**
   * Set theme name.
   */
  setThemeName(name: string): void {
    this.currentTheme.name = name
    this.notifyListeners(this.currentTheme)
  }

  /**
   * Export theme as CSS variables.
   */
  exportAsCSSVariables(theme?: ThemeConfiguration): string {
    const t = theme ?? this.currentTheme
    const lines: string[] = [':root {']

    for (const [token, value] of Object.entries(t.colors)) {
      lines.push(`  --color-${token}: ${value.hex};`)
    }

    for (const [key, value] of Object.entries(t.borderRadius)) {
      lines.push(`  --radius-${key}: ${value};`)
    }

    for (const [key, value] of Object.entries(t.spacing)) {
      lines.push(`  --spacing-${key}: ${value};`)
    }

    for (const [key, value] of Object.entries(t.fontSize)) {
      lines.push(`  --font-size-${key}: ${value};`)
    }

    for (const [key, value] of Object.entries(t.shadows)) {
      lines.push(`  --shadow-${key}: ${value};`)
    }

    for (const [key, value] of Object.entries(t.transitions)) {
      lines.push(`  --transition-${key}: ${value};`)
    }

    lines.push('}')
    return lines.join('\n')
  }

  /**
   * Export theme as Tailwind config.
   */
  exportAsTailwindConfig(theme?: ThemeConfiguration): string {
    const t = theme ?? this.currentTheme
    const config = {
      theme: {
        extend: {
          colors: Object.fromEntries(
            Object.entries(t.colors).map(([k, v]) => [k, v.hex])
          ),
          borderRadius: t.borderRadius,
          spacing: t.spacing,
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          boxShadow: t.shadows,
          transitionDuration: t.transitions,
        },
      },
    }
    return `/** @type {import('tailwindcss').Config} */\nexport default ${JSON.stringify(config, null, 2)}`
  }

  /**
   * Convert color formats.
   */
  hexToColor(hex: string): ColorValue {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    const rn = r / 255, gn = g / 255, bn = b / 255
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
    const l = (max + min) / 2
    let h = 0, s = 0

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
      else if (max === gn) h = ((bn - rn) / d + 2) / 6
      else h = ((rn - gn) / d + 4) / 6
    }

    return {
      hex,
      rgb: { r, g, b },
      hsl: { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) },
    }
  }

  hslToColor(h: number, s: number, l: number): ColorValue {
    const sn = s / 100
    const ln = l / 100
    const c = (1 - Math.abs(2 * ln - 1)) * sn
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = ln - c / 2

    let r = 0, g = 0, b = 0
    if (h < 60) { r = c; g = x }
    else if (h < 120) { r = x; g = c }
    else if (h < 180) { g = c; b = x }
    else if (h < 240) { g = x; b = c }
    else if (h < 300) { r = x; b = c }
    else { r = c; b = x }

    const rn = Math.round((r + m) * 255)
    const gn = Math.round((g + m) * 255)
    const bn = Math.round((b + m) * 255)

    const hex = `#${rn.toString(16).padStart(2, '0')}${gn.toString(16).padStart(2, '0')}${bn.toString(16).padStart(2, '0')}`

    return {
      hex,
      rgb: { r: rn, g: gn, b: bn },
      hsl: { h: Math.round(h), s: Math.round(s), l: Math.round(l) },
    }
  }

  /**
   * Subscribe to theme changes.
   */
  subscribe(listener: (theme: ThemeConfiguration) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(theme: ThemeConfiguration): void {
    for (const listener of this.listeners) {
      try { listener(theme) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: ThemeBuilderEngine | null = null

export function getThemeBuilderEngine(
  config?: Partial<ThemeBuilderConfig>
): ThemeBuilderEngine {
  if (!instance) {
    instance = new ThemeBuilderEngine(config)
  }
  return instance
}

export function resetThemeBuilderEngine(): void {
  instance = null
}
