/**
 * Intelligent Code Review Engine for Idexal Agents.
 * AI-powered code review with pattern detection, best practices
 * enforcement, and actionable suggestions.
 */

/** Review severity */
export type ReviewSeverity = 'critical' | 'warning' | 'info' | 'suggestion'

/** Review category */
export type ReviewCategory =
  | 'correctness'
  | 'performance'
  | 'security'
  | 'maintainability'
  | 'readability'
  | 'best-practice'
  | 'accessibility'
  | 'testing'

/** Code review issue */
export interface ReviewIssue {
  id: string
  category: ReviewCategory
  severity: ReviewSeverity
  title: string
  description: string
  file: string
  line: number
  column: number
  endLine: number
  snippet: string
  suggestion: string
  autoFixAvailable: boolean
  docsUrl?: string
  confidence: number
}

/** Review score */
export interface ReviewScore {
  overall: number
  byCategory: Record<ReviewCategory, number>
  grade: string
  totalIssues: number
  bySeverity: Record<ReviewSeverity, number>
}

/** Review result */
export interface CodeReviewResult {
  id: string
  timestamp: number
  file: string
  issues: ReviewIssue[]
  score: ReviewScore
  linesAnalyzed: number
  duration: number
}

/** Review configuration */
export interface CodeReviewConfig {
  categories: ReviewCategory[]
  minSeverity: ReviewSeverity
  enableAutoFix: boolean
  maxIssuesPerCategory: number
  customRules: ReviewRule[]
}

/** Custom review rule */
export interface ReviewRule {
  name: string
  pattern: string
  severity: ReviewSeverity
  category: ReviewCategory
  description: string
  fix: string
  enabled: boolean
}

/** Review event */
export interface ReviewEvent {
  type: 'review-complete' | 'issue-found' | 'auto-fix-applied'
  result?: CodeReviewResult
  issue?: ReviewIssue
}

function matchAll(line: string, pattern: RegExp): Array<RegExpMatchArray> {
  return Array.from(line.matchAll(pattern))
}

function addMatchIssues(
  issues: ReviewIssue[],
  lines: string[],
  file: string,
  category: ReviewCategory,
  severity: ReviewSeverity,
  title: string,
  desc: string,
  fix: string,
  pattern: RegExp,
  autoFix: boolean,
  confidence: number,
  maxPerCategory: number,
): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const matches = matchAll(line, pattern)
    for (const m of matches) {
      const count = issues.filter(x => x.category === category).length
      if (count >= maxPerCategory) return
      const idx = m.index ?? 0
      issues.push({
        id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category, severity, title, description: desc,
        file, line: i + 1, column: idx + 1, endLine: i + 1,
        snippet: line.trim(), suggestion: fix,
        autoFixAvailable: autoFix, confidence,
      })
    }
  }
}

/**
 * Intelligent Code Review Engine.
 */
export class CodeReviewEngine {
  private config: CodeReviewConfig
  private issues: ReviewIssue[] = []
  private listeners: Set<(event: ReviewEvent) => void> = new Set()

  constructor(config: Partial<CodeReviewConfig> = {}) {
    this.config = {
      categories: config.categories ?? [
        'correctness', 'performance', 'security', 'maintainability',
        'readability', 'best-practice', 'accessibility', 'testing',
      ],
      minSeverity: config.minSeverity ?? 'info',
      enableAutoFix: config.enableAutoFix ?? true,
      maxIssuesPerCategory: config.maxIssuesPerCategory ?? 50,
      customRules: config.customRules ?? [],
    }
  }

