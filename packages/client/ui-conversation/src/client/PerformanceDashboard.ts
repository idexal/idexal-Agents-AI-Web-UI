/**
 * Performance Dashboard Engine for Idexal Agents.
 * Provides real-time performance monitoring with FPS tracking,
 * memory usage, network stats, and optimization suggestions.
 */

/** Performance metric type */
export type MetricType = 'fps' | 'memory' | 'network' | 'render' | 'interaction'

/** Performance metric */
export interface PerformanceMetric {
  /** Metric type */
  type: MetricType
  /** Current value */
  current: number
  /** Average value */
  average: number
  /** Minimum value */
  min: number
  /** Maximum value */
  max: number
  /** Unit of measurement */
  unit: string
  /** Timestamp */
  timestamp: number
  /** History of values */
  history: number[]
}

/** FPS data */
export interface FPSData {
  /** Current FPS */
  current: number
  /** Average FPS */
  average: number
  /** Frame time in ms */
  frameTime: number
  /** Jank frames count */
  jankFrames: number
  /** Total frames rendered */
  totalFrames: number
  /** FPS history */
  history: number[]
}

/** Memory data */
export interface MemoryData {
  /** Used heap in MB */
  usedHeap: number
  /** Total heap in MB */
  totalHeap: number
  /** Heap usage percentage */
  heapPercentage: number
  /** External memory in MB */
  external: number
  /** Memory trend */
  trend: 'growing' | 'stable' | 'shrinking'
}

/** Network data */
export interface NetworkData {
  /** Requests in progress */
  activeRequests: number
  /** Total requests */
  totalRequests: number
  /** Failed requests */
  failedRequests: number
  /** Average response time in ms */
  avgResponseTime: number
  /** Total bytes transferred */
  bytesTransferred: number
  /** Network status */
  status: 'online' | 'offline' | 'slow'
}

/** Render data */
export interface RenderData {
  /** Components rendered */
  componentsRendered: number
  /** Re-renders triggered */
  reRenders: number
  /** DOM mutations */
  domMutations: number
  /** Layout recalculations */
  layoutRecalcs: number
  /** Paint operations */
  paintOperations: number
}

/** Performance snapshot */
export interface PerformanceSnapshot {
  /** FPS data */
  fps: FPSData
  /** Memory data */
  memory: MemoryData
  /** Network data */
  network: NetworkData
  /** Render data */
  render: RenderData
  /** Performance score (0-100) */
  score: number
  /** Performance grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  /** Issues detected */
  issues: PerformanceIssue[]
  /** Optimization suggestions */
  suggestions: string[]
  /** Snapshot timestamp */
  timestamp: number
}

/** Performance issue */
export interface PerformanceIssue {
  /** Issue type */
  type: 'fps-drop' | 'memory-leak' | 'slow-render' | 'network-delay' | 'jank'
  /** Severity */
  severity: 'critical' | 'warning' | 'info'
  /** Description */
  description: string
  /** Suggested fix */
  suggestion: string
}

/** Dashboard config */
export interface PerformanceDashboardConfig {
  /** Monitoring interval in ms */
  interval: number
  /** History size */
  historySize: number
  /** Enable FPS monitoring */
  enableFPS: boolean
  /** Enable memory monitoring */
  enableMemory: boolean
  /** Enable network monitoring */
  enableNetwork: boolean
  /** Enable render monitoring */
  enableRender: boolean
  /** FPS threshold for warnings */
  fpsWarningThreshold: number
  /** Memory threshold in MB */
  memoryWarningThreshold: number
  /** Response time threshold in ms */
  responseTimeThreshold: number
}

/**
 * Performance Dashboard Engine.
 */
export class PerformanceDashboardEngine {
  private config: PerformanceDashboardConfig
  private snapshot: PerformanceSnapshot
  private monitorTimer: ReturnType<typeof setInterval> | null = null
  private fpsFrames: number[] = []
  private lastFrameTime: number = 0
  private listeners: Set<(snapshot: PerformanceSnapshot) => void> = new Set()
  private observers: {
    mutation?: MutationObserver | undefined
    performance?: PerformanceObserver | undefined
  } = {}

