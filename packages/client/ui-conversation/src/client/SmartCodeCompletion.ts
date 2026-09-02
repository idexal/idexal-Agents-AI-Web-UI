/**
 * Smart Code Completion Engine for Idexal Agents.
 * Provides AI-powered code completion with project context awareness,
 * pattern recognition, and intelligent suggestions.
 */

/** Completion suggestion type */
export type CompletionType =
  | 'function'
  | 'variable'
  | 'class'
  | 'interface'
  | 'type'
  | 'module'
  | 'snippet'
  | 'keyword'
  | 'property'
  | 'method'
  | 'enum'
  | 'constant'

/** Completion suggestion priority */
export type CompletionPriority = 'critical' | 'high' | 'medium' | 'low'

/** Code context type */
export type CodeContextType =
  | 'import'
  | 'function-call'
  | 'object-property'
  | 'type-annotation'
  | 'jsx-attribute'
  | 'comment'
  | 'string'
  | 'general'

/** Completion suggestion */
export interface CompletionSuggestion {
  /** Unique identifier */
  id: string
  /** Display label */
  label: string
  /** Detailed description */
  description: string
  /** Completion type */
  type: CompletionType
  /** Priority level */
  priority: CompletionPriority
  /** The actual completion text */
  insertText: string
  /** Snippet with tab stops */
  snippet?: string
  /** Required imports */
  imports?: string[]
  /** Confidence score (0-1) */
  confidence: number
  /** Source of suggestion */
  source: 'project' | 'global' | 'recent' | 'pattern' | 'ai'
  /** Associated documentation */
  documentation?: string
  /** Category for grouping */
  category: string
  /** Whether this is a recommended completion */
  recommended: boolean
}

/** File context */
export interface FileContext {
  /** Current file path */
  filePath: string
  /** Current file content */
  content: string
  /** Cursor position */
  cursorOffset: number
  /** Current line */
  currentLine: string
  /** Current word being typed */
  currentWord: string
  /** Language of the file */
  language: string
  /** Available imports in the file */
  imports: string[]
  /** Defined symbols in the file */
  symbols: string[]
}

/** Project context */
export interface ProjectContext {
  /** Project root path */
  rootPath: string
  /** Package name */
  packageName: string
  /** Dependencies */
  dependencies: Record<string, string>
  /** TypeScript config */
  tsConfig?: {
    strict: boolean
    paths: Record<string, string[]>
    target: string
  }
  /** Source files */
  sourceFiles: string[]
  /** Exported symbols from source files */
  exports: Record<string, string[]>
}

/** Completion config */
export interface SmartCompletionConfig {
  /** Maximum suggestions to return */
  maxSuggestions: number
  /** Minimum confidence threshold */
  minConfidence: number
  /** Enable AI-powered suggestions */
  enableAISuggestions: boolean
  /** Enable pattern-based suggestions */
  enablePatternSuggestions: boolean
  /** Enable project context suggestions */
  enableProjectContext: boolean
  /** Enable recent completions */
  enableRecentCompletions: boolean
  /** Debounce delay in ms */
  debounceDelay: number
}

/** Completion state */
export interface CompletionState {
  /** Active suggestions */
  suggestions: CompletionSuggestion[]
  /** Selected index */
  selectedIndex: number
  /** Whether loading */
  isLoading: boolean
  /** Whether triggered manually */
  isManual: boolean
  /** Current context */
  context: CodeContextType
  /** Completion timestamp */
  timestamp: number
}

