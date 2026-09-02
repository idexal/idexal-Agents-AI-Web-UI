/**
 * Developer Productivity Tracker engine.
 *
 * Records coding sessions, measures productive vs. idle time, computes
 * work-pattern metrics (focus blocks, context switches, peak hours), and
 * surfaces actionable insights without invasive telemetry.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType = 'coding' | 'reviewing' | 'debugging' | 'testing' | 'planning' | 'idle' | 'meeting'

export type MetricTrend = 'improving' | 'stable' | 'declining'

export interface CodingSession {
  readonly id: string
  readonly startMs: number
  readonly endMs?: number
  readonly activity: ActivityType
  readonly linesAdded: number
  readonly linesRemoved: number
  readonly filesModified: readonly string[]
  readonly keystrokes: number
  readonly focusScore: number // 0-1
}

export interface DailyMetrics {
  readonly date: string // YYYY-MM-DD
  readonly totalCodingMs: number
  readonly totalFocusMs: number
  readonly contextSwitches: number
  readonly peakHour: number
  readonly linesNet: number
  readonly filesModified: number
  readonly sessionCount: number
  readonly productivityScore: number // 0-100
}

export interface ProductivityReport {
  readonly period: string
  readonly totalSessions: number
  readonly totalCodingMs: number
  readonly averageSessionMs: number
  readonly averageProductivity: number
  readonly focusTimeRatio: number
  readonly peakHours: readonly number[]
  readonly activityBreakdown: Record<ActivityType, number>
  readonly trend: MetricTrend
  readonly dailyMetrics: DailyMetrics[]
  readonly insights: readonly string[]
}

export interface ProductivityConfig {
  readonly sessionGapMs: number
  readonly focusThreshold: number
  readonly trackingEnabled: boolean
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ProductivityTrackerEngine {
  private readonly sessions: CodingSession[] = []
  private readonly dailyData = new Map<string, DailyMetrics>()
  private readonly config: ProductivityConfig

  constructor(config?: Partial<ProductivityConfig>) {
    this.config = {
      sessionGapMs: config?.sessionGapMs ?? 300_000, // 5 min gap = new session
      focusThreshold: config?.focusThreshold ?? 0.7,
      trackingEnabled: config?.trackingEnabled ?? true,
    }
  }

  recordSession(session: CodingSession): void {
    if (!this.config.trackingEnabled) return
    this.sessions.push(session)
    this.rebuildDaily(session.startMs)
  }

  startSession(activity: ActivityType = 'coding'): CodingSession {
    const session: CodingSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      startMs: Date.now(),
      activity,
      linesAdded: 0,
      linesRemoved: 0,
      filesModified: [],
      keystrokes: 0,
      focusScore: 0,
    }
    return session
  }

  endSession(session: CodingSession): CodingSession {
    return { ...session, endMs: Date.now() }
  }

  getSessions(startDate?: string, endDate?: string): CodingSession[] {
    if (!startDate && !endDate) return [...this.sessions]
    const startMs = startDate ? new Date(startDate).getTime() : 0
    const endMs = endDate ? new Date(endDate).getTime() + 86_400_000 : Date.now()
    return this.sessions.filter(s => s.startMs >= startMs && s.startMs < endMs)
  }

  getDailyMetrics(date: string): DailyMetrics | undefined {
    return this.dailyData.get(date)
  }

  getProductivityReport(periodDays: number = 30): ProductivityReport {
    const endMs = Date.now()
    const startMs = endMs - periodDays * 86_400_000
    const periodSessions = this.sessions.filter(s => s.startMs >= startMs)

    const totalCodingMs = periodSessions.reduce((sum, s) => sum + ((s.endMs ?? Date.now()) - s.startMs), 0)
    const averageSessionMs = periodSessions.length > 0 ? totalCodingMs / periodSessions.length : 0
    const focusSessions = periodSessions.filter(s => s.focusScore >= this.config.focusThreshold)
    const focusTimeRatio = totalCodingMs > 0
      ? focusSessions.reduce((sum, s) => sum + ((s.endMs ?? Date.now()) - s.startMs), 0) / totalCodingMs
      : 0

    const hourCounts = new Map<number, number>()
    for (const s of periodSessions) {
      const hour = new Date(s.startMs).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
    }
    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => h)

    const activityBreakdown: Record<ActivityType, number> = {
      coding: 0, reviewing: 0, debugging: 0, testing: 0, planning: 0, idle: 0, meeting: 0,
    }
    for (const s of periodSessions) {
      activityBreakdown[s.activity] += (s.endMs ?? Date.now()) - s.startMs
    }

    const daily = this.getDailyRange(startMs, endMs)
    const trend = this.calculateTrend(daily)
    const averageProductivity = daily.length > 0
      ? daily.reduce((sum, d) => sum + d.productivityScore, 0) / daily.length
      : 0

    const insights = this.generateInsights(periodSessions, daily, focusTimeRatio, peakHours)

    return {
      period: `${new Date(startMs).toISOString().slice(0, 10)} to ${new Date(endMs).toISOString().slice(0, 10)}`,
      totalSessions: periodSessions.length,
      totalCodingMs,
      averageSessionMs,
      averageProductivity,
      focusTimeRatio,
      peakHours,
      activityBreakdown,
      trend,
      dailyMetrics: daily,
      insights,
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private rebuildDaily(sessionStartMs: number): void {
    const date = new Date(sessionStartMs).toISOString().slice(0, 10)
    const daySessions = this.sessions.filter(s => new Date(s.startMs).toISOString().slice(0, 10) === date)

    const totalCodingMs = daySessions.reduce((sum, s) => sum + ((s.endMs ?? Date.now()) - s.startMs), 0)
    const focusSessions = daySessions.filter(s => s.focusScore >= this.config.focusThreshold)
    const totalFocusMs = focusSessions.reduce((sum, s) => sum + ((s.endMs ?? Date.now()) - s.startMs), 0)
    const allFiles = new Set(daySessions.flatMap(s => [...s.filesModified]))
    const linesNet = daySessions.reduce((sum, s) => sum + s.linesAdded - s.linesRemoved, 0)

    const hourCounts = new Map<number, number>()
    for (const s of daySessions) {
      const h = new Date(s.startMs).getHours()
      hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1)
    }
    let peakHour = 12
    let maxCount = 0
    for (const [h, c] of hourCounts) {
      if (c > maxCount) { maxCount = c; peakHour = h }
    }

    const productivityScore = this.computeProductivity(daySessions, totalCodingMs, totalFocusMs)

    this.dailyData.set(date, {
      date,
      totalCodingMs,
      totalFocusMs,
      contextSwitches: Math.max(0, daySessions.length - 1),
      peakHour,
      linesNet,
      filesModified: allFiles.size,
      sessionCount: daySessions.length,
      productivityScore,
    })
  }

  private computeProductivity(sessions: CodingSession[], totalMs: number, focusMs: number): number {
    if (totalMs === 0) return 0
    const focusRatio = focusMs / totalMs
    const avgFocus = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length
      : 0
    const sessionEfficiency = Math.min(1, sessions.length / 8) // ideal: ~8 sessions/day
    return Math.round((focusRatio * 40 + avgFocus * 40 + sessionEfficiency * 20) * 100) / 100
  }

  private getDailyRange(startMs: number, endMs: number): DailyMetrics[] {
    const result: DailyMetrics[] = []
    for (let ms = startMs; ms <= endMs; ms += 86_400_000) {
      const date = new Date(ms).toISOString().slice(0, 10)
      const metrics = this.dailyData.get(date)
      if (metrics) result.push(metrics)
    }
    return result
  }

  private calculateTrend(daily: DailyMetrics[]): MetricTrend {
    if (daily.length < 5) return 'stable'
    const half = Math.floor(daily.length / 2)
    const firstHalf = daily.slice(0, half)
    const secondHalf = daily.slice(half)
    const avgFirst = firstHalf.reduce((s, d) => s + d.productivityScore, 0) / firstHalf.length
    const avgSecond = secondHalf.reduce((s, d) => s + d.productivityScore, 0) / secondHalf.length
    const diff = avgSecond - avgFirst
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  }

  private generateInsights(sessions: CodingSession[], daily: DailyMetrics[], focusRatio: number, peakHours: number[]): string[] {
    const insights: string[] = []
    if (focusRatio < 0.4) insights.push('Focus time is below 40%. Try time-blocking deep work sessions.')
    if (focusRatio > 0.7) insights.push('Great focus ratio! You\'re spending most of your time in deep work.')
    if (peakHours.length > 0) insights.push(`Your peak productivity hours are around ${peakHours.join(', ')}:00 — schedule important work then.`)
    if (sessions.length > 0) {
      const avgSession = sessions.reduce((sum, s) => sum + ((s.endMs ?? Date.now()) - s.startMs), 0) / sessions.length
      if (avgSession > 2 * 3600_000) insights.push('Average session exceeds 2 hours. Consider Pomodoro breaks to maintain focus.')
      if (avgSession < 15 * 60_000) insights.push('Sessions are very short. Batch similar tasks for longer focus blocks.')
    }
    if (daily.length >= 7) {
      const weekendDays = daily.filter(d => {
        const day = new Date(d.date).getDay()
        return day === 0 || day === 6
      })
      const weekdayDays = daily.filter(d => {
        const day = new Date(d.date).getDay()
        return day !== 0 && day !== 6
      })
      if (weekendDays.length > 0 && weekdayDays.length > 0) {
        const avgWeekend = weekendDays.reduce((s, d) => s + d.productivityScore, 0) / weekendDays.length
        const avgWeekday = weekdayDays.reduce((s, d) => s + d.productivityScore, 0) / weekdayDays.length
        if (avgWeekend > avgWeekday * 1.2) insights.push('Weekend productivity is notably higher — consider adjusting weekday workflow.')
      }
    }
    if (insights.length === 0) insights.push('Keep coding consistently to build a meaningful productivity profile.')
    return insights
  }
}

let _instance: ProductivityTrackerEngine | undefined
export function getProductivityTrackerEngine(config?: Partial<ProductivityConfig>): ProductivityTrackerEngine {
  _instance ??= new ProductivityTrackerEngine(config)
  return _instance
}
export function resetProductivityTrackerEngine(): void { _instance = undefined }
