/**
 * Snippet Manager Engine — Code snippet storage and management.
 *
 * Stores, categorizes, searches, and manages code snippets with metadata,
 * tags, and versioning. Supports import/export and sharing.
 *
 * @module SnippetManager
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Snippet language. */
export type SnippetLanguage = string;

/** Snippet category. */
export type SnippetCategory =
  | 'utility'
  | 'component'
  | 'hook'
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'constant'
  | 'config'
  | 'test'
  | 'snippet'
  | 'boilerplate'
  | 'pattern'
  | 'algorithm'
  | 'data-structure';

/** A code snippet. */
export interface Snippet {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly language: SnippetLanguage;
  readonly category: SnippetCategory;
  readonly tags: readonly string[];
  readonly author: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly version: number;
  readonly usageCount: number;
  readonly isFavorite: boolean;
  readonly isPublic: boolean;
}

/** Snippet search query. */
export interface SnippetSearchQuery {
  readonly text?: string;
  readonly language?: SnippetLanguage;
  readonly category?: SnippetCategory;
  readonly tags?: readonly string[];
  readonly author?: string;
  readonly minUsageCount?: number;
  readonly isFavorite?: boolean;
  readonly sortBy: 'title' | 'createdAt' | 'updatedAt' | 'usageCount' | 'relevance';
  readonly sortOrder: 'asc' | 'desc';
  readonly limit: number;
  readonly offset: number;
}

/** Snippet search result. */
export interface SnippetSearchResult {
  readonly snippets: readonly Snippet[];
  readonly total: number;
  readonly hasMore: boolean;
}

/** Snippet statistics. */
export interface SnippetStatistics {
  readonly totalSnippets: number;
  readonly byLanguage: Record<string, number>;
  readonly byCategory: Record<string, number>;
  readonly topTags: readonly { readonly tag: string; readonly count: number }[];
  readonly recentlyUsed: readonly Snippet[];
  readonly favoritesCount: number;
}

/** Snippet export format. */
export type SnippetExportFormat = 'json' | 'yaml' | 'markdown' | 'vscode';

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export interface SnippetManagerConfig {
  readonly storageKey: string;
  readonly maxSnippets: number;
  readonly maxSnippetSize: number;
  readonly autoSave: boolean;
  readonly enableVersioning: boolean;
}

const SNIPPET_DEFAULT_CONFIG: SnippetManagerConfig = {
  storageKey: 'idexal-snippets',
  maxSnippets: 10000,
  maxSnippetSize: 100000,
  autoSave: true,
  enableVersioning: true,
}

export interface SnippetManagerEvent {
  readonly type: 'create' | 'update' | 'delete' | 'search' | 'import' | 'export';
  readonly timestamp: number;
  readonly data: unknown;
}

export class SnippetManagerEngine {
  private config: SnippetManagerConfig
  private snippets: Map<string, Snippet> = new Map()
  private eventListeners: Array<(event: SnippetManagerEvent) => void> = []
  private idCounter = 0

  constructor(config: Partial<SnippetManagerConfig> = {}) {
    this.config = { ...SNIPPET_DEFAULT_CONFIG, ...config }
    this.loadFromStorage()
  }

  /** Create a new snippet. */
  create(snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'usageCount' | 'isFavorite'>): Snippet {
    const id = `snippet-${++this.idCounter}-${Date.now()}`
    const now = Date.now()

    const newSnippet: Snippet = {
      ...snippet,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      usageCount: 0,
      isFavorite: false,
    }

    this.snippets.set(id, newSnippet)
    this.saveToStorage()

    this.emit({
      type: 'create',
      timestamp: now,
      data: { id, title: snippet.title },
    })

    return newSnippet
  }

  /** Update an existing snippet. */
  update(id: string, updates: Partial<Omit<Snippet, 'id' | 'createdAt'>>): Snippet | undefined {
    const existing = this.snippets.get(id)
    if (!existing) return undefined

    const updated: Snippet = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      version: existing.version + 1,
    }

    this.snippets.set(id, updated)
    this.saveToStorage()

    this.emit({
      type: 'update',
      timestamp: Date.now(),
      data: { id, version: updated.version },
    })

