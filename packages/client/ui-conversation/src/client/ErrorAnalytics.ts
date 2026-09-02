/**
 * Advanced Error Analytics engine.
 *
 * Collects, clusters, and analyses runtime errors to surface patterns,
 * root causes, and fix recommendations.  Designed for in-process use — no
 * external telemetry service required.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ErrorCategory = 'runtime' | 'type' | 'network' | 'auth' | 'validation' | 'permission' | 'resource' | 'unknown'

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type ErrorTrend = 'increasing' | 'stable' | 'decreasing'

export interface CapturedError {
  readonly id: string
  readonly message: string
  readonly stack: string
  readonly category: ErrorCategory
  readonly severity: ErrorSeverity
  readonly source: string
  readonly timestamp: number
  context?: Record<string, unknown> | undefined
  readonly count: number
  readonly firstSeen: number
  readonly lastSeen: number
}

export interface ErrorCluster {
  readonly id: string
  readonly pattern: string
  readonly errors: readonly CapturedError[]
  readonly totalCount: number
  readonly category: ErrorCategory
  readonly suggestedFix?: string
  readonly relatedFiles: readonly string[]
}

export interface ErrorAnalyticsReport {
  readonly period: string
  readonly totalErrors: number
  readonly uniquePatterns: number
  readonly categoryBreakdown: Record<ErrorCategory, number>
  readonly severityBreakdown: Record<ErrorSeverity, number>
  readonly clusters: readonly ErrorCluster[]
  readonly topErrors: readonly CapturedError[]
  readonly trend: ErrorTrend
  readonly recommendations: readonly string[]
  readonly mttr: number // mean time to resolution estimate (ms)
}

export interface ErrorAnalyticsConfig {
  readonly maxErrors: number
  readonly clusterSimilarity: number
  readonly patternMinCount: number
  readonly trackingEnabled: boolean
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ErrorAnalyticsEngine {
  private readonly errors: CapturedError[] = []
  private readonly clusters: ErrorCluster[] = []
  private readonly config: ErrorAnalyticsConfig

  constructor(config?: Partial<ErrorAnalyticsConfig>) {
    this.config = {
      maxErrors: config?.maxErrors ?? 10_000,
      clusterSimilarity: config?.clusterSimilarity ?? 0.7,
      patternMinCount: config?.patternMinCount ?? 2,
      trackingEnabled: config?.trackingEnabled ?? true,
    }
  }

  /** Record a new error occurrence. */
  recordError(error: {
    message: string
    stack: string
    source: string
    context?: Record<string, unknown>
  }): CapturedError {
    if (!this.config.trackingEnabled) {
      return this.emptyError(error)
    }

    const pattern = this.extractPattern(error.message)
    const existing = this.errors.find(e => this.extractPattern(e.message) === pattern)

    if (existing) {
      const updated: CapturedError = {
        ...existing,
        count: existing.count + 1,
        lastSeen: Date.now(),
      }
      const idx = this.errors.indexOf(existing)
      this.errors[idx] = updated
      this.updateClusters(updated)
      return updated
    }

    const captured: CapturedError = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      message: error.message,
      stack: error.stack,
      category: this.categorizeError(error.message, error.stack),
      severity: this.assessSeverity(error.message, error.stack),
      source: error.source,
      timestamp: Date.now(),
      context: error.context,
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    }

    this.errors.push(captured)
    if (this.errors.length > this.config.maxErrors) {
      this.errors.splice(0, this.errors.length - this.config.maxErrors)
    }

    this.addToClusters(captured)
    return captured
  }

  getErrors(category?: ErrorCategory, severity?: ErrorSeverity): CapturedError[] {
    return this.errors.filter(e =>
      (!category || e.category === category) &&
      (!severity || e.severity === severity),
    )
  }

  getClusters(): ErrorCluster[] { return [...this.clusters] }

  getReport(periodDays: number = 7): ErrorAnalyticsReport {
    const cutoff = Date.now() - periodDays * 86_400_000
    const periodErrors = this.errors.filter(e => e.lastSeen >= cutoff)

    const categoryBreakdown: Record<ErrorCategory, number> = {
      runtime: 0, type: 0, network: 0, auth: 0, validation: 0, permission: 0, resource: 0, unknown: 0,
    }
    const severityBreakdown: Record<ErrorSeverity, number> = {
      critical: 0, high: 0, medium: 0, low: 0, info: 0,
    }
    for (const e of periodErrors) {
      categoryBreakdown[e.category] += e.count
      severityBreakdown[e.severity] += e.count
    }

    const trend = this.calculateTrend(periodErrors)
    const totalErrors = periodErrors.reduce((sum, e) => sum + e.count, 0)
    const topErrors = [...periodErrors].sort((a, b) => b.count - a.count).slice(0, 10)
    const recommendations = this.generateRecommendations(periodErrors, this.clusters)

    return {
      period: `${new Date(cutoff).toISOString().slice(0, 10)} to ${new Date().toISOString().slice(0, 10)}`,
      totalErrors,
      uniquePatterns: this.clusters.length,
      categoryBreakdown,
      severityBreakdown,
      clusters: [...this.clusters],
      topErrors,
      trend,
      recommendations,
      mttr: this.estimateMTTR(periodErrors),
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private categorizeError(message: string, stack: string): ErrorCategory {
    const combined = `${message} ${stack}`.toLowerCase()
    if (/type\s*error|type\s*range|cannot\s*read|undefined\s*is\s*not/i.test(combined)) return 'type'
    if (/fetch|network|econnrefused|timeout|cors|dns/i.test(combined)) return 'network'
    if (/auth|unauthorized|forbidden|401|403|token|jwt/i.test(combined)) return 'auth'
    if (/validation|required|invalid|expected/i.test(combined)) return 'validation'
    if (/permission|access|denied|not\s*allowed/i.test(combined)) return 'permission'
    if (/memory|heap|quota|limit|overflow|enoent|enospc/i.test(combined)) return 'resource'
    if (/syntax|reference|range|uri|eval|internal/i.test(combined)) return 'runtime'
    return 'unknown'
  }

  private assessSeverity(message: string, stack: string): ErrorSeverity {
    const combined = `${message} ${stack}`.toLowerCase()
    if (/out.of.memory|heap|stack.overflow|segfault/i.test(combined)) return 'critical'
    if (/unhandled|uncaught|fatal|crash|cannot\s*read\s*propert/i.test(combined)) return 'high'
    if (/type\s*error|reference\s*error|network|timeout/i.test(combined)) return 'medium'
    if (/warning|deprecat|console/i.test(combined)) return 'low'
    return 'info'
  }

  private extractPattern(message: string): string {
    return message
      .replace(/\d+/g, '<N>')
      .replace(/['"`][^'"`]{10,}['"`]/g, '<STR>')
      .replace(/0x[0-9a-f]+/gi, '<HEX>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120)
  }

  private addToClusters(error: CapturedError): void {
    for (const cluster of this.clusters) {
      if (this.similarity(this.extractPattern(error.message), cluster.pattern) >= this.config.clusterSimilarity) {
        const updated: ErrorCluster = {
          ...cluster,
          errors: [...cluster.errors, error],
          totalCount: cluster.totalCount + 1,
          relatedFiles: [...new Set([...cluster.relatedFiles, error.source])],
        }
        const idx = this.clusters.indexOf(cluster)
        this.clusters[idx] = updated
        return
      }
    }
    this.clusters.push({
      id: `clust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      pattern: this.extractPattern(error.message),
      errors: [error],
      totalCount: 1,
      category: error.category,
      relatedFiles: [error.source],
    })
  }

  private updateClusters(error: CapturedError): void {
    for (let i = 0; i < this.clusters.length; i++) {
      const cluster = this.clusters[i]
      if (cluster && cluster.errors.some(e => e.id === error.id)) {
        const updated: ErrorCluster = {
          id: cluster.id,
          pattern: cluster.pattern,
          errors: cluster.errors,
          totalCount: cluster.errors.reduce((sum, e) => sum + e.count, 0),
          category: cluster.category,
          relatedFiles: cluster.relatedFiles,
        }
        this.clusters[i] = updated
        return
      }
    }
  }

  private similarity(a: string, b: string): number {
    if (a === b) return 1
    const aTokens = new Set(a.split(' '))
    const bTokens = new Set(b.split(' '))
    const intersection = [...aTokens].filter(t => bTokens.has(t)).length
    const union = new Set([...aTokens, ...bTokens]).size
    return union > 0 ? intersection / union : 0
  }

  private calculateTrend(errors: CapturedError[]): ErrorTrend {
    if (errors.length < 4) return 'stable'
    const now = Date.now()
    const recent = errors.filter(e => e.lastSeen > now - 86_400_000)
    const older = errors.filter(e => e.lastSeen <= now - 86_400_000 && e.lastSeen > now - 2 * 86_400_000)
    const recentTotal = recent.reduce((s, e) => s + e.count, 0)
    const olderTotal = older.reduce((s, e) => s + e.count, 0)
    if (recentTotal > olderTotal * 1.3) return 'increasing'
    if (recentTotal < olderTotal * 0.7) return 'decreasing'
    return 'stable'
  }

  private estimateMTTR(errors: CapturedError[]): number {
    if (errors.length === 0) return 0
    const resolved = errors.filter(e => e.count === 1 && (Date.now() - e.lastSeen) < 86_400_000 * 7)
    if (resolved.length === 0) return 3_600_000
    return resolved.reduce((sum, e) => sum + (e.lastSeen - e.firstSeen), 0) / resolved.length
  }

  private generateRecommendations(errors: CapturedError[], clusters: ErrorCluster[]): string[] {
    const recs: string[] = []
    const criticals = errors.filter(e => e.severity === 'critical')
    if (criticals.length > 0) recs.push(`Address ${criticals.length} critical error(s) immediately — they may cause system instability.`)
    const topCluster = clusters.sort((a, b) => b.totalCount - a.totalCount)[0]
    if (topCluster && topCluster.totalCount >= this.config.patternMinCount) {
      recs.push(`Most frequent error pattern (${topCluster.totalCount} occurrences) in [${topCluster.relatedFiles.join(', ')}] — investigate root cause.`)
    }
    const networkErrors = errors.filter(e => e.category === 'network')
    if (networkErrors.length > 3) recs.push('Frequent network errors detected — add retry logic and timeout handling.')
    const authErrors = errors.filter(e => e.category === 'auth')
    if (authErrors.length > 3) recs.push('Authentication errors are recurring — verify token refresh and credential lifecycle.')
    if (recs.length === 0) recs.push('No significant error patterns detected. Keep monitoring.')
    return recs
  }

  private emptyError(error: { message: string; stack: string; source: string }): CapturedError {
    return {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      message: error.message,
      stack: error.stack,
      category: 'unknown',
      severity: 'info',
      source: error.source,
      timestamp: Date.now(),
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    }
  }
}

let _instance: ErrorAnalyticsEngine | undefined
export function getErrorAnalyticsEngine(config?: Partial<ErrorAnalyticsConfig>): ErrorAnalyticsEngine {
  _instance ??= new ErrorAnalyticsEngine(config)
  return _instance
}
export function resetErrorAnalyticsEngine(): void { _instance = undefined }
