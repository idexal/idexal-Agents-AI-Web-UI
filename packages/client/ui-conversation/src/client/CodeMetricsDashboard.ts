/**
 * Code Metrics Dashboard Engine for Idexal Agents.
 * Provides comprehensive code metrics, complexity analysis,
 * and visual dashboards for code quality tracking.
 */

/** Metric type */
export type MetricType =
  | 'lines-of-code'
  | 'cyclomatic-complexity'
  | 'cognitive-complexity'
  | 'halstead-volume'
  | 'maintainability-index'
  | 'test-coverage'
  | 'documentation-coverage'
  | 'duplicate-ratio'
  | 'technical-debt'
  | 'code-smells'

/** Metric category */
export type MetricCategory =
  | 'size'
  | 'complexity'
  | 'quality'
  | 'maintainability'
  | 'documentation'
  | 'testing'
  | 'technical-debt'

/** Code metric value */
export interface CodeMetric {
  /** Metric ID */
  id: string
  /** Metric type */
  type: MetricType
  /** Metric category */
  category: MetricCategory
  /** Metric name */
  name: string
  /** Metric value */
  value: number
  /** Unit (%, lines, score, etc.) */
  unit: string
  /** Threshold warning */
  warningThreshold?: number
  /** Threshold error */
  errorThreshold?: number
  /** Status based on thresholds */
  status: 'good' | 'warning' | 'critical'
  /** Trend compared to previous */
  trend: 'improving' | 'stable' | 'degrading'
  /** Description */
  description: string
}

/** File metrics */
export interface FileMetrics {
  /** File path */
  path: string
  /** Metrics for this file */
  metrics: CodeMetric[]
  /** Overall score (0-100) */
  overallScore: number
  /** Grade (A-F) */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  /** Last analyzed */
  analyzedAt: Date
}

/** Project metrics */
export interface ProjectMetrics {
  /** Total files analyzed */
  totalFiles: number
  /** Total lines of code */
  totalLOC: number
  /** Average metrics */
  averages: Record<MetricType, number>
  /** Worst files */
  worstFiles: FileMetrics[]
  /** Best files */
  bestFiles: FileMetrics[]
  /** Overall project score */
  overallScore: number
  /** Project grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  /** Metrics history */
  history: ProjectMetricsSnapshot[]
  /** Recommendations */
  recommendations: CodeRecommendation[]
}

/** Metrics history snapshot */
export interface ProjectMetricsSnapshot {
  /** Timestamp */
  timestamp: Date
  /** Overall score */
  overallScore: number
  /** LOC */
  totalLOC: number
  /** Average complexity */
  avgComplexity: number
  /** Average maintainability */
  avgMaintainability: number
}

/** Code recommendation */
export interface CodeRecommendation {
  /** Recommendation ID */
  id: string
  /** Priority */
  priority: 'high' | 'medium' | 'low'
  /** Category */
  category: MetricCategory
  /** Title */
  title: string
  /** Description */
  description: string
  /** Affected files */
  affectedFiles: string[]
  /** Expected impact */
  impact: string
  /** Estimated effort */
  effort: 'small' | 'medium' | 'large'
}

/** Metrics dashboard config */
export interface MetricsDashboardConfig {
  /** Enable size metrics */
  enableSizeMetrics: boolean
  /** Enable complexity metrics */
  enableComplexityMetrics: boolean
  /** Enable quality metrics */
  enableQualityMetrics: boolean
  /** Enable maintainability metrics */
  enableMaintainabilityMetrics: boolean
  /** Enable documentation metrics */
  enableDocumentationMetrics: boolean
  /** Enable testing metrics */
  enableTestingMetrics: boolean
  /** History retention (days) */
  historyRetention: number
  /** Auto-analyze on file change */
  autoAnalyze: boolean
  /** Analysis interval (ms) */
  analysisInterval: number
}

/**
 * Code Metrics Dashboard Engine.
 */
export class CodeMetricsEngine {
  private config: MetricsDashboardConfig
  private projectMetrics: ProjectMetrics | null = null
  private fileMetricsCache: Map<string, FileMetrics> = new Map()
  private listeners: Set<(metrics: ProjectMetrics) => void> = new Set()

