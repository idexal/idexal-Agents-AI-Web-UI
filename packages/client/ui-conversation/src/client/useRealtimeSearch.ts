/**
 * React hook for real-time search in Idexal Agents.
 * Provides search functionality with live updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RealtimeSearchIndex,
  getRealtimeSearchIndex,
  type MessageEvent,
  type IndexStats,
  type RealtimeSearchConfig,
} from './RealtimeSearchIndex.ts'
import type { SearchQuery, SearchResult, SearchStats } from './AdvancedSearch.ts'

/** Hook options */
export interface UseRealtimeSearchOptions {
  /** Enable real-time search */
  enabled?: boolean
  /** Debounce delay for search (ms) */
  debounceMs?: number
  /** Maximum results to return */
  maxResults?: number
  /** Auto-index conversations on mount */
  autoIndex?: boolean
  /** Search index configuration */
  indexConfig?: Partial<RealtimeSearchConfig>
}

/** Hook return type */
export interface UseRealtimeSearchReturn {
  /** Search results */
  results: SearchResult[]
  /** Search statistics */
  stats: SearchStats | null
  /** Index statistics */
  indexStats: IndexStats
  /** Whether search is in progress */
  isSearching: boolean
  /** Whether index is loading */
  isIndexing: boolean
  /** Search suggestions */
  suggestions: string[]
  /** Perform a search */
  search: (query: SearchQuery) => void
  /** Index a conversation */
  indexConversation: (conversation: {
    id: string
    title: string
    messages: Array<{
      id: string
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: Date
      attachments?: Array<{ type: string }>
      tags?: string[]
    }>
    createdAt: Date
    updatedAt: Date
  }) => void
  /** Handle a message event */
  handleMessageEvent: (event: MessageEvent) => void
  /** Get search suggestions */
  getSuggestions: (partialInput: string) => void
  /** Clear search results */
  clearResults: () => void
  /** Clear the index */
  clearIndex: () => void
  /** Optimize the index */
  optimizeIndex: () => void
  /** Export the index */
  exportIndex: () => ReturnType<RealtimeSearchIndex['exportIndex']>
  /** Import index data */
  importIndex: (data: ReturnType<RealtimeSearchIndex['exportIndex']>) => void
}

/**
 * Hook for real-time search functionality.
 */
export function useRealtimeSearch(
  options: UseRealtimeSearchOptions = {}
): UseRealtimeSearchReturn {
  const {
    enabled = true,
    debounceMs = 200,
    maxResults = 100,
    indexConfig = {},
  } = options

  // State
  const [results, setResults] = useState<SearchResult[]>([])
  const [stats, setStats] = useState<SearchStats | null>(null)
  const [indexStats, setIndexStats] = useState<IndexStats>({
    totalMessages: 0,
    totalConversations: 0,
    totalTokens: 0,
    lastUpdate: new Date(),
    estimatedSizeBytes: 0,
  })
  const [isSearching, setIsSearching] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Refs
  const indexRef = useRef<RealtimeSearchIndex | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastQueryRef = useRef<SearchQuery | null>(null)

  // Initialize index
  useEffect(() => {
    if (!enabled) return

    indexRef.current = getRealtimeSearchIndex(indexConfig)

    // Update stats periodically
    const statsInterval = setInterval(() => {
      if (indexRef.current) {
        setIndexStats(indexRef.current.getStats())
      }
    }, 5000)

    return () => {
      clearInterval(statsInterval)
    }
  }, [enabled, indexConfig])

  // Subscribe to message events
  useEffect(() => {
    if (!enabled || !indexRef.current) return

    const unsubscribe = indexRef.current.onMessageEvent(() => {
      // Re-run search if there's an active query
      if (lastQueryRef.current) {
        performSearch(lastQueryRef.current)
      }
    })

    return unsubscribe
  }, [enabled])

  // Perform search
  const performSearch = useCallback(
    (query: SearchQuery) => {
      if (!indexRef.current || !enabled) return

      setIsSearching(true)
      lastQueryRef.current = query

      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        try {
          const searchResult = indexRef.current!.search(query, maxResults)
          setResults(searchResult.results)
          setStats(searchResult.stats)
        } catch (error) {
          console.error('Search error:', error)
        } finally {
          setIsSearching(false)
        }
      }, debounceMs)
    },
    [enabled, maxResults, debounceMs]
  )

  // Index a conversation
  const indexConversation = useCallback(
    (conversation: Parameters<RealtimeSearchIndex['indexConversation']>[0]) => {
      if (!indexRef.current || !enabled) return

      setIsIndexing(true)
      try {
        indexRef.current.indexConversation(conversation)
        setIndexStats(indexRef.current.getStats())
      } catch (error) {
        console.error('Index error:', error)
      } finally {
        setIsIndexing(false)
      }
    },
    [enabled]
  )

  // Handle message event
  const handleMessageEvent = useCallback(
    (event: MessageEvent) => {
      if (!indexRef.current || !enabled) return

      indexRef.current.handleMessageEvent(event)
    },
    [enabled]
  )

  // Get suggestions
  const getSuggestions = useCallback(
    (partialInput: string) => {
      if (!indexRef.current || !enabled) return

      const newSuggestions = indexRef.current.getSuggestions(partialInput)
      setSuggestions(newSuggestions)
    },
    [enabled]
  )

  // Clear results
  const clearResults = useCallback(() => {
    setResults([])
    setStats(null)
    lastQueryRef.current = null
  }, [])

  // Clear index
  const clearIndex = useCallback(() => {
    if (!indexRef.current) return

    indexRef.current.clear()
    setIndexStats(indexRef.current.getStats())
    clearResults()
  }, [clearResults])

  // Optimize index
  const optimizeIndex = useCallback(() => {
    if (!indexRef.current) return

    indexRef.current.optimize()
    setIndexStats(indexRef.current.getStats())
  }, [])

  // Export index
  const exportIndex = useCallback(() => {
    if (!indexRef.current) {
      return { conversations: [], messages: [] }
    }

    return indexRef.current.exportIndex()
  }, [])

  // Import index
  const importIndex = useCallback(
    (data: ReturnType<RealtimeSearchIndex['exportIndex']>) => {
      if (!indexRef.current) return

      indexRef.current.importIndex(data)
      setIndexStats(indexRef.current.getStats())
    },
    []
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return {
    results,
    stats,
    indexStats,
    isSearching,
    isIndexing,
    suggestions,
    search: performSearch,
    indexConversation,
    handleMessageEvent,
    getSuggestions,
    clearResults,
    clearIndex,
    optimizeIndex,
    exportIndex,
    importIndex,
  }
}

/**
 * Hook for debounced search suggestions.
 */
export function useSearchSuggestions(
  getSuggestions: (partialInput: string) => string[],
  debounceMs: number = 150
): {
  suggestions: string[]
  updateSuggestions: (input: string) => void
  clearSuggestions: () => void
} {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateSuggestions = useCallback(
    (input: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const newSuggestions = getSuggestions(input)
        setSuggestions(newSuggestions)
      }, debounceMs)
    },
    [getSuggestions, debounceMs]
  )

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { suggestions, updateSuggestions, clearSuggestions }
}
