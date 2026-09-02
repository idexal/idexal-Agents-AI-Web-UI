/**
 * Context-Aware Search Engine for Idexal Agents.
 * Provides intelligent search that understands developer intent,
 * code semantics, and finds related code across the entire project.
 */

/** Search intent type */
export type SearchIntent =
  | 'find-definition'
  | 'find-usage'
  | 'find-reference'
  | 'find-similar'
  | 'find-related'
  | 'find-pattern'
  | 'find-type'
  | 'find-interface'
  | 'find-import'

/** Code entity type */
export type CodeEntityType =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'variable'
  | 'constant'
  | 'enum'
  | 'module'
  | 'import'
  | 'export'

/** Search result */
export interface ContextSearchResult {
  /** Result ID */
  id: string
  /** File path */
  filePath: string
  /** Line number */
  line: number
  /** Column */
  column: number
  /** Matched code */
  code: string
  /** Context lines */
  context: string[]
  /** Relevance score (0-100) */
  relevance: number
  /** Code entity type */
  entityType: CodeEntityType
  /** Entity name */
  entityName: string
  /** Documentation */
  documentation?: string
  /** Related files */
  relatedFiles: string[]
  /** Definition location */
  definition?: { file: string; line: number }
  /** Usage count */
  usageCount: number
}

/** Search context */
export interface SearchContext {
  /** Current file */
  currentFile?: string
  /** Current line */
  currentLine?: number
  /** Selected text */
  selectedText?: string
  /** Language */
  language: string
  /** Project files */
  projectFiles: Map<string, string>
  /** Import graph */
  importGraph: Map<string, string[]>
  /** Type definitions */
  typeDefinitions: Map<string, CodeEntity>
}

/** Code entity */
export interface CodeEntity {
  /** Entity name */
  name: string
  /** Entity type */
  type: CodeEntityType
  /** File path */
  filePath: string
  /** Line number */
  line: number
  /** End line */
  endLine: number
  /** Documentation */
  documentation?: string
  /** Parameters (for functions) */
  parameters?: string[]
  /** Return type */
  returnType?: string
  /** Modifiers */
  modifiers: string[]
}

/** Search suggestion */
export interface SearchSuggestion {
  /** Suggestion text */
  text: string
  /** Search intent */
  intent: SearchIntent
  /** Confidence (0-1) */
  confidence: number
  /** Source entity */
  entity?: CodeEntity
}

/** Context-aware search config */
export interface ContextAwareSearchConfig {
  /** Enable semantic analysis */
  enableSemanticAnalysis: boolean
  /** Enable code graph */
  enableCodeGraph: boolean
  /** Enable fuzzy matching */
  enableFuzzyMatching: boolean
  /** Max results */
  maxResults: number
  /** Min relevance score */
  minRelevance: number
  /** Context lines to show */
  contextLines: number
  /** Enable search history */
  enableHistory: boolean
}

/**
 * Context-Aware Search Engine.
 */
export class ContextAwareSearchEngine {
  private config: ContextAwareSearchConfig
  private searchHistory: string[] = []
  private listeners: Set<(results: ContextSearchResult[]) => void> = new Set()

  constructor(config: Partial<ContextAwareSearchConfig> = {}) {
    this.config = {
      enableSemanticAnalysis: config.enableSemanticAnalysis ?? true,
      enableCodeGraph: config.enableCodeGraph ?? true,
      enableFuzzyMatching: config.enableFuzzyMatching ?? true,
      maxResults: config.maxResults ?? 50,
      minRelevance: config.minRelevance ?? 20,
      contextLines: config.contextLines ?? 3,
      enableHistory: config.enableHistory ?? true,
    }
  }