  constructor(config: Partial<MetricsDashboardConfig> = {}) {
    this.config = {
      enableSizeMetrics: config.enableSizeMetrics ?? true,
      enableComplexityMetrics: config.enableComplexityMetrics ?? true,
      enableQualityMetrics: config.enableQualityMetrics ?? true,
      enableMaintainabilityMetrics: config.enableMaintainabilityMetrics ?? true,
      enableDocumentationMetrics: config.enableDocumentationMetrics ?? true,
      enableTestingMetrics: config.enableTestingMetrics ?? true,
      historyRetention: config.historyRetention ?? 30,
      autoAnalyze: config.autoAnalyze ?? false,
      analysisInterval: config.analysisInterval ?? 5000,
    }
  }

  /**
   * Analyze a file and return metrics.
   */
  analyzeFile(filePath: string, content: string): FileMetrics {
    const lines = content.split('\n')
    const metrics: CodeMetric[] = []

    // Size metrics
    if (this.config.enableSizeMetrics) {
      metrics.push(this.calculateLinesOfCode(lines))
      metrics.push(this.calculateCommentRatio(lines))
    }

    // Complexity metrics
    if (this.config.enableComplexityMetrics) {
      metrics.push(this.calculateCyclomaticComplexity(lines))
      metrics.push(this.calculateCognitiveComplexity(lines))
    }

    // Quality metrics
    if (this.config.enableQualityMetrics) {
      metrics.push(this.calculateDuplicateRatio(lines))
      metrics.push(this.calculateCodeSmells(lines))
    }

    // Maintainability metrics
    if (this.config.enableMaintainabilityMetrics) {
      metrics.push(this.calculateMaintainabilityIndex(lines))
      metrics.push(this.calculateHalsteadVolume(lines))
    }

    // Documentation metrics
    if (this.config.enableDocumentationMetrics) {
      metrics.push(this.calculateDocumentationCoverage(lines))
    }

    // Calculate overall score and grade
    const overallScore = this.calculateOverallScore(metrics)
    const grade = this.scoreToGrade(overallScore)

    const fileMetrics: FileMetrics = {
      path: filePath,
      metrics,
      overallScore,
      grade,
      analyzedAt: new Date(),
    }

    this.fileMetricsCache.set(filePath, fileMetrics)
    return fileMetrics
  }

  /**
   * Analyze entire project.
   */
  analyzeProject(files: Map<string, string>): ProjectMetrics {
    const allFileMetrics: FileMetrics[] = []

    for (const [path, content] of files) {
      allFileMetrics.push(this.analyzeFile(path, content))
    }

    // Calculate averages
    const averages = this.calculateAverages(allFileMetrics)

    // Sort files by score
    const sorted = [...allFileMetrics].sort((a, b) => a.overallScore - b.overallScore)

    // Calculate overall score
    const overallScore = allFileMetrics.length > 0
      ? allFileMetrics.reduce((sum, f) => sum + f.overallScore, 0) / allFileMetrics.length
      : 100

    const totalLOC = allFileMetrics.reduce((sum, f) => {
      const locMetric = f.metrics.find(m => m.type === 'lines-of-code')
      return sum + (locMetric?.value ?? 0)
    }, 0)

    // Generate recommendations
    const recommendations = this.generateRecommendations(allFileMetrics)

    this.projectMetrics = {
      totalFiles: allFileMetrics.length,
      totalLOC,
      averages,
      worstFiles: sorted.slice(0, 5),
      bestFiles: sorted.slice(-5).reverse(),
      overallScore,
      grade: this.scoreToGrade(overallScore),
      history: this.projectMetrics?.history ?? [],
      recommendations,
    }

    // Add to history
    this.projectMetrics.history.push({
      timestamp: new Date(),
      overallScore,
      totalLOC,
      avgComplexity: averages['cyclomatic-complexity'] ?? 0,
      avgMaintainability: averages['maintainability-index'] ?? 100,
    })

    // Trim history
    if (this.projectMetrics.history.length > this.config.historyRetention) {
      this.projectMetrics.history = this.projectMetrics.history.slice(-this.config.historyRetention)
    }

    this.notifyListeners(this.projectMetrics)
    return this.projectMetrics
  }

