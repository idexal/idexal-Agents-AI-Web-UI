/**
 * Predictive Bug Detection Engine for Idexal Agents.
 * Analyzes code patterns to predict potential bugs before they occur,
 * with confidence scores and suggested fixes.
 */

/** Bug category */
export type BugCategory =
  | 'null-reference'
  | 'type-error'
  | 'memory-leak'
  | 'race-condition'
  | 'infinite-loop'
  | 'unhandled-promise'
  | 'resource-leak'
  | 'logic-error'
  | 'security-vulnerability'
  | 'performance-issue'

/** Bug severity */
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low'

/** Predicted bug */
export interface PredictedBug {
  /** Bug ID */
  id: string
  /** Bug title */
  title: string
  /** Detailed description */
  description: string
  /** Bug category */
  category: BugCategory
  /** Severity level */
  severity: BugSeverity
  /** Confidence score (0-1) */
  confidence: number
  /** Line number */
  line: number
  /** Column number */
  column: number
  /** Code snippet */
  codeSnippet: string
  /** Suggested fix */
  suggestedFix: string
  /** Related documentation */
  documentation?: string
  /** Whether this is a known pattern */
  isKnownPattern: boolean
  /** Pattern ID if known */
  patternId?: string
}

/** Bug pattern */
export interface BugPattern {
  /** Pattern ID */
  id: string
  /** Pattern name */
  name: string
  /** Pattern description */
  description: string
  /** Regex pattern to match */
  pattern: RegExp
  /** Bug category */
  category: BugCategory
  /** Default severity */
  severity: BugSeverity
  /** Suggested fix template */
  fixTemplate: string
}

/** Detection config */
export interface BugDetectionConfig {
  /** Enable null reference detection */
  enableNullReference: boolean
  /** Enable type error detection */
  enableTypeError: boolean
  /** Enable memory leak detection */
  enableMemoryLeak: boolean
  /** Enable race condition detection */
  enableRaceCondition: boolean
  /** Enable infinite loop detection */
  enableInfiniteLoop: boolean
  /** Enable unhandled promise detection */
  enableUnhandledPromise: boolean
  /** Enable security vulnerability detection */
  enableSecurityVulnerability: boolean
  /** Minimum confidence threshold */
  minConfidence: number
  /** Maximum bugs to report */
  maxBugs: number
}

/**
 * Predictive Bug Detection Engine.
 */
export class PredictiveBugDetectionEngine {
  private config: BugDetectionConfig
  private patterns: BugPattern[]
  private listeners: Set<(bugs: PredictedBug[]) => void> = new Set()

  constructor(config: Partial<BugDetectionConfig> = {}) {
    this.config = {
      enableNullReference: config.enableNullReference ?? true,
      enableTypeError: config.enableTypeError ?? true,
      enableMemoryLeak: config.enableMemoryLeak ?? true,
      enableRaceCondition: config.enableRaceCondition ?? true,
      enableInfiniteLoop: config.enableInfiniteLoop ?? true,
      enableUnhandledPromise: config.enableUnhandledPromise ?? true,
      enableSecurityVulnerability: config.enableSecurityVulnerability ?? true,
      minConfidence: config.minConfidence ?? 0.5,
      maxBugs: config.maxBugs ?? 20,
    }

    this.patterns = this.initializePatterns()
  }

  /**
   * Analyze code for potential bugs.
   */
  analyze(code: string, filePath: string): PredictedBug[] {
    const lines = code.split('\n')
    const bugs: PredictedBug[] = []

    // Run pattern-based detection
    const patternBugs = this.detectByPatterns(lines, filePath)
    bugs.push(...patternBugs)

    // Run null reference detection
    if (this.config.enableNullReference) {
      const nullBugs = this.detectNullReferences(lines, filePath)
      bugs.push(...nullBugs)
    }

    // Run type error detection
    if (this.config.enableTypeError) {
      const typeBugs = this.detectTypeErrors(lines, filePath)
      bugs.push(...typeBugs)
    }

    // Run unhandled promise detection
    if (this.config.enableUnhandledPromise) {
      const promiseBugs = this.detectUnhandledPromises(lines, filePath)
      bugs.push(...promiseBugs)
    }

    // Run infinite loop detection
    if (this.config.enableInfiniteLoop) {
      const loopBugs = this.detectInfiniteLoops(lines, filePath)
      bugs.push(...loopBugs)
    }

    // Run memory leak detection
    if (this.config.enableMemoryLeak) {
      const memoryBugs = this.detectMemoryLeaks(lines, filePath)
      bugs.push(...memoryBugs)
    }

    // Run security vulnerability detection
    if (this.config.enableSecurityVulnerability) {
      const securityBugs = this.detectSecurityVulnerabilities(lines, filePath)
      bugs.push(...securityBugs)
    }

    // Filter and sort
    const filtered = bugs
      .filter(b => b.confidence >= this.config.minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxBugs)

    this.notifyListeners(filtered)
    return filtered
  }

