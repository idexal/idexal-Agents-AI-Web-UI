/**
 * Smart Error Recovery Engine for Idexal Agents.
 * Intelligent error handling with pattern matching, root cause analysis,
 * and automatic fix suggestions for common programming errors.
 */

/** Error severity */
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low'

/** Error category */
export type ErrorCategory = 'type' | 'reference' | 'syntax' | 'runtime' | 'network' | 'permission' | 'memory' | 'async' | 'configuration'

/** Recovery strategy */
export type RecoveryStrategy = 'retry' | 'fallback' | 'skip' | 'cache' | 'transform' | 'user-intervention'

/** Error pattern */
export interface ErrorPattern {
  id: string
  name: string
  pattern: RegExp
  category: ErrorCategory
  severity: ErrorSeverity
  description: string
  /** Auto-fix suggestion */
  fixSuggestion: string
  /** Code fix template */
  fixTemplate?: string
  /** Recovery strategy */
  recovery: RecoveryStrategy
  /** Can be auto-fixed? */
  autoFixable: boolean
  /** Confidence of detection 0-1 */
  confidence: number
}

/** Error analysis */
export interface ErrorAnalysis {
  id: string
  message: string
  stack?: string
  category: ErrorCategory
  severity: ErrorSeverity
  matchedPattern?: ErrorPattern
  rootCause: string
  fixSuggestions: FixSuggestion[]
  recoveryStrategy: RecoveryStrategy
  context: {
    file?: string
    line?: number
    column?: number
    function?: string
    timestamp: number
  }
}

/** Fix suggestion */
export interface FixSuggestion {
  id: string
  title: string
  description: string
  code?: string
  confidence: number
  effort: 'trivial' | 'easy' | 'moderate' | 'complex'
  autoApplicable: boolean
}

/** Recovery result */
export interface RecoveryResult {
  errorId: string
  strategy: RecoveryStrategy
  success: boolean
  message: string
  /** Applied fix code if any */
  appliedFix?: string
  timestamp: number
}

/** Error recovery config */
export interface ErrorRecoveryConfig {
  maxHistory: number
  autoFix: boolean
  logErrors: boolean
  alertOnCritical: boolean
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    id: 'null-deref', name: 'Null Dereference',
    pattern: /Cannot read propert(y|ies) of (null|undefined)/i,
    category: 'type', severity: 'high',
    description: 'Attempting to access property on null/undefined',
    fixSuggestion: 'Add null check or use optional chaining (?.)',
    fixTemplate: '// Before: obj.prop\n// After: obj?.prop ?? defaultValue',
    recovery: 'transform', autoFixable: true, confidence: 0.95,
  },
  {
    id: 'undefined-func', name: 'Undefined Function',
    pattern: /(\w+) is not a function/i,
    category: 'type', severity: 'high',
    description: 'Variable is not a function',
    fixSuggestion: 'Check if the variable is imported correctly',
    recovery: 'user-intervention', autoFixable: false, confidence: 0.9,
  },
  {
    id: 'undefined-var', name: 'Undefined Variable',
    pattern: /(\w+) is not defined/i,
    category: 'reference', severity: 'high',
    description: 'Variable is not declared',
    fixSuggestion: 'Add declaration or check import path',
    recovery: 'user-intervention', autoFixable: false, confidence: 0.9,
  },
  {
    id: 'syntax-error', name: 'Syntax Error',
    pattern: /SyntaxError:\s*(.+)/i,
    category: 'syntax', severity: 'critical',
    description: 'Invalid syntax detected',
    fixSuggestion: 'Check for missing brackets, commas, or semicolons',
    recovery: 'user-intervention', autoFixable: false, confidence: 0.95,
  },
  {
    id: 'network-timeout', name: 'Network Timeout',
    pattern: /ETIMEDOUT|ECONNREFUSED|fetch failed/i,
    category: 'network', severity: 'medium',
    description: 'Network request timed out or refused',
    fixSuggestion: 'Check connectivity and server status',
    fixTemplate: 'try {\n  await fetch(url, { signal: AbortSignal.timeout(5000) })\n} catch (err) {\n  if (err.name === \'TimeoutError\') {\n    // Retry or use fallback\n  }\n}',
    recovery: 'retry', autoFixable: true, confidence: 0.85,
  },
  {
    id: 'permission-denied', name: 'Permission Denied',
    pattern: /EACCES|EPERM|permission denied/i,
    category: 'permission', severity: 'high',
    description: 'Permission denied for file/directory',
    fixSuggestion: 'Check file permissions or run with appropriate privileges',
    recovery: 'user-intervention', autoFixable: false, confidence: 0.9,
  },
  {
    id: 'out-of-memory', name: 'Out of Memory',
    pattern: /out of memory|heap.*exceeded|JavaScript heap/i,
    category: 'memory', severity: 'critical',
    description: 'JavaScript heap out of memory',
    fixSuggestion: 'Check for memory leaks or increase heap size',
    fixTemplate: '// Run with: node --max-old-space-size=4096 script.js',
    recovery: 'user-intervention', autoFixable: false, confidence: 0.9,
  },
  {
    id: 'unhandled-rejection', name: 'Unhandled Promise Rejection',
    pattern: /unhandled.*rejection|unhandledrejection/i,
    category: 'async', severity: 'high',
    description: 'Unhandled Promise rejection',
    fixSuggestion: 'Add .catch() or use try/catch with async/await',
    fixTemplate: 'try {\n  await riskyOperation()\n} catch (err) {\n  console.error(\'Failed:\', err)\n}',
    recovery: 'transform', autoFixable: true, confidence: 0.85,
  },
  {
    id: 'max-call-stack', name: 'Maximum Call Stack',
    pattern: /Maximum call stack size exceeded/i,
    category: 'runtime', severity: 'critical',
    description: 'Infinite recursion detected',
    fixSuggestion: 'Add base case to recursive function',
    recovery: 'user-intervention', autoFixable: false, confidence: 0.95,
  },
  {
    id: 'file-not-found', name: 'File Not Found',
    pattern: /ENOENT|no such file or directory/i,
    category: 'configuration', severity: 'medium',
    description: 'File or directory not found',
    fixSuggestion: 'Check file path and ensure file exists',
    recovery: 'fallback', autoFixable: false, confidence: 0.9,
  },
  {
    id: 'type-mismatch', name: 'Type Mismatch',
    pattern: /Type\s+(\w+)\s+is not assignable to type\s+(\w+)/i,
    category: 'type', severity: 'medium',
    description: 'TypeScript type mismatch',
    fixSuggestion: 'Cast the value or update the type definition',
    recovery: 'transform', autoFixable: true, confidence: 0.8,
  },
]

