/**
 * Advanced Search Engine for Idexal Agents.
 * AI-powered code search with semantic understanding, fuzzy matching,
 * and context-aware results ranking.
 */

/** Search mode */
export type SearchMode = 'text' | 'regex' | 'semantic' | 'symbol' | 'reference'

/** Search scope */
export type SearchScope = 'file' | 'project' | 'selection' | 'recent'

/** Search result */
export interface SearchResult {
  id: string
  file: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  /** Matched text */
  text: string
  /** Context lines */
  context: string
  /** Match score 0-1 */
  score: number
  /** Match type */
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'symbol' | 'reference'
  /** File type */
  fileType: string
  /** Last modified timestamp */
  lastModified?: number
}

/** Search suggestion */
export interface SearchSuggestion {
  text: string
  type: 'query' | 'symbol' | 'file' | 'recent'
  score: number
}

/** Search history */
export interface SearchHistoryEntry {
  query: string
  mode: SearchMode
  scope: SearchScope
  resultCount: number
  timestamp: number
}

/** Search config */
export interface AdvancedSearchConfig {
  maxResults: number
  fuzzyThreshold: number
  enableSemantic: boolean
  enableHistory: boolean
  maxHistory: number
}

/**
 * Advanced Search Engine.
 */
export class AdvancedSearchEngine {
  private history: SearchHistoryEntry[] = []
  private config: AdvancedSearchConfig
  private listeners: Set<(event: SearchEvent) => void> = new Set()

  constructor(config: Partial<AdvancedSearchConfig> = {}) {
    this.config = {
      maxResults: config.maxResults ?? 100,
      fuzzyThreshold: config.fuzzyThreshold ?? 0.6,
      enableSemantic: config.enableSemantic ?? true,
      enableHistory: config.enableHistory ?? true,
      maxHistory: config.maxHistory ?? 50,
    }
  }

  /**
   * Search code with the given query.
   */
  search(query: string, files: Array<{ path: string; content: string }>, options: {
    mode?: SearchMode
    scope?: SearchScope
    caseSensitive?: boolean
    wholeWord?: boolean
    maxResults?: number
  } = {}): SearchResult[] {
    const mode = options.mode ?? 'text'
    const caseSensitive = options.caseSensitive ?? false
    const wholeWord = options.wholeWord ?? false
    const maxResults = options.maxResults ?? this.config.maxResults

    const results: SearchResult[] = []

    for (const file of files) {
      const lines = file.content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? ''
        let matches: Array<{ index: number; length: number }> = []

        if (mode === 'text' || mode === 'reference') {
          // Text search
          const searchLine = caseSensitive ? line : line.toLowerCase()
          const searchQuery = caseSensitive ? query : query.toLowerCase()
          let startIndex = 0

          while (true) {
            const idx = searchLine.indexOf(searchQuery, startIndex)
            if (idx === -1) break

            if (wholeWord) {
              const before = idx > 0 ? (searchLine[idx - 1] ?? ' ') : ' '
              const afterIdx = idx + query.length
              const after = afterIdx < searchLine.length ? (searchLine[afterIdx] ?? ' ') : ' '
              if (/\w/.test(before) || /\w/.test(after)) {
                startIndex = idx + 1
                continue
              }
            }

            matches.push({ index: idx, length: query.length })
            startIndex = idx + 1
          }
        } else if (mode === 'regex') {
          // Regex search
          try {
            const regex = new RegExp(query, caseSensitive ? 'g' : 'gi')
            let match
            while ((match = regex.exec(line)) !== null) {
              matches.push({ index: match.index, length: match[0].length })
              if (!regex.global) break
            }
          } catch { /* invalid regex */ }
        } else if (mode === 'symbol') {
          // Symbol search (function, class, variable names)
          const symbolPattern = new RegExp(`\\b${query}\\b`, caseSensitive ? 'g' : 'gi')
          let match
          while ((match = symbolPattern.exec(line)) !== null) {
            matches.push({ index: match.index, length: match[0].length })
          }
        } else if (mode === 'semantic') {
          // Semantic search (fuzzy matching)
          const score = this.fuzzyMatch(query, line)
          if (score >= this.config.fuzzyThreshold) {
            matches.push({ index: 0, length: line.length })
          }
        }

        for (const match of matches) {
          if (results.length >= maxResults) break

          const contextStart = Math.max(0, i - 2)
          const contextEnd = Math.min(lines.length - 1, i + 2)
          const context = lines.slice(contextStart, contextEnd + 1).join('\n')

          const score = mode === 'semantic'
            ? this.fuzzyMatch(query, line)
            : this.calculateRelevance(query, line, match.index)

          results.push({
            id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file: file.path,
            line: i + 1,
            column: match.index + 1,
            endLine: i + 1,
            endColumn: match.index + match.length + 1,
            text: line.trim(),
            context,
            score,
            matchType: mode === 'semantic' ? 'semantic' : mode === 'symbol' ? 'symbol' : 'exact',
            fileType: file.path.split('.').pop() ?? 'unknown',
          })
        }
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score)

    // Record history
    if (this.config.enableHistory) {
      this.recordHistory(query, options.scope ?? 'project', results.length)
    }

    this.notifyListeners({ type: 'search-complete', results, query })
    return results
  }

