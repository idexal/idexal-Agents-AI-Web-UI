/**
 * RTL Integration for Idexal Agents.
 * Provides hooks and utilities for automatic RTL support based on locale.
 */

import { createContext, useContext, useEffect, useState, useMemo } from 'react'

/** RTL languages supported by the platform */
const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'] as const

/** Direction type */
export type Direction = 'ltr' | 'rtl'

/** RTL context state */
interface RTLContextState {
  /** Current text direction based on locale */
  direction: Direction
  /** Whether RTL is active */
  isRTL: boolean
  /** Current locale code */
  locale: string
}

const RTLContext = createContext<RTLContextState>({
  direction: 'ltr',
  isRTL: false,
  locale: 'en',
})

/** RTL Provider Props */
export interface RTLIntegrationProviderProps {
  /** Children */
  children: React.ReactNode
  /** Override direction (ignores locale detection when provided) */
  direction?: Direction
  /** Override locale (ignores document.lang when provided) */
  locale?: string
}

/**
 * RTL Integration Provider.
 * Automatically detects RTL from document.lang or provided locale.
 */
export function RTLIntegrationProvider({
  children,
  direction: overrideDirection,
  locale: overrideLocale,
}: RTLIntegrationProviderProps) {
  const [state, setState] = useState<RTLContextState>(() => {
    if (overrideDirection) {
      return {
        direction: overrideDirection,
        isRTL: overrideDirection === 'rtl',
        locale: overrideLocale ?? 'en',
      }
    }

    const locale = overrideLocale ?? detectLocale()
    const isRTL = isRTLLocale(locale)

    return {
      direction: isRTL ? 'rtl' : 'ltr',
      isRTL,
      locale,
    }
  })

  useEffect(() => {
    if (overrideDirection) {
      setState({
        direction: overrideDirection,
        isRTL: overrideDirection === 'rtl',
        locale: overrideLocale ?? state.locale,
      })
      return
    }

    const locale = overrideLocale ?? detectLocale()
    const isRTL = isRTLLocale(locale)

    setState({
      direction: isRTL ? 'rtl' : 'ltr',
      isRTL,
      locale,
    })

    // Listen for locale changes via MutationObserver on <html lang>
    const observer = new MutationObserver(() => {
      const newLocale = overrideLocale ?? detectLocale()
      const newIsRTL = isRTLLocale(newLocale)
      setState({
        direction: newIsRTL ? 'rtl' : 'ltr',
        isRTL: newIsRTL,
        locale: newLocale,
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang', 'dir'],
    })

    return () => observer.disconnect()
  }, [overrideDirection, overrideLocale])

  return (
    <RTLContext.Provider value={state}>
      {children}
    </RTLContext.Provider>
  )
}

/**
 * Hook to get current RTL state.
 */
export function useRTLState(): RTLContextState {
  return useContext(RTLContext)
}

/**
 * Hook for direction-aware inline styles.
 * Returns a set of helper functions that produce correct CSS properties
 * regardless of text direction.
 */
export function useRTLStyles() {
  const { isRTL, direction } = useRTLState()

  return useMemo(() => ({
    isRTL,
    direction,

    /** Margin: margin-inline-start */
    marginStart: (value: string | number) => ({
      [isRTL ? 'marginRight' : 'marginLeft']: typeof value === 'number' ? `${value}px` : value,
    }),

    /** Margin: margin-inline-end */
    marginEnd: (value: string | number) => ({
      [isRTL ? 'marginLeft' : 'marginRight']: typeof value === 'number' ? `${value}px` : value,
    }),

    /** Padding: padding-inline-start */
    paddingStart: (value: string | number) => ({
      [isRTL ? 'paddingRight' : 'paddingLeft']: typeof value === 'number' ? `${value}px` : value,
    }),

    /** Padding: padding-inline-end */
    paddingEnd: (value: string | number) => ({
      [isRTL ? 'paddingLeft' : 'paddingRight']: typeof value === 'number' ? `${value}px` : value,
    }),

    /** Position: left/right for inline-start */
    insetStart: (value: string | number) => ({
      [isRTL ? 'right' : 'left']: typeof value === 'number' ? `${value}px` : value,
    }),

    /** Position: right/left for inline-end */
    insetEnd: (value: string | number) => ({
      [isRTL ? 'left' : 'right']: typeof value === 'number' ? `${value}px` : value,
    }),

    /** Border: border-inline-start */
    borderStart: (value: string) => ({
      [isRTL ? 'borderRight' : 'borderLeft']: value,
    }),

    /** Border: border-inline-end */
    borderEnd: (value: string) => ({
      [isRTL ? 'borderLeft' : 'borderRight']: value,
    }),

    /** Text alignment: start/end */
    textAlignStart: { textAlign: isRTL ? 'right' as const : 'left' as const },
    textAlignEnd: { textAlign: isRTL ? 'left' as const : 'right' as const },

    /** Flex direction for row layouts */
    flexRow: { flexDirection: isRTL ? 'row-reverse' as const : 'row' as const },

    /** Float direction */
    floatStart: { float: isRTL ? 'right' as const : 'left' as const },
    floatEnd: { float: isRTL ? 'left' as const : 'right' as const },

    /** Transform for arrow icons that need to flip */
    flipX: { transform: isRTL ? 'scaleX(-1)' : 'none' },

    /** Box shadow for directional shadows */
    shadowStart: (value: string) => ({
      [isRTL ? 'boxShadow' : 'boxShadow']: isRTL ? `-${value}` : value,
    }),

    /** Combined direction container style */
    containerStyle: {
      direction,
      textAlign: isRTL ? 'right' as const : 'left' as const,
    },
  }), [isRTL, direction])
}

/**
 * Hook to translate text with automatic RTL-aware formatting.
 * Handles number formatting and text alignment.
 */
export function useRTLAwareText() {
  const { isRTL } = useRTLState()

  return useMemo(() => ({
    /** Format a number considering locale */
    formatNumber: (num: number): string => {
      return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(num)
    },

    /** Format a date considering locale */
    formatDate: (date: Date): string => {
      return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date)
    },

    /** Format relative time */
    formatRelativeTime: (date: Date): string => {
      const rtf = new Intl.RelativeTimeFormat(isRTL ? 'ar-SA' : 'en-US', { numeric: 'auto' })
      const diff = Date.now() - date.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) return rtf.format(-days, 'day')
      if (hours > 0) return rtf.format(-hours, 'hour')
      if (minutes > 0) return rtf.format(-minutes, 'minute')
      return rtf.format(-seconds, 'second')
    },

    /** Get the appropriate arrow character for navigation */
    arrowLeft: isRTL ? '\u2192' : '\u2190',
    arrowRight: isRTL ? '\u2190' : '\u2192',
    arrowUp: '\u2191',
    arrowDown: '\u2193',
  }), [isRTL])
}

/**
 * Higher-order component that injects RTL props.
 */
export function withRTL<P extends object>(
  Component: React.ComponentType<P & RTLContextState>
): React.FC<P> {
  return function RTLWrappedComponent(props: P) {
    const rtlState = useRTLState()
    return <Component {...props} {...rtlState} />
  }
}

/** Detect locale from document */
function detectLocale(): string {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang?.split('-')[0] ?? 'en'
}

/** Check if a locale is RTL */
function isRTLLocale(locale: string): boolean {
  const primary = locale.split('-')[0]?.toLowerCase() ?? locale.toLowerCase()
  return RTL_LOCALES.includes(primary as typeof RTL_LOCALES[number])
}

export default RTLIntegrationProvider