    return updated
  }

  /** Delete a snippet. */
  delete(id: string): boolean {
    const existed = this.snippets.has(id)
    if (!existed) return false

    this.snippets.delete(id)
    this.saveToStorage()

    this.emit({
      type: 'delete',
      timestamp: Date.now(),
      data: { id },
    })

    return true
  }

  /** Get a snippet by ID. */
  get(id: string): Snippet | undefined {
    const snippet = this.snippets.get(id)
    if (snippet) {
      // Increment usage count
      this.update(id, { usageCount: snippet.usageCount + 1 })
    }
    return snippet
  }

  /** Search for snippets. */
  search(query: SnippetSearchQuery): SnippetSearchResult {
    let results = Array.from(this.snippets.values())

    // Apply filters
    if (query.text) {
      const lowerText = query.text.toLowerCase()
      results = results.filter(s =>
        s.title.toLowerCase().includes(lowerText) ||
        s.description.toLowerCase().includes(lowerText) ||
        s.code.toLowerCase().includes(lowerText) ||
        s.tags.some(t => t.toLowerCase().includes(lowerText))
      )
    }

    if (query.language) {
      results = results.filter(s => s.language === query.language)
    }

    if (query.category) {
      results = results.filter(s => s.category === query.category)
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(s =>
        query.tags!.some(t => s.tags.includes(t))
      )
    }

    if (query.author) {
      results = results.filter(s => s.author === query.author)
    }

    if (query.minUsageCount !== undefined) {
      results = results.filter(s => s.usageCount >= query.minUsageCount!)
    }

    if (query.isFavorite !== undefined) {
      results = results.filter(s => s.isFavorite === query.isFavorite)
    }

    // Sort
    results.sort((a, b) => {
      let comparison = 0
      switch (query.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'createdAt':
          comparison = a.createdAt - b.createdAt
          break
        case 'updatedAt':
          comparison = a.updatedAt - b.updatedAt
          break
        case 'usageCount':
          comparison = a.usageCount - b.usageCount
          break
        case 'relevance':
          // Simple relevance: title match > description match > code match
          comparison = 0
          break
      }
      return query.sortOrder === 'desc' ? -comparison : comparison
    })

    const total = results.length
    const paginated = results.slice(query.offset, query.offset + query.limit)

    this.emit({
      type: 'search',
      timestamp: Date.now(),
      data: { query, total },
    })

    return {
      snippets: paginated,
      total,
      hasMore: query.offset + query.limit < total,
    }
  }

  /** Toggle favorite status. */
  toggleFavorite(id: string): boolean {
    const snippet = this.snippets.get(id)
    if (!snippet) return false

    const updated = this.update(id, { isFavorite: !snippet.isFavorite })
    return updated?.isFavorite ?? false
  }

  /** Get statistics. */
  getStatistics(): SnippetStatistics {
    const all = Array.from(this.snippets.values())

    const byLanguage: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}

    for (const snippet of all) {
      byLanguage[snippet.language] = (byLanguage[snippet.language] || 0) + 1
      byCategory[snippet.category] = (byCategory[snippet.category] || 0) + 1
      for (const tag of snippet.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const recentlyUsed = all
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5)

    const favoritesCount = all.filter(s => s.isFavorite).length

    return {
      totalSnippets: all.length,
      byLanguage,
      byCategory,
      topTags,
      recentlyUsed,
      favoritesCount,
    }
  }

  /** Export snippets. */
  export(format: SnippetExportFormat, ids?: readonly string[]): string {
    const snippets = ids
      ? ids.map(id => this.snippets.get(id)).filter((s): s is Snippet => s !== undefined)
      : Array.from(this.snippets.values())

    switch (format) {
      case 'json':
        return JSON.stringify(snippets, null, 2)

      case 'yaml':
        return this.toYaml(snippets)

      case 'markdown':
        return this.toMarkdown(snippets)

      case 'vscode':
        return this.toVsCode(snippets)

      default:
        return JSON.stringify(snippets, null, 2)
    }
  }

  /** Import snippets. */
  import(data: string, format: SnippetExportFormat): number {
    let imported = 0

    try {
      let snippets: Snippet[]

      switch (format) {
        case 'json':
          snippets = JSON.parse(data)
          break

        case 'yaml':
          snippets = this.fromYaml(data)
          break

        case 'markdown':
          snippets = this.fromMarkdown(data)
          break

        case 'vscode':
          snippets = this.fromVsCode(data)
          break

        default:
          return 0
      }

      for (const snippet of snippets) {
        // Generate new ID to avoid conflicts
        const newId = `snippet-${++this.idCounter}-${Date.now()}`
        const newSnippet: Snippet = {
          ...snippet,
          id: newId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          usageCount: 0,
          isFavorite: false,
        }
        this.snippets.set(newId, newSnippet)
        imported++
      }

      this.saveToStorage()

      this.emit({
        type: 'import',
        timestamp: Date.now(),
        data: { count: imported, format },
      })
    } catch {
      // Import failed
    }

    return imported
  }

  /** Clear all snippets. */
  clear(): void {
    this.snippets.clear()
    this.saveToStorage()
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.config.storageKey)
      if (data) {
        const parsed = JSON.parse(data) as Snippet[]
        for (const snippet of parsed) {
          this.snippets.set(snippet.id, snippet)
          // Update idCounter to avoid conflicts
          const match = snippet.id.match(/snippet-(\d+)/)
          if (match?.[1]) {
            const num = parseInt(match[1], 10)
            if (num >= this.idCounter) this.idCounter = num + 1
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.snippets.values())
      localStorage.setItem(this.config.storageKey, JSON.stringify(data))
    } catch {
      // Ignore storage errors
    }
  }

  private toYaml(snippets: readonly Snippet[]): string {
    return snippets.map(s =>
      `- id: ${s.id}\n  title: "${s.title}"\n  description: "${s.description}"\n  language: ${s.language}\n  category: ${s.category}\n  tags: [${s.tags.join(', ')}]\n  code: |\n${s.code.split('\n').map(l => `    ${l}`).join('\n')}`
    ).join('\n\n')
  }

  private toMarkdown(snippets: readonly Snippet[]): string {
    const lines: string[] = ['# Code Snippets', '']
    for (const s of snippets) {
      lines.push(`## ${s.title}`, '', s.description, '', `\`${s.language}\` | ${s.category} | Tags: ${s.tags.join(', ')}`, '', '```' + s.language, s.code, '```', '')
    }
    return lines.join('\n')
  }

  private toVsCode(snippets: readonly Snippet[]): string {
    const vscodeSnippets: Record<string, { prefix: string; body: string[]; description: string }> = {}
    for (const s of snippets) {
      const key = s.title.toLowerCase().replace(/\s+/g, '-')
      vscodeSnippets[key] = {
        prefix: key,
        body: s.code.split('\n'),
        description: s.description,
      }
    }
    return JSON.stringify(vscodeSnippets, null, 2)
  }

  private fromYaml(_data: string): Snippet[] {
    // Simplified YAML parsing - in production, use a proper parser
    return []
  }

  private fromMarkdown(data: string): Snippet[] {
    const snippets: Snippet[] = []
    const sections = data.split(/^## /m).slice(1)

    for (const section of sections) {
      const lines = section.split('\n')
      const title = lines[0]?.trim() ?? 'Untitled'
      const description = lines[2]?.trim() ?? ''

      // Extract code block
      const codeMatch = section.match(/```[\s\S]*?\n([\s\S]*?)```/)
      const code = codeMatch?.[1]?.trim() ?? ''

      snippets.push({
        id: `imported-${String(Date.now())}-${String(Math.random())}`,
        title,
        description,
        code,
        language: 'unknown',
        category: 'snippet',
        tags: [],
        author: 'imported',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        usageCount: 0,
        isFavorite: false,
        isPublic: false,
      })
    }

    return snippets
  }

  private fromVsCode(data: string): Snippet[] {
    const parsed = JSON.parse(data) as Record<string, { prefix: string; body: string[]; description: string }>
    return Object.entries(parsed).map(([key, value]) => ({
      id: `vscode-${key}-${Date.now()}`,
      title: key,
      description: value.description,
      code: value.body.join('\n'),
      language: 'unknown',
      category: 'snippet' as SnippetCategory,
      tags: [value.prefix],
      author: 'vscode-import',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      usageCount: 0,
      isFavorite: false,
      isPublic: false,
    }))
  }

  private emit(event: SnippetManagerEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }

  /** Register an event listener. */
  onEvent(listener: (event: SnippetManagerEvent) => void): () => void {
    this.eventListeners.push(listener)
    return () => {
      const idx = this.eventListeners.indexOf(listener)
      if (idx !== -1) this.eventListeners.splice(idx, 1)
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _instance: SnippetManagerEngine | undefined

export function getSnippetManagerEngine(config?: Partial<SnippetManagerConfig>): SnippetManagerEngine {
  if (!_instance) _instance = new SnippetManagerEngine(config)
  return _instance
}

export function resetSnippetManagerEngine(): void {
  _instance = undefined
}
