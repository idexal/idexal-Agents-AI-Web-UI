/**
 * Code Quality Scoring Engine for Idexal Agents.
 * Provides real-time code analysis with quality metrics,
 * complexity analysis, and improvement suggestions.
 */

/** Quality category */
export type QualityCategory =
  | 'complexity'
  | 'maintainability'
  | 'readability'
  | 'testability'
  | 'security'
  | 'performance'
  | 'documentation'

/** Severity level */
export type IssueSeverity = 'critical' | 'warning' | 'info' | 'suggestion'

/** Quality issue */
export interface QualityIssue {
  /** Issue identifier */
  id: string
  /** Issue title */
  title: string
  /** Detailed description */
  description: string
  /** Severity level */
  severity: IssueSeverity
  /** Quality category */
  category: QualityCategory
  /** Line number */
  line: number
  /** Column number */
  column: number
  /** Suggested fix */
  fix?: string
  /** Rule that was violated */
  rule: string
}

/** Quality metric */
export interface QualityMetric {
  /** Metric name */
  name: string
  /** Metric value */
  value: number
  /** Maximum possible value */
  maxValue: number
  /** Unit of measurement */
  unit: string
  /** Category */
  category: QualityCategory
  /** Whether higher is better */
  higherIsBetter: boolean
  /** Description */
  description: string
}

/** Quality score */
export interface QualityScore {
  /** Overall score (0-100) */
  overall: number
  /** Grade (A-F) */
  grade: string
  /** Category scores */
  categories: Record<QualityCategory, number>
  /** Issues found */
  issues: QualityIssue[]
  /** Metrics computed */
  metrics: QualityMetric[]
  /** Improvement suggestions */
  suggestions: string[]
  /** Analysis timestamp */
  timestamp: number
}

/** Analysis config */
export interface QualityAnalysisConfig {
  /** Enable complexity analysis */
  enableComplexity: boolean
  /** Enable maintainability analysis */
  enableMaintainability: boolean
  /** Enable readability analysis */
  enableReadability: boolean
  /** Enable security analysis */
  enableSecurity: boolean
  /** Maximum function length (lines) */
  maxFunctionLength: number
  /** Maximum cyclomatic complexity */
  maxCyclomaticComplexity: number
  /** Maximum nesting depth */
  maxNestingDepth: number
  /** Maximum parameters per function */
  maxParameters: number
  /** Minimum documentation coverage */
  minDocCoverage: number
}

/**
 * Code Quality Scoring Engine.
 */
export class CodeQualityEngine {
  private config: QualityAnalysisConfig
  private listeners: Set<(score: QualityScore) => void> = new Set()

  constructor(config: Partial<QualityAnalysisConfig> = {}) {
    this.config = {
      enableComplexity: config.enableComplexity ?? true,
      enableMaintainability: config.enableMaintainability ?? true,
      enableReadability: config.enableReadability ?? true,
      enableSecurity: config.enableSecurity ?? true,
      maxFunctionLength: config.maxFunctionLength ?? 50,
      maxCyclomaticComplexity: config.maxCyclomaticComplexity ?? 10,
      maxNestingDepth: config.maxNestingDepth ?? 4,
      maxParameters: config.maxParameters ?? 5,
      minDocCoverage: config.minDocCoverage ?? 0.6,
    }
  }

