/**
 * Enhanced Dark Mode System for Idexal Agents.
 * Advanced theme management with system preference detection.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

/** Theme types */
export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
export type SystemTheme = 'light' | 'dark' | 'no-preference'

/** Theme configuration */
export interface ThemeConfig {
  /** Default theme when no preference is stored */
  defaultTheme: Theme
  /** localStorage key */
  storageKey: string
  /** Enable smooth transitions */
  enableTransitions: boolean
  /** Transition duration in ms */
  transitionDuration: number
  /** Enable system preference detection */
  detectSystemPreference: boolean
  /** Enable OS-level theme sync */
  syncWithOS: boolean
  /** Callback when theme changes */
  onThemeChange: ((theme: ResolvedTheme) => void) | undefined
  /** Callback when system preference changes */
  onSystemPreferenceChange: ((isDark: boolean) => void) | undefined
}

/** Theme state */
export interface ThemeState {
  /** Current theme setting */
  theme: Theme
  /** Resolved theme (light or dark) */
  resolvedTheme: ResolvedTheme
  /** System preference */
  systemPreference: SystemTheme
  /** Whether system is dark */
  isSystemDark: boolean
  /** Whether theme is loading */
  isLoading: boolean
}

/** Default configuration */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'system',
  storageKey: 'idexal-theme',
  enableTransitions: true,
  transitionDuration: 200,
  detectSystemPreference: true,
  syncWithOS: true,
  onThemeChange: undefined,
  onSystemPreferenceChange: undefined,
}

/**
 * Enhanced Dark Mode Manager.
 */
export class DarkModeManager {
  private config: ThemeConfig
  private state: ThemeState
  private mediaQuery: MediaQueryList | null = null
  private listeners: Set<(state: ThemeState) => void> = new Set()
  private transitionTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(config: Partial<ThemeConfig> = {}) {
    this.config = { ...DEFAULT_THEME_CONFIG, ...config }

    // Initialize state
    const savedTheme = this.getSavedTheme()
    const systemPreference = this.getSystemPreference()
    const isSystemDark = systemPreference === 'dark'
    const resolvedTheme = this.resolveTheme(savedTheme, isSystemDark)

    this.state = {
      theme: savedTheme,
      resolvedTheme,
      systemPreference,
      isSystemDark,
      isLoading: false,
    }

    // Setup system preference detection
    if (this.config.detectSystemPreference) {
      this.setupSystemDetection()
    }

    // Apply initial theme
    this.applyTheme(resolvedTheme)
  }

  /**
   * Get current theme state.
   */
  getState(): ThemeState {
    return { ...this.state }
  }

  /**
   * Get the current resolved theme.
   */
  getResolvedTheme(): ResolvedTheme {
    return this.state.resolvedTheme
  }

  /**
   * Set theme.
   */
  setTheme(theme: Theme): void {
    this.state.theme = theme
    this.state.resolvedTheme = this.resolveTheme(theme, this.state.isSystemDark)
    
    this.saveTheme(theme)
    this.applyTheme(this.state.resolvedTheme)
    this.config.onThemeChange?.(this.state.resolvedTheme)
    this.notifyListeners()
  }

  /**
   * Toggle between light and dark.
   */
  toggleTheme(): void {
    const newTheme = this.state.resolvedTheme === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
  }

  /**
   * Cycle through themes: light -> dark -> system -> light
   */
  cycleTheme(): void {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(this.state.theme)
    const nextIndex = (currentIndex + 1) % themes.length
    this.setTheme(themes[nextIndex]!)
  }

  /**
   * Check if system preference is dark.
   */
  isSystemDark(): boolean {
    return this.state.isSystemDark
  }

  /**
   * Get system preference.
   */
  getSystemPreference(): SystemTheme {
    if (typeof window === 'undefined') return 'no-preference'
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (mediaQuery.matches) return 'dark'
    
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)')
    if (lightQuery.matches) return 'light'
    
