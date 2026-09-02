/**
 * Performance Regression Detector engine.
 *
 * Compares sequential performance snapshots (build times, bundle sizes,
 * render latency, memory usage) to detect regressions before they reach
 * production.  Uses statistical thresholds and trend analysis.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MetricUnit = 'ms' | 'bytes' | 'count' | 'percent' | 'score'

export type RegressionSeverity = 'critical' | 'major' | 'minor' | 'none'

export interface PerfSnapshot {
  readonly timestamp: number
  readonly buildId: string
  readonly metrics: PerfMetric[]
  readonly metadata?: Record<string, unknown>
}

export interface PerfMetric {
  readonly name: string
  readonly value: number
  readonly unit: MetricUnit
  readonly baseline?: number
}

export interface Regression {
  readonly metric: string
  readonly current: number
  readonly baseline: number
  readonly changePercent: number
  readonly severity: RegressionSeverity
  readonly unit: MetricUnit
  readonly message: string
  readonly recommendation: string
}

export interface RegressionReport {
  readonly buildId: string
  readonly regressions: readonly Regression[]
  readonly improvements: readonly Regression[]
  readonly totalRegressions: number
  readonly totalImprovements: number
  readonly overallHealth: 'healthy' | 'warning' | 'degraded' | 'critical'
  readonly score: number
  readonly recommendations: readonly string[]
}

export interface RegressionDetectorConfig {
  readonly regressionThresholdPercent: number
  readonly criticalThresholdPercent: number
  readonly comparisonWindow: number  // number of snapshots
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class RegressionDetectorEngine {
  private readonly snapshots: PerfSnapshot[] = []
  private readonly config: RegressionDetectorConfig

  constructor(config?: Partial<RegressionDetectorConfig>) {
    this.config = {
      regressionThresholdPercent: config?.regressionThresholdPercent ?? 10,
      criticalThresholdPercent: config?.criticalThresholdPercent ?? 30,
      comparisonWindow: config?.comparisonWindow ?? 5,
    }
  }

  addSnapshot(snapshot: PerfSnapshot): void {
    this.snapshots.push(snapshot)
    if (this.snapshots.length > 100) this.snapshots.splice(0, this.snapshots.length - 100)
  }

  /** Compare latest snapshot against its baseline. */
  detectRegressions(): RegressionReport | undefined {
    if (this.snapshots.length < 2) return undefined
    const current = this.snapshots[this.snapshots.length - 1]!
    const baseline = this.getBaseline()
    const regressions: Regression[] = []
    const improvements: Regression[] = []

    for (const metric of current.metrics) {
      const baseMetric = baseline.metrics.find(m => m.name === metric.name)
      if (!baseMetric || baseMetric.value === 0) continue
      const changePercent = ((metric.value - baseMetric.value) / baseMetric.value) * 100
      if (changePercent > 0) {
        const severity = this.classifyRegression(changePercent)
        if (severity !== 'none') {
          regressions.push({
            metric: metric.name, current: metric.value, baseline: baseMetric.value,
            changePercent, severity, unit: metric.unit,
            message: `${metric.name} regressed by ${changePercent.toFixed(1)}%`,
            recommendation: this.getRecommendation(metric.name, changePercent),
          })
        }
      } else if (changePercent < -5) {
        improvements.push({
          metric: metric.name, current: metric.value, baseline: baseMetric.value,
          changePercent, severity: 'none', unit: metric.unit,
          message: `${metric.name} improved by ${Math.abs(changePercent).toFixed(1)}%`,
          recommendation: '',
        })
      }
    }

    const criticals = regressions.filter(r => r.severity === 'critical').length
    const majors = regressions.filter(r => r.severity === 'major').length
    const overallHealth: RegressionReport['overallHealth'] = criticals > 0 ? 'critical' : majors > 0 ? 'degraded' : regressions.length > 0 ? 'warning' : 'healthy'
    const score = Math.max(0, 100 - criticals * 30 - majors * 15 - regressions.length * 3)
    const recommendations = this.generateRecommendations(regressions, overallHealth)

    return { buildId: current.buildId, regressions, improvements, totalRegressions: regressions.length, totalImprovements: improvements.length, overallHealth, score, recommendations }
  }

  /** Get trend data for a specific metric across recent snapshots. */
  getMetricTrend(metricName: string): { timestamps: number[]; values: number[]; trend: 'improving' | 'stable' | 'regressing' } {
    const window = this.snapshots.slice(-this.config.comparisonWindow)
    const timestamps = window.map(s => s.timestamp)
    const values = window.map(s => s.metrics.find(m => m.name === metricName)?.value ?? 0)
    let trend: 'improving' | 'stable' | 'regressing' = 'stable'
    if (values.length >= 3) {
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      const change = ((avgSecond - avgFirst) / (avgFirst || 1)) * 100
      if (change > 10) trend = 'regressing'
      else if (change < -10) trend = 'improving'
    }
    return { timestamps, values, trend }
  }

  getSnapshots(): PerfSnapshot[] { return [...this.snapshots] }

  private getBaseline(): PerfSnapshot {
    const window = this.snapshots.slice(-this.config.comparisonWindow)
    // Use median of window as baseline
    const avgMetrics: PerfMetric[] = []
    if (window.length === 0) return this.snapshots[0]!
    const metricNames = [...new Set(window.flatMap(s => s.metrics.map(m => m.name)))]
    for (const name of metricNames) {
      const values = window.map(s => s.metrics.find(m => m.name === name)?.value ?? 0).sort((a, b) => a - b)
      const median = values[Math.floor(values.length / 2)] ?? 0
      const unit = window[0]?.metrics.find(m => m.name === name)?.unit ?? 'count'
      avgMetrics.push({ name, value: median, unit })
    }
    return { timestamp: window[0]!.timestamp, buildId: 'baseline', metrics: avgMetrics }
  }

  private classifyRegression(changePercent: number): RegressionSeverity {
    if (changePercent >= this.config.criticalThresholdPercent) return 'critical'
    if (changePercent >= this.config.regressionThresholdPercent * 2) return 'major'
    if (changePercent >= this.config.regressionThresholdPercent) return 'minor'
    return 'none'
  }

  private getRecommendation(metricName: string, changePercent: number): string {
    const name = metricName.toLowerCase()
    if (name.includes('bundle') || name.includes('size')) return 'Check for newly added dependencies or removed code splitting.'
    if (name.includes('render') || name.includes('fps')) return 'Profile component renders and check for unnecessary re-renders.'
    if (name.includes('memory')) return 'Check for memory leaks in event listeners, closures, or detached DOM nodes.'
    if (name.includes('build') || name.includes('compile')) return 'Review webpack/vite config changes and check for new transform plugins.'
    if (name.includes('lcp') || name.includes('cls') || name.includes('fid')) return 'Optimise Core Web Vitals: lazy-load below-the-fold content and reduce layout shifts.'
    return `Investigate the ${changePercent.toFixed(0)}% regression in ${metricName}.`
  }

  private generateRecommendations(regressions: Regression[], health: string): string[] {
    const recs: string[] = []
    if (health === 'critical') recs.push('🚨 Critical performance regression detected — block the build until resolved.')
    const criticals = regressions.filter(r => r.severity === 'critical')
    if (criticals.length > 0) recs.push(`${criticals.length} critical metric(s) regressed: ${criticals.map(r => r.metric).join(', ')}.`)
    if (regressions.length > 3) recs.push('Multiple metrics regressing — review recent changes holistically.')
    if (recs.length === 0) recs.push('No significant regressions detected.')
    return recs
  }
}

let _instance: RegressionDetectorEngine | undefined
export function getRegressionDetectorEngine(config?: Partial<RegressionDetectorConfig>): RegressionDetectorEngine {
  _instance ??= new RegressionDetectorEngine(config)
  return _instance
}
export function resetRegressionDetectorEngine(): void { _instance = undefined }
