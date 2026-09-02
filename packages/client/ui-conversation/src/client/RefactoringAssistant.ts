/**
 * Smart Refactoring Assistant Engine for Idexal Agents.
 * Detects code smells, suggests refactoring patterns,
 * and applies transformations with safety checks.
 */

/** Refactoring type */
export type RefactoringType =
  | 'extract-function'
  | 'extract-variable'
  | 'rename'
  | 'inline'
  | 'move'
  | 'simplify-conditional'
  | 'remove-duplication'
  | 'convert-to-arrow'
  | 'add-type-annotations'
  | 'split-large-function'

/** Code smell type */
export type CodeSmellType =
  | 'long-function'
  | 'long-parameter-list'
  | 'duplicate-code'
  | 'dead-code'
  | 'magic-number'
  | 'deep-nesting'
  | 'complex-conditional'
  | 'feature-envy'
  | 'god-class'
  | 'shotgun-surgery'

/** Refactoring suggestion */
export interface RefactoringSuggestion {
  id: string
  type: RefactoringType
  title: string
  description: string
  /** Code smell that triggered this */
  smell: CodeSmellType
  /** Original code */
  originalCode: string
  /** Suggested refactored code */
  refactoredCode: string
  /** Line range affected */
  lineRange: { start: number; end: number }
  /** Safety score (0-1) */
  safetyScore: number
  /** Impact score (0-1) */
  impactScore: number
  /** Effort level */
  effort: 'trivial' | 'easy' | 'moderate' | 'complex'
  /** Can be auto-applied? */
  autoApplicable: boolean
  /** Warnings about this refactoring */
  warnings: string[]
  /** Tags */
  tags: string[]
}

/** Refactoring result */
export interface RefactoringResult {
  id: string
  file: string
  suggestions: RefactoringSuggestion[]
  appliedCount: number
  skippedCount: number
  timestamp: number
}

/** Refactoring config */
export interface RefactoringConfig {
  minSafetyScore: number
  maxSuggestions: number
  autoApplyThreshold: number
  includeExperimental: boolean
}