  /**
   * Get search suggestions.
   */
  getSuggestions(query: string, files: Array<{ path: string; content: string }>): SearchSuggestion[] {
    if (!query) return this.getRecentSearches()

    const suggestions: SearchSuggestion[] = []
    const queryLower = query.toLowerCase()

    // Symbol suggestions
    for (const file of files) {
      const symbols = file.content.match(/\b(?:function|class|interface|type|const|let|var)\s+(\w+)/g) ?? []
      for (const symbol of symbols) {
        const name = symbol.replace(/^(?:function|class|interface|type|const|let|var)\s+/, '')
        if (name.toLowerCase().includes(queryLower)) {
          suggestions.push({ text: name, type: 'symbol', score: name.toLowerCase().startsWith(queryLower) ? 1 : 0.7 })
        }
      }
      if (suggestions.length > 20) break
    }

    // File suggestions
    for (const file of files) {
      const name = file.path.split('/').pop() ?? file.path
      if (name.toLowerCase().includes(queryLower)) {
        suggestions.push({ text: name, type: 'file', score: 0.6 })
      }
    }

    // Recent searches
    for (const entry of this.history) {
      if (entry.query.toLowerCase().includes(queryLower)) {
        suggestions.push({ text: entry.query, type: 'recent', score: 0.5 })
      }
    }

    // Deduplicate and sort
    const unique = new Map<string, SearchSuggestion>()
    for (const s of suggestions) {
      const existing = unique.get(s.text)
      if (!existing || s.score > existing.score) {
        unique.set(s.text, s)
      }
    }

    return Array.from(unique.values()).sort((a, b) => b.score - a.score).slice(0, 10)
  }

  /**
   * Get search history.
   */
  getHistory(): SearchHistoryEntry[] {
    return [...this.history]
  }

  private fuzzyMatch(query: string, target: string): number {
    const queryLower = query.toLowerCase()
    const targetLower = target.toLowerCase()

    // Exact match
    if (targetLower.includes(queryLower)) return 1

    // Character-by-character fuzzy match
    let qi = 0
    let matched = 0
    let lastMatchIdx = -1

    for (let ti = 0; ti < targetLower.length && qi < queryLower.length; ti++) {
      if (targetLower[ti] === queryLower[qi]) {
        matched++
        // Bonus for consecutive matches
        if (lastMatchIdx === ti - 1) matched += 0.1
        lastMatchIdx = ti
        qi++
      }
    }

    return qi === queryLower.length ? matched / queryLower.length : 0
  }

  private calculateRelevance(query: string, text: string, matchIndex: number): number {
    let score = 0.5

    // Exact match bonus
    if (text.includes(query)) score += 0.3

    // Start of line bonus
    if (matchIndex === 0) score += 0.1

    // Short text bonus (more relevant)
    if (text.length < 80) score += 0.05

    // Code vs comment
    if (!text.trim().startsWith('//') && !text.trim().startsWith('*')) score += 0.05

    return Math.min(1, score)
  }

  private recordHistory(query: string, scope: SearchScope, resultCount: number): void {
    this.history.push({ query, mode: 'text', scope, resultCount, timestamp: Date.now() })
    if (this.history.length > this.config.maxHistory) {
      this.history.shift()
    }
  }

  private getRecentSearches(): SearchSuggestion[] {
    const recent = new Map<string, SearchSuggestion>()
    for (const entry of this.history.reverse()) {
      if (!recent.has(entry.query)) {
        recent.set(entry.query, { text: entry.query, type: 'recent', score: 0.5 })
      }
    }
    return Array.from(recent.values()).slice(0, 5)
  }

  subscribe(listener: (event: SearchEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: SearchEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Search event */
export interface SearchEvent {
  type: 'search-complete' | 'search-started'
  results?: SearchResult[]
  query?: string
}

/** Singleton */
let instance: AdvancedSearchEngine | null = null

export function getAdvancedSearchEngine(config?: Partial<AdvancedSearchConfig>): AdvancedSearchEngine {
  if (!instance) instance = new AdvancedSearchEngine(config)
  return instance
}

export function resetAdvancedSearchEngine(): void { instance = null }
