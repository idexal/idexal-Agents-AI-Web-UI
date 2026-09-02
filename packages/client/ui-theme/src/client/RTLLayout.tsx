/**
 * RTL Layout Component for Idexal Agents.
 * Provides RTL-aware layout utilities and components.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

/** Direction type */
export type Direction = 'ltr' | 'rtl'

/** RTL Context type */
interface RTLContextType {
  /** Current direction */
  direction: Direction
  /** Whether RTL is active */
  isRTL: boolean
  /** Set direction */
  setDirection: (dir: Direction) => void
  /** Toggle direction */
  toggleDirection: () => void
}

const RTLContext = createContext<RTLContextType | undefined>(undefined)

/** RTL Provider Props */
export interface RTLProviderProps {
  /** Children */
  children: React.ReactNode
  /** Initial direction */
  defaultDirection?: Direction
  /** Persist preference in localStorage */
  persist?: boolean
  /** localStorage key */
  storageKey?: string
}

/**
 * RTL Provider Component.
 */
export function RTLProvider({
  children,
  defaultDirection = 'ltr',
  persist = true,
  storageKey = 'idexal-direction',
}: RTLProviderProps) {
  const [direction, setDirectionState] = useState<Direction>(() => {
    if (persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'ltr' || stored === 'rtl') {
        return stored
      }
    }
    return defaultDirection
  })

  // Apply direction to document
  useEffect(() => {
    document.documentElement.setAttribute('dir', direction)
    document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en'
  }, [direction])

  // Persist direction
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, direction)
    }
  }, [direction, persist, storageKey])

  const setDirection = useCallback((dir: Direction) => {
    setDirectionState(dir)
  }, [])

  const toggleDirection = useCallback(() => {
    setDirectionState(prev => (prev === 'ltr' ? 'rtl' : 'ltr'))
  }, [])

  return (
    <RTLContext.Provider value={{ direction, isRTL: direction === 'rtl', setDirection, toggleDirection }}>
      {children}
    </RTLContext.Provider>
  )
}

/**
 * Hook to use RTL context.
 */
export function useRTL() {
  const context = useContext(RTLContext)
  if (!context) {
    throw new Error('useRTL must be used within an RTLProvider')
  }
  return context
}

/**
 * Hook to get direction-aware styles.
 */
export function useDirectionStyles() {
  const { isRTL } = useRTL()

  return {
    isRTL,

    // Margin
    marginStart: (value: string) => ({
      [isRTL ? 'marginRight' : 'marginLeft']: value,
    }),
    marginEnd: (value: string) => ({
      [isRTL ? 'marginLeft' : 'marginRight']: value,
    }),

    // Padding
    paddingStart: (value: string) => ({
      [isRTL ? 'paddingRight' : 'paddingLeft']: value,
    }),
    paddingEnd: (value: string) => ({
      [isRTL ? 'paddingLeft' : 'paddingRight']: value,
    }),

    // Position
    insetStart: (value: string) => ({
      [isRTL ? 'right' : 'left']: value,
    }),
    insetEnd: (value: string) => ({
      [isRTL ? 'left' : 'right']: value,
    }),

    // Border
    borderStart: (value: string) => ({
      [isRTL ? 'borderRight' : 'borderLeft']: value,
    }),
    borderEnd: (value: string) => ({
      [isRTL ? 'borderLeft' : 'borderRight']: value,
    }),

    // Text
    textAlign: isRTL ? 'right' as const : 'left' as const,

    // Float
    float: isRTL ? 'right' as const : 'left' as const,
  }
}

/** RTL Layout Props */
export interface RTLLayoutProps {
  /** Children */
  children: React.ReactNode
  /** Additional className */
  className?: string
  /** Additional styles */
  style?: React.CSSProperties
}

/**
 * RTL Layout Component.
 * Wraps content with proper RTL styling.
 */
export function RTLLayout({ children, className = '', style }: RTLLayoutProps) {
  const { direction } = useRTL()

  return (
    <div
      dir={direction}
      lang={direction === 'rtl' ? 'ar' : 'en'}
      className={`rtl-layout ${className}`}
      style={{
        direction,
        textAlign: direction === 'rtl' ? 'right' : 'left',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** RTL Flex Props */
export interface RTLFlexProps {
  /** Children */
  children: React.ReactNode
  /** Flex direction */
  direction?: 'row' | 'column'
  /** Additional className */
  className?: string
  /** Additional styles */
  style?: React.CSSProperties
}

/**
 * RTL-aware Flex component.
 */
export function RTLFlex({
  children,
  direction = 'row',
  className = '',
  style,
}: RTLFlexProps) {
  const { isRTL } = useRTL()

  const flexDirection = direction === 'row'
    ? (isRTL ? 'row-reverse' : 'row')
    : direction

  return (
    <div
      className={`rtl-flex ${className}`}
      style={{
        display: 'flex',
        flexDirection,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** RTL Text Props */
export interface RTLTextProps {
  /** Text content */
  children: React.ReactNode
  /** Text alignment */
  align?: 'start' | 'end' | 'center' | 'justify'
  /** Additional className */
  className?: string
  /** Additional styles */
  style?: React.CSSProperties
}

/**
 * RTL-aware Text component.
 */
export function RTLText({
  children,
  align = 'start',
  className = '',
  style,
}: RTLTextProps) {
  const { isRTL } = useRTL()

  const textAlign = align === 'start'
    ? (isRTL ? 'right' : 'left')
    : align === 'end'
      ? (isRTL ? 'left' : 'right')
      : align

  return (
    <div
      className={`rtl-text ${className}`}
      style={{
        textAlign,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** RTL Icon Props */
export interface RTLIconProps {
  /** Icon content (emoji or SVG) */
  icon: React.ReactNode
  /** Icon position */
  position?: 'start' | 'end'
  /** Children (text) */
  children: React.ReactNode
  /** Additional className */
  className?: string
  /** Additional styles */
  style?: React.CSSProperties
}

/**
 * RTL-aware Icon with Text component.
 */
export function RTLIcon({
  icon,
  position = 'start',
  children,
  className = '',
  style,
}: RTLIconProps) {
  const { isRTL } = useRTL()

  const isIconStart = position === 'start' ? !isRTL : isRTL

  return (
    <span
      className={`rtl-icon ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        ...style,
      }}
    >
      {isIconStart && <span className="icon">{icon}</span>}
      <span className="text">{children}</span>
      {!isIconStart && <span className="icon">{icon}</span>}
    </span>
  )
}

export default RTLProvider