  /**
   * Analyze code and return quality score.
   */
  analyze(code: string, filePath: string): QualityScore {
    const lines = code.split('\n')
    const issues: QualityIssue[] = []
    const metrics: QualityMetric[] = []
    const suggestions: string[] = []

    // Complexity analysis
    if (this.config.enableComplexity) {
      const complexity = this.analyzeComplexity(lines, filePath)
      issues.push(...complexity.issues)
      metrics.push(...complexity.metrics)
      suggestions.push(...complexity.suggestions)
    }

    // Maintainability analysis
    if (this.config.enableMaintainability) {
      const maintainability = this.analyzeMaintainability(lines, filePath)
      issues.push(...maintainability.issues)
      metrics.push(...maintainability.metrics)
      suggestions.push(...maintainability.suggestions)
    }

    // Readability analysis
    if (this.config.enableReadability) {
      const readability = this.analyzeReadability(lines, filePath)
      issues.push(...readability.issues)
      metrics.push(...readability.metrics)
      suggestions.push(...readability.suggestions)
    }

    // Security analysis
    if (this.config.enableSecurity) {
      const security = this.analyzeSecurity(lines, filePath)
      issues.push(...security.issues)
      metrics.push(...security.metrics)
      suggestions.push(...security.suggestions)
    }

    // Calculate category scores
    const categories = this.calculateCategoryScores(issues, metrics)

    // Calculate overall score
    const overall = this.calculateOverallScore(categories)

    // Generate grade
    const grade = this.getGrade(overall)

    const score: QualityScore = {
      overall,
      grade,
      categories,
      issues,
      metrics,
      suggestions: [...new Set(suggestions)].slice(0, 10),
      timestamp: Date.now(),
    }

    this.notifyListeners(score)
    return score
  }

  /**
   * Analyze code complexity.
   */
  private analyzeComplexity(lines: string[], filePath: string): {
    issues: QualityIssue[]
    metrics: QualityMetric[]
    suggestions: string[]
  } {
    const issues: QualityIssue[] = []
    const metrics: QualityMetric[] = []
    const suggestions: string[] = []

    // Calculate cyclomatic complexity
    let complexity = 1
    let functionCount = 0
    let maxFunctionLength = 0
    let currentFunctionLength = 0
    let inFunction = false

    for (const line of lines) {
      const trimmed = line.trim()

      // Detect function boundaries
      if (trimmed.match(/^(export\s+)?(async\s+)?function\s/)) {
        if (inFunction && currentFunctionLength > maxFunctionLength) {
          maxFunctionLength = currentFunctionLength
        }
        inFunction = true
        currentFunctionLength = 0
        functionCount++
      }

      if (inFunction) {
        currentFunctionLength++
      }

      // Count complexity indicators
      if (trimmed.match(/\b(if|else if|else|case|catch|&&|\|\||\?)\b/)) {
        complexity++
      }
      if (trimmed.match(/\b(for|while|do)\b/)) {
        complexity++
      }
    }

    // Final function length check
    if (inFunction && currentFunctionLength > maxFunctionLength) {
      maxFunctionLength = currentFunctionLength
    }

    // Add metrics
    metrics.push({
      name: 'Cyclomatic Complexity',
      value: complexity,
      maxValue: 50,
      unit: '',
      category: 'complexity',
      higherIsBetter: false,
      description: 'Number of independent paths through the code',
    })

    metrics.push({
      name: 'Function Count',
      value: functionCount,
      maxValue: 100,
      unit: 'functions',
      category: 'complexity',
      higherIsBetter: false,
      description: 'Number of functions in the file',
    })

    // Check for issues
    if (complexity > this.config.maxCyclomaticComplexity) {
      issues.push({
        id: `complexity-${filePath}`,
        title: 'High cyclomatic complexity',
        description: `Complexity is ${complexity}, exceeding the maximum of ${this.config.maxCyclomaticComplexity}`,
        severity: complexity > 20 ? 'critical' : 'warning',
        category: 'complexity',
        line: 1,
        column: 0,
        fix: 'Consider breaking down complex functions into smaller ones',
        rule: 'max-complexity',
      })
      suggestions.push('Reduce cyclomatic complexity by extracting helper functions')
    }

    if (maxFunctionLength > this.config.maxFunctionLength) {
      issues.push({
        id: `function-length-${filePath}`,
        title: 'Function too long',
        description: `Longest function is ${maxFunctionLength} lines, exceeding the maximum of ${this.config.maxFunctionLength}`,
        severity: 'warning',
        category: 'complexity',
        line: 1,
        column: 0,
        fix: 'Break long functions into smaller, focused functions',
        rule: 'max-function-length',
      })
      suggestions.push('Split long functions into smaller ones for better readability')
    }

    return { issues, metrics, suggestions }
  }