  /**
   * Calculate Lines of Code.
   */
  private calculateLinesOfCode(lines: string[]): CodeMetric {
    const totalLines = lines.length
    const blankLines = lines.filter(l => l.trim() === '').length
    const codeLines = totalLines - blankLines

    return {
      id: 'loc',
      type: 'lines-of-code',
      category: 'size',
      name: 'Lines of Code',
      value: codeLines,
      unit: 'lines',
      warningThreshold: 500,
      errorThreshold: 1000,
      status: codeLines > 1000 ? 'critical' : codeLines > 500 ? 'warning' : 'good',
      trend: 'stable',
      description: `File has ${codeLines} lines of code`,
    }
  }

  /**
   * Calculate comment ratio.
   */
  private calculateCommentRatio(lines: string[]): CodeMetric {
    const commentLines = lines.filter(l =>
      l.trim().startsWith('//') || l.trim().startsWith('*') || l.trim().startsWith('/*')
    ).length
    const ratio = lines.length > 0 ? (commentLines / lines.length) * 100 : 0

    return {
      id: 'comment-ratio',
      type: 'documentation-coverage',
      category: 'documentation',
      name: 'Comment Ratio',
      value: Math.round(ratio),
      unit: '%',
      warningThreshold: 20,
      errorThreshold: 10,
      status: ratio < 10 ? 'critical' : ratio < 20 ? 'warning' : 'good',
      trend: 'stable',
      description: `${Math.round(ratio)}% of lines are comments`,
    }
  }

  /**
   * Calculate cyclomatic complexity.
   */
  private calculateCyclomaticComplexity(lines: string[]): CodeMetric {
    let complexity = 1

    for (const line of lines) {
      const trimmed = line.trim()
      // Decision points
      if (trimmed.match(/\b(if|else if|elif|while|for|switch|case|catch|&&|\|\||\?)\b/)) {
        complexity++
      }
    }

    return {
      id: 'cyclomatic',
      type: 'cyclomatic-complexity',
      category: 'complexity',
      name: 'Cyclomatic Complexity',
      value: complexity,
      unit: '',
      warningThreshold: 10,
      errorThreshold: 20,
      status: complexity > 20 ? 'critical' : complexity > 10 ? 'warning' : 'good',
      trend: 'stable',
      description: `Complexity score: ${complexity}`,
    }
  }

  /**
   * Calculate cognitive complexity.
   */
  private calculateCognitiveComplexity(lines: string[]): CodeMetric {
    let complexity = 0
    let nestingLevel = 0

    for (const line of lines) {
      const trimmed = line.trim()

      // Increase nesting
      if (trimmed.match(/\b(if|for|while|switch|try)\b/)) {
        complexity += 1 + nestingLevel
        nestingLevel++
      }

      // Decrease nesting
      if (trimmed === '}' || trimmed.match(/\b(catch|finally)\b/)) {
        nestingLevel = Math.max(0, nestingLevel - 1)
      }

      // Break/continue add complexity
      if (trimmed.match(/\b(break|continue)\b/)) {
        complexity++
      }
    }

    return {
      id: 'cognitive',
      type: 'cognitive-complexity',
      category: 'complexity',
      name: 'Cognitive Complexity',
      value: complexity,
      unit: '',
      warningThreshold: 15,
      errorThreshold: 30,
      status: complexity > 30 ? 'critical' : complexity > 15 ? 'warning' : 'good',
      trend: 'stable',
      description: `Cognitive load: ${complexity}`,
    }
  }

