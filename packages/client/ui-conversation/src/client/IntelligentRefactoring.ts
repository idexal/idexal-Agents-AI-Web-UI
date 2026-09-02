/**
 * Intelligent Code Refactoring Engine for Idexal Agents.
 * Provides smart refactoring suggestions with pattern detection,
 * code transformation, and automatic application.
 */

/** Refactoring type */
export type RefactoringType =
  | 'extract-function'
  | 'extract-variable'
  | 'rename'
  | 'inline'
  | 'move'
  | 'simplify'
  | 'optimize'
  | 'modernize'
  | 'dead-code'
  | 'magic-number'

/** Refactoring severity */
export type RefactoringSeverity = 'critical' | 'high' | 'medium' | 'low'

/** Refactoring suggestion */
export interface RefactoringSuggestion {
  /** Suggestion ID */
  id: string
  /** Refactoring type */
  type: RefactoringType
  /** Suggestion title */
  title: string
  /** Detailed description */
  description: string
  /** Severity level */
  severity: RefactoringSeverity
  /** Impact score (0-100) */
  impact: number
  /** Effort score (0-100) */
  effort: number
  /** Line number */
  line: number
  /** End line number */
  endLine: number
  /** Original code */
  originalCode: string
  /** Suggested code */
  suggestedCode: string
  /** Preview of changes */
  preview: string
  /** Related documentation */
  documentation?: string
  /** Whether auto-apply is safe */
  autoApplicable: boolean
  /** Dependencies */
  dependencies: string[]
}

/** Code pattern */
export interface CodePattern {
  /** Pattern ID */
  id: string
  /** Pattern name */
  name: string
  /** Pattern description */
  description: string
  /** Detection regex */
  detectionPattern: RegExp
  /** Transformation function */
  transform: (match: string) => string
  /** Refactoring type */
  type: RefactoringType
}

/** Refactoring config */
export interface RefactoringConfig {
  /** Enable extract function suggestions */
  enableExtractFunction: boolean
  /** Enable variable extraction */
  enableExtractVariable: boolean
  /** Enable dead code detection */
  enableDeadCode: boolean
  /** Enable magic number detection */
  enableMagicNumber: boolean
  /** Enable modernization suggestions */
  enableModernization: boolean
  /** Enable optimization suggestions */
  enableOptimization: boolean
  /** Minimum impact threshold */
  minImpact: number
  /** Maximum suggestions */
  maxSuggestions: number
}

/**
 * Intelligent Code Refactoring Engine.
 */
export class IntelligentRefactoringEngine {
  private config: RefactoringConfig
  private patterns: CodePattern[]
  private listeners: Set<(suggestions: RefactoringSuggestion[]) => void> = new Set()

  constructor(config: Partial<RefactoringConfig> = {}) {
    this.config = {
      enableExtractFunction: config.enableExtractFunction ?? true,
      enableExtractVariable: config.enableExtractVariable ?? true,
      enableDeadCode: config.enableDeadCode ?? true,
      enableMagicNumber: config.enableMagicNumber ?? true,
      enableModernization: config.enableModernization ?? true,
      enableOptimization: config.enableOptimization ?? true,
      minImpact: config.minImpact ?? 20,
      maxSuggestions: config.maxSuggestions ?? 20,
    }

    this.patterns = this.initializePatterns()
  }

  /**
   * Analyze code and suggest refactorings.
   */
  analyze(code: string, filePath: string): RefactoringSuggestion[] {
    const lines = code.split('\n')
    const suggestions: RefactoringSuggestion[] = []

    // Pattern-based suggestions
    const patternSuggestions = this.detectPatterns(lines, filePath)
    suggestions.push(...patternSuggestions)

    // Extract function suggestions
    if (this.config.enableExtractFunction) {
      suggestions.push(...this.detectExtractFunction(lines, filePath))
    }

    // Dead code detection
    if (this.config.enableDeadCode) {
      suggestions.push(...this.detectDeadCode(lines, filePath))
    }

    // Magic number detection
    if (this.config.enableMagicNumber) {
      suggestions.push(...this.detectMagicNumbers(lines, filePath))
    }

    // Modernization suggestions
    if (this.config.enableModernization) {
      suggestions.push(...this.detectModernization(lines, filePath))
    }

    // Optimization suggestions
    if (this.config.enableOptimization) {
      suggestions.push(...this.detectOptimization(lines, filePath))
    }

    // Filter and sort
    const filtered = suggestions
      .filter(s => s.impact >= this.config.minImpact)
      .sort((a, b) => b.impact - a.impact)
      .slice(0, this.config.maxSuggestions)

    this.notifyListeners(filtered)
    return filtered
  }

