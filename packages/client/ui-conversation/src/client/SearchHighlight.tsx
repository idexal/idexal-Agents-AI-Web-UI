/**
 * Search Highlight Component for Idexal Agents.
 * Highlights search matches in conversation messages.
 */

import React, { useMemo } from 'react'

/** Highlight configuration */
export interface HighlightConfig {
  /** Search text to highlight */
  searchText: string
  /** Highlight color (CSS color value) */
  highlightColor?: string
  /** Text color for highlighted text */
  highlightTextColor?: string
  /** Whether to be case sensitive */
  caseSensitive?: boolean
  /** Whether to match whole words only */
  wholeWords?: boolean
  /** Maximum number of highlights */
  maxHighlights?: number
  /** Context characters around highlight */
  contextLength?: number
}

/** Highlight result */
export interface HighlightResult {
  /** Original text */
  original: string
  /** Text with highlights */
  highlighted: string
  /** Number of matches found */
  matchCount: number
  /** Array of match positions */
  matches: Array<{ start: number; end: number; text: string }>
}

/** Highlight styles */
interface HighlightStyles {
  container: React.CSSProperties | undefined
  highlight: React.CSSProperties | undefined
  activeHighlight: React.CSSProperties | undefined
  matchCount: React.CSSProperties | undefined
}

/** Default styles */
const DEFAULT_STYLES: HighlightStyles = {
  container: {
    position: 'relative',
    lineHeight: '1.6',
  },
  highlight: {
    backgroundColor: '#fef08a',
    color: '#1f2937',
    padding: '1px 2px',
    borderRadius: '2px',
    fontWeight: 500,
  },
  activeHighlight: {
    backgroundColor: '#fbbf24',
    color: '#1f2937',
    padding: '1px 2px',
    borderRadius: '2px',
    fontWeight: 600,
    boxShadow: '0 0 0 2px #f59e0b',
  },
  matchCount: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
}

/** Labels for different languages */
const HIGHLIGHT_LABELS = {
  en: {
    matchFound: 'match found',
    matchesFound: 'matches found',
    noMatches: 'No matches found',
    nextMatch: 'Next match',
    prevMatch: 'Previous match',
  },
  ar: {
    matchFound: 'تطابق',
    matchesFound: 'تطابقات',
    noMatches: 'لا توجد نتائج',
    nextMatch: 'التطابق التالي',
    prevMatch: 'التطابق السابق',
  },
  zh: {
    matchFound: '个匹配',
    matchesFound: '个匹配',
    noMatches: '未找到匹配',
    nextMatch: '下一个匹配',
    prevMatch: '上一个匹配',
  },
}

/**
 * Highlight search matches in text.
 */
export function highlightText(
  text: string,
  config: HighlightConfig
): HighlightResult {
  const {
    searchText,
    caseSensitive = false,
    wholeWords = false,
    maxHighlights = 1000,
  } = config

  if (!searchText) {
    return {
      original: text,
      highlighted: text,
      matchCount: 0,
      matches: [],
    }
  }

  // Build regex pattern
  let pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (wholeWords) {
    pattern = `\\b${pattern}\\b`
  }

  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(pattern, flags)

  const matches: Array<{ start: number; end: number; text: string }> = []
  let match
  let count = 0

  while ((match = regex.exec(text)) !== null && count < maxHighlights) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    })
    count++
  }

  // Build highlighted string
  if (matches.length === 0) {
    return {
      original: text,
      highlighted: text,
      matchCount: 0,
      matches: [],
    }
  }

  let highlighted = ''
  let lastIndex = 0

  for (const m of matches) {
    // Add text before match
    highlighted += escapeHtml(text.substring(lastIndex, m.start))
    // Add highlighted match
    highlighted += `<mark class="search-highlight">${escapeHtml(m.text)}</mark>`
    lastIndex = m.end
  }

  // Add remaining text
  highlighted += escapeHtml(text.substring(lastIndex))

  return {
    original: text,
    highlighted,
    matchCount: matches.length,
    matches,
  }
}

/**
 * SearchHighlight Component Props.
 */
export interface SearchHighlightProps {
  /** Text to highlight */
  text: string
  /** Search text */
  searchText: string
  /** Custom styles */
  styles: Partial<HighlightStyles> | undefined
  /** Language for labels */
  language: 'en' | 'ar' | 'zh' | undefined
  /** Show match count */
  showMatchCount: boolean | undefined
  /** Callback when highlight is clicked */
  onHighlightClick: ((matchIndex: number) => void) | undefined
}

/**
 * SearchHighlight Component.
 */
