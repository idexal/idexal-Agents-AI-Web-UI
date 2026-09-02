/**
 * Real-time Log Analyzer engine.
 *
 * Parses, filters, and analyses streaming log output: detects error
 * spikes, latency outliers, stack traces, and recurring patterns.
 * Designed for live debugging sessions and CI log review.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export type LogPatternType = 'stack-trace' | 'error-spike' | 'latency-outlier' | 'repeated-error' | 'memory-warning' | 'timeout' | 'connection-refused' | 'anomaly'

export interface LogEntry {
  readonly timestamp: number
  readonly level: LogLevel
  readonly message: string
  readonly source: string
  readonly metadata?: Record<string, unknown>
  readonly raw: string
}

export interface LogPattern {
  readonly type: LogPatternType
  readonly message: string
  readonly count: number
  readonly firstSeen: number
  readonly lastSeen: number
  readonly severity: 'critical' | 'warning' | 'info'
  readonly affectedLines: readonly number[]
  readonly suggestion?: string
}

export interface LogAnalysisResult {
  readonly totalLines: number
  readonly byLevel: Record<LogLevel, number>
  readonly patterns: readonly LogPattern[]
  readonly errorRate: number
  readonly avgLinesPerSecond: number
  readonly timespanMs: number
  readonly topSources: readonly { source: string; count: number }[]
  readonly recommendations: readonly string[]
}

export interface LogAnalyzerConfig {
  readonly maxBufferSize: number
  readonly patternWindowMs: number
  readonly errorSpikeThreshold: number
  readonly latencyOutlierMs: number
  readonly detectStackTraces: boolean
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class LogAnalyzerEngine {
  private readonly buffer: LogEntry[] = []
  private readonly config: LogAnalyzerConfig

  constructor(config?: Partial<LogAnalyzerConfig>) {
    this.config = {
      maxBufferSize: config?.maxBufferSize ?? 10_000,
      patternWindowMs: config?.patternWindowMs ?? 60_000,
      errorSpikeThreshold: config?.errorSpikeThreshold ?? 5,
      latencyOutlierMs: config?.latencyOutlierMs ?? 5000,
      detectStackTraces: config?.detectStackTraces ?? true,
    }
  }

  /** Parse a raw log line into a structured LogEntry. */
  parseLine(raw: string): LogEntry {
    const levelMatch = /\b(TRACE|DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|CRITICAL)\b/i.exec(raw)
    const level: LogLevel = this.normalizeLevel(levelMatch?.[1] ?? 'info')
    const tsMatch = /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[\d:.Z+-]*)/.exec(raw)
    const timestamp = tsMatch?.[1] ? new Date(tsMatch[1]).getTime() : Date.now()
    const sourceMatch = /\[([^\]]+)\]/.exec(raw)
    return { timestamp, level, message: raw, source: sourceMatch?.[1] ?? '', raw }
  }

  feed(rawLine: string): LogEntry {
    const entry = this.parseLine(rawLine)
    this.buffer.push(entry)
    if (this.buffer.length > this.config.maxBufferSize) {
      this.buffer.splice(0, this.buffer.length - this.config.maxBufferSize)
    }
    return entry
  }

  feedBatch(lines: string[]): LogEntry[] {
    return lines.map(l => this.feed(l))
  }

  /** Analyse all buffered entries and detect patterns. */
  analyze(): LogAnalysisResult {
    if (this.buffer.length === 0) return this.emptyResult()

    const byLevel: Record<LogLevel, number> = { trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 }
    for (const e of this.buffer) byLevel[e.level]++

    const patterns: LogPattern[] = []
    patterns.push(...this.detectErrorSpikes())
    patterns.push(...this.detectStackTraces())
    patterns.push(...this.detectRepeatedErrors())
    patterns.push(...this.detectMemoryWarnings())
    patterns.push(...this.detectTimeouts())

    const timespan = this.buffer[this.buffer.length - 1]!.timestamp - this.buffer[0]!.timestamp
    const totalErrors = byLevel.error + byLevel.fatal
    const errorRate = this.buffer.length > 0 ? totalErrors / this.buffer.length : 0
    const avgLinesPerSecond = timespan > 0 ? this.buffer.length / (timespan / 1000) : 0

    const sourceCounts = new Map<string, number>()
    for (const e of this.buffer) {
      if (e.source) sourceCounts.set(e.source, (sourceCounts.get(e.source) ?? 0) + 1)
    }
    const topSources = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }))

    const recommendations = this.generateRecommendations(byLevel, patterns, errorRate)

    return { totalLines: this.buffer.length, byLevel, patterns, errorRate, avgLinesPerSecond, timespanMs: timespan, topSources, recommendations }
  }

  /** Get entries filtered by level and/or time range. */
  getEntries(level?: LogLevel, startMs?: number, endMs?: number): LogEntry[] {
    return this.buffer.filter(e =>
      (!level || e.level === level) &&
      (!startMs || e.timestamp >= startMs) &&
      (!endMs || e.timestamp <= endMs),
    )
  }

  clear(): void { this.buffer.length = 0 }

  // ---------------------------------------------------------------------------
  // Pattern detection
  // ---------------------------------------------------------------------------

  private detectErrorSpikes(): LogPattern[] {
    const patterns: LogPattern[] = []
    const windowMs = this.config.patternWindowMs
    const windowStart = this.buffer[this.buffer.length - 1]!.timestamp - windowMs
    const windowErrors = this.buffer.filter(e => e.timestamp >= windowStart && (e.level === 'error' || e.level === 'fatal'))
    if (windowErrors.length >= this.config.errorSpikeThreshold) {
      patterns.push({
        type: 'error-spike',
        message: `${windowErrors.length} errors in last ${windowMs / 1000}s window`,
        count: windowErrors.length,
        firstSeen: windowErrors[0]!.timestamp,
        lastSeen: windowErrors[windowErrors.length - 1]!.timestamp,
        severity: windowErrors.length >= this.config.errorSpikeThreshold * 3 ? 'critical' : 'warning',
        affectedLines: [],
        suggestion: 'Check for cascading failures or upstream service issues.',
      })
    }
    return patterns
  }

  private detectStackTraces(): LogPattern[] {
    if (!this.config.detectStackTraces) return []
    const patterns: LogPattern[] = []
    let stackStart = -1
    let stackLines: number[] = []
    for (let i = 0; i < this.buffer.length; i++) {
      const msg = this.buffer[i]!.raw
      if (/^\s+at\s+|^\s+File\s+"|^\s+Traceback|^\s+in\s+\w+/.test(msg)) {
        if (stackStart < 0) stackStart = i
        stackLines.push(i)
      } else {
        if (stackLines.length >= 3) {
          patterns.push({
            type: 'stack-trace',
            message: `Stack trace detected (${stackLines.length} frames) near line ${stackStart + 1}`,
            count: 1,
            firstSeen: this.buffer[stackStart]!.timestamp,
            lastSeen: this.buffer[stackLines[stackLines.length - 1]!]!.timestamp,
            severity: 'warning',
            affectedLines: stackLines,
            suggestion: 'Review the root cause at the top of the stack trace.',
          })
        }
        stackStart = -1
        stackLines = []
      }
    }
    return patterns
  }

  private detectRepeatedErrors(): LogPattern[] {
    const patterns: LogPattern[] = []
    const errorMessages = new Map<string, { count: number; firstSeen: number; lastSeen: number; lines: number[] }>()
    for (let i = 0; i < this.buffer.length; i++) {
      const e = this.buffer[i]!
      if (e.level === 'error' || e.level === 'fatal') {
        const key = e.message.slice(0, 100)
        const existing = errorMessages.get(key)
        if (existing) {
          errorMessages.set(key, { count: existing.count + 1, firstSeen: existing.firstSeen, lastSeen: e.timestamp, lines: [...existing.lines, i] })
        } else {
          errorMessages.set(key, { count: 1, firstSeen: e.timestamp, lastSeen: e.timestamp, lines: [i] })
        }
      }
    }
    for (const [msg, data] of errorMessages) {
      if (data.count >= 3) {
        patterns.push({
          type: 'repeated-error',
          message: `Error repeated ${data.count} times: "${msg.slice(0, 60)}"`,
          count: data.count,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
          severity: data.count >= 10 ? 'critical' : 'warning',
          affectedLines: data.lines,
          suggestion: 'This error is recurring — investigate the root cause.',
        })
      }
    }
    return patterns
  }

  private detectMemoryWarnings(): LogPattern[] {
    const patterns: LogPattern[] = []
    for (let i = 0; i < this.buffer.length; i++) {
      if (/heap|memory|gc|allocation|out.of.memory/i.test(this.buffer[i]!.raw)) {
        patterns.push({
          type: 'memory-warning',
          message: `Memory-related message at line ${i + 1}`,
          count: 1,
          firstSeen: this.buffer[i]!.timestamp,
          lastSeen: this.buffer[i]!.timestamp,
          severity: 'warning',
          affectedLines: [i],
          suggestion: 'Monitor memory usage and check for leaks.',
        })
      }
    }
    return patterns.slice(0, 3)
  }

  private detectTimeouts(): LogPattern[] {
    const patterns: LogPattern[] = []
    for (let i = 0; i < this.buffer.length; i++) {
      if (/timeout|timed?\s*out|deadline\s+exceeded/i.test(this.buffer[i]!.raw)) {
        patterns.push({
          type: 'timeout',
          message: `Timeout detected at line ${i + 1}`,
          count: 1,
          firstSeen: this.buffer[i]!.timestamp,
          lastSeen: this.buffer[i]!.timestamp,
          severity: 'warning',
          affectedLines: [i],
          suggestion: 'Increase timeout or investigate slow downstream calls.',
        })
      }
    }
    return patterns.slice(0, 3)
  }

  private generateRecommendations(byLevel: Record<LogLevel, number>, patterns: LogPattern[], errorRate: number): string[] {
    const recs: string[] = []
    const criticalPatterns = patterns.filter(p => p.severity === 'critical')
    if (criticalPatterns.length > 0) recs.push(`${criticalPatterns.length} critical pattern(s) detected — investigate immediately.`)
    if (errorRate > 0.1) recs.push(`Error rate is ${(errorRate * 100).toFixed(1)}% — above 10% threshold. Check for systemic issues.`)
    if (byLevel.warn > byLevel.info) recs.push('Warnings exceed info logs — consider reducing log verbosity or fixing warnings.')
    if ((byLevel.trace ?? 0) + byLevel.debug > byLevel.info * 5) recs.push('Excessive debug/trace logs — consider log level filtering in production.')
    const timeoutPatterns = patterns.filter(p => p.type === 'timeout')
    if (timeoutPatterns.length > 0) recs.push(`${timeoutPatterns.length} timeout(s) detected — check network stability and downstream latency.`)
    if (recs.length === 0) recs.push('Logs look healthy. No actionable patterns detected.')
    return recs
  }

  private normalizeLevel(raw: string): LogLevel {
    const upper = raw.toUpperCase()
    if (upper === 'TRACE') return 'trace'
    if (upper === 'DEBUG') return 'debug'
    if (upper === 'WARN' || upper === 'WARNING') return 'warn'
    if (upper === 'ERROR') return 'error'
    if (upper === 'FATAL' || upper === 'CRITICAL') return 'fatal'
    return 'info'
  }

  private emptyResult(): LogAnalysisResult {
    return {
      totalLines: 0, byLevel: { trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 },
      patterns: [], errorRate: 0, avgLinesPerSecond: 0, timespanMs: 0, topSources: [], recommendations: [],
    }
  }
}

let _instance: LogAnalyzerEngine | undefined
export function getLogAnalyzerEngine(config?: Partial<LogAnalyzerConfig>): LogAnalyzerEngine {
  _instance ??= new LogAnalyzerEngine(config)
  return _instance
}
export function resetLogAnalyzerEngine(): void { _instance = undefined }