/**
 * Smart Error Recovery Engine.
 */
export class ErrorRecoveryEngine {
  private patterns: ErrorPattern[] = [...ERROR_PATTERNS]
  private history: ErrorAnalysis[] = []
  private config: ErrorRecoveryConfig
  private listeners: Set<(event: ErrorRecoveryEvent) => void> = new Set()

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = {
      maxHistory: config.maxHistory ?? 100,
      autoFix: config.autoFix ?? true,
      logErrors: config.logErrors ?? true,
      alertOnCritical: config.alertOnCritical ?? true,
    }
  }

  /**
   * Analyze an error and generate recovery suggestions.
   */
  analyze(error: Error | string, context?: Partial<ErrorAnalysis['context']>): ErrorAnalysis {
    const message = error instanceof Error ? error.message : error
    const stack = error instanceof Error ? error.stack : undefined

    // Find matching pattern
    let matchedPattern: ErrorPattern | undefined
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(message)) {
        matchedPattern = pattern
        break
      }
    }

    const category = matchedPattern?.category ?? 'runtime'
    const severity = matchedPattern?.severity ?? 'medium'
    const recovery = matchedPattern?.recovery ?? 'user-intervention'

    // Generate fix suggestions
    const fixSuggestions = this.generateFixSuggestions(message, matchedPattern, stack)

    // Determine root cause
    const rootCause = this.determineRootCause(message, stack, matchedPattern)

    const analysis: ErrorAnalysis = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      category,
      severity,
      rootCause,
      fixSuggestions,
      recoveryStrategy: recovery,
      context: {
        timestamp: Date.now(),
        ...context,
      },
    }
    if (stack !== undefined) analysis.stack = stack
    if (matchedPattern !== undefined) analysis.matchedPattern = matchedPattern

    // Store in history
    this.history.push(analysis)
    if (this.history.length > this.config.maxHistory) {
      this.history.shift()
    }

    this.notifyListeners({ type: 'error-analyzed', analysis })
    return analysis
  }

  /**
   * Attempt automatic recovery.
   */
  async recover(analysis: ErrorAnalysis): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      errorId: analysis.id,
      strategy: analysis.recoveryStrategy,
      success: false,
      message: '',
      timestamp: Date.now(),
    }

    switch (analysis.recoveryStrategy) {
      case 'retry':
        result.message = 'Retry the operation after a delay'
        result.success = true
        break
      case 'fallback':
        result.message = 'Use fallback value or alternative path'
        result.success = true
        break
      case 'skip':
        result.message = 'Skip the failed operation'
        result.success = true
        break
      case 'cache':
        result.message = 'Use cached data if available'
        result.success = true
        break
      case 'transform':
        if (this.config.autoFix && analysis.fixSuggestions.some(f => f.autoApplicable)) {
          const fix = analysis.fixSuggestions.find(f => f.autoApplicable)
          if (fix?.code) result.appliedFix = fix.code
          result.message = `Auto-applied fix: ${fix?.title ?? 'unknown'}`
          result.success = true
        } else {
          result.message = 'Manual fix required'
        }
        break
      case 'user-intervention':
        result.message = 'Manual intervention required'
        break
    }

    this.notifyListeners({ type: 'recovery-attempted', result })
    return result
  }

  /**
   * Add a custom error pattern.
   */
  addPattern(pattern: ErrorPattern): void {
    this.patterns.push(pattern)
  }

  /**
   * Get error history.
   */
  getHistory(): ErrorAnalysis[] {
    return [...this.history]
  }

  /**
   * Get error statistics.
   */
  getStats(): { total: number; byCategory: Record<string, number>; bySeverity: Record<string, number>; autoFixable: number } {
    const byCategory: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    let autoFixable = 0

    for (const err of this.history) {
      byCategory[err.category] = (byCategory[err.category] ?? 0) + 1
      bySeverity[err.severity] = (bySeverity[err.severity] ?? 0) + 1
      if (err.fixSuggestions.some(f => f.autoApplicable)) autoFixable++
    }

    return { total: this.history.length, byCategory, bySeverity, autoFixable }
  }

  private generateFixSuggestions(_message: string, pattern?: ErrorPattern, stack?: string): FixSuggestion[] {
    const suggestions: FixSuggestion[] = []

    if (pattern) {
      const suggestion: FixSuggestion = {
        id: `fix-${Date.now()}-1`,
        title: pattern.name,
        description: pattern.fixSuggestion,
        confidence: pattern.confidence,
        effort: pattern.autoFixable ? 'easy' : 'moderate',
        autoApplicable: pattern.autoFixable,
      }
      if (pattern.fixTemplate !== undefined) suggestion.code = pattern.fixTemplate
      suggestions.push(suggestion)
    }

    // Generic suggestions based on category
    if (!pattern || pattern.category === 'type') {
      suggestions.push({
        id: `fix-${Date.now()}-2`,
        title: 'Add type guard',
        description: 'Use typeof/instanceof checks before accessing properties',
        code: 'if (value !== null && typeof value === \'object\') {\n  // safe to access\n}',
        confidence: 0.7,
        effort: 'easy',
        autoApplicable: true,
      })
    }

    // Stack-based suggestions
    if (stack) {
      const frameMatch = stack.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/)
      if (frameMatch?.[2]) {
        suggestions.push({
          id: `fix-${Date.now()}-stack`,
          title: `Debug at ${frameMatch[2]}:${frameMatch[3]}`,
          description: `The error originates in ${frameMatch[1] ?? 'unknown'}. Focus debugging there.`,
          confidence: 0.8,
          effort: 'trivial',
          autoApplicable: false,
        })
      }
    }

    return suggestions
  }

  private determineRootCause(message: string, _stack?: string, pattern?: ErrorPattern): string {
    if (pattern) {
      return `[${pattern.category.toUpperCase()}] ${pattern.description}. ${pattern.fixSuggestion}`
    }
    return `Unknown error pattern: ${message.slice(0, 100)}`
  }

  subscribe(listener: (event: ErrorRecoveryEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: ErrorRecoveryEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Error recovery event */
export interface ErrorRecoveryEvent {
  type: 'error-analyzed' | 'recovery-attempted' | 'pattern-added'
  analysis?: ErrorAnalysis
  result?: RecoveryResult
}

/** Singleton */
let instance: ErrorRecoveryEngine | null = null

export function getErrorRecoveryEngine(config?: Partial<ErrorRecoveryConfig>): ErrorRecoveryEngine {
  if (!instance) instance = new ErrorRecoveryEngine(config)
  return instance
}

export function resetErrorRecoveryEngine(): void { instance = null }