  /**
   * Analyze maintainability.
   */
  private analyzeMaintainability(lines: string[], filePath: string): {
    issues: QualityIssue[]
    metrics: QualityMetric[]
    suggestions: string[]
  } {
    const issues: QualityIssue[] = []
    const metrics: QualityMetric[] = []
    const suggestions: string[] = []

    // Calculate lines of code
    const totalLines = lines.length
    const codeLines = lines.filter(l => l.trim().length > 0).length
    const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('*') || l.trim().startsWith('/*')).length


    // Documentation coverage
    const docCoverage = codeLines > 0 ? commentLines / codeLines : 1

    metrics.push({
      name: 'Lines of Code',
      value: totalLines,
      maxValue: 500,
      unit: 'lines',
      category: 'maintainability',
      higherIsBetter: false,
      description: 'Total lines of code in the file',
    })

    metrics.push({
      name: 'Documentation Coverage',
      value: Math.round(docCoverage * 100),
      maxValue: 100,
      unit: '%',
      category: 'maintainability',
      higherIsBetter: true,
      description: 'Percentage of code covered by comments',
    })

    if (docCoverage < this.config.minDocCoverage && codeLines > 10) {
      issues.push({
        id: `doc-coverage-${filePath}`,
        title: 'Insufficient documentation',
        description: `Documentation coverage is ${Math.round(docCoverage * 100)}%, below the minimum of ${Math.round(this.config.minDocCoverage * 100)}%`,
        severity: 'warning',
        category: 'maintainability',
        line: 1,
        column: 0,
        fix: 'Add comments to explain complex logic and document functions',
        rule: 'min-doc-coverage',
      })
      suggestions.push('Add more documentation to improve maintainability')
    }