  /**
   * Search with context awareness.
   */
  search(query: string, context: SearchContext): ContextSearchResult[] {
    // Analyze query intent
    const intent = this.analyzeIntent(query, context)

    // Build search results based on intent
    let results: ContextSearchResult[] = []

    switch (intent) {
      case 'find-definition':
        results = this.findDefinitions(query, context)
        break
      case 'find-usage':
        results = this.findUsages(query, context)
        break
      case 'find-similar':
        results = this.findSimilar(query, context)
        break
      case 'find-related':
        results = this.findRelated(query, context)
        break
      case 'find-pattern':
        results = this.findPatterns(query, context)
        break
      default:
        results = this.generalSearch(query, context)
    }

    // Boost results from current file
    if (context.currentFile) {
      results = results.map(r => ({
        ...r,
        relevance: r.filePath === context.currentFile
          ? Math.min(100, r.relevance + 20)
          : r.relevance,
      }))
    }

    // Filter and sort
    results = results
      .filter(r => r.relevance >= this.config.minRelevance)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, this.config.maxResults)

    // Update history
    if (this.config.enableHistory) {
      this.searchHistory.push(query)
      if (this.searchHistory.length > 100) {
        this.searchHistory = this.searchHistory.slice(-100)
      }
    }

    this.notifyListeners(results)
    return results
  }

  /**
   * Analyze search intent from query.
   */
  private analyzeIntent(query: string, context: SearchContext): SearchIntent {
    const lower = query.toLowerCase()

    // Intent detection patterns
    if (lower.startsWith('def ') || lower.startsWith('definition ')) return 'find-definition'
    if (lower.startsWith('usage ') || lower.startsWith('used ')) return 'find-usage'
    if (lower.startsWith('ref ') || lower.startsWith('reference ')) return 'find-reference'
    if (lower.startsWith('similar ') || lower.startsWith('like ')) return 'find-similar'
    if (lower.startsWith('related ') || lower.startsWith('related to ')) return 'find-related'
    if (lower.startsWith('pattern ') || lower.startsWith('find pattern')) return 'find-pattern'
    if (lower.startsWith('type ') || lower.startsWith('interface ')) return 'find-type'
    if (lower.startsWith('import ') || lower.startsWith('from ')) return 'find-import'

    // If there's selected text, it's likely a find-usage
    if (context.selectedText) return 'find-usage'

    // If query looks like a function call
    if (query.includes('()') || query.includes('(')) return 'find-definition'

    // Default to general search
    return 'find-reference'
  }

  /**
   * Find definitions of entities.
   */
  private findDefinitions(query: string, context: SearchContext): ContextSearchResult[] {
    const results: ContextSearchResult[] = []
    const name = query.replace(/^(def|definition|class|function|interface|type)\s+/, '').trim()

    for (const [filePath, content] of context.projectFiles) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        const patterns = [
          new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${this.escapeRegex(name)}\\b`),
          new RegExp(`(?:export\\s+)?class\\s+${this.escapeRegex(name)}\\b`),
          new RegExp(`(?:export\\s+)?interface\\s+${this.escapeRegex(name)}\\b`),
          new RegExp(`(?:export\\s+)?type\\s+${this.escapeRegex(name)}\\b`),
          new RegExp(`(?:export\\s+)?const\\s+${this.escapeRegex(name)}\\b`),
        ]

        for (const pattern of patterns) {
          if (pattern.test(line)) {
            results.push({
              id: `def-${filePath}-${i}`,
              filePath,
              line: i + 1,
              column: 0,
              code: line.trim(),
              context: lines.slice(Math.max(0, i - 2), i + 3),
              relevance: 90,
              entityType: this.inferEntityType(line),
              entityName: name,
              relatedFiles: this.findRelatedFiles(name, context),
              usageCount: this.countUsages(name, context),
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Find usages of entities.
   */
  private findUsages(query: string, context: SearchContext): ContextSearchResult[] {
    const results: ContextSearchResult[] = []
    const name = query.replace(/^(usage|used|call|calls|invoked)\s+/, '').trim()

    for (const [filePath, content] of context.projectFiles) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        const regex = new RegExp(`\\b${this.escapeRegex(name)}\\b`)
        if (regex.test(line) && !line.trim().startsWith('//')) {
          const isDefinition = line.match(new RegExp(`(?:function|class|interface|type|const)\\s+${this.escapeRegex(name)}`))
          results.push({
            id: `use-${filePath}-${i}`,
            filePath,
            line: i + 1,
            column: line.indexOf(name),
            code: line.trim(),
            context: lines.slice(Math.max(0, i - 2), i + 3),
            relevance: isDefinition ? 60 : 80,
            entityType: this.inferEntityType(line),
            entityName: name,
            relatedFiles: [],
            usageCount: 0,
          })
        }
      }
    }

    return results
  }

  /**
   * Find similar code patterns.
   */
  private findSimilar(query: string, context: SearchContext): ContextSearchResult[] {
    const results: ContextSearchResult[] = []
    const queryLower = query.toLowerCase()

    for (const [filePath, content] of context.projectFiles) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.toLowerCase()
        const similarity = this.calculateSimilarity(queryLower, line)
        if (similarity > 0.5) {
          results.push({
            id: `sim-${filePath}-${i}`,
            filePath,
            line: i + 1,
            column: 0,
            code: lines[i]!.trim(),
            context: lines.slice(Math.max(0, i - 2), i + 3),
            relevance: Math.round(similarity * 100),
            entityType: this.inferEntityType(lines[i]!),
            entityName: '',
            relatedFiles: [],
            usageCount: 0,
          })
        }
      }
    }

    return results
  }

  /**
   * Find related code.
   */
  private findRelated(query: string, context: SearchContext): ContextSearchResult[] {
    const results: ContextSearchResult[] = []
    const name = query.replace(/^(related|related to)\s+/, '').trim()

    // Find the entity
    for (const [filePath, content] of context.projectFiles) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (lines[i]!.includes(name)) {
          // Find imports and exports in this file
          for (const imp of context.importGraph.get(filePath) ?? []) {
            results.push({
              id: `rel-${filePath}-${imp}`,
              filePath: imp,
              line: 1,
              column: 0,
              code: `import from '${imp}'`,
              context: [],
              relevance: 70,
              entityType: 'module',
              entityName: imp,
              relatedFiles: [filePath],
              usageCount: 0,
            })
          }
        }
      }
    }

    return results
  }

  /**
   * Find code patterns.
   */
  private findPatterns(query: string, context: SearchContext): ContextSearchResult[] {
    const results: ContextSearchResult[] = []

    // Convert query to regex pattern
    try {
      const pattern = new RegExp(query, 'gi')
      for (const [filePath, content] of context.projectFiles) {
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i]!)) {
            results.push({
              id: `pat-${filePath}-${i}`,
              filePath,
              line: i + 1,
              column: 0,
              code: lines[i]!.trim(),
              context: lines.slice(Math.max(0, i - 2), i + 3),
              relevance: 75,
              entityType: this.inferEntityType(lines[i]!),
              entityName: '',
              relatedFiles: [],
              usageCount: 0,
            })
          }
        }
      }
    } catch {
      // Invalid regex, fall back to literal search
      return this.generalSearch(query, context)
    }

    return results
  }

  /**
   * General text search.
   */
  private generalSearch(query: string, context: SearchContext): ContextSearchResult[] {
    const results: ContextSearchResult[] = []
    const queryLower = query.toLowerCase()

    for (const [filePath, content] of context.projectFiles) {
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const lineLower = lines[i]!.toLowerCase()
        if (lineLower.includes(queryLower)) {
          const relevance = this.calculateRelevance(query, lines[i]!)
          results.push({
            id: `gen-${filePath}-${i}`,
            filePath,
            line: i + 1,
            column: lineLower.indexOf(queryLower),
            code: lines[i]!.trim(),
            context: lines.slice(Math.max(0, i - 2), i + 3),
            relevance,
            entityType: this.inferEntityType(lines[i]!),
            entityName: '',
            relatedFiles: [],
            usageCount: 0,
          })
        }
      }
    }

    return results
  }

  /**
   * Calculate similarity between two strings.
   */
  private calculateSimilarity(a: string, b: string): number {
    const aTokens = a.split(/\s+/)
    const bTokens = b.split(/\s+/)
    const intersection = aTokens.filter(t => bTokens.includes(t))
    return intersection.length / Math.max(aTokens.length, bTokens.length)
  }

  /**
   * Calculate relevance score.
   */
  private calculateRelevance(query: string, line: string): number {
    let score = 50

    // Exact match
    if (line.includes(query)) score += 30

    // Case-insensitive match
    if (line.toLowerCase().includes(query.toLowerCase())) score += 10

    // Start of line
    if (line.trim().startsWith(query)) score += 10

    return Math.min(100, score)
  }

  /**
   * Infer entity type from code line.
   */
  private inferEntityType(line: string): CodeEntityType {
    const trimmed = line.trim()
    if (trimmed.match(/(?:export\s+)?(?:async\s+)?function\s/)) return 'function'
    if (trimmed.match(/(?:export\s+)?class\s/)) return 'class'
    if (trimmed.match(/(?:export\s+)?interface\s/)) return 'interface'
    if (trimmed.match(/(?:export\s+)?type\s/)) return 'type'
    if (trimmed.match(/(?:export\s+)?const\s/)) return 'constant'
    if (trimmed.match(/(?:export\s+)?let\s/)) return 'variable'
    if (trimmed.match(/(?:export\s+)?enum\s/)) return 'enum'
    if (trimmed.match(/import\s/)) return 'import'
    if (trimmed.match(/export\s/)) return 'export'
    return 'variable'
  }

  /**
   * Find related files based on imports.
   */
  private findRelatedFiles(name: string, context: SearchContext): string[] {
    const related: string[] = []
    for (const [filePath, imports] of context.importGraph) {
      for (const imp of imports) {
        if (imp.includes(name)) {
          related.push(filePath)
        }
      }
    }
    return related
  }

  /**
   * Count usages of an entity.
   */
  private countUsages(name: string, context: SearchContext): number {
    let count = 0
    for (const [, content] of context.projectFiles) {
      const regex = new RegExp(`\\b${this.escapeRegex(name)}\\b`)
      const matches = content.match(regex)
      count += matches?.length ?? 0
    }
    return count
  }

  /**
   * Get search suggestions based on context.
   */
  getSuggestions(context: SearchContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []

    // Suggest based on current file
    if (context.currentFile && context.projectFiles.has(context.currentFile)) {
      const content = context.projectFiles.get(context.currentFile)!
      const functions = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g)
      if (functions) {
        for (const func of functions.slice(0, 5)) {
          const name = func.match(/function\s+(\w+)/)?.[1]
          if (name) {
            suggestions.push({
              text: `Find usages of ${name}`,
              intent: 'find-usage',
              confidence: 0.8,
            })
          }
        }
      }
    }

    // Suggest based on search history
    if (this.config.enableHistory && this.searchHistory.length > 0) {
      const recent = this.searchHistory.slice(-5)
      for (const query of recent) {
        suggestions.push({
          text: `Search again: ${query}`,
          intent: 'find-reference',
          confidence: 0.5,
        })
      }
    }

    return suggestions
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Subscribe to search results.
   */
  subscribe(listener: (results: ContextSearchResult[]) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(results: ContextSearchResult[]): void {
    for (const listener of this.listeners) {
      try { listener(results) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: ContextAwareSearchEngine | null = null

export function getContextAwareSearchEngine(
  config?: Partial<ContextAwareSearchConfig>
): ContextAwareSearchEngine {
  if (!instance) {
    instance = new ContextAwareSearchEngine(config)
  }
  return instance
}

export function resetContextAwareSearchEngine(): void {
  instance = null
}