  /**
   * Detect code patterns.
   */
  private detectPatterns(lines: string[], _filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = []

    for (const pattern of this.patterns) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        if (pattern.detectionPattern.test(line)) {
          const suggestedCode = pattern.transform(line)
          suggestions.push({
            id: `pattern-${pattern.id}-${i}`,
            type: pattern.type,
            title: pattern.name,
            description: pattern.description,
            severity: 'medium',
            impact: 60,
            effort: 30,
            line: i + 1,
            endLine: i + 1,
            originalCode: line,
            suggestedCode,
            preview: suggestedCode,
            autoApplicable: true,
            dependencies: [],
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Detect functions that could be extracted.
   */
  private detectExtractFunction(lines: string[], _filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Long function detection
      if (line.match(/^(export\s+)?(async\s+)?function\s/)) {
        let braceCount = 0
        let functionLength = 0
        let functionStart = i

        for (let j = i; j < lines.length; j++) {
          const funcLine = lines[j]!
          if (funcLine.includes('{')) braceCount++
          if (funcLine.includes('}')) braceCount--
          functionLength++

          if (braceCount === 0 && j > i) {
            if (functionLength > 50) {
              suggestions.push({
                id: `extract-func-${i}`,
                type: 'extract-function',
                title: 'Function too long',
                description: `Function is ${functionLength} lines long. Consider breaking it into smaller functions.`,
                severity: 'medium',
                impact: 70,
                effort: 50,
                line: functionStart + 1,
                endLine: j + 1,
                originalCode: lines.slice(functionStart, j + 1).join('\n'),
                suggestedCode: '// Consider extracting parts into smaller functions',
                preview: 'Function can be split into 2-3 smaller functions',
                autoApplicable: false,
                dependencies: [],
              })
            }
            break
          }
        }
      }
    }

    return suggestions
  }

  /**
   * Detect dead code.
   */
  private detectDeadCode(lines: string[], _filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = []
    const functionNames: { name: string; line: number }[] = []

    // Collect function definitions
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/)
      if (match) {
        functionNames.push({ name: match[1]!, line: i + 1 })
      }
    }

    // Check for unused functions
    for (const func of functionNames) {
      const isUsed = lines.some((line, idx) =>
        idx !== func.line - 1 &&
        line.includes(func.name) &&
        !line.match(new RegExp(`function\\s+${func.name}`))
      )

      if (!isUsed && !func.name.startsWith('_')) {
        suggestions.push({
          id: `dead-code-${func.line}`,
          type: 'dead-code',
          title: 'Unused function',
          description: `Function '${func.name}' is defined but never used.`,
          severity: 'low',
          impact: 30,
          effort: 10,
          line: func.line,
          endLine: func.line,
          originalCode: lines[func.line - 1]!,
          suggestedCode: `// Remove unused function: ${func.name}`,
          preview: `Function '${func.name}' can be removed`,
          autoApplicable: true,
          dependencies: [],
        })
      }
    }

    return suggestions
  }

  /**
   * Detect magic numbers.
   */
  private detectMagicNumbers(lines: string[], _filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Detect numeric literals (excluding 0, 1, common values)
      const magicNumbers = line.match(/\b(?!0\b|1\b|2\b|10\b|100\b)\d{2,}\b/g)
      if (magicNumbers && !line.includes('const') && !line.includes('let')) {
        for (const num of magicNumbers) {
          suggestions.push({
            id: `magic-number-${i}-${num}`,
            type: 'magic-number',
            title: 'Magic number detected',
            description: `Number ${num} should be extracted to a named constant.`,
            severity: 'low',
            impact: 25,
            effort: 15,
            line: i + 1,
            endLine: i + 1,
            originalCode: line,
            suggestedCode: `const CONSTANT_NAME = ${num}`,
            preview: `Extract ${num} to a named constant`,
            autoApplicable: false,
            dependencies: [],
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Detect modernization opportunities.
   */
  private detectModernization(lines: string[], _filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // var to const/let
      if (line.startsWith('var ')) {
        suggestions.push({
          id: `modernize-var-${i}`,
          type: 'modernize',
          title: 'Use const/let instead of var',
          description: 'var is function-scoped. Use const or let for block scoping.',
          severity: 'medium',
          impact: 50,
          effort: 20,
          line: i + 1,
          endLine: i + 1,
          originalCode: line,
          suggestedCode: line.replace('var ', 'const '),
          preview: 'Replace var with const/let',
          autoApplicable: true,
          dependencies: [],
        })
      }

      // function to arrow function
      if (line.match(/^\s*(?:export\s+)?function\s+\w+\s*\([^)]*\)\s*\{/)) {
        if (!line.includes('this')) {
          suggestions.push({
            id: `modernize-arrow-${i}`,
            type: 'modernize',
            title: 'Use arrow function',
            description: 'Consider using arrow function for shorter syntax.',
            severity: 'low',
            impact: 30,
            effort: 15,
            line: i + 1,
            endLine: i + 1,
            originalCode: line,
            suggestedCode: 'const fn = () => {}',
            preview: 'Convert to arrow function',
            autoApplicable: false,
            dependencies: [],
          })
        }
      }

      // Promise chain to async/await
      if (line.includes('.then(')) {
        suggestions.push({
          id: `modernize-async-${i}`,
          type: 'modernize',
          title: 'Use async/await',
          description: 'Promise chains can be simplified with async/await.',
          severity: 'medium',
          impact: 60,
          effort: 30,
          line: i + 1,
          endLine: i + 1,
          originalCode: line,
          suggestedCode: 'await expression',
          preview: 'Convert .then() chain to async/await',
          autoApplicable: false,
          dependencies: [],
        })
      }
    }

    return suggestions
  }

  /**
   * Detect optimization opportunities.
   */
  private detectOptimization(lines: string[], _filePath: string): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Array.includes instead of multiple ||
      if (line.match(/\w+\s*===?\s*['"].*['"]\s*\|\|\s*\w+\s*===?\s*['"]/)) {
        suggestions.push({
          id: `optimize-includes-${i}`,
          type: 'optimize',
          title: 'Use Array.includes()',
          description: 'Multiple equality checks can be replaced with Array.includes().',
          severity: 'low',
          impact: 35,
          effort: 20,
          line: i + 1,
          endLine: i + 1,
          originalCode: line,
          suggestedCode: '[\'a\', \'b\', \'c\'].includes(value)',
          preview: 'Simplify with Array.includes()',
          autoApplicable: false,
          dependencies: [],
        })
      }

      // String concatenation to template literal
      if (line.includes("' + '") || line.includes('" + "')) {
        suggestions.push({
          id: `optimize-template-${i}`,
          type: 'optimize',
          title: 'Use template literal',
          description: 'String concatenation can be replaced with template literals.',
          severity: 'low',
          impact: 25,
          effort: 15,
          line: i + 1,
          endLine: i + 1,
          originalCode: line,
          suggestedCode: '`string ${variable}`',
          preview: 'Convert to template literal',
          autoApplicable: true,
          dependencies: [],
        })
      }
    }

    return suggestions
  }

  /**
   * Apply a refactoring suggestion and return the transformed code.
   */
  apply(code: string, suggestion: RefactoringSuggestion): string {
    const lines = code.split('\n')

    if (suggestion.autoApplicable) {
      lines.splice(suggestion.line - 1, suggestion.endLine - suggestion.line + 1, suggestion.suggestedCode)
    }

    return lines.join('\n')
  }

  /**
   * Apply multiple refactorings in order, deduplicating overlapping ranges.
   */
  applyAll(code: string, suggestions: RefactoringSuggestion[]): string {
    const sorted = [...suggestions]
      .filter(s => s.autoApplicable)
      .sort((a, b) => b.line - a.line)

    let result = code
    const appliedIds = new Set<string>()

    for (const s of sorted) {
      if (appliedIds.has(`${s.line}-${s.endLine}`)) continue
      result = this.apply(result, s)
      appliedIds.add(`${s.line}-${s.endLine}`)
    }

    return result
  }

  /**
   * Detect extract-class opportunities: structs with 3+ related methods that
   * share state.
   */
  detectExtractClass(code: string, _filePath: string): RefactoringSuggestion[] {
    const lines = code.split('\n')
    const suggestions: RefactoringSuggestion[] = []

    // Collect functions that share a common prefix or operate on the same variable
    const functions: Array<{ name: string; startLine: number; endLine: number; params: string[]; bodyVars: string[] }> = []

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/)
      if (match) {
        const name = match[1]!
        const params = match[2]!.split(',').map(p => p.trim().split(':')[0]!.trim()).filter(Boolean)
        let braceCount = 0
        let endLine = i
        const bodyVars: string[] = []

        for (let j = i; j < lines.length; j++) {
          if (lines[j]!.includes('{')) braceCount++
          if (lines[j]!.includes('}')) braceCount--
          if (braceCount === 0 && j > i) { endLine = j; break }

          // Track shared state variables
          const varMatch = lines[j]!.match(/(?:let|const|var)\s+(\w+)/)
          if (varMatch) bodyVars.push(varMatch[1]!)
        }

        functions.push({ name, startLine: i, endLine, params, bodyVars })
      }
    }

    // Find groups of functions sharing common params or state
    const groups: Array<typeof functions> = []
    const used = new Set<number>()

    for (let i = 0; i < functions.length; i++) {
      if (used.has(i)) continue
      const group = [functions[i]!]
      used.add(i)

      for (let j = i + 1; j < functions.length; j++) {
        if (used.has(j)) continue
        const a = functions[i]!
        const b = functions[j]!

        // Check param overlap
        const sharedParams = a.params.filter(p => b.params.includes(p))
        // Check body var overlap
        const sharedVars = a.bodyVars.filter(v => b.bodyVars.includes(v))

        if (sharedParams.length >= 2 || sharedVars.length >= 2) {
          group.push(functions[j]!)
          used.add(j)
        }
      }

      if (group.length >= 3) groups.push(group)
    }

    for (const group of groups) {
      const commonParams = group[0]!.params.filter(p =>
        group.every(f => f.params.includes(p))
      )

      suggestions.push({
        id: `extract-class-${group[0]!.name}`,
        type: 'move',
        title: 'Extract class',
        description: `${group.length} functions share parameters (${commonParams.join(', ')}). Consider extracting them into a class.`,
        severity: 'medium',
        impact: 65,
        effort: 60,
        line: group[0]!.startLine + 1,
        endLine: group[group.length - 1]!.endLine + 1,
        originalCode: group.map(f => `function ${f.name}(...)`).join('\n'),
        suggestedCode: `class SharedModule {
  constructor(${commonParams.map(p => `private ${p}: unknown`).join(', ')}) {}
${group.map(f => `  ${f.name}(${f.params.filter(p => !commonParams.includes(p)).map(p => `${p}: unknown`).join(', ')}) { /* ... */ }`).join('\n')}
}`,
        preview: `Extract ${group.length} related functions into a class`,
        autoApplicable: false,
        dependencies: [],
      })
    }

    return suggestions
  }

  /**
   * Detect interface extraction opportunities from function parameter objects.
   */
  detectExtractInterface(code: string, _filePath: string): RefactoringSuggestion[] {
    const lines = code.split('\n')
    const suggestions: RefactoringSuggestion[] = []

    // Find functions with 3+ parameters of type object literal
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(/function\s+(\w+)\s*\(([^)]+)\)/)
      if (!match) continue

      const params = match[2]!.split(',').map(p => p.trim())
      const hasObjectLiterals = params.filter(p =>
        p.includes(': {') || p.match(/:\s*Record</)
      )

      if (hasObjectLiterals.length >= 2 || params.length >= 5) {
        suggestions.push({
          id: `extract-interface-${match[1]!}-${i}`,
          type: 'extract-variable',
          title: 'Extract interface',
          description: `Function '${match[1]}' has ${params.length} parameters. Consider extracting a shared interface.`,
          severity: 'low',
          impact: 40,
          effort: 30,
          line: i + 1,
          endLine: i + 1,
          originalCode: lines[i]!,
          suggestedCode: `interface ${match[1]!}Params {
${params.map(p => `  // ${p}`).join('\n')}
}

function ${match[1]}(params: ${match[1]}Params)`,
          preview: 'Extract parameters into a named interface',
          autoApplicable: false,
          dependencies: [],
        })
      }
    }

    return suggestions
  }

  /**
   * Detect dependency injection opportunities: functions that directly
   * instantiate dependencies instead of receiving them.
   */
  detectDependencyInjection(code: string, _filePath: string): RefactoringSuggestion[] {
    const lines = code.split('\n')
    const suggestions: RefactoringSuggestion[] = []

    const instantiationPatterns = [
      { regex: /new\s+(\w+)\s*\(/, desc: 'Direct instantiation' },
      { regex: /require\s*\(['"]([^'"]+)['"]\)/, desc: 'Direct require' },
    ]

    for (let i = 0; i < lines.length; i++) {
      for (const { regex, desc } of instantiationPatterns) {
        const match = lines[i]!.match(regex)
        if (match && !lines[i]!.trim().startsWith('//')) {
          suggestions.push({
            id: `di-${match[1] ?? match[0]}-${i}`,
            type: 'move',
            title: `${desc}: ${match[1] ?? match[0]}`,
            description: `${desc} inside a function reduces testability. Consider dependency injection.`,
            severity: 'low',
            impact: 35,
            effort: 45,
            line: i + 1,
            endLine: i + 1,
            originalCode: lines[i]!,
            suggestedCode: `// Inject ${match[1] ?? 'dependency'} as parameter instead`,
            preview: `Convert direct ${desc} to injected dependency`,
            autoApplicable: false,
            dependencies: [],
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Detect guard clause opportunities: deeply nested conditionals that
   * could be flattened with early returns.
   */
  detectGuardClauses(code: string, _filePath: string): RefactoringSuggestion[] {
    const lines = code.split('\n')
    const suggestions: RefactoringSuggestion[] = []

    let maxDepth = 0
    let currentDepth = 0
    let deepStartLine = 0

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i]!.trim()
      if (trimmed.startsWith('if') && trimmed.includes('{')) currentDepth++
      if (trimmed === '}') currentDepth = Math.max(0, currentDepth - 1)

      if (currentDepth > maxDepth) {
        maxDepth = currentDepth
        deepStartLine = i
      }
    }

    if (maxDepth >= 3) {
      suggestions.push({
        id: `guard-clause-${deepStartLine}`,
        type: 'simplify',
        title: 'Use guard clauses',
        description: `Code reaches ${maxDepth} levels of nesting. Flatten with early returns.`,
        severity: 'medium',
        impact: 55,
        effort: 35,
        line: deepStartLine + 1,
        endLine: deepStartLine + 1,
        originalCode: '// Deeply nested conditionals',
        suggestedCode: 'if (errorCondition) return defaultValue',
        preview: `Flatten ${maxDepth}-deep nesting with guard clauses`,
        autoApplicable: false,
        dependencies: [],
      })
    }

    return suggestions
  }

  /**
   * Comprehensive analysis: run all detectors including the new advanced ones.
   */
  analyzeFull(code: string, _filePath: string): RefactoringSuggestion[] {
    const basic = this.analyze(code, _filePath)
    const advanced = [
      ...this.detectExtractClass(code, _filePath),
      ...this.detectExtractInterface(code, _filePath),
      ...this.detectDependencyInjection(code, _filePath),
      ...this.detectGuardClauses(code, _filePath),
    ]

    return [...basic, ...advanced]
      .filter(s => s.impact >= this.config.minImpact)
      .sort((a, b) => b.impact - a.impact)
      .slice(0, this.config.maxSuggestions)
  }

  /**
   * Get refactoring summary for a file.
   */
  getSummary(code: string, filePath: string): {
    totalSuggestions: number
    byType: Record<RefactoringType, number>
    bySeverity: Record<RefactoringSeverity, number>
    topImprovement: RefactoringSuggestion | null
    estimatedImpact: number
  } {
    const suggestions = this.analyzeFull(code, filePath)
    const byType = {} as Record<RefactoringType, number>
    const bySeverity = {} as Record<RefactoringSeverity, number>

    for (const s of suggestions) {
      byType[s.type] = (byType[s.type] ?? 0) + 1
      bySeverity[s.severity] = (bySeverity[s.severity] ?? 0) + 1
    }

    return {
      totalSuggestions: suggestions.length,
      byType,
      bySeverity,
      topImprovement: suggestions[0] ?? null,
      estimatedImpact: suggestions.reduce((sum, s) => sum + s.impact, 0),
    }
  }

  /**
   * Initialize refactoring patterns.
   */
  private initializePatterns(): CodePattern[] {
    return [
      {
        id: 'console-log',
        name: 'Remove console.log',
        description: 'Console.log statements should be removed in production.',
        detectionPattern: /console\.log\s*\(/,
        transform: (match) => `// ${match}`,
        type: 'dead-code',
      },
      {
        id: 'empty-catch',
        name: 'Handle empty catch',
        description: 'Empty catch blocks should handle errors properly.',
        detectionPattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
        transform: (match) => match.replace('{}', '{ console.error(error) }'),
        type: 'simplify',
      },
      {
        id: 'triple-equals',
        name: 'Use strict equality',
        description: 'Use === instead of == for type-safe comparisons.',
        detectionPattern: /[^=!]==[^=]/,
        transform: (match) => match.replace('==', '==='),
        type: 'modernize',
      },
    ]
  }

  /**
   * Subscribe to refactoring suggestions.
   */
  subscribe(listener: (suggestions: RefactoringSuggestion[]) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(suggestions: RefactoringSuggestion[]): void {
    for (const listener of this.listeners) {
      try { listener(suggestions) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: IntelligentRefactoringEngine | null = null

export function getIntelligentRefactoringEngine(
  config?: Partial<RefactoringConfig>
): IntelligentRefactoringEngine {
  if (!instance) {
    instance = new IntelligentRefactoringEngine(config)
  }
  return instance
}

export function resetIntelligentRefactoringEngine(): void {
  instance = null
}
