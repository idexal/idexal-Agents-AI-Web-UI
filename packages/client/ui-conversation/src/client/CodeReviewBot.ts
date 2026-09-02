/**
 * AI Code Review Bot Engine for Idexal Agents.
 * Automated code review with detailed feedback, style checking,
 * best practices enforcement, and improvement suggestions.
 */

/** Review category */
export type ReviewCategory = 'correctness' | 'performance' | 'security' | 'maintainability' | 'readability' | 'style' | 'documentation' | 'testing'

/** Issue severity */
export type IssueSeverity = 'error' | 'warning' | 'info' | 'hint'

/** Review rule */
export interface ReviewRule {
  id: string
  name: string
  category: ReviewCategory
  severity: IssueSeverity
  description: string
  /** Regex pattern to detect the issue */
  pattern: RegExp
  /** Fix suggestion */
  fix: string
  /** Auto-fixable? */
  autoFixable: boolean
  /** Confidence 0-1 */
  confidence: number
}

/** Review issue */
export interface ReviewIssue {
  id: string
  rule: string
  category: ReviewCategory
  severity: IssueSeverity
  message: string
  file: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  /** Code context */
  context: string
  /** Fix suggestion */
  fix?: string
  /** Fix diff */
  fixDiff?: string
  /** Is this auto-fixable? */
  autoFixable: boolean
  /** Confidence 0-1 */
  confidence: number
}

/** Review result */
export interface ReviewResult {
  id: string
  file: string
  issues: ReviewIssue[]
  stats: {
    totalIssues: number
    errors: number
    warnings: number
    info: number
    hints: number
    autoFixable: number
  }
  score: number
  grade: string
  summary: string
  timestamp: number
}

/** Review config */
export interface CodeReviewBotConfig {
  maxIssues: number
  minSeverity: IssueSeverity
  categories: ReviewCategory[]
  autoFix: boolean
}