  /**
   * Calculate Halstead volume.
   */
  private calculateHalsteadVolume(lines: string[]): CodeMetric {
    const operators = new Set<string>()
    const operands = new Set<string>()
    let operatorCount = 0
    let operandCount = 0

    for (const line of lines) {
      // Simple tokenization
      const tokens = line.split(/\s+/)
      for (const token of tokens) {
        if (token.match(/^[+\-*/=<>!&|?:]+$/)) {
          operators.add(token)
          operatorCount++
        } else if (token.match(/^\d+(\.\d+)?$/)) {
          operands.add(token)
          operandCount++
        }
      }
    }

    const n1 = operators.size || 1
    const n2 = operands.size || 1
    const N1 = operatorCount || 1
    const N2 = operandCount || 1
    const volume = (N1 + N2) * Math.log2(n1 + n2)

    return {
      id: 'halstead',
      type: 'halstead-volume',
      category: 'complexity',
      name: 'Halstead Volume',
      value: Math.round(volume),
      unit: 'bits',
      warningThreshold: 1000,
      errorThreshold: 5000,
      status: volume > 5000 ? 'critical' : volume > 1000 ? 'warning' : 'good',
      trend: 'stable',
      description: `Volume: ${Math.round(volume)} bits`,
    }
  }

  /**
   * Calculate maintainability index.
   */
  private calculateMaintainabilityIndex(lines: string[]): CodeMetric {
    const loc = lines.length
    const complexity = this.calculateCyclomaticComplexity(lines).value
    const commentRatio = this.calculateCommentRatio(lines).value / 100

    // Simplified MI formula
    const mi = Math.max(0, 171 - 5.2 * Math.log(loc) - 0.23 * complexity + 16.2 * Math.log(loc * commentRatio + 1))
    const normalizedMi = Math.min(100, Math.max(0, mi))

    return {
      id: 'maintainability',
      type: 'maintainability-index',
      category: 'maintainability',
      name: 'Maintainability Index',
      value: Math.round(normalizedMi),
      unit: '/100',
      warningThreshold: 50,
      errorThreshold: 30,
      status: normalizedMi < 30 ? 'critical' : normalizedMi < 50 ? 'warning' : 'good',
      trend: 'stable',
      description: `Maintainability: ${Math.round(normalizedMi)}/100`,
    }
  }