  /**
   * Review source code.
   */
  reviewCode(code: string, filename: string): CodeReviewResult {
    const startTime = performance.now()
    this.issues = []
    const lines = code.split('\n')
    const maxPerCat = this.config.maxIssuesPerCategory

    // Correctness
    addMatchIssues(this.issues, lines, filename, 'correctness', 'warning', 'Loose equality', 'Use strict equality (===) instead of loose equality (==).', 'Replace == with ===', /==(?!=)/g, true, 0.9, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'correctness', 'warning', 'Loose inequality', 'Use strict inequality (!==) instead of loose inequality (!=).', 'Replace != with !==', /!=(?!=)/g, true, 0.9, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'correctness', 'warning', 'var declaration', 'Use const or let instead of var for block scoping.', 'Replace var with const or let', /\bvar\b/g, true, 0.9, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'correctness', 'warning', 'Empty catch block', 'Empty catch blocks silently swallow errors. Handle or log the error.', 'Add error handling or logging', /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g, true, 0.9, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'correctness', 'warning', 'Array constructor', 'Avoid using Array constructor with numeric argument. Use array literal instead.', 'Use [] syntax', /new Array\(\d+\)/g, true, 0.9, maxPerCat)

    // Performance
    addMatchIssues(this.issues, lines, filename, 'performance', 'info', 'forEach in hot path', 'For-of loops can be faster than forEach.', 'Use for-of loop instead', /\.forEach\(/g, false, 0.7, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'performance', 'info', 'Deep clone via JSON', 'JSON.parse(JSON.stringify()) is slow. Consider structuredClone().', 'Use structuredClone() for deep cloning', /JSON\.parse\(JSON\.stringify/g, false, 0.7, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'performance', 'info', 'String concatenation', 'Template literals are more readable.', 'Use template literals', /\+\s*['"`]/g, false, 0.6, maxPerCat)

    // Security
    addMatchIssues(this.issues, lines, filename, 'security', 'critical', 'innerHTML usage', 'Using innerHTML can lead to XSS vulnerabilities.', 'Use textContent or sanitize input', /innerHTML\s*=/g, false, 0.95, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'security', 'critical', 'eval() usage', 'eval() executes arbitrary code and is a major security risk.', 'Remove eval() and use safer alternatives', /eval\s*\(/g, false, 0.95, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'security', 'warning', 'document.write()', 'document.write() can be exploited for XSS.', 'Use DOM APIs', /document\.write\s*\(/g, false, 0.9, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'security', 'critical', 'Hardcoded password', 'Hardcoded passwords are a critical security vulnerability.', 'Use environment variables', /password\s*[:=]\s*['"][^'"]+['"]/gi, false, 0.95, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'security', 'critical', 'Hardcoded API key', 'Exposed API keys can be stolen.', 'Use environment variables', /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, false, 0.95, maxPerCat)

    // Best practices
    addMatchIssues(this.issues, lines, filename, 'best-practice', 'warning', 'Console statement', 'Console statements should be removed in production code.', 'Remove or use a logging library', /console\.(log|warn|error|info|debug)\(/g, false, 0.9, maxPerCat)
    addMatchIssues(this.issues, lines, filename, 'best-practice', 'warning', 'Debugger statement', 'Remove debugger statements before committing.', 'Remove debugger statement', /debugger\b/g, true, 0.9, maxPerCat)

    // Maintainability
    this.checkFunctionLength(lines, filename)
    this.checkTodoComments(lines, filename)
    this.checkNesting(lines, filename)

    // Readability
    this.checkLongLines(lines, filename)
    this.checkMagicNumbers(lines, filename)

    // Custom rules
    this.runCustomRules(lines, filename)

    const score = this.calculateScore(this.issues)
    const result: CodeReviewResult = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      file: filename,
      issues: this.issues,
      score,
      linesAnalyzed: lines.length,
      duration: performance.now() - startTime,
    }

    this.notifyListeners({ type: 'review-complete', result })
    return result
  }

  private checkFunctionLength(lines: string[], file: string): void {
    const funcPattern = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>))/
    let funcStart = -1
    let braceDepth = 0
    let funcName = ''

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i] ?? ''
      const match = currentLine.match(funcPattern)
      if (match && funcStart === -1) {
        funcStart = i
        funcName = match[0]?.slice(0, 40) ?? 'unknown'
        braceDepth = 0
      }
      if (funcStart !== -1) {
        for (const ch of lines[i] ?? '') {
          if (ch === '{') braceDepth++
          if (ch === '}') braceDepth--
        }
        if (braceDepth <= 0 && i > funcStart) {
          const funcLength = i - funcStart + 1
          if (funcLength > 50) {
            this.issues.push({
              id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              category: 'maintainability', severity: 'warning',
              title: 'Long function',
              description: `Function "${funcName}..." is ${funcLength} lines long. Consider breaking it into smaller functions.`,
              file, line: funcStart + 1, column: 1, endLine: i + 1,
              snippet: lines[funcStart]?.trim() ?? '',
              suggestion: 'Extract logic into helper functions',
              autoFixAvailable: false, confidence: 0.8,
            })
          }
          funcStart = -1
        }
      }
    }
  }

  private checkTodoComments(lines: string[], file: string): void {
    for (let i = 0; i < lines.length; i++) {
      const todoMatch = lines[i]?.match(/(TODO|FIXME|HACK|XXX)\s*[:\-]?\s*(.*)/)
      if (todoMatch?.[1]) {
        this.issues.push({
          id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          category: 'maintainability', severity: 'info',
          title: `${todoMatch[1]} comment found`,
          description: `Unresolved ${todoMatch[1]}: ${todoMatch[2]}`,
          file, line: i + 1, column: 1, endLine: i + 1,
          snippet: lines[i]?.trim() ?? '',
          suggestion: `Resolve this ${todoMatch[1]} or create a tracking issue`,
          autoFixAvailable: false, confidence: 1.0,
        })
      }
    }
  }

  private checkNesting(lines: string[], file: string): void {
    let maxDepth = 0, currentDepth = 0
    for (const line of lines) {
      for (const ch of line ?? '') {
        if (ch === '{') { currentDepth++; maxDepth = Math.max(maxDepth, currentDepth) }
        if (ch === '}') currentDepth--
      }
    }
    if (maxDepth > 5) {
      this.issues.push({
        id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        category: 'maintainability', severity: 'warning',
        title: 'Deep nesting',
        description: `Maximum nesting depth is ${maxDepth}. Deep nesting reduces readability and maintainability.`,
        file, line: 1, column: 1, endLine: lines.length,
        snippet: '(entire file)',
        suggestion: 'Extract nested logic into functions or use early returns',
        autoFixAvailable: false, confidence: 0.85,
      })
    }
  }

  private checkLongLines(lines: string[], file: string): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      if (line.length > 120) {
        this.issues.push({
          id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          category: 'readability', severity: 'info',
          title: 'Long line',
          description: `Line is ${line.length} characters. Consider breaking it up for readability.`,
          file, line: i + 1, column: 120, endLine: i + 1,
          snippet: line.trim().slice(0, 60) + '...',
          suggestion: 'Break line at logical points',
          autoFixAvailable: false, confidence: 0.6,
        })
      }
    }
  }