    return 'no-preference'
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: ThemeState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Destroy the manager and cleanup.
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemChange)
    }
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout)
    }
    this.listeners.clear()
  }

  private setupSystemDetection(): void {
    if (typeof window === 'undefined') return

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQuery.addEventListener('change', this.handleSystemChange)
  }

  private handleSystemChange = (e: MediaQueryListEvent): void => {
    this.state.isSystemDark = e.matches
    this.state.systemPreference = e.matches ? 'dark' : 'light'

    this.config.onSystemPreferenceChange?.(e.matches)

    // Update resolved theme if using system preference
    if (this.state.theme === 'system') {
      this.state.resolvedTheme = e.matches ? 'dark' : 'light'
      this.applyTheme(this.state.resolvedTheme)
      this.config.onThemeChange?.(this.state.resolvedTheme)
    }

    this.notifyListeners()
  }

  private resolveTheme(theme: Theme, isSystemDark: boolean): ResolvedTheme {
    if (theme === 'system') {
      return isSystemDark ? 'dark' : 'light'
    }
    return theme
  }

  private getSavedTheme(): Theme {
    if (typeof window === 'undefined') return this.config.defaultTheme
    
    const saved = localStorage.getItem(this.config.storageKey)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
    return this.config.defaultTheme
  }

  private saveTheme(theme: Theme): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.config.storageKey, theme)
  }

  private applyTheme(resolved: ResolvedTheme): void {
    if (typeof document === 'undefined') return

    // Apply transition class if enabled
    if (this.config.enableTransitions) {
      document.documentElement.classList.add('theme-transitioning')
      
      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout)
      }
      
      this.transitionTimeout = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning')
      }, this.config.transitionDuration)
    }

    // Apply theme attributes
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.classList.toggle('light', resolved === 'light')

    // Update meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff')
    }

    // Update color-scheme for native elements
    document.documentElement.style.colorScheme = resolved
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Theme listener error:', error)
      }
    }
  }
}

/**
 * Hook to use dark mode.
 */
export function useDarkMode(config?: Partial<ThemeConfig>) {
  const managerRef = useRef<DarkModeManager | null>(null)
  const [state, setState] = useState<ThemeState>(() => {
    const manager = new DarkModeManager(config)
    managerRef.current = manager
    return manager.getState()
  })

  useEffect(() => {
    const manager = managerRef.current!
    const unsub = manager.subscribe(setState)
    return () => {
      unsub()
      manager.destroy()
    }
  }, [])

  const setTheme = useCallback((theme: Theme) => {
    managerRef.current?.setTheme(theme)
  }, [])

  const toggleTheme = useCallback(() => {
    managerRef.current?.toggleTheme()
  }, [])

  const cycleTheme = useCallback(() => {
    managerRef.current?.cycleTheme()
  }, [])

  return {
    ...state,
    setTheme,
    toggleTheme,
    cycleTheme,
  }
}

/**
 * Hook to detect system color scheme preference.
 */
export function useSystemPreference(): SystemTheme {
  const [preference, setPreference] = useState<SystemTheme>('no-preference')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

    const updatePreference = () => {
      if (darkQuery.matches) setPreference('dark')
      else if (lightQuery.matches) setPreference('light')
      else setPreference('no-preference')
    }

    updatePreference()

    darkQuery.addEventListener('change', updatePreference)
    lightQuery.addEventListener('change', updatePreference)

    return () => {
      darkQuery.removeEventListener('change', updatePreference)
      lightQuery.removeEventListener('change', updatePreference)
    }
  }, [])

  return preference
}

/**
 * Hook to check if user prefers reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(query.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches)
    }

    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  return prefersReduced
}

/**
 * Hook to get theme-aware styles.
 */
export function useThemeStyles() {
  const { resolvedTheme } = useDarkMode()
  const isDark = resolvedTheme === 'dark'

  return {
    isDark,
    resolvedTheme,
    colors: isDark ? DARK_COLORS : LIGHT_COLORS,
    className: isDark ? 'dark' : 'light',
  }
}

/** Light theme colors */
const LIGHT_COLORS = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  secondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
}

/** Dark theme colors */
const DARK_COLORS = {
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  secondary: '#94a3b8',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  border: '#334155',
  borderLight: '#1e293b',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
}

export type ThemeColors = typeof LIGHT_COLORS

/**
 * CSS for dark mode transitions.
 */
export const DARK_MODE_TRANSITION_CSS = `
  /* Smooth theme transitions */
  .theme-transitioning *,
  .theme-transitioning *::before,
  .theme-transitioning *::after {
    transition: background-color 0.2s ease, 
                color 0.2s ease, 
                border-color 0.2s ease,
                box-shadow 0.2s ease !important;
  }
`

/**
 * Singleton instance.
 */
let instance: DarkModeManager | null = null

export function getDarkModeManager(config?: Partial<ThemeConfig>): DarkModeManager {
  if (!instance) {
    instance = new DarkModeManager(config)
  }
  return instance
}