export function SearchHighlight({
  text,
  searchText,
  styles: customStyles,
  language = 'en',
  showMatchCount = false,
  onHighlightClick,
}: SearchHighlightProps) {
  const labels = HIGHLIGHT_LABELS[language] ?? HIGHLIGHT_LABELS.en
  const styles = useMemo(
    () => ({
      ...DEFAULT_STYLES,
      ...customStyles,
    }),
    [customStyles]
  )

  const highlightResult = useMemo(
    () => highlightText(text, { searchText }),
    [text, searchText]
  )

  if (!searchText) {
    return <span style={styles.container}>{text}</span>
  }

  return (
    <span style={styles.container}>
      <span
        dangerouslySetInnerHTML={{ __html: highlightResult.highlighted }}
        onClick={(e) => {
          if (onHighlightClick) {
            const target = e.target as HTMLElement
            if (target.classList.contains('search-highlight')) {
              // Find which match was clicked
              const allHighlights = e.currentTarget.querySelectorAll(
                '.search-highlight'
              )
              const index = Array.from(allHighlights).indexOf(target)
              if (index !== -1) {
                onHighlightClick(index)
              }
            }
          }
        }}
        style={{ cursor: onHighlightClick ? 'pointer' : 'default' }}
      />
      {showMatchCount && highlightResult.matchCount > 0 && (
        <span style={styles.matchCount}>
          {highlightResult.matchCount}{' '}
          {highlightResult.matchCount === 1
            ? labels.matchFound
            : labels.matchesFound}
        </span>
      )}
    </span>
  )
}

/**
 * SearchHighlightBlock Component Props.
 */
export interface SearchHighlightBlockProps {
  /** Text content (may include code blocks) */
  content: string
  /** Search text */
  searchText: string
  /** Language for labels */
  language?: 'en' | 'ar' | 'zh'
  /** Custom highlight color */
  highlightColor?: string
  /** Custom active highlight color */
  activeHighlightColor?: string
}

/**
 * SearchHighlightBlock Component.
 * Handles highlighting in text that may contain code blocks.
 */
export function SearchHighlightBlock({
  content,
  searchText,
  language = 'en',
  highlightColor,
}: SearchHighlightBlockProps) {
  const segments = useMemo(() => {
    if (!searchText) {
      return [{ type: 'text' as const, content }]
    }

    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g)

    return parts.map((part) => {
      const isCodeBlock = part.startsWith('```')
      return {
        type: isCodeBlock ? ('code' as const) : ('text' as const),
        content: part,
      }
    })
  }, [content, searchText])

  return (
    <div>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          // Don't highlight code blocks
          return <code key={index}>{segment.content}</code>
        }

        const highlightStyles = highlightColor ? { highlight: { backgroundColor: highlightColor } } : {}
        return (
          <SearchHighlight
            key={index}
            text={segment.content}
            searchText={searchText}
            language={language}
            styles={Object.keys(highlightStyles).length > 0 ? highlightStyles : undefined}
            showMatchCount={undefined}
            onHighlightClick={undefined}
          />
        )
      })}
    </div>
  )
}

/**
 * SearchMatchInfo Component Props.
 */
export interface SearchMatchInfoProps {
  /** Current match index (0-based) */
  currentMatch: number
  /** Total number of matches */
  totalMatches: number
  /** Language for labels */
  language?: 'en' | 'ar' | 'zh'
  /** Callback for next match */
  onNext?: () => void
  /** Callback for previous match */
  onPrevious?: () => void
}

/**
 * SearchMatchInfo Component.
 * Shows match count and navigation buttons.
 */
export function SearchMatchInfo({
  currentMatch,
  totalMatches,
  language = 'en',
  onNext,
  onPrevious,
}: SearchMatchInfoProps) {
  const labels = HIGHLIGHT_LABELS[language] ?? HIGHLIGHT_LABELS.en

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: 'var(--color-background-secondary, #f3f4f6)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--color-text, #374151)',
  }

  const buttonStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: '1px solid var(--color-border, #d1d5db)',
    borderRadius: '4px',
    background: 'var(--color-background, #fff)',
    cursor: 'pointer',
    fontSize: '12px',
  }

  const counterStyle: React.CSSProperties = {
    fontWeight: 500,
    minWidth: '80px',
    textAlign: 'center',
  }

  if (totalMatches === 0) {
    return (
      <div style={containerStyle}>
        <span>{labels.noMatches}</span>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <button
        style={buttonStyle}
        onClick={onPrevious}
        disabled={currentMatch <= 0}
        title={labels.prevMatch}
      >
        ▲
      </button>
      <span style={counterStyle}>
        {currentMatch + 1} / {totalMatches}
      </span>
      <button
        style={buttonStyle}
        onClick={onNext}
        disabled={currentMatch >= totalMatches - 1}
        title={labels.nextMatch}
      >
        ▼
      </button>
    </div>
  )
}

/**
 * escapeHtml - Helper to escape HTML special characters.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