  /**
   * Calculate duplicate ratio.
   */
  private calculateDuplicateRatio(lines: string[]): CodeMetric {
    const lineSet = new Set<string>()
    let duplicates = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 10) {
        if (lineSet.has(trimmed)) {
          duplicates++
        } else {
          lineSet.add(trimmed)
        }
      }
    }

    const ratio = lines.length > 0 ? (duplicates / lines.length) * 100 : 0

    return {
      id: 'duplicate-ratio',
      type: 'duplicate-ratio',
      category: 'quality',
      name: 'Duplicate Code Ratio',
      value: Math.round(ratio),
      unit: '%',
      warningThreshold: 10,
      errorThreshold: 20,
      status: ratio > 20 ? 'critical' : ratio > 10 ? 'warning' : 'good',
      trend: 'stable',
      description: `${Math.round(ratio)}% duplicate code`,
    }
  }

  /**
   * Calculate code smells.
   */
  private calculateCodeSmells(lines: string[]): CodeMetric {
    let smells = 0

    for (const line of lines) {
      const trimmed = line.trim()
      // Long lines
      if (trimmed.length > 120) smells++
      // TODO/FIXME/HACK
      if (trimmed.match(/\/\/\s*(TODO|FIXME|HACK|XXX)/i)) smells++
      // Empty blocks
      if (trimmed === '{}' || trimmed === '{ }') smells++
      // Nested ternary
      if (trimmed.match(/\?.*\?.*/)) smells++
    }

    return {
      id: 'code-smells',
      type: 'code-smells',
      category: 'quality',
      name: 'Code Smells',
      value: smells,
      unit: '',
      warningThreshold: 5,
      errorThreshold: 10,
      status: smells > 10 ? 'critical' : smells > 5 ? 'warning' : 'good',
      trend: 'stable',
      description: `${smells} code smells detected`,
    }
  }

  /**
   * Calculate documentation coverage.
   */
  private calculateDocumentationCoverage(lines: string[]): CodeMetric {
    const functions = lines.filter(l => l.match(/(?:export\s+)?(?:async\s+)?function\s/))
    const documentedFunctions = functions.filter(l => {
      const idx = lines.indexOf(l)
      return idx > 0 && lines[idx - 1]!.trim().startsWith('/**')
    })

    const ratio = functions.length > 0
      ? (documentedFunctions.length / functions.length) * 100
      : 100

    return {
      id: 'doc-coverage',
      type: 'documentation-coverage',
      category: 'documentation',
      name: 'Documentation Coverage',
      value: Math.round(ratio),
      unit: '%',
      warningThreshold: 70,
      errorThreshold: 50,
      status: ratio < 50 ? 'critical' : ratio < 70 ? 'warning' : 'good',
      trend: 'stable',
      description: `${Math.round(ratio)}% of functions documented`,
    }
  }

  /**
   * Calculate overall score from metrics.
   */
  private calculateOverallScore(metrics: CodeMetric[]): number {
    const weights: Record<string, number> = {
      'lines-of-code': 0.1,
      'cyclomatic-complexity': 0.2,
      'cognitive-complexity': 0.15,
      'halstead-volume': 0.1,
      'maintainability-index': 0.2,
      'documentation-coverage': 0.1,
      'duplicate-ratio': 0.1,
      'code-smells': 0.05,
    }

    let totalScore = 0
    let totalWeight = 0

    for (const metric of metrics) {
      const weight = weights[metric.type] ?? 0.1
      let score = 100

      if (metric.status === 'critical') score = 25
      else if (metric.status === 'warning') score = 60

      totalScore += score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 100
  }

  /**
   * Convert score to letter grade.
   */
  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Calculate average metrics across files.
   */
  private calculateAverages(files: FileMetrics[]): Record<MetricType, number> {
    const sums: Partial<Record<MetricType, number>> = {}
    const counts: Partial<Record<MetricType, number>> = {}

    for (const file of files) {
      for (const metric of file.metrics) {
        sums[metric.type] = (sums[metric.type] ?? 0) + metric.value
        counts[metric.type] = (counts[metric.type] ?? 0) + 1
      }
    }

    const averages: Record<MetricType, number> = {} as Record<MetricType, number>
    for (const [type, sum] of Object.entries(sums)) {
      averages[type as MetricType] = Math.round((sum ?? 0) / (counts[type as MetricType] ?? 1))
    }

    return averages
  }

  /**
   * Generate code improvement recommendations.
   */
  private generateRecommendations(files: FileMetrics[]): CodeRecommendation[] {
    const recommendations: CodeRecommendation[] = []

    // Check for complex files
    const complexFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'cyclomatic-complexity' && m.status === 'critical')
    )

    if (complexFiles.length > 0) {
      recommendations.push({
        id: 'reduce-complexity',
        priority: 'high',
        category: 'complexity',
        title: 'Reduce cyclomatic complexity',
        description: `${complexFiles.length} files have high complexity. Consider breaking them into smaller functions.`,
        affectedFiles: complexFiles.map(f => f.path),
        impact: 'Improved maintainability and reduced bug risk',
        effort: 'medium',
      })
    }

    // Check for poorly documented files
    const undocumentedFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'documentation-coverage' && m.status === 'critical')
    )

    if (undocumentedFiles.length > 0) {
      recommendations.push({
        id: 'add-documentation',
        priority: 'medium',
        category: 'documentation',
        title: 'Add documentation',
        description: `${undocumentedFiles.length} files lack documentation. Add JSDoc comments to public APIs.`,
        affectedFiles: undocumentedFiles.map(f => f.path),
        impact: 'Better developer experience and code understanding',
        effort: 'small',
      })
    }

    // Check for duplicate code
    const duplicateFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'duplicate-ratio' && m.status !== 'good')
    )

    if (duplicateFiles.length > 0) {
      recommendations.push({
        id: 'reduce-duplicates',
        priority: 'medium',
        category: 'quality',
        title: 'Extract duplicate code',
        description: `${duplicateFiles.length} files have significant duplicate code. Extract common patterns.`,
        affectedFiles: duplicateFiles.map(f => f.path),
        impact: 'Reduced maintenance burden and fewer bugs',
        effort: 'medium',
      })
    }

    return recommendations
  }

  /**
   * Compare two project snapshots and return trend analysis.
   */
  compareSnapshots(current: ProjectMetrics, previous: ProjectMetrics): TrendAnalysis {
    const metricTrends: Array<{
      metric: MetricType
      current: number
      previous: number
      change: number
      changePercent: number
      direction: 'improved' | 'degraded' | 'stable'
    }> = []

    const allMetricTypes = new Set<MetricType>([
      ...Object.keys(current.averages) as MetricType[],
      ...Object.keys(previous.averages) as MetricType[],
    ])

    for (const type of allMetricTypes) {
      const cur = current.averages[type] ?? 0
      const prev = previous.averages[type] ?? 0
      const change = cur - prev
      const changePercent = prev !== 0 ? Math.round((change / prev) * 100) : 0

      // For some metrics lower is better (complexity, smells, duplicates)
      const lowerIsBetter = ['cyclomatic-complexity', 'cognitive-complexity', 'code-smells', 'duplicate-ratio'].includes(type)
      const improved = lowerIsBetter ? change < 0 : change > 0
      const direction = Math.abs(changePercent) < 5 ? 'stable' : improved ? 'improved' : 'degraded'

      metricTrends.push({
        metric: type,
        current: Math.round(cur),
        previous: Math.round(prev),
        change: Math.round(change),
        changePercent,
        direction,
      })
    }

    const improved = metricTrends.filter(t => t.direction === 'improved').length
    const degraded = metricTrends.filter(t => t.direction === 'degraded').length

    const overallDirection = improved > degraded ? 'improving' : degraded > improved ? 'degrading' : 'stable'

    return {
      periodDays: Math.round((current.history[0]?.timestamp.getTime() ?? Date.now()) - (previous.history[0]?.timestamp.getTime() ?? Date.now())) / 86400000,
      overallDirection,
      metricTrends,
      summary: `Overall ${overallDirection}: ${improved} metrics improved, ${degraded} degraded`,
    }
  }

  /**
   * Calculate technical debt estimate in hours.
   */
  calculateTechnicalDebt(files: FileMetrics[]): TechnicalDebtReport {
    let totalDebtHours = 0
    const items: Array<{
      category: string
      description: string
      estimatedHours: number
      affectedFiles: string[]
      priority: 'high' | 'medium' | 'low'
    }> = []

    // Complexity debt
    const complexFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'cyclomatic-complexity' && m.value > 15)
    )
    if (complexFiles.length > 0) {
      const hours = complexFiles.length * 2
      totalDebtHours += hours
      items.push({
        category: 'complexity',
        description: `${complexFiles.length} files with high cyclomatic complexity need refactoring`,
        estimatedHours: hours,
        affectedFiles: complexFiles.map(f => f.path),
        priority: 'high',
      })
    }

    // Documentation debt
    const undocumentedFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'documentation-coverage' && m.status === 'critical')
    )
    if (undocumentedFiles.length > 0) {
      const hours = undocumentedFiles.length * 0.5
      totalDebtHours += hours
      items.push({
        category: 'documentation',
        description: `${undocumentedFiles.length} files lack sufficient documentation`,
        estimatedHours: hours,
        affectedFiles: undocumentedFiles.map(f => f.path),
        priority: 'medium',
      })
    }

    // Duplicate code debt
    const duplicateFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'duplicate-ratio' && m.value > 15)
    )
    if (duplicateFiles.length > 0) {
      const hours = duplicateFiles.length * 1.5
      totalDebtHours += hours
      items.push({
        category: 'duplicates',
        description: `${duplicateFiles.length} files have significant duplicate code`,
        estimatedHours: hours,
        affectedFiles: duplicateFiles.map(f => f.path),
        priority: 'medium',
      })
    }

    // Code smell debt
    const smellyFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'code-smells' && m.value > 5)
    )
    if (smellyFiles.length > 0) {
      const hours = smellyFiles.length * 0.5
      totalDebtHours += hours
      items.push({
        category: 'code-smells',
        description: `${smellyFiles.length} files have excessive code smells`,
        estimatedHours: hours,
        affectedFiles: smellyFiles.map(f => f.path),
        priority: 'low',
      })
    }

    // Large file debt
    const largeFiles = files.filter(f =>
      f.metrics.some(m => m.type === 'lines-of-code' && m.value > 500)
    )
    if (largeFiles.length > 0) {
      const hours = largeFiles.length * 3
      totalDebtHours += hours
      items.push({
        category: 'file-size',
        description: `${largeFiles.length} files exceed 500 lines`,
        estimatedHours: hours,
        affectedFiles: largeFiles.map(f => f.path),
        priority: 'medium',
      })
    }

    const debtRatio = files.length > 0
      ? Math.round((totalDebtHours / (files.length * 8)) * 100) / 100
      : 0

    return {
      totalHours: Math.round(totalDebtHours * 10) / 10,
      debtRatio,
      items: items.sort((a, b) => b.estimatedHours - a.estimatedHours),
      grade: totalDebtHours < 10 ? 'A' : totalDebtHours < 25 ? 'B' : totalDebtHours < 50 ? 'C' : totalDebtHours < 100 ? 'D' : 'F',
    }
  }

  /**
   * Export project metrics to a serializable format.
   */
  exportMetrics(metrics: ProjectMetrics, format: 'json' | 'csv' | 'summary'): string {
    if (format === 'json') {
      return JSON.stringify(metrics, null, 2)
    }

    if (format === 'csv') {
      const header = 'File,Score,Grade,LOC,Cyclomatic,Cognitive,Doc Coverage,Duplicate%\n'
      const rows = metrics.worstFiles.concat(metrics.bestFiles).map(f => {
        const getVal = (type: MetricType) => f.metrics.find(m => m.type === type)?.value ?? 0
        return [
          f.path,
          f.overallScore,
          f.grade,
          getVal('lines-of-code'),
          getVal('cyclomatic-complexity'),
          getVal('cognitive-complexity'),
          getVal('documentation-coverage'),
          getVal('duplicate-ratio'),
        ].join(',')
      }).join('\n')

      return header + rows
    }

    // Summary format
    const lines = [
      `# Code Metrics Report`,
      ``,
      `**Overall Score:** ${metrics.overallScore}/100 (Grade ${metrics.grade})`,
      `**Files Analyzed:** ${metrics.totalFiles}`,
      `**Total LOC:** ${metrics.totalLOC}`,
      ``,
      `## Averages`,
    ]

    for (const [type, value] of Object.entries(metrics.averages)) {
      lines.push(`- **${type}:** ${value}`)
    }

    lines.push('', '## Recommendations')
    for (const rec of metrics.recommendations) {
      lines.push(`- [${rec.priority}] **${rec.title}**: ${rec.description}`)
    }

    return lines.join('\n')
  }

  /**
   * Subscribe to metrics updates.
   */
  subscribe(listener: (metrics: ProjectMetrics) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(metrics: ProjectMetrics): void {
    for (const listener of this.listeners) {
      try { listener(metrics) } catch { /* ignore */ }
    }
  }
}