  private checkMagicNumbers(lines: string[], file: string): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const magicMatch = line.match(/(?<![.\w])(?:3|[4-9]|\d{2,})(?!\w*['"])/g)
      if (magicMatch && !line.includes('//') && !line.includes('*')) {
        for (const m of magicMatch) {
          this.issues.push({
            id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            category: 'readability', severity: 'suggestion',
            title: 'Magic number',
            description: `The number ${m} appears to be a magic number. Consider extracting it to a named constant.`,
            file, line: i + 1, column: line.indexOf(m) + 1, endLine: i + 1,
            snippet: line.trim(),
            suggestion: `Extract ${m} to a named constant`,
            autoFixAvailable: false, confidence: 0.5,
          })
        }
      }
    }
  }

  private runCustomRules(lines: string[], file: string): void {
    for (const rule of this.config.customRules) {
      if (!rule.enabled) continue
      try {
        const pattern = new RegExp(rule.pattern, 'g')
        for (let i = 0; i < lines.length; i++) {
          const matches = matchAll(lines[i] ?? '', pattern)
          for (const m of matches) {
            const idx = m.index ?? 0
            this.issues.push({
              id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              category: rule.category, severity: rule.severity,
              title: rule.name, description: rule.description,
              file, line: i + 1, column: idx + 1, endLine: i + 1,
              snippet: lines[i]?.trim() ?? '',
              suggestion: rule.fix,
              autoFixAvailable: false, confidence: 0.8,
            })
          }
        }
      } catch { /* invalid regex */ }
    }
  }

  private calculateScore(issues: ReviewIssue[]): ReviewScore {
    const severityWeight: Record<ReviewSeverity, number> = {
      critical: 20, warning: 10, info: 3, suggestion: 1,
    }
    const totalPenalty = issues.reduce((sum, issue) => sum + severityWeight[issue.severity], 0)
    const score = Math.max(0, Math.min(100, 100 - totalPenalty))

    const byCategory: Record<ReviewCategory, number> = {
      correctness: 100, performance: 100, security: 100,
      maintainability: 100, readability: 100, 'best-practice': 100,
      accessibility: 100, testing: 100,
    }
    for (const issue of issues) {
      byCategory[issue.category] -= severityWeight[issue.severity]
      byCategory[issue.category] = Math.max(0, byCategory[issue.category])
    }

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

    const bySeverity: Record<ReviewSeverity, number> = { critical: 0, warning: 0, info: 0, suggestion: 0 }
    for (const issue of issues) {
      bySeverity[issue.severity]++
    }

    return { overall: score, byCategory, grade, totalIssues: issues.length, bySeverity }
  }

  subscribe(listener: (event: ReviewEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: ReviewEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Singleton */
let instance: CodeReviewEngine | null = null

export function getCodeReviewEngine(config?: Partial<CodeReviewConfig>): CodeReviewEngine {
  if (!instance) instance = new CodeReviewEngine(config)
  return instance
}

export function resetCodeReviewEngine(): void { instance = null }
