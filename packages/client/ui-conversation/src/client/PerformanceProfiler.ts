/**
 * Performance Profiler Engine for Idexal Agents.
 * Real-time performance monitoring, bottleneck detection,
 * render profiling, and optimization recommendations.
 */

/** Metric type */
export type ProfilerMetric = 'fps' | 'memory' | 'render' | 'network' | 'interaction' | 'bundle'

/** Performance snapshot */
export interface PerformanceSnapshot {
  timestamp: number
  fps: number
  frameTime: number
  memory: {
    used: number
    total: number
    limit: number
    percentage: number
  }
  render: {
    count: number
    avgDuration: number
    maxDuration: number
    longFrames: number
  }
  network: {
    requests: number
    failed: number
    avgLatency: number
    totalTransfer: number
  }
  interaction: {
    inputLatency: number
    clickLatency: number
    scrollLatency: number
  }
}

/** Performance issue */
export interface PerformanceIssue {
  id: string
  type: 'fps-drop' | 'memory-leak' | 'slow-render' | 'long-task' | 'layout-thrashing' | 'large-payload' | 'excessive-dom'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  metric: ProfilerMetric
  value: number
  threshold: number
  suggestion: string
  timestamp: number
}

/** Performance report */
export interface PerformanceReport {
  id: string
  duration: number
  snapshots: PerformanceSnapshot[]
  issues: PerformanceIssue[]
  summary: {
    avgFps: number
    minFps: number
    maxFps: number
    avgMemory: number
    peakMemory: number
    totalIssues: number
    criticalIssues: number
    score: number
  }
  recommendations: string[]
  generatedAt: number
}

/** Profiler config */
export interface PerformanceProfilerConfig {
  sampleInterval: number
  maxSnapshots: number
  thresholds: {
    fpsLow: number
    fpsCritical: number
    memoryHigh: number
    memoryCritical: number
    renderSlow: number
    inputLatencyHigh: number
    longTaskMs: number
  }
  enableAutoDetect: boolean
}

const DEFAULT_PROFILER_CONFIG: PerformanceProfilerConfig = {
  sampleInterval: 1000,
  maxSnapshots: 300,
  thresholds: {
    fpsLow: 55,
    fpsCritical: 30,
    memoryHigh: 0.7,
    memoryCritical: 0.9,
    renderSlow: 16,
    inputLatencyHigh: 100,
    longTaskMs: 50,
  },
  enableAutoDetect: true,
}

/**
 * Performance Profiler Engine.
 */
export class PerformanceProfilerEngine {
  private config: PerformanceProfilerConfig
  private snapshots: PerformanceSnapshot[] = []
  private issues: PerformanceIssue[] = []
  private listeners: Set<(event: ProfilerEvent) => void> = new Set()
  private sampleTimer: ReturnType<typeof setInterval> | null = null
  private isRunning = false
  private frameCount = 0
  private lastFrameTime = 0

  constructor(config: Partial<PerformanceProfilerConfig> = {}) {
    this.config = { ...DEFAULT_PROFILER_CONFIG, ...config }
  }

  /**
   * Start profiling.
   */
  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.snapshots = []
    this.issues = []
    this.lastFrameTime = performance.now()

    this.sampleTimer = setInterval(() => {
      this.collectSnapshot()
    }, this.config.sampleInterval)