/** Trend analysis result */
export interface TrendAnalysis {
  /** Days between snapshots */
  periodDays: number
  /** Overall direction */
  overallDirection: 'improving' | 'stable' | 'degrading'
  /** Per-metric trends */
  metricTrends: Array<{
    metric: MetricType
    current: number
    previous: number
    change: number
    changePercent: number
    direction: 'improved' | 'degraded' | 'stable'
  }>
  /** Human-readable summary */
  summary: string
}

/** Technical debt item */
export interface TechnicalDebtItem {
  category: string
  description: string
  estimatedHours: number
  affectedFiles: string[]
  priority: 'high' | 'medium' | 'low'
}

/** Technical debt report */
export interface TechnicalDebtReport {
  /** Total estimated hours to fix */
  totalHours: number
  /** Debt ratio (hours per file per day of dev) */
  debtRatio: number
  /** Individual debt items */
  items: TechnicalDebtItem[]
  /** Overall debt grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

/** Singleton instance */
let instance: CodeMetricsEngine | null = null

export function getCodeMetricsEngine(
  config?: Partial<MetricsDashboardConfig>
): CodeMetricsEngine {
  if (!instance) {
    instance = new CodeMetricsEngine(config)
  }
  return instance
}

export function resetCodeMetricsEngine(): void {
  instance = null
}
