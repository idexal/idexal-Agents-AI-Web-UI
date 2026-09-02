/**
 * Dark Mode theme system for Idexal Agents.
 * Supports system preference detection and manual toggle.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  /** Current theme setting */
  theme: Theme
  /** Resolved theme (light or dark) */
  resolvedTheme: ResolvedTheme
  /** Set theme */
  setTheme: (theme: Theme) => void
  /** Toggle between light and dark */
  toggleTheme: () => void
  /** Whether system preference is dark */
  isSystemDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Theme provider component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('idexal-theme') as Theme) || 'system'
    }
    return 'system'
  })
  const [isSystemDark, setIsSystemDark] = useState(false)

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsSystemDark(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches)
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  // Apply theme to document
  const applyTheme = useCallback((resolved: ResolvedTheme) => {
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.classList.toggle('light', resolved === 'light')
    
    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', resolved === 'dark' ? '#0A1628' : '#ffffff')
    }
  }, [])

  // Apply theme when it changes
  useEffect(() => {
    const resolved = theme === 'system' 
      ? (isSystemDark ? 'dark' : 'light')
      : theme
    
    applyTheme(resolved)
    localStorage.setItem('idexal-theme', theme)
  }, [theme, isSystemDark, applyTheme])

  const resolvedTheme = theme === 'system' 
    ? (isSystemDark ? 'dark' : 'light')
    : theme

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'light'
      return isSystemDark ? 'light' : 'dark'
    })
  }, [isSystemDark])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme, isSystemDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to use theme context.
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * CSS variables for light and dark themes.
 */
export const themeStyles = `
  :root,
  [data-theme="light"] {
    /* Colors */
    --color-primary: #2563EB;
    --color-primary-hover: #1D4ED8;
    --color-primary-light: #EFF6FF;
    --color-secondary: #64748B;
    --color-success: #10B981;
    --color-warning: #F59E0B;
    --color-error: #EF4444;
    --color-info: #3B82F6;

    /* Backgrounds */
    --bg-primary: #FFFFFF;
    --bg-secondary: #F8FAFC;
    --bg-tertiary: #F1F5F9;
    --bg-hover: #F1F5F9;
    --bg-active: #E2E8F0;
    --bg-overlay: rgba(0, 0, 0, 0.5);

    /* Text */
    --text-primary: #0F172A;
    --text-secondary: #475569;
    --text-tertiary: #94A3B8;
    --text-inverse: #FFFFFF;
    --text-link: #2563EB;

    /* Borders */
    --border-primary: #E2E8F0;
    --border-secondary: #CBD5E1;
    --border-focus: #2563EB;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

    /* Brand */
    --brand-primary: #0A1628;
    --brand-secondary: #2563EB;
    --brand-accent: #00D4FF;
  }

  [data-theme="dark"] {
    /* Colors */
    --color-primary: #3B82F6;
    --color-primary-hover: #60A5FA;
    --color-primary-light: #1E3A5F;
    --color-secondary: #94A3B8;
    --color-success: #34D399;
    --color-warning: #FBBF24;
    --color-error: #F87171;
    --color-info: #60A5FA;

    /* Backgrounds */
    --bg-primary: #0F172A;
    --bg-secondary: #1E293B;
    --bg-tertiary: #334155;
    --bg-hover: #334155;
    --bg-active: #475569;
    --bg-overlay: rgba(0, 0, 0, 0.7);

    /* Text */
    --text-primary: #F1F5F9;
    --text-secondary: #94A3B8;
    --text-tertiary: #64748B;
    --text-inverse: #0F172A;
    --text-link: #60A5FA;

    /* Borders */
    --border-primary: #334155;
    --border-secondary: #475569;
    --border-focus: #3B82F6;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3);

    /* Brand */
    --brand-primary: #0A1628;
    --brand-secondary: #3B82F6;
    --brand-accent: #00D4FF;
  }

  /* Transitions for smooth theme switching */
  * {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }

  /* Base styles */
  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-secondary);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-tertiary);
  }
`

/**
 * Theme toggle button component.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, isSystemDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ]

  const currentTheme = themes.find(t => t.value === theme) || themes[2]!

  return (
    <div className={`theme-toggle ${className}`}>
      <button
        className="theme-toggle-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme"
      >
        <span className="theme-icon">{currentTheme.icon}</span>
        <span className="theme-label">{currentTheme.label}</span>
        <span className="theme-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="theme-dropdown">
          {themes.map((t) => (
            <button
              key={t.value}
              className={`theme-option ${theme === t.value ? 'active' : ''}`}
              onClick={() => {
                setTheme(t.value)
                setIsOpen(false)
              }}
            >
              <span className="option-icon">{t.icon}</span>
              <span className="option-label">{t.label}</span>
              {t.value === 'system' && (
                <span className="option-hint">
                  ({isSystemDark ? 'Dark' : 'Light'})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .theme-toggle {
          position: relative;
        }

        .theme-toggle-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-toggle-button:hover {
          background: var(--bg-hover);
          border-color: var(--border-secondary);
        }

        .theme-icon {
          font-size: 16px;
        }

        .theme-label {
          font-size: 14px;
          color: var(--text-primary);
        }

        .theme-arrow {
          font-size: 10px;
          color: var(--text-tertiary);
          transition: transform 0.2s;
        }

        .theme-toggle.open .theme-arrow {
          transform: rotate(180deg);
        }

        .theme-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          overflow: hidden;
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }

        .theme-option:hover {
          background: var(--bg-hover);
        }

        .theme-option.active {
          background: var(--bg-active);
        }

        .option-icon {
          font-size: 16px;
        }

        .option-label {
          font-size: 14px;
          color: var(--text-primary);
          flex: 1;
        }

        .option-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  )
}

export default ThemeProvider