  constructor(config: Partial<PerformanceDashboardConfig> = {}) {
    this.config = {
      interval: config.interval ?? 1000,
      historySize: config.historySize ?? 60,
      enableFPS: config.enableFPS ?? true,
      enableMemory: config.enableMemory ?? true,
      enableNetwork: config.enableNetwork ?? true,
      enableRender: config.enableRender ?? true,
      fpsWarningThreshold: config.fpsWarningThreshold ?? 30,
      memoryWarningThreshold: config.memoryWarningThreshold ?? 500,
      responseTimeThreshold: config.responseTimeThreshold ?? 1000,
    }

    this.snapshot = this.createEmptySnapshot()
  }

  /**
   * Start monitoring.
   */
  start(): void {
    if (this.monitorTimer) return

    // FPS monitoring
    if (this.config.enableFPS && typeof requestAnimationFrame !== 'undefined') {
      this.startFPSMonitoring()
    }

    // DOM mutation monitoring
    if (this.config.enableRender && typeof MutationObserver !== 'undefined') {
      this.startRenderMonitoring()
    }

    // Regular snapshot updates
    this.monitorTimer = setInterval(() => {
      this.updateSnapshot()
    }, this.config.interval)
  }

  /**
   * Stop monitoring.
   */
  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer)
      this.monitorTimer = null
    }

    if (this.observers.mutation) {
      this.observers.mutation.disconnect()
      this.observers.mutation = undefined
    }

    if (this.observers.performance) {
      this.observers.performance.disconnect()
      this.observers.performance = undefined
    }
  }

  /**
   * Get current snapshot.
   */
  getSnapshot(): Readonly<PerformanceSnapshot> {
    return this.snapshot
  }

  /**
   * Subscribe to updates.
   */
  subscribe(listener: (snapshot: PerformanceSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private startFPSMonitoring(): void {
    const measureFPS = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime
        const fps = Math.round(1000 / delta)
        this.fpsFrames.push(fps)

        // Keep history size limited
        if (this.fpsFrames.length > this.config.historySize) {
          this.fpsFrames.shift()
        }
      }
      this.lastFrameTime = timestamp

      if (this.monitorTimer !== null) {
        requestAnimationFrame(measureFPS)
      }
    }

    requestAnimationFrame(measureFPS)
  }

  private startRenderMonitoring(): void {
    if (typeof document === 'undefined') return

    let mutationCount = 0

    this.observers.mutation = new MutationObserver(() => {
      mutationCount++
    })

    this.observers.mutation.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    // Reset mutation count on each interval
    setInterval(() => {
      this.snapshot.render.domMutations = mutationCount
      mutationCount = 0
    }, this.config.interval)
  }

  private updateSnapshot(): void {
    // Update FPS
    if (this.config.enableFPS && this.fpsFrames.length > 0) {
      const current = this.fpsFrames[this.fpsFrames.length - 1] ?? 0
      const average = Math.round(this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length)
      const jankFrames = this.fpsFrames.filter(f => f < 30).length

      this.snapshot.fps = {
        current,
        average,
        frameTime: current > 0 ? Math.round(1000 / current) : 0,
        jankFrames,
        totalFrames: this.fpsFrames.length,
        history: [...this.fpsFrames],
      }
    }

    // Update memory
    if (this.config.enableMemory && typeof performance !== 'undefined') {
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      if (memory) {
        const usedHeap = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        const totalHeap = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

        this.snapshot.memory = {
          usedHeap,
          totalHeap,
          heapPercentage: Math.round((usedHeap / totalHeap) * 100),
          external: 0,
          trend: this.getMemoryTrend(usedHeap),
        }
      }
    }

    // Update network
    if (this.config.enableNetwork) {
      this.snapshot.network.status = typeof navigator !== 'undefined' && navigator.onLine
        ? 'online'
        : 'offline'
    }

    // Calculate score
    this.snapshot.score = this.calculateScore()
    this.snapshot.grade = this.getGrade(this.snapshot.score)
    this.snapshot.timestamp = Date.now()

    // Detect issues
    this.snapshot.issues = this.detectIssues()

    // Generate suggestions
    this.snapshot.suggestions = this.generateSuggestions()

    this.notifyListeners()
  }

  private calculateScore(): number {
    let score = 100

    // FPS impact
    if (this.snapshot.fps.current < 30) score -= 30
    else if (this.snapshot.fps.current < 50) score -= 15
    else if (this.snapshot.fps.current < 55) score -= 5

    // Memory impact
    if (this.snapshot.memory.heapPercentage > 80) score -= 25
    else if (this.snapshot.memory.heapPercentage > 60) score -= 10

    // Jank impact
    if (this.snapshot.fps.jankFrames > 10) score -= 20
    else if (this.snapshot.fps.jankFrames > 5) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  private getMemoryTrend(current: number): 'growing' | 'stable' | 'shrinking' {
    const history = this.snapshot.memory.usedHeap
    if (current > history + 10) return 'growing'
    if (current < history - 10) return 'shrinking'
    return 'stable'
  }

  private detectIssues(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    if (this.snapshot.fps.current < this.config.fpsWarningThreshold) {
      issues.push({
        type: 'fps-drop',
        severity: this.snapshot.fps.current < 20 ? 'critical' : 'warning',
        description: `FPS dropped to ${this.snapshot.fps.current}`,
        suggestion: 'Check for expensive computations or rendering operations',
      })
    }

    if (this.snapshot.memory.heapPercentage > 80) {
      issues.push({
        type: 'memory-leak',
        severity: 'warning',
        description: `Memory usage at ${this.snapshot.memory.heapPercentage}%`,
        suggestion: 'Check for memory leaks and unused object references',
      })
    }

    if (this.snapshot.fps.jankFrames > 5) {
      issues.push({
        type: 'jank',
        severity: 'warning',
        description: `${this.snapshot.fps.jankFrames} jank frames detected`,
        suggestion: 'Reduce DOM operations and use requestAnimationFrame',
      })
    }

    return issues
  }

  private generateSuggestions(): string[] {
    const suggestions: string[] = []

    if (this.snapshot.fps.average < 50) {
      suggestions.push('Consider using Web Workers for heavy computations')
      suggestions.push('Enable virtual scrolling for large lists')
    }

    if (this.snapshot.memory.heapPercentage > 60) {
      suggestions.push('Implement lazy loading for off-screen content')
      suggestions.push('Clean up event listeners and timers')
    }

    if (this.snapshot.render.reRenders > 100) {
      suggestions.push('Use React.memo or useMemo to prevent unnecessary re-renders')
    }

    return [...new Set(suggestions)].slice(0, 5)
  }

  private createEmptySnapshot(): PerformanceSnapshot {
    return {
      fps: { current: 0, average: 0, frameTime: 0, jankFrames: 0, totalFrames: 0, history: [] },
      memory: { usedHeap: 0, totalHeap: 0, heapPercentage: 0, external: 0, trend: 'stable' },
      network: { activeRequests: 0, totalRequests: 0, failedRequests: 0, avgResponseTime: 0, bytesTransferred: 0, status: 'online' },
      render: { componentsRendered: 0, reRenders: 0, domMutations: 0, layoutRecalcs: 0, paintOperations: 0 },
      score: 100,
      grade: 'A',
      issues: [],
      suggestions: [],
      timestamp: Date.now(),
    }
  }

  private notifyListeners(): void {
    const snapshot = { ...this.snapshot }
    for (const listener of this.listeners) {
      try { listener(snapshot) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: PerformanceDashboardEngine | null = null

export function getPerformanceDashboardEngine(
  config?: Partial<PerformanceDashboardConfig>
): PerformanceDashboardEngine {
  if (!instance) {
    instance = new PerformanceDashboardEngine(config)
  }
  return instance
}

export function resetPerformanceDashboardEngine(): void {
  instance?.stop()
  instance = null
}