/** Common TypeScript/JavaScript snippets */
const CODE_SNIPPETS: Record<string, { snippet: string; description: string; category: string }[]> = {
  typescript: [
    { snippet: 'interface ${1:Name} {\n  ${2:property}: ${3:type}\n}', description: 'Interface declaration', category: 'TypeScript' },
    { snippet: 'type ${1:Name} = ${2:type}', description: 'Type alias', category: 'TypeScript' },
    { snippet: 'enum ${1:Name} {\n  ${2:Value} = \'${3:value}\',\n}', description: 'Enum declaration', category: 'TypeScript' },
    { snippet: 'function ${1:name}(${2:params}): ${3:void} {\n  ${4}\n}', description: 'Function with return type', category: 'TypeScript' },
    { snippet: 'const ${1:name}: ${2:type} = ${3:value}', description: 'Typed variable', category: 'TypeScript' },
    { snippet: 'class ${1:Name} {\n  ${2:property}: ${3:type}\n\n  constructor(${4:params}) {\n    ${5}\n  }\n}', description: 'Class declaration', category: 'TypeScript' },
    { snippet: 'async function ${1:name}(${2:params}): Promise<${3:void}> {\n  ${4}\n}', description: 'Async function', category: 'TypeScript' },
    { snippet: 'try {\n  ${1}\n} catch (${2:error}) {\n  ${3:console.error(error)}\n}', description: 'Try-catch block', category: 'TypeScript' },
  ],
  react: [
    { snippet: 'import React from \'react\'', description: 'React import', category: 'React' },
    { snippet: 'const ${1:Component} = (${2:props}: ${3:Props}) => {\n  return (\n    <div>\n      ${4}\n    </div>\n  )\n}', description: 'Functional component', category: 'React' },
    { snippet: 'interface ${1:Props} {\n  ${2:children}: React.ReactNode\n}', description: 'Component props', category: 'React' },
    { snippet: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState<${2:type}>(${3:initialValue})', description: 'useState hook', category: 'React' },
    { snippet: 'useEffect(() => {\n  ${1}\n  return () => {\n    ${2}\n  }\n}, [${3}])', description: 'useEffect hook', category: 'React' },
    { snippet: 'const ${1:value} = useMemo(() => {\n  ${2}\n  return ${3:result}\n}, [${4:deps}])', description: 'useMemo hook', category: 'React' },
  ],
  general: [
    { snippet: 'console.log(${1:data})', description: 'Console log', category: 'General' },
    { snippet: 'console.error(${1:error})', description: 'Console error', category: 'General' },
    { snippet: 'if (${1:condition}) {\n  ${2}\n}', description: 'If statement', category: 'General' },
    { snippet: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n  ${3}\n}', description: 'For loop', category: 'General' },
    { snippet: '${1:array}.map((${2:item}) => {\n  ${3}\n  return ${4:item}\n})', description: 'Map array', category: 'General' },
    { snippet: '${1:array}.filter((${2:item}) => ${3:condition})', description: 'Filter array', category: 'General' },
    { snippet: 'const ${1:name} = async (${2:params}) => {\n  const ${3:result} = await ${4:fetch}(\'${5:url}\')\n  return ${6:result}.json()\n}', description: 'Async fetch', category: 'General' },
  ],
}

/**
 * Smart Code Completion Engine.
 */
export class SmartCodeCompletionEngine {
  private config: SmartCompletionConfig
  private state: CompletionState
  private projectContext: ProjectContext | null = null
  private recentCompletions: Map<string, number> = new Map()
  private listeners: Set<(state: CompletionState) => void> = new Set()

  constructor(config: Partial<SmartCompletionConfig> = {}) {
    this.config = {
      maxSuggestions: config.maxSuggestions ?? 10,
      minConfidence: config.minConfidence ?? 0.3,
      enableAISuggestions: config.enableAISuggestions ?? true,
      enablePatternSuggestions: config.enablePatternSuggestions ?? true,
      enableProjectContext: config.enableProjectContext ?? true,
      enableRecentCompletions: config.enableRecentCompletions ?? true,
      debounceDelay: config.debounceDelay ?? 100,
    }

    this.state = {
      suggestions: [],
      selectedIndex: 0,
      isLoading: false,
      isManual: false,
      context: 'general',
      timestamp: Date.now(),
    }

    this.loadRecentCompletions()
  }

  /**
   * Set project context for intelligent suggestions.
   */
  setProjectContext(context: ProjectContext): void {
    this.projectContext = context
  }

  /**
   * Get completions for the current context.
   */
  async getCompletions(fileContext: FileContext): Promise<CompletionSuggestion[]> {
    const context = this.detectContext(fileContext)
    this.state.context = context
    this.state.isLoading = true
    this.notifyListeners()

    const suggestions: CompletionSuggestion[] = []

    // Add snippets based on context
    const snippets = this.getSnippets(fileContext, context)
    suggestions.push(...snippets)

    // Add project-specific suggestions
    if (this.config.enableProjectContext && this.projectContext) {
      const projectSuggestions = this.getProjectSuggestions(fileContext)
      suggestions.push(...projectSuggestions)
    }

    // Add pattern-based suggestions
    if (this.config.enablePatternSuggestions) {
      const patternSuggestions = this.getPatternSuggestions(fileContext)
      suggestions.push(...patternSuggestions)
    }

    // Add recent completions
    if (this.config.enableRecentCompletions) {
      const recentSuggestions = this.getRecentSuggestions(fileContext)
      suggestions.push(...recentSuggestions)
    }

    // Sort by priority and confidence
    const sorted = suggestions
      .filter(s => s.confidence >= this.config.minConfidence)
      .sort((a, b) => {
        if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
        const priorityOrder: Record<CompletionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return b.confidence - a.confidence
      })
      .slice(0, this.config.maxSuggestions)

    this.state.suggestions = sorted
    this.state.isLoading = false
    this.state.timestamp = Date.now()
    this.notifyListeners()

    return sorted
  }

  /**
   * Detect the current code context type.
   */
  private detectContext(ctx: FileContext): CodeContextType {
    const line = ctx.currentLine.trim()

    if (line.startsWith('import ') || line.startsWith('from ')) return 'import'
    if (line.includes('function(') || line.includes('=>')) return 'function-call'
    if (line.includes('.')) return 'object-property'
    if (line.includes(':') && !line.includes('//')) return 'type-annotation'
    if (line.includes('className=') || line.includes('props.')) return 'jsx-attribute'
    if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) return 'comment'
    if (line.includes('\'') || line.includes('"') || line.includes('`')) return 'string'
    return 'general'
  }

  /**
   * Get snippet suggestions based on context.
   */
  private getSnippets(ctx: FileContext, _context: CodeContextType): CompletionSuggestion[] {
    const suggestions: CompletionSuggestion[] = []
    const language = ctx.language.toLowerCase()

    // Get language-specific snippets
    const snippetGroups = CODE_SNIPPETS[language] ?? CODE_SNIPPETS.general ?? []

    for (const [idx, snippet] of snippetGroups.entries()) {
      suggestions.push({
        id: `snippet-${language}-${idx}`,
        label: snippet.description,
        description: snippet.description,
        type: 'snippet',
        priority: 'medium',
        insertText: snippet.snippet,
        snippet: snippet.snippet,
        confidence: 0.6,
        source: 'global',
        category: snippet.category,
        recommended: false,
      })
    }

    return suggestions
  }

  /**
   * Get project-specific suggestions.
   */
  private getProjectSuggestions(ctx: FileContext): CompletionSuggestion[] {
    if (!this.projectContext) return []

    const suggestions: CompletionSuggestion[] = []
    const currentWord = ctx.currentWord.toLowerCase()

    // Suggest from project exports
    for (const [module, exports] of Object.entries(this.projectContext.exports)) {
      for (const exp of exports) {
        if (!currentWord || exp.toLowerCase().includes(currentWord)) {
          suggestions.push({
            id: `project-${module}-${exp}`,
            label: exp,
            description: `From ${module}`,
            type: this.guessSymbolType(exp),
            priority: 'high',
            insertText: exp,
            imports: [`import { ${exp} } from '${module}'`],
            confidence: 0.8,
            source: 'project',
            category: 'Project',
            recommended: false,
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Get pattern-based suggestions.
   */
  private getPatternSuggestions(ctx: FileContext): CompletionSuggestion[] {
    const suggestions: CompletionSuggestion[] = []
    const line = ctx.currentLine

    // Pattern: const/let/var declaration
    const declMatch = line.match(/(const|let|var)\s+(\w*)$/)
    if (declMatch) {
      suggestions.push({
        id: 'pattern-declaration',
        label: 'Type declaration',
        description: 'Add type annotation',
        type: 'snippet',
        priority: 'medium',
        insertText: ': ',
        confidence: 0.7,
        source: 'pattern',
        category: 'Pattern',
        recommended: false,
      })
    }

    // Pattern: async function
    if (line.includes('async') && line.includes('function')) {
      suggestions.push({
        id: 'pattern-async-return',
        label: 'Promise return type',
        description: 'Add Promise return type',
        type: 'snippet',
        priority: 'medium',
        insertText: 'Promise<void>',
        confidence: 0.7,
        source: 'pattern',
        category: 'Pattern',
        recommended: false,
      })
    }

    return suggestions
  }

  /**
   * Get recent completion suggestions.
   */
  private getRecentSuggestions(ctx: FileContext): CompletionSuggestion[] {
    const suggestions: CompletionSuggestion[] = []
    const currentWord = ctx.currentWord.toLowerCase()

    // Sort recent completions by frequency
    const sorted = Array.from(this.recentCompletions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    for (const [completion, count] of sorted) {
      if (!currentWord || completion.toLowerCase().includes(currentWord)) {
        suggestions.push({
          id: `recent-${completion}`,
          label: completion,
          description: `Used ${count} times recently`,
          type: 'variable',
          priority: 'low',
          insertText: completion,
          confidence: 0.5,
          source: 'recent',
          category: 'Recent',
          recommended: false,
        })
      }
    }

    return suggestions
  }

  /**
   * Guess symbol type from name.
   */
  private guessSymbolType(name: string): CompletionType {
    if (/^[A-Z]/.test(name)) return 'class'
    if (name.startsWith('I') && /^[A-Z]/.test(name.slice(1))) return 'interface'
    if (name.endsWith('Props') || name.endsWith('State')) return 'interface'
    if (name === name.toUpperCase()) return 'constant'
    if (name.includes('Action') || name.includes('Reducer')) return 'type'
    return 'function'
  }

  /**
   * Record a completion usage.
   */
  recordCompletion(text: string): void {
    const count = this.recentCompletions.get(text) ?? 0
    this.recentCompletions.set(text, count + 1)
    this.saveRecentCompletions()
  }

  /**
   * Navigate suggestions.
   */
  navigate(direction: 'up' | 'down'): void {
    const total = this.state.suggestions.length
    if (total === 0) return

    if (direction === 'down') {
      this.state.selectedIndex = (this.state.selectedIndex + 1) % total
    } else {
      this.state.selectedIndex = (this.state.selectedIndex - 1 + total) % total
    }
    this.notifyListeners()
  }

  /**
   * Get currently selected suggestion.
   */
  getSelected(): CompletionSuggestion | undefined {
    return this.state.suggestions[this.state.selectedIndex]
  }

  /**
   * Accept the selected completion.
   */
  accept(): CompletionSuggestion | undefined {
    const selected = this.getSelected()
    if (selected) {
      this.recordCompletion(selected.insertText)
      this.state.suggestions = []
      this.state.selectedIndex = 0
      this.notifyListeners()
    }
    return selected
  }

  /**
   * Dismiss completions.
   */
  dismiss(): void {
    this.state.suggestions = []
    this.state.selectedIndex = 0
    this.notifyListeners()
  }

  /**
   * Get current state.
   */
  getState(): Readonly<CompletionState> {
    return this.state
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: CompletionState) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(): void {
    const state = { ...this.state }
    for (const listener of this.listeners) {
      try { listener(state) } catch { /* ignore */ }
    }
  }

  private loadRecentCompletions(): void {
    if (typeof localStorage === 'undefined') return
    try {
      const stored = localStorage.getItem('idexal-recent-completions')
      if (stored) {
        const entries = JSON.parse(stored) as [string, number][]
        this.recentCompletions = new Map(entries)
      }
    } catch { /* ignore */ }
  }

  private saveRecentCompletions(): void {
    if (typeof localStorage === 'undefined') return
    try {
      const entries = Array.from(this.recentCompletions.entries())
      localStorage.setItem('idexal-recent-completions', JSON.stringify(entries))
    } catch { /* ignore */ }
  }
}

/** Singleton instance */
let instance: SmartCodeCompletionEngine | null = null

export function getSmartCodeCompletionEngine(
  config?: Partial<SmartCompletionConfig>
): SmartCodeCompletionEngine {
  if (!instance) {
    instance = new SmartCodeCompletionEngine(config)
  }
  return instance
}

export function resetSmartCodeCompletionEngine(): void {
  instance = null
}