const BUILTIN_RULES: ReviewRule[] = [
  // Correctness
  { id: 'eqeqeq', name: 'No loose equality', category: 'correctness', severity: 'warning', description: 'Use strict equality (===) instead of loose equality (==)', pattern: /==(?!=)/g, fix: 'Replace == with ===', autoFixable: true, confidence: 0.95 },
  { id: 'no-var', name: 'No var declarations', category: 'correctness', severity: 'warning', description: 'Use const or let instead of var', pattern: /\bvar\s/g, fix: 'Replace var with const or let', autoFixable: true, confidence: 0.9 },
  { id: 'no-empty-catch', name: 'No empty catch blocks', category: 'correctness', severity: 'warning', description: 'Empty catch blocks swallow errors silently', pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g, fix: 'Add error handling or logging', autoFixable: false, confidence: 0.9 },

  // Security
  { id: 'no-eval', name: 'No eval()', category: 'security', severity: 'error', description: 'eval() is a security risk and should not be used', pattern: /\beval\s*\(/g, fix: 'Remove eval() and use safer alternatives', autoFixable: false, confidence: 0.99 },
  { id: 'no-innerhtml', name: 'No innerHTML assignment', category: 'security', severity: 'error', description: 'innerHTML can lead to XSS vulnerabilities', pattern: /\.innerHTML\s*=/g, fix: 'Use textContent or a sanitization library', autoFixable: false, confidence: 0.95 },
  { id: 'no-document-write', name: 'No document.write()', category: 'security', severity: 'error', description: 'document.write() can be exploited for XSS', pattern: /document\.write\s*\(/g, fix: 'Use DOM manipulation instead', autoFixable: false, confidence: 0.95 },
  { id: 'no-hardcoded-secrets', name: 'No hardcoded secrets', category: 'security', severity: 'error', description: 'Hardcoded passwords or API keys are a security risk', pattern: /(password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi, fix: 'Use environment variables', autoFixable: false, confidence: 0.85 },

  // Performance
  { id: 'no-console', name: 'No console statements', category: 'style', severity: 'info', description: 'Console statements should be removed in production', pattern: /console\.(log|warn|error|info|debug)\(/g, fix: 'Use a logging library or remove', autoFixable: true, confidence: 0.8 },
  { id: 'no-debugger', name: 'No debugger statements', category: 'style', severity: 'warning', description: 'Debugger statements should not be committed', pattern: /\bdebugger\b/g, fix: 'Remove debugger statement', autoFixable: true, confidence: 0.99 },
  { id: 'prefer-const', name: 'Prefer const', category: 'style', severity: 'info', description: 'Use const for variables that are never reassigned', pattern: /\blet\s+(\w+)\s*=\s*[^;]+;/g, fix: 'Replace let with const if not reassigned', autoFixable: false, confidence: 0.6 },

  // Readability
  { id: 'max-line-length', name: 'Line too long', category: 'readability', severity: 'info', description: 'Lines should not exceed 120 characters', pattern: /.{121,}/g, fix: 'Break line at logical point', autoFixable: false, confidence: 0.7 },
  { id: 'no-todo', name: 'TODO comments', category: 'maintainability', severity: 'info', description: 'TODO comments indicate incomplete work', pattern: /(TODO|FIXME|HACK|XXX)\b/g, fix: 'Complete the task or create an issue', autoFixable: false, confidence: 1.0 },

  // Documentation
  { id: 'no-jsdoc', name: 'Missing JSDoc', category: 'documentation', severity: 'hint', description: 'Exported functions should have JSDoc comments', pattern: /export\s+(?:async\s+)?function\s+(\w+)/g, fix: 'Add JSDoc comment above the function', autoFixable: false, confidence: 0.5 },

  // Testing
  { id: 'no-skip', name: 'Skipped tests', category: 'testing', severity: 'warning', description: 'Skipped tests should not be committed', pattern: /\b(it|test|describe)\.skip\b/g, fix: 'Unskip tests or remove them', autoFixable: false, confidence: 0.9 },
  { id: 'no-only', name: 'Focused tests', category: 'testing', severity: 'error', description: 'Focused tests (it.only) should not be committed', pattern: /\b(it|test|describe)\.only\b/g, fix: 'Remove .only to run all tests', autoFixable: true, confidence: 0.99 },
]

/**
 * AI Code Review Bot Engine.
 */
export class CodeReviewBotEngine {
  private rules: ReviewRule[] = [...BUILTIN_RULES]
  private config: CodeReviewBotConfig
  private listeners: Set<(event: ReviewBotEvent) => void> = new Set()

  constructor(config: Partial<CodeReviewBotConfig> = {}) {
    this.config = {
      maxIssues: config.maxIssues ?? 200,
      minSeverity: config.minSeverity ?? 'hint',
      categories: config.categories ?? ['correctness', 'performance', 'security', 'maintainability', 'readability', 'style', 'documentation', 'testing'],
      autoFix: config.autoFix ?? false,
    }
  }

  /**
   * Review code and return issues.
   */
  review(code: string, filename: string): ReviewResult {
    const issues: ReviewIssue[] = []
    const lines = code.split('\n')
    const severityOrder: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2, hint: 3 }
    const minSeverityLevel = severityOrder[this.config.minSeverity]

    for (const rule of this.rules) {
      if (!this.config.categories.includes(rule.category)) continue
      if (severityOrder[rule.severity] > minSeverityLevel) continue

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? ''
        const matches = Array.from(line.matchAll(rule.pattern))

        for (const match of matches) {
          if (issues.length >= this.config.maxIssues) break

          issues.push({
            id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            rule: rule.id,
            category: rule.category,
            severity: rule.severity,
            message: rule.description,
            file: filename,
            line: i + 1,
            column: (match.index ?? 0) + 1,
            context: line.trim(),
            fix: rule.fix,
            autoFixable: rule.autoFixable,
            confidence: rule.confidence,
          })
        }
      }
    }

    // Calculate stats
    const stats = {
      totalIssues: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      hints: issues.filter(i => i.severity === 'hint').length,
      autoFixable: issues.filter(i => i.autoFixable).length,
    }

    // Score: 100 base, deductions for issues
    const deductions = stats.errors * 15 + stats.warnings * 8 + stats.info * 2 + stats.hints * 1
    const score = Math.max(0, Math.min(100, 100 - deductions))
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

    const summary = `Found ${stats.totalIssues} issues (${stats.errors} errors, ${stats.warnings} warnings, ${stats.info} info, ${stats.hints} hints). ${stats.autoFixable} can be auto-fixed.`

    const result: ReviewResult = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: filename,
      issues,
      stats,
      score,
      grade,
      summary,
      timestamp: Date.now(),
    }

    this.notifyListeners({ type: 'review-complete', result })
    return result
  }

  /**
   * Auto-fix issues in code.
   */
  autoFix(code: string, issues: ReviewIssue[]): { code: string; fixed: number } {
    let result = code
    let fixed = 0

    // Sort by line number descending to avoid offset issues
    const fixable = issues.filter(i => i.autoFixable).sort((a, b) => b.line - a.line)

    for (const issue of fixable) {
      const lines = result.split('\n')
      const lineIdx = issue.line - 1
      const line = lines[lineIdx]
      if (!line) continue

      const rule = this.rules.find(r => r.id === issue.rule)
      if (!rule) continue

      const newLine = line.replace(rule.pattern, (match) => {
        if (rule.id === 'eqeqeq') return match.replace('==', '===')
        if (rule.id === 'no-var') return match.replace('var', 'const')
        if (rule.id === 'no-debugger') return ''
        if (rule.id === 'no-console') return `// ${match}`
        if (rule.id === 'no-only') return match.replace('.only', '')
        return match
      })

      if (newLine !== line) {
        lines[lineIdx] = newLine
        result = lines.join('\n')
        fixed++
      }
    }

    this.notifyListeners({ type: 'auto-fix-applied', fixed })
    return { code: result, fixed }
  }

  /**
   * Add a custom rule.
   */
  addRule(rule: ReviewRule): void {
    this.rules.push(rule)
  }

  /**
   * Get all rules.
   */
  getRules(): ReviewRule[] {
    return [...this.rules]
  }

  subscribe(listener: (event: ReviewBotEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: ReviewBotEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Review bot event */
export interface ReviewBotEvent {
  type: 'review-complete' | 'auto-fix-applied'
  result?: ReviewResult
  fixed?: number
}

/** Singleton */
let instance: CodeReviewBotEngine | null = null

export function getCodeReviewBotEngine(config?: Partial<CodeReviewBotConfig>): CodeReviewBotEngine {
  if (!instance) instance = new CodeReviewBotEngine(config)
  return instance
}

export function resetCodeReviewBotEngine(): void { instance = null }
