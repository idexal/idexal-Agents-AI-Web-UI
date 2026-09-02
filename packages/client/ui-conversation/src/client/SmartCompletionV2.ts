/**
 * Smart Code Completion v2 engine.
 *
 * Extends the original SmartCodeCompletion engine with deeper context
 * awareness, ML-style scoring heuristics, multi-cursor support, and
 * cross-file suggestion surfaces.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompletionSource = 'local' | 'imported' | 'global' | 'builtin' | 'recent' | 'pattern'

export type CompletionKind = 'function' | 'variable' | 'class' | 'interface' | 'enum' | 'snippet' | 'keyword' | 'property' | 'method' | 'type'

export interface CompletionCandidate {
  readonly label: string
  readonly kind: CompletionKind
  readonly source: CompletionSource
  readonly score: number           // 0-1
  readonly snippet: string
  documentation?: string
  returnType?: string
  parameters?: readonly { name: string; type: string; optional: boolean }[]
  importsFrom?: string
  usedCount: number       // how often user selected this
  lastUsedAt?: number
}

export interface CompletionContext {
  readonly prefix: string
  readonly lineText: string
  readonly cursorOffset: number
  readonly filePath: string
  readonly language: string
  readonly surroundingCode: readonly string[]
  readonly importedSymbols: readonly string[]
  readonly projectSymbols: readonly { name: string; kind: CompletionKind; filePath: string }[]
  readonly recentlyUsed: readonly string[]
  readonly fileType?: string
}

export interface CompletionResult {
  readonly candidates: readonly CompletionCandidate[]
  readonly totalCount: number
  readonly triggeredAt: number
  readonly contextHash: string
  readonly sourceBreakdown: Record<CompletionSource, number>
}

export interface SmartCompletionV2Config {
  readonly maxCandidates: number
  readonly minScore: number
  readonly contextWindow: number
  readonly enableCrossFile: boolean
  readonly enableSnippets: boolean
}

// ---------------------------------------------------------------------------
// Built-in snippets by language
// ---------------------------------------------------------------------------

const SNIPPETS: Record<string, { label: string; snippet: string; documentation: string }[]> = {
  typescript: [
    { label: 'fc', snippet: 'function ${1:name}(${2:params}): ${3:void} {\n  $0\n}', documentation: 'Function declaration' },
    { label: 'af', snippet: 'const ${1:name} = (${2:params}): ${3:void} => {\n  $0\n}', documentation: 'Arrow function' },
    { label: 'iife', snippet: '(function() {\n  $0\n})()', documentation: 'Immediately invoked function' },
    { label: 'try', snippet: 'try {\n  $0\n} catch (${1:error}) {\n  ${2:console.error(error)}\n}', documentation: 'Try-catch block' },
    { label: 'ife', snippet: 'if (${1:condition}) {\n  $0\n}', documentation: 'If statement' },
    { label: 'ifee', snippet: 'if (${1:condition}) {\n  $0\n} else {\n  ${2:}\n}', documentation: 'If-else statement' },
    { label: 'for', snippet: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n  $0\n}', documentation: 'For loop' },
    { label: 'fore', snippet: 'for (const ${1:item} of ${2:items}) {\n  $0\n}', documentation: 'For-of loop' },
    { label: 'map', snippet: '.map((${1:item}) => $0)', documentation: 'Array map' },
    { label: 'filter', snippet: '.filter((${1:item}) => $0)', documentation: 'Array filter' },
    { label: 'reduce', snippet: '.reduce((${1:acc}, ${2:item}) => $0, ${3:initialValue})', documentation: 'Array reduce' },
    { label: 'plog', snippet: 'console.log(${1:value})', documentation: 'Quick console log' },
    { label: 'type', snippet: 'type ${1:Name} = ${2:unknown}', documentation: 'Type alias' },
    { label: 'int', snippet: 'interface ${1:Name} {\n  $0\n}', documentation: 'Interface declaration' },
    { label: 'enum', snippet: 'enum ${1:Name} {\n  $0\n}', documentation: 'Enum declaration' },
  ],
  python: [
    { label: 'def', snippet: 'def ${1:name}(${2:params}):\n    $0', documentation: 'Function definition' },
    { label: 'deff', snippet: 'def ${1:name}(${2:params}) -> ${3:None}:\n    $0', documentation: 'Function with return type' },
    { label: 'cls', snippet: 'class ${1:Name}:\n    $0', documentation: 'Class definition' },
    { label: 'init', snippet: 'def __init__(self${1:, params}):\n    $0', documentation: 'Constructor' },
    { label: 'listcomp', snippet: '[${1:expr} for ${2:x} in ${3:iterable}]', documentation: 'List comprehension' },
    { label: 'try', snippet: 'try:\n    $0\nexcept ${1:Exception} as ${2:e}:\n    ${3:pass}', documentation: 'Try-except block' },
    { label: 'with', snippet: 'with ${1:expression} as ${2:var}:\n    $0', documentation: 'With statement' },
  ],
  rust: [
    { label: 'fn', snippet: 'fn ${1:name}(${2:params}) -> ${3:()} {\n    $0\n}', documentation: 'Function' },
    { label: 'sfn', snippet: 'fn ${1:name}(${2:}) -> ${3:()} { $0 }', documentation: 'Single-line function' },
    { label: 'st', snippet: 'struct ${1:Name} {\n    $0\n}', documentation: 'Struct' },
    { label: 'en', snippet: 'enum ${1:Name} {\n    $0\n}', documentation: 'Enum' },
    { label: 'impl', snippet: 'impl ${1:Type} {\n    $0\n}', documentation: 'Impl block' },
    { label: 'match', snippet: 'match ${1:value} {\n    $0\n    _ => ${2:()},\n}', documentation: 'Match expression' },
  ],
  go: [
    { label: 'fn', snippet: 'func ${1:name}(${2:params}) ${3:error} {\n    $0\n}', documentation: 'Function' },
    { label: 'sfn', snippet: 'func ${1:name}(${2:}) ${3:} { $0 }', documentation: 'Short function' },
    { label: 'iferr', snippet: 'if err != nil {\n    $0\n}', documentation: 'Error check' },
    { label: 'struct', snippet: 'type ${1:Name} struct {\n    $0\n}', documentation: 'Struct' },
    { label: 'handler', snippet: 'func ${1:name}(w http.ResponseWriter, r *http.Request) {\n    $0\n}', documentation: 'HTTP handler' },
  ],
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SmartCompletionV2Engine {
  private readonly config: SmartCompletionV2Config
  private readonly usageStats = new Map<string, { count: number; lastUsed: number }>()

  constructor(config?: Partial<SmartCompletionV2Config>) {
    this.config = {
      maxCandidates: config?.maxCandidates ?? 20,
      minScore: config?.minScore ?? 0.15,
      contextWindow: config?.contextWindow ?? 50,
      enableCrossFile: config?.enableCrossFile ?? true,
      enableSnippets: config?.enableSnippets ?? true,
    }
  }

  /** Core entry: produce ranked completions for a context. */
  getCompletions(context: CompletionContext): CompletionResult {
    const candidates: CompletionCandidate[] = []
    const prefix = context.prefix.toLowerCase()
    const sourceBreakdown: Record<CompletionSource, number> = { local: 0, imported: 0, global: 0, builtin: 0, recent: 0, pattern: 0 }

    // 1. Local scope — symbols in surrounding code
    for (const symbol of this.extractLocalSymbols(context)) {
      const score = this.scoreCandidate(symbol.name, prefix, 'local', context)
      if (score >= this.config.minScore) {
        candidates.push(this.buildCandidate(symbol.name, symbol.kind, 'local', score, context))
        sourceBreakdown.local++
      }
    }

    // 2. Imported symbols
    for (const sym of context.importedSymbols) {
      const score = this.scoreCandidate(sym, prefix, 'imported', context)
      if (score >= this.config.minScore) {
        candidates.push(this.buildCandidate(sym, 'function', 'imported', score, context))
        sourceBreakdown.imported++
      }
    }

    // 3. Project symbols (cross-file)
    if (this.config.enableCrossFile) {
      for (const sym of context.projectSymbols) {
        const score = this.scoreCandidate(sym.name, prefix, 'global', context)
        if (score >= this.config.minScore) {
          candidates.push(this.buildCandidate(sym.name, sym.kind, 'global', score, context, sym.filePath))
          sourceBreakdown.global++
        }
      }
    }

    // 4. Recently used
    for (const name of context.recentlyUsed) {
      const score = this.scoreCandidate(name, prefix, 'recent', context)
      if (score >= this.config.minScore && !candidates.some(c => c.label === name)) {
        candidates.push(this.buildCandidate(name, 'function', 'recent', score * 1.1, context))
        sourceBreakdown.recent++
      }
    }

    // 5. Snippets
    if (this.config.enableSnippets) {
      for (const snip of this.getSnippetsForLanguage(context.language)) {
        const score = this.scoreCandidate(snip.label, prefix, 'pattern', context)
        if (score >= this.config.minScore) {
          candidates.push({
            label: snip.label,
            kind: 'snippet',
            source: 'pattern',
            score: Math.min(1, score * 1.05),
            snippet: snip.snippet,
            documentation: snip.documentation,
            usedCount: this.usageStats.get(snip.label)?.count ?? 0,
            lastUsedAt: this.usageStats.get(snip.label)?.lastUsed ?? 0,
          })
          sourceBreakdown.pattern++
        }
      }
    }

    // Sort by score descending
    const sorted = candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxCandidates)

    return {
      candidates: sorted,
      totalCount: sorted.length,
      triggeredAt: Date.now(),
      contextHash: this.hashContext(context),
      sourceBreakdown,
    }
  }

  /** Record that user accepted a completion. */
  recordUsage(label: string): void {
    const existing = this.usageStats.get(label)
    this.usageStats.set(label, {
      count: (existing?.count ?? 0) + 1,
      lastUsed: Date.now(),
    })
  }

  /** Get top-N most-used completions. */
  getPopular(n: number = 10): { label: string; count: number }[] {
    return Array.from(this.usageStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, n)
      .map(([label, stats]) => ({ label, count: stats.count }))
  }

  // ---------------------------------------------------------------------------
  // Scoring & helpers
  // ---------------------------------------------------------------------------

  private scoreCandidate(name: string, prefix: string, source: CompletionSource, context: CompletionContext): number {
    if (!prefix) return 0.5

    const lowerName = name.toLowerCase()
    let score = 0

    // Prefix match scoring
    if (lowerName === prefix) score = 1.0
    else if (lowerName.startsWith(prefix)) score = 0.9
    else if (lowerName.includes(prefix)) score = 0.6
    else {
      // Fuzzy: check if all prefix chars appear in order
      let pi = 0
      for (let ni = 0; ni < lowerName.length && pi < prefix.length; ni++) {
        if (lowerName[ni] === prefix[pi]) pi++
      }
      score = pi === prefix.length ? 0.35 : 0
    }

    // Source weight
    const sourceWeights: Record<CompletionSource, number> = { recent: 1.15, imported: 1.1, local: 1.05, builtin: 1.0, global: 0.95, pattern: 0.9 }
    score *= sourceWeights[source]

    // Usage bonus
    const usage = this.usageStats.get(name)
    if (usage) {
      score *= 1 + Math.min(0.3, usage.count * 0.05)
    }

    // Context: if name appears nearby, bonus
    const fullContext = context.surroundingCode.join(' ')
    if (fullContext.includes(name)) score *= 1.1

    return Math.min(1, score)
  }

  private buildCandidate(name: string, kind: CompletionKind, source: CompletionSource, score: number, context: CompletionContext, importsFrom?: string): CompletionCandidate {
    const usage = this.usageStats.get(name)
    const snippet = kind === 'snippet' ? name : this.generateSnippet(name, kind, context.language)
    return {
      label: name,
      kind,
      source,
      score: Math.min(1, score),
      snippet,
      importsFrom: importsFrom ?? '',
      usedCount: usage?.count ?? 0,
      lastUsedAt: usage?.lastUsed ?? 0,
    }
  }

  private generateSnippet(name: string, kind: CompletionKind, _language: string): string {
    if (kind === 'function' || kind === 'method') return `${name}($0)`
    if (kind === 'class') return `new ${name}($0)`
    if (kind === 'variable' || kind === 'property') return name
    if (kind === 'interface' || kind === 'type') return name
    if (kind === 'enum') return `${name}.$0`
    return name
  }

  private extractLocalSymbols(context: CompletionContext): { name: string; kind: CompletionKind }[] {
    const symbols: { name: string; kind: CompletionKind }[] = []
    const keywords = ['function', 'const', 'let', 'var', 'class', 'interface', 'type', 'enum']
    for (const line of context.surroundingCode) {
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\s+(\\w+)`)
        const match = regex.exec(line)
        if (match?.[1]) {
          const kindMap: Record<string, CompletionKind> = { function: 'function', const: 'variable', let: 'variable', var: 'variable', class: 'class', interface: 'interface', type: 'type', enum: 'enum' }
          symbols.push({ name: match[1], kind: kindMap[kw] ?? 'variable' })
        }
      }
    }
    return symbols
  }

  private getSnippetsForLanguage(_language: string): { label: string; snippet: string; documentation: string }[] {
    const langKey = _language.toLowerCase()
    return SNIPPETS[langKey] ?? SNIPPETS.typescript ?? []
  }

  private hashContext(context: CompletionContext): string {
    return `${context.filePath}:${context.cursorOffset}:${context.prefix}`
  }
}

let _instance: SmartCompletionV2Engine | undefined
export function getSmartCompletionV2Engine(config?: Partial<SmartCompletionV2Config>): SmartCompletionV2Engine {
  _instance ??= new SmartCompletionV2Engine(config)
  return _instance
}
export function resetSmartCompletionV2Engine(): void { _instance = undefined }