const SMELL_PATTERNS: Array<{ smell: CodeSmellType; pattern: RegExp; severity: 'high' | 'medium' | 'low'; description: string }> = [
  { smell: 'long-function', pattern: /function\s+\w+[^{]*\{[\s\S]{1000,}?\n\}/g, severity: 'high', description: 'Function is very long and should be split' },
  { smell: 'long-parameter-list', pattern: /function\s+\w+\s*\(([^,]+,){4,}[^)]+\)/g, severity: 'medium', description: 'Function has too many parameters' },
  { smell: 'duplicate-code', pattern: /(.{20,})\n[\s\S]*?\1/g, severity: 'high', description: 'Duplicate code detected' },
  { smell: 'magic-number', pattern: /(?<![.\w])(?:[3-9]|\d{2,})(?!\w*['"\\)])/g, severity: 'low', description: 'Magic numbers should be named constants' },
  { smell: 'deep-nesting', pattern: /\b(if|for|while)\b[^{]*\{[^}]*\b(if|for|while)\b[^{]*\{[^}]*\b(if|for|while)\b/g, severity: 'medium', description: 'Deeply nested code is hard to read' },
  { smell: 'complex-conditional', pattern: /if\s*\(.{50,}\)/g, severity: 'medium', description: 'Complex conditionals should be extracted' },
  { smell: 'dead-code', pattern: /\/\/\s*(?:TODO|FIXME|HACK|XXX|DEAD|UNUSED)/gi, severity: 'low', description: 'Potential dead code' },
]

/**
 * Smart Refactoring Assistant Engine.
 */
export class RefactoringAssistantEngine {
  private config: RefactoringConfig
  private listeners: Set<(event: RefactoringEvent) => void> = new Set()

  constructor(config: Partial<RefactoringConfig> = {}) {
    this.config = {
      minSafetyScore: config.minSafetyScore ?? 0.7,
      maxSuggestions: config.maxSuggestions ?? 50,
      autoApplyThreshold: config.autoApplyThreshold ?? 0.9,
      includeExperimental: config.includeExperimental ?? false,
    }
  }

  /**
   * Analyze code and generate refactoring suggestions.
   */
  analyze(code: string, filename: string): RefactoringResult {
    const suggestions: RefactoringSuggestion[] = []
    const lines = code.split('\n')

    // Detect code smells
    for (const { smell, pattern, severity, description } of SMELL_PATTERNS) {
      let match
      pattern.lastIndex = 0
      while ((match = pattern.exec(code)) !== null) {
        const startLine = code.slice(0, match.index).split('\n').length
        const matchLines = match[0].split('\n').length
        const endLine = startLine + matchLines - 1

        const suggestion = this.generateSuggestion(smell, description, match[0], startLine, endLine, severity)
        if (suggestion) suggestions.push(suggestion)
        if (suggestions.length >= this.config.maxSuggestions) break
      }
      if (suggestions.length >= this.config.maxSuggestions) break
    }

    // Additional: extract-function for long functions
    this.detectLongFunctions(lines, suggestions, code)

    // Additional: convert to arrow functions
    this.detectTraditionalFunctions(lines, suggestions)

    // Additional: add type annotations
    this.detectUntypedParams(lines, suggestions)

    // Sort by impact * safety
    suggestions.sort((a, b) => (b.impactScore * b.safetyScore) - (a.impactScore * a.safetyScore))

    const result: RefactoringResult = {
      id: `refactor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: filename,
      suggestions,
      appliedCount: 0,
      skippedCount: 0,
      timestamp: Date.now(),
    }

    this.notifyListeners({ type: 'analysis-complete', result })
    return result
  }

  /**
   * Apply a refactoring suggestion.
   */
  applySuggestion(code: string, suggestion: RefactoringSuggestion): { code: string; success: boolean } {
    if (!suggestion.autoApplicable) {
      return { code, success: false }
    }

    if (suggestion.safetyScore < this.config.minSafetyScore) {
      return { code, success: false }
    }

    // Apply the refactoring
    const newCode = code.replace(suggestion.originalCode, suggestion.refactoredCode)
    const success = newCode !== code

    if (success) {
      this.notifyListeners({ type: 'suggestion-applied', suggestion })
    }

    return { code: newCode, success }
  }

  /**
   * Batch apply all safe suggestions.
   */
  batchApply(code: string, suggestions: RefactoringSuggestion[]): { code: string; applied: number } {
    let result = code
    let applied = 0

    // Sort by line range (bottom to top to preserve line numbers)
    const sorted = [...suggestions]
      .filter(s => s.autoApplicable && s.safetyScore >= this.config.autoApplyThreshold)
      .sort((a, b) => b.lineRange.start - a.lineRange.start)

    for (const suggestion of sorted) {
      const { code: newCode, success } = this.applySuggestion(result, suggestion)
      if (success) {
        result = newCode
        applied++
      }
    }

    return { code: result, applied }
  }

  private generateSuggestion(
    smell: CodeSmellType, description: string, originalCode: string,
    startLine: number, endLine: number, severity: 'high' | 'medium' | 'low'
  ): RefactoringSuggestion | null {
    const typeMap: Record<CodeSmellType, RefactoringType> = {
      'long-function': 'split-large-function',
      'long-parameter-list': 'extract-variable',
      'duplicate-code': 'remove-duplication',
      'magic-number': 'extract-variable',
      'deep-nesting': 'simplify-conditional',
      'complex-conditional': 'simplify-conditional',
      'dead-code': 'inline',
      'feature-envy': 'move',
      'god-class': 'extract-function',
      'shotgun-surgery': 'extract-function',
    }

    const safetyMap: Record<CodeSmellType, number> = {
      'long-function': 0.6, 'long-parameter-list': 0.7, 'duplicate-code': 0.8,
      'magic-number': 0.95, 'deep-nesting': 0.7, 'complex-conditional': 0.75,
      'dead-code': 0.85, 'feature-envy': 0.5, 'god-class': 0.4, 'shotgun-surgery': 0.4,
    }

    const safety = safetyMap[smell] ?? 0.7
    if (safety < this.config.minSafetyScore && !this.config.includeExperimental) return null

    const type = typeMap[smell] ?? 'extract-function'

    return {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title: `${type.replace(/-/g, ' ')}: ${smell.replace(/-/g, ' ')}`,
      description,
      smell,
      originalCode,
      refactoredCode: this.generateRefactoredCode(type, originalCode),
      lineRange: { start: startLine, end: endLine },
      safetyScore: safety,
      impactScore: severity === 'high' ? 0.9 : severity === 'medium' ? 0.6 : 0.3,
      effort: safety > 0.8 ? 'easy' : safety > 0.6 ? 'moderate' : 'complex',
      autoApplicable: safety >= this.config.autoApplyThreshold,
      warnings: safety < 0.7 ? ['Low safety score — manual review recommended'] : [],
      tags: [smell, type],
    }
  }

  private generateRefactoredCode(type: RefactoringType, original: string): string {
    switch (type) {
      case 'extract-variable': {
        const trimmed = original.trim()
        return `const extracted = ${trimmed.length > 60 ? trimmed.slice(0, 60) + '...' : trimmed}`
      }
      case 'convert-to-arrow': {
        return original
          .replace(/function\s+(\w+)\s*\(/, 'const $1 = (')
          .replace(/\)\s*\{/, ') => {')
      }
      case 'simplify-conditional': {
        return `// Extracted condition for readability\nconst condition = /* simplify */\nif (condition) {`
      }
      default:
        return `// Refactored: ${type}\n${original}`
    }
  }

  private detectLongFunctions(lines: string[], suggestions: RefactoringSuggestion[], _code: string): void {
    let funcStart = -1, braceDepth = 0, funcName = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const funcMatch = line.match(/(?:function|const\s+\w+\s*=)\s*(?:async\s+)?/)
      if (funcMatch && funcStart === -1) {
        funcStart = i
        funcName = line.slice(0, 40)
      }
      if (funcStart !== -1) {
        for (const ch of line) {
          if (ch === '{') braceDepth++
          if (ch === '}') braceDepth--
        }
        if (braceDepth <= 0 && i > funcStart && i - funcStart > 40) {
          const originalCode = lines.slice(funcStart, i + 1).join('\n')
          suggestions.push({
            id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'split-large-function',
            title: `Split long function: ${funcName}`,
            description: `Function is ${i - funcStart + 1} lines long. Consider splitting into smaller functions.`,
            smell: 'long-function',
            originalCode,
            refactoredCode: `// TODO: Split this function into smaller pieces\n${originalCode}`,
            lineRange: { start: funcStart + 1, end: i + 1 },
            safetyScore: 0.6,
            impactScore: 0.8,
            effort: 'complex',
            autoApplicable: false,
            warnings: ['Manual refactoring required — function logic must be analyzed'],
            tags: ['long-function', 'split-large-function'],
          })
          funcStart = -1
        }
      }
    }
  }

  private detectTraditionalFunctions(lines: string[], suggestions: RefactoringSuggestion[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const match = line.match(/(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*function\s*\(/)
      if (match?.[1]) {
        suggestions.push({
          id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'convert-to-arrow',
          title: `Convert to arrow function: ${match[1]}`,
          description: 'Arrow functions are more concise and lexically scoped.',
          smell: 'dead-code',
          originalCode: line,
          refactoredCode: line.replace(/=\s*function\s*\(/, '= ('),
          lineRange: { start: i + 1, end: i + 1 },
          safetyScore: 0.9,
          impactScore: 0.2,
          effort: 'trivial',
          autoApplicable: true,
          warnings: [],
          tags: ['convert-to-arrow'],
        })
      }
    }
  }

  private detectUntypedParams(lines: string[], suggestions: RefactoringSuggestion[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const match = line.match(/(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(([^)]+)\)/)
      if (match?.[1] && !match[1].includes(':')) {
        const params = match[1].split(',').map(p => p.trim()).filter(Boolean)
        if (params.length > 0 && params.length < 5) {
          suggestions.push({
            id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'add-type-annotations',
            title: 'Add type annotations to parameters',
            description: `Parameters [${params.join(', ')}] lack type annotations.`,
            smell: 'dead-code',
            originalCode: match[0],
            refactoredCode: match[0].replace(/\(([^)]+)\)/, `(${params.map(p => `${p}: any`).join(', ')})`),
            lineRange: { start: i + 1, end: i + 1 },
            safetyScore: 0.95,
            impactScore: 0.4,
            effort: 'easy',
            autoApplicable: true,
            warnings: [],
            tags: ['add-type-annotations'],
          })
        }
      }
    }
  }

  subscribe(listener: (event: RefactoringEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: RefactoringEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Refactoring event */
export interface RefactoringEvent {
  type: 'analysis-complete' | 'suggestion-applied' | 'batch-applied'
  result?: RefactoringResult
  suggestion?: RefactoringSuggestion
}

/** Singleton */
let instance: RefactoringAssistantEngine | null = null

export function getRefactoringAssistantEngine(config?: Partial<RefactoringConfig>): RefactoringAssistantEngine {
  if (!instance) instance = new RefactoringAssistantEngine(config)
  return instance
}

export function resetRefactoringAssistantEngine(): void { instance = null }
