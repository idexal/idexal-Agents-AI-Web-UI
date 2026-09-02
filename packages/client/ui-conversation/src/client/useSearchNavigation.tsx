/**
 * Search Navigation Hook for Idexal Agents.
 * Provides navigation between search results in a conversation.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { SearchResult } from './AdvancedSearch.ts'

/** Navigation state */
export interface SearchNavigationState {
  /** Current match index (0-based) */
  currentMatch: number
  /** Total number of matches */
  totalMatches: number
  /** Whether there are matches */
  hasMatches: boolean
  /** Whether at the first match */
  isFirst: boolean
  /** Whether at the last match */
  isLast: boolean
  /** Current search result */
  currentResult: SearchResult | null
  /** All search results */
  results: SearchResult[]
}

/** Navigation actions */
export interface SearchNavigationActions {
  /** Go to next match */
  next: () => void
  /** Go to previous match */
  previous: () => void
  /** Go to first match */
  first: () => void
  /** Go to last match */
  last: () => void
  /** Go to specific match index */
  goTo: (index: number) => void
  /** Clear navigation */
  clear: () => void
}

/** Hook options */
export interface UseSearchNavigationOptions {
  /** Search results */
  results: SearchResult[]
  /** Callback when navigating to a result */
  onNavigate?: (result: SearchResult, index: number) => void
  /** Auto-scroll to match */
  autoScroll?: boolean
  /** Scroll offset from top (px) */
  scrollOffset?: number
}

/** Hook return type */
export interface UseSearchNavigationReturn extends SearchNavigationState {
  /** Navigation actions */
  actions: SearchNavigationActions
  /** Ref to attach to the container */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Register a match element for navigation */
  registerMatch: (index: number, element: HTMLElement | null) => void
}

/**
 * Hook for navigating between search results.
 */
export function useSearchNavigation(
  options: UseSearchNavigationOptions
): UseSearchNavigationReturn {
  const {
    results,
    onNavigate,
    autoScroll = true,
    scrollOffset = 100,
  } = options

  const [currentMatch, setCurrentMatch] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const matchRefs = useRef<Map<number, HTMLElement>>(new Map())

  const totalMatches = results.length
  const hasMatches = totalMatches > 0
  const isFirst = currentMatch === 0
  const isLast = currentMatch === totalMatches - 1
  const currentResult = hasMatches ? results[currentMatch] ?? null : null

  // Scroll to current match
  const scrollToMatch = useCallback(
    (index: number) => {
      if (!autoScroll) return

      const element = matchRefs.current.get(index)
      if (element) {
        const rect = element.getBoundingClientRect()
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const targetTop = rect.top + scrollTop - scrollOffset

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth',
        })
      }
    },
    [autoScroll, scrollOffset]
  )

  // Navigate to result
  const navigateToResult = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalMatches) return

      setCurrentMatch(index)
      scrollToMatch(index)

      const result = results[index]
      if (result && onNavigate) {
        onNavigate(result, index)
      }
    },
    [totalMatches, results, onNavigate, scrollToMatch]
  )

  // Navigation actions
  const next = useCallback(() => {
    if (!isLast) {
      navigateToResult(currentMatch + 1)
    }
  }, [currentMatch, isLast, navigateToResult])

  const previous = useCallback(() => {
    if (!isFirst) {
      navigateToResult(currentMatch - 1)
    }
  }, [currentMatch, isFirst, navigateToResult])

  const first = useCallback(() => {
    navigateToResult(0)
  }, [navigateToResult])

  const last = useCallback(() => {
    navigateToResult(totalMatches - 1)
  }, [navigateToResult, totalMatches])

  const goTo = useCallback(
    (index: number) => {
      navigateToResult(index)
    },
    [navigateToResult]
  )

  const clear = useCallback(() => {
    setCurrentMatch(0)
    matchRefs.current.clear()
  }, [])

  // Reset when results change
  useEffect(() => {
    if (results.length === 0) {
      setCurrentMatch(0)
    } else if (currentMatch >= results.length) {
      setCurrentMatch(results.length - 1)
    }
  }, [results.length, currentMatch])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if (e.key === 'F3' || (e.key === 'g' && e.ctrlKey)) {
        e.preventDefault()
        if (e.shiftKey) {
          previous()
        } else {
          next()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [next, previous])

  // Register match element
  const registerMatch = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      matchRefs.current.set(index, element)
    } else {
      matchRefs.current.delete(index)
    }
  }, [])

  return {
    currentMatch,
    totalMatches,
    hasMatches,
    isFirst,
    isLast,
    currentResult,
    results,
    actions: {
      next,
      previous,
      first,
      last,
      goTo,
      clear,
    },
    containerRef,
    registerMatch,
  }
}

/** SearchMatchHighlight Component Props */
export interface SearchMatchHighlightProps {
  /** Match index for navigation */
  matchIndex: number
  /** Whether this is the current match */
  isCurrent?: boolean
  /** Register callback from useSearchNavigation */
  registerMatch?: (index: number, element: HTMLElement | null) => void
  /** Children to wrap */
  children: React.ReactNode
  /** Custom class name */
  className?: string
}

/**
 * SearchMatchHighlight Component.
 * Wraps a search match and registers it for navigation.
 */
export function SearchMatchHighlight({
  matchIndex,
  isCurrent = false,
  registerMatch,
  children,
  className = '',
}: SearchMatchHighlightProps) {
  const ref = useCallback(
    (node: HTMLElement | null) => {
      registerMatch?.(matchIndex, node)
    },
    [matchIndex, registerMatch]
  )

  const style: React.CSSProperties = {
    backgroundColor: isCurrent ? '#fbbf24' : '#fef08a',
    padding: '1px 2px',
    borderRadius: '2px',
    fontWeight: isCurrent ? 600 : 500,
    boxShadow: isCurrent ? '0 0 0 2px #f59e0b' : 'none',
    transition: 'all 0.15s ease',
  }

  return (
    <span
      ref={ref}
      className={`search-match-highlight ${isCurrent ? 'current' : ''} ${className}`}
      style={style}
      data-match-index={matchIndex}
    >
      {children}
    </span>
  )
}