    return { issues, metrics, suggestions }
  }

  /**
   * Analyze readability.
   */
  private analyzeReadability(lines: string[], filePath: string): {
    issues: QualityIssue[]
    metrics: QualityMetric[]
    suggestions: string[]
  } {
    const issues: QualityIssue[] = []
    const metrics: QualityMetric[] = []
    const suggestions: string[] = []

    // Check for very long lines
    let longLineCount = 0
    let maxLineLength = 0

    for (const [idx, line] of lines.entries()) {
      const length = line.length
      if (length > maxLineLength) maxLineLength = length
      if (length > 120) {
        longLineCount++
        if (longLineCount <= 3) {
          issues.push({
            id: `long-line-${filePath}-${idx}`,
            title: 'Line too long',
            description: `Line ${idx + 1} is ${length} characters long`,
            severity: 'info',
            category: 'readability',
            line: idx + 1,
            column: 120,
            fix: 'Break long lines for better readability',
            rule: 'max-line-length',
          })
        }
      }
    }

    metrics.push({
      name: 'Max Line Length',
      value: maxLineLength,
      maxValue: 200,
      unit: 'chars',
      category: 'readability',
      higherIsBetter: false,
      description: 'Length of the longest line',
    })

    if (longLineCount > 5) {
      suggestions.push('Consider breaking long lines to improve readability')
    }

    return { issues, metrics, suggestions }
  }

  /**
   * Analyze security issues.
   */
  private analyzeSecurity(lines: string[], filePath: string): {
    issues: QualityIssue[]
    metrics: QualityMetric[]
    suggestions: string[]
  } {
    const issues: QualityIssue[] = []
    const metrics: QualityMetric[] = []
    const suggestions: string[] = []

    const securityPatterns = [
      { pattern: /eval\s*\(/, title: 'Use of eval()', severity: 'critical' as IssueSeverity },
      { pattern: /innerHTML\s*=/, title: 'Direct innerHTML assignment', severity: 'warning' as IssueSeverity },
      { pattern: /document\.write\s*\(/, title: 'Use of document.write()', severity: 'warning' as IssueSeverity },
      { pattern: /new\s+Function\s*\(/, title: 'Dynamic function creation', severity: 'warning' as IssueSeverity },
      { pattern: /console\.(log|debug|info)\s*\(/, title: 'Console output in production', severity: 'info' as IssueSeverity },
    ]

    let securityScore = 100

    for (const [idx, line] of lines.entries()) {
      for (const { pattern, title, severity } of securityPatterns) {
        if (pattern.test(line)) {
          const deduction = severity === 'critical' ? 25 : severity === 'warning' ? 10 : 2
          securityScore = Math.max(0, securityScore - deduction)

          issues.push({
            id: `security-${filePath}-${idx}`,
            title,
            description: `Found at line ${idx + 1}`,
            severity,
            category: 'security',
            line: idx + 1,
            column: 0,
            rule: 'security-pattern',
          })
        }
      }
    }

    metrics.push({
      name: 'Security Score',
      value: securityScore,
      maxValue: 100,
      unit: 'score',
      category: 'security',
      higherIsBetter: true,
      description: 'Security score based on common vulnerability patterns',
    })

    if (securityScore < 80) {
      suggestions.push('Review and fix security issues identified in the analysis')
    }

    return { issues, metrics, suggestions }
  }

  /**
   * Calculate category scores from issues and metrics.
   */
  private calculateCategoryScores(
    issues: QualityIssue[],
    metrics: QualityMetric[]
  ): Record<QualityCategory, number> {
    const categories: Record<QualityCategory, number> = {
      complexity: 100,
      maintainability: 100,
      readability: 100,
      testability: 100,
      security: 100,
      performance: 100,
      documentation: 100,
    }

    // Deduct points for issues
    for (const issue of issues) {
      const deduction = issue.severity === 'critical' ? 20 : issue.severity === 'warning' ? 10 : 3
      categories[issue.category] = Math.max(0, categories[issue.category] - deduction)
    }

    // Adjust based on metrics
    for (const metric of metrics) {
      if (metric.category in categories) {
        const ratio = metric.higherIsBetter
          ? metric.value / metric.maxValue
          : 1 - (metric.value / metric.maxValue)
        const metricScore = Math.round(Math.max(0, Math.min(100, ratio * 100)))
        categories[metric.category] = Math.round(
          (categories[metric.category] + metricScore) / 2
        )
      }
    }

    return categories
  }

  /**
   * Calculate overall score from category scores.
   */
  private calculateOverallScore(categories: Record<QualityCategory, number>): number {
    const weights: Record<QualityCategory, number> = {
      complexity: 0.2,
      maintainability: 0.2,
      readability: 0.15,
      testability: 0.1,
      security: 0.2,
      performance: 0.1,
      documentation: 0.05,
    }

    let totalWeight = 0
    let weightedSum = 0

    for (const [category, score] of Object.entries(categories)) {
      const weight = weights[category as QualityCategory] ?? 0.1
      weightedSum += score * weight
      totalWeight += weight
    }

    return Math.round(totalWeight > 0 ? weightedSum / totalWeight : 100)
  }

  /**
   * Get letter grade from score.
   */
  private getGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Subscribe to analysis results.
   */
  subscribe(listener: (score: QualityScore) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(score: QualityScore): void {
    for (const listener of this.listeners) {
      try { listener(score) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: CodeQualityEngine | null = null

export function getCodeQualityEngine(
  config?: Partial<QualityAnalysisConfig>
): CodeQualityEngine {
  if (!instance) {
    instance = new CodeQualityEngine(config)
  }
  return instance
}

export function resetCodeQualityEngine(): void {
  instance = null
}