    this.notifyListeners({ type: 'profiler-started' })
  }

  /**
   * Stop profiling and generate report.
   */
  stop(): PerformanceReport {
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer)
      this.sampleTimer = null
    }
    this.isRunning = false

    const report = this.generateReport()
    this.notifyListeners({ type: 'profiler-stopped', report })
    return report
  }

  /**
   * Collect a single snapshot.
   */
  collectSnapshot(): PerformanceSnapshot {
    const now = performance.now()
    const frameTime = now - this.lastFrameTime
    const fps = frameTime > 0 ? 1000 / frameTime : 60
    this.lastFrameTime = now

    // Memory (if available)
    const memInfo = typeof performance !== 'undefined' && 'memory' in performance
      ? (performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      : null

    const memoryUsed = memInfo?.usedJSHeapSize ?? 0
    const memoryTotal = memInfo?.totalJSHeapSize ?? 0
    const memoryLimit = memInfo?.jsHeapSizeLimit ?? 0

    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      fps: Math.round(fps * 10) / 10,
      frameTime: Math.round(frameTime * 10) / 10,
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        limit: memoryLimit,
        percentage: memoryLimit > 0 ? memoryUsed / memoryLimit : 0,
      },
      render: {
        count: this.frameCount,
        avgDuration: frameTime,
        maxDuration: Math.max(frameTime, 16),
        longFrames: frameTime > this.config.thresholds.longTaskMs ? 1 : 0,
      },
      network: { requests: 0, failed: 0, avgLatency: 0, totalTransfer: 0 },
      interaction: { inputLatency: 0, clickLatency: 0, scrollLatency: 0 },
    }

    this.snapshots.push(snapshot)
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift()
    }

    // Auto-detect issues
    if (this.config.enableAutoDetect) {
      this.detectIssues(snapshot)
    }

    this.frameCount++
    this.notifyListeners({ type: 'snapshot-collected', snapshot })
    return snapshot
  }

  /**
   * Get current snapshot.
   */
  getCurrentSnapshot(): PerformanceSnapshot {
    return this.collectSnapshot()
  }

  /**
   * Get all collected snapshots.
   */
  getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots]
  }

  /**
   * Get detected issues.
   */
  getIssues(): PerformanceIssue[] {
    return [...this.issues]
  }

  /**
   * Check if profiler is running.
   */
  getIsRunning(): boolean {
    return this.isRunning
  }

  private detectIssues(snapshot: PerformanceSnapshot): void {
    // FPS drop
    if (snapshot.fps < this.config.thresholds.fpsCritical) {
      this.addIssue({
        type: 'fps-drop', severity: 'critical',
        title: 'Critical FPS Drop',
        description: `FPS dropped to ${snapshot.fps}, severely impacting user experience.`,
        metric: 'fps', value: snapshot.fps, threshold: this.config.thresholds.fpsCritical,
        suggestion: 'Check for long-running synchronous operations, optimize render cycles, or reduce DOM complexity.',
      })
    } else if (snapshot.fps < this.config.thresholds.fpsLow) {
      this.addIssue({
        type: 'fps-drop', severity: 'warning',
        title: 'Low FPS Detected',
        description: `FPS at ${snapshot.fps}, below smooth threshold of ${this.config.thresholds.fpsLow}.`,
        metric: 'fps', value: snapshot.fps, threshold: this.config.thresholds.fpsLow,
        suggestion: 'Profile expensive components and consider memoization or virtualization.',
      })
    }

    // Memory
    if (snapshot.memory.percentage > this.config.thresholds.memoryCritical) {
      this.addIssue({
        type: 'memory-leak', severity: 'critical',
        title: 'Critical Memory Usage',
        description: `Memory usage at ${Math.round(snapshot.memory.percentage * 100)}%, approaching browser limit.`,
        metric: 'memory', value: snapshot.memory.percentage, threshold: this.config.thresholds.memoryCritical,
        suggestion: 'Check for memory leaks in event listeners, timers, and closures. Consider lazy loading.',
      })
    } else if (snapshot.memory.percentage > this.config.thresholds.memoryHigh) {
      this.addIssue({
        type: 'memory-leak', severity: 'warning',
        title: 'High Memory Usage',
        description: `Memory usage at ${Math.round(snapshot.memory.percentage * 100)}%.`,
        metric: 'memory', value: snapshot.memory.percentage, threshold: this.config.thresholds.memoryHigh,
        suggestion: 'Monitor for continued growth. Consider reducing data held in memory.',
      })
    }

    // Long frames
    if (snapshot.render.longFrames > 0) {
      this.addIssue({
        type: 'long-task', severity: 'warning',
        title: 'Long Task Detected',
        description: `Frame took ${snapshot.frameTime}ms, blocking the main thread.`,
        metric: 'render', value: snapshot.frameTime, threshold: this.config.thresholds.longTaskMs,
        suggestion: 'Break long tasks into smaller chunks using requestIdleCallback or setTimeout.',
      })
    }
  }

  private addIssue(issue: Omit<PerformanceIssue, 'id' | 'timestamp'>): void {
    // Don't duplicate similar recent issues
    const recentSimilar = this.issues.find(
      i => i.type === issue.type && Date.now() - i.timestamp < 5000
    )
    if (recentSimilar) return

    this.issues.push({
      ...issue,
      id: `perf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    })
  }

  private generateReport(): PerformanceReport {
    if (this.snapshots.length === 0) {
      return {
        id: `report-${Date.now()}`,
        duration: 0, snapshots: [], issues: [],
        summary: { avgFps: 0, minFps: 0, maxFps: 0, avgMemory: 0, peakMemory: 0, totalIssues: 0, criticalIssues: 0, score: 0 },
        recommendations: ['No data collected. Start profiling to generate a report.'],
        generatedAt: Date.now(),
      }
    }

    const fpsValues = this.snapshots.map(s => s.fps)
    const memoryValues = this.snapshots.map(s => s.memory.percentage)
    const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length
    const minFps = Math.min(...fpsValues)
    const maxFps = Math.max(...fpsValues)
    const avgMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length
    const peakMemory = Math.max(...memoryValues)

    const totalIssues = this.issues.length
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length

    // Score: 100 base, deductions for issues
    let score = 100
    if (avgFps < 30) score -= 30
    else if (avgFps < 55) score -= 15
    if (peakMemory > 0.9) score -= 25
    else if (peakMemory > 0.7) score -= 10
    score -= criticalIssues * 10
    score -= Math.min(20, totalIssues * 2)
    score = Math.max(0, Math.min(100, score))

    const recommendations: string[] = []
    if (avgFps < 55) recommendations.push('Optimize render cycles — consider React.memo, useMemo, and useCallback')
    if (peakMemory > 0.7) recommendations.push('Investigate memory usage — check for leaks in subscriptions and event listeners')
    if (this.issues.some(i => i.type === 'long-task')) recommendations.push('Break long tasks into smaller async chunks')
    if (this.issues.some(i => i.type === 'excessive-dom')) recommendations.push('Reduce DOM complexity with virtualization for large lists')
    if (recommendations.length === 0) recommendations.push('Performance looks healthy! Continue monitoring.')

    return {
      id: `report-${Date.now()}`,
      duration: this.snapshots[this.snapshots.length - 1]!.timestamp - this.snapshots[0]!.timestamp,
      snapshots: this.snapshots,
      issues: this.issues,
      summary: { avgFps: Math.round(avgFps * 10) / 10, minFps: Math.round(minFps * 10) / 10, maxFps: Math.round(maxFps * 10) / 10, avgMemory: Math.round(avgMemory * 1000) / 1000, peakMemory: Math.round(peakMemory * 1000) / 1000, totalIssues, criticalIssues, score },
      recommendations,
      generatedAt: Date.now(),
    }
  }

  subscribe(listener: (event: ProfilerEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: ProfilerEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }

  destroy(): void {
    if (this.sampleTimer) clearInterval(this.sampleTimer)
    this.snapshots = []
    this.issues = []
  }
}

/** Profiler event */
export interface ProfilerEvent {
  type: 'profiler-started' | 'profiler-stopped' | 'snapshot-collected' | 'issue-detected'
  snapshot?: PerformanceSnapshot
  report?: PerformanceReport
}

/** Singleton */
let instance: PerformanceProfilerEngine | null = null

export function getPerformanceProfilerEngine(config?: Partial<PerformanceProfilerConfig>): PerformanceProfilerEngine {
  if (!instance) instance = new PerformanceProfilerEngine(config)
  return instance
}

export function resetPerformanceProfilerEngine(): void {
  instance?.destroy()
  instance = null
}