  /**
   * Detect bugs by predefined patterns.
   */
  private detectByPatterns(lines: string[], _filePath: string): PredictedBug[] {
    const bugs: PredictedBug[] = []

    for (const [lineIdx, line] of lines.entries()) {
      for (const pattern of this.patterns) {
        if (pattern.pattern.test(line)) {
          bugs.push({
            id: `pattern-${pattern.id}-${lineIdx}`,
            title: pattern.name,
            description: pattern.description,
            category: pattern.category,
            severity: pattern.severity,
            confidence: 0.8,
            line: lineIdx + 1,
            column: 0,
            codeSnippet: line.trim(),
            suggestedFix: pattern.fixTemplate,
            isKnownPattern: true,
            patternId: pattern.id,
          })
        }
      }
    }

    return bugs
  }

  /**
   * Detect potential null reference issues.
   */
  private detectNullReferences(lines: string[], _filePath: string): PredictedBug[] {
    const bugs: PredictedBug[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Accessing property without null check
      const accessMatch = line.match(/(\w+)\.(\w+)(?:\s*\(|\.)/)
      if (accessMatch) {
        const varName = accessMatch[1]!
        const prop = accessMatch[2]!

        // Check if there's a null check before this line
        const hasNullCheck = lines.slice(Math.max(0, i - 5), i).some(l =>
          l.includes(`${varName} !== null`) ||
          l.includes(`${varName} != null`) ||
          l.includes(`${varName} !== undefined`) ||
          l.includes(`${varName} != undefined`) ||
          l.includes(`${varName} ?`)
        )

        if (!hasNullCheck && !varName.startsWith('_')) {
          bugs.push({
            id: `null-ref-${i}`,
            title: 'Potential null reference',
            description: `Accessing property '${prop}' on '${varName}' without null check`,
            category: 'null-reference',
            severity: 'medium',
            confidence: 0.6,
            line: i + 1,
            column: 0,
            codeSnippet: line,
            suggestedFix: `Add null check: if (${varName} !== null) { ... }`,
            isKnownPattern: false,
          })
        }
      }
    }

    return bugs
  }

  /**
   * Detect potential type errors.
   */
  private detectTypeErrors(lines: string[], _filePath: string): PredictedBug[] {
    const bugs: PredictedBug[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Implicit any type
      if (line.match(/(?:const|let|var)\s+\w+\s*=\s*(?!\s*new\s)/)) {
        const hasType = line.includes(':')
        if (!hasType) {
          bugs.push({
            id: `type-implicit-${i}`,
            title: 'Implicit any type',
            description: 'Variable declared without explicit type annotation',
            category: 'type-error',
            severity: 'low',
            confidence: 0.4,
            line: i + 1,
            column: 0,
            codeSnippet: line,
            suggestedFix: 'Add explicit type annotation',
            isKnownPattern: false,
          })
        }
      }
    }

    return bugs
  }

  /**
   * Detect unhandled promises.
   */
  private detectUnhandledPromises(lines: string[], _filePath: string): PredictedBug[] {
    const bugs: PredictedBug[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Async function call without await
      if (line.match(/^\w+\.\w+\(.*\)\s*$/) && !line.includes('await') && !line.includes('.then(')) {
        const hasAsync = lines.slice(Math.max(0, i - 10), i).some(l =>
          l.includes('async') || l.includes('Promise')
        )

        if (hasAsync) {
          bugs.push({
            id: `unhandled-promise-${i}`,
            title: 'Potential unhandled promise',
            description: 'Async operation without await or .then()',
            category: 'unhandled-promise',
            severity: 'medium',
            confidence: 0.5,
            line: i + 1,
            column: 0,
            codeSnippet: line,
            suggestedFix: 'Add await before the async call or use .then()',
            isKnownPattern: false,
          })
        }
      }
    }

    return bugs
  }

  /**
   * Detect potential infinite loops.
   */
  private detectInfiniteLoops(lines: string[], _filePath: string): PredictedBug[] {
    const bugs: PredictedBug[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // while(true) without break
      if (line === 'while (true)' || line === 'for (;;)') {
        const loopBody = lines.slice(i, i + 20)
        const hasBreak = loopBody.some(l => l.includes('break') || l.includes('return'))

        if (!hasBreak) {
          bugs.push({
            id: `infinite-loop-${i}`,
            title: 'Potential infinite loop',
            description: 'Loop without exit condition',
            category: 'infinite-loop',
            severity: 'high',
            confidence: 0.9,
            line: i + 1,
            column: 0,
            codeSnippet: line,
            suggestedFix: 'Add break condition or use a finite loop',
            isKnownPattern: true,
            patternId: 'infinite-loop',
          })
        }
      }
    }

    return bugs
  }

  /**
   * Detect potential memory leaks.
   */
  private detectMemoryLeaks(lines: string[], _filePath: string): PredictedBug[] {
    const bugs: PredictedBug[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Event listener without cleanup
      if (line.includes('addEventListener') && !line.includes('removeEventListener')) {
        const hasCleanup = lines.slice(i, i + 50).some(l =>
          l.includes('removeEventListener') || l.includes('cleanup') || l.includes('dispose')
        )

        if (!hasCleanup) {
          bugs.push({
            id: `memory-leak-${i}`,
            title: 'Potential memory leak',
            description: 'Event listener added without cleanup',
            category: 'memory-leak',
            severity: 'medium',
            confidence: 0.6,
            line: i + 1,
            column: 0,
            codeSnippet: line,
            suggestedFix: 'Add cleanup function to remove event listener',
            isKnownPattern: false,
          })
        }
      }
    }

    return bugs
  }

  /**
   * Detect security vulnerabilities.
   */
  private detectSecurityVulnerabilities(lines: string[], _filePath: string): PredictedBug[] {
    const bugs: PredictedBug[] = []

    const securityPatterns: { pattern: RegExp; title: string; severity: BugSeverity; fix: string }[] = [
      { pattern: /eval\s*\(/, title: 'Use of eval()', severity: 'critical', fix: 'Avoid eval(), use safer alternatives' },
      { pattern: /innerHTML\s*=/, title: 'Direct innerHTML assignment', severity: 'high', fix: 'Use textContent or safe HTML methods' },
      { pattern: /document\.write\s*\(/, title: 'Use of document.write()', severity: 'high', fix: 'Use DOM manipulation methods instead' },
      { pattern: /new\s+Function\s*\(/, title: 'Dynamic function creation', severity: 'high', fix: 'Avoid dynamic function creation' },
      { pattern: /Math\.random\s*\(\).*(?:token|key|secret|password)/i, title: 'Weak random for security', severity: 'critical', fix: 'Use crypto.getRandomValues() for security tokens' },
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      for (const { pattern, title, severity, fix } of securityPatterns) {
        if (pattern.test(line)) {
          bugs.push({
            id: `security-${i}-${title.replace(/\s/g, '-').toLowerCase()}`,
            title,
            description: `Found at line ${i + 1}`,
            category: 'security-vulnerability',
            severity,
            confidence: 0.9,
            line: i + 1,
            column: 0,
            codeSnippet: line,
            suggestedFix: fix,
            isKnownPattern: true,
          })
        }
      }
    }

    return bugs
  }

  /**
   * Initialize bug patterns.
   */
  private initializePatterns(): BugPattern[] {
    return [
      {
        id: 'unused-variable',
        name: 'Unused variable',
        description: 'Variable declared but never used',
        pattern: /(?:const|let|var)\s+(\w+)\s*=/,
        category: 'logic-error',
        severity: 'low',
        fixTemplate: 'Remove unused variable or use it',
      },
      {
        id: 'empty-catch',
        name: 'Empty catch block',
        description: 'Catch block that swallows errors',
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
        category: 'logic-error',
        severity: 'medium',
        fixTemplate: 'Add error handling or logging in catch block',
      },
      {
        id: 'console-in-production',
        name: 'Console statement in production',
        description: 'Console.log found in code',
        pattern: /console\.(log|debug|info)\s*\(/,
        category: 'performance-issue',
        severity: 'low',
        fixTemplate: 'Remove console statements for production',
      },
    ]
  }

  /**
   * Subscribe to bug detection results.
   */
  subscribe(listener: (bugs: PredictedBug[]) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(bugs: PredictedBug[]): void {
    for (const listener of this.listeners) {
      try { listener(bugs) } catch { /* ignore */ }
    }
  }

  /**
   * Predict bugs from complexity metrics.
   */
  predictFromMetrics(metrics: {
    cyclomaticComplexity: number
    linesOfCode: number
    functionCount: number
    nestingDepth: number
    duplicateRatio: number
    testCoverage: number
  }): Array<{ category: string; probability: number; recommendation: string }> {
    const predictions: Array<{ category: string; probability: number; recommendation: string }> = []

    if (metrics.cyclomaticComplexity > 15) {
      predictions.push({
        category: 'logic-error',
        probability: Math.min(0.9, metrics.cyclomaticComplexity / 20),
        recommendation: 'High complexity increases bug risk. Break into smaller functions.',
      })
    }

    if (metrics.nestingDepth > 4) {
      predictions.push({
        category: 'logic-error',
        probability: Math.min(0.85, metrics.nestingDepth / 6),
        recommendation: 'Deep nesting makes control flow hard to follow. Use guard clauses.',
      })
    }

    if (metrics.duplicateRatio > 0.15) {
      predictions.push({
        category: 'logic-error',
        probability: metrics.duplicateRatio,
        recommendation: 'High duplication increases maintenance burden and divergence bugs.',
      })
    }

    if (metrics.testCoverage < 50) {
      predictions.push({
        category: 'unhandled-promise',
        probability: (100 - metrics.testCoverage) / 100,
        recommendation: 'Low test coverage means untested paths likely contain bugs.',
      })
    }

    if (metrics.linesOfCode > 500 && metrics.functionCount < 10) {
      predictions.push({
        category: 'resource-leak',
        probability: 0.4,
        recommendation: 'Large monolithic functions are prone to resource leaks.',
      })
    }

    return predictions.sort((a, b) => b.probability - a.probability)
  }

  /**
   * Generate a comprehensive bug report.
   */
  generateBugReport(code: string, filePath: string): {
    summary: { total: number; critical: number; high: number; medium: number; low: number }
    bugs: PredictedBug[]
    riskScore: number
    recommendations: string[]
    markdown: string
  } {
    const bugs = this.analyze(code, filePath)
    const summary = {
      total: bugs.length,
      critical: bugs.filter((b: PredictedBug) => b.severity === 'critical').length,
      high: bugs.filter((b: PredictedBug) => b.severity === 'high').length,
      medium: bugs.filter((b: PredictedBug) => b.severity === 'medium').length,
      low: bugs.filter((b: PredictedBug) => b.severity === 'low').length,
    }

    const riskScore = Math.min(100, Math.round(
      summary.critical * 25 + summary.high * 15 + summary.medium * 8 + summary.low * 3
    ))

    const recommendations: string[] = []
    if (summary.critical > 0) recommendations.push('Fix critical bugs immediately — they affect correctness or security.')
    if (summary.high > 0) recommendations.push('Address high-severity bugs before next release.')
    if (riskScore > 50) recommendations.push('Consider refactoring to reduce overall risk.')
    if (bugs.filter((b: PredictedBug) => b.category === 'null-reference').length > 3) recommendations.push('Add null checks or use optional chaining consistently.')
    if (bugs.filter((b: PredictedBug) => b.category === 'unhandled-promise').length > 2) recommendations.push('Add .catch() handlers or use try/catch with async/await.')

    const mdLines = [
      `# Bug Report — ${filePath}\n`,
      `**Risk Score:** ${riskScore}/100\n`,
      `**Total Issues:** ${summary.total} (🔴 ${summary.critical} critical, 🟠 ${summary.high} high, 🟡 ${summary.medium} medium, 🔵 ${summary.low} low)\n`,
      '## Recommendations\n', ...recommendations.map(r => `- ${r}`), '',
      '## Findings\n',
      '| Severity | Category | Line | Description |',
      '|----------|----------|------|-------------|',
    ]
    for (const bug of bugs) {
      const icon = bug.severity === 'critical' ? '🔴' : bug.severity === 'high' ? '🟠' : bug.severity === 'medium' ? '🟡' : '🔵'
      mdLines.push(`| ${icon} ${bug.severity} | ${bug.category} | ${bug.line} | ${bug.title} |`)
    }

    return { summary, bugs, riskScore, recommendations, markdown: mdLines.join('\n') }
  }
}

/** Singleton instance */
let instance: PredictiveBugDetectionEngine | null = null

export function getPredictiveBugDetectionEngine(
  config?: Partial<BugDetectionConfig>
): PredictiveBugDetectionEngine {
  if (!instance) {
    instance = new PredictiveBugDetectionEngine(config)
  }
  return instance
}

export function resetPredictiveBugDetectionEngine(): void {
  instance = null
}
