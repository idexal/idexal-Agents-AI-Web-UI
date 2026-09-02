/**
 * Developer Analytics Engine for Idexal Agents.
 * Tracks coding productivity, patterns, focus, and flow state
 * with actionable insights and exportable reports.
 */

// ---------------------------------------------------------------------------
// Session tracking
// ---------------------------------------------------------------------------

/** A single coding activity event */
export interface ActivityEvent {
  /** Event ID */
  id: string
  /** Event type */
  type: ActivityType
  /** ISO-8601 timestamp */
  timestamp: string
  /** Duration in milliseconds (for duration events) */
  durationMs?: number
  /** Associated file path */
  filePath?: string
  /** Language / file type */
  language?: string
  /** Lines changed (insertions - deletions) */
  linesChanged?: number
  /** Metadata */
  metadata?: Record<string, unknown>
}

export type ActivityType =
  | 'file-open'
  | 'file-edit'
  | 'file-save'
  | 'file-close'
  | 'terminal-run'
  | 'debug-start'
  | 'debug-breakpoint'
  | 'git-commit'
  | 'git-push'
  | 'search'
  | 'refactor'
  | 'ai-prompt'
  | 'ai-accept'
  | 'ai-reject'
  | 'test-run'
  | 'test-pass'
  | 'test-fail'
  | 'lint-run'
  | 'lint-fix'
  | 'build-run'
  | 'build-pass'
  | 'build-fail'
  | 'review-comment'
  | 'review-approve'
  | 'focus-start'
  | 'focus-end'

// ---------------------------------------------------------------------------
// Productivity metrics
// ---------------------------------------------------------------------------

/** Hourly productivity bucket */
export interface HourlyBucket {
  /** Hour (0-23) */
  hour: number
  /** Number of events */
  events: number
  /** Lines changed */
  linesChanged: number
  /** Files touched */
  filesTouched: number
  /** Active minutes */
  activeMinutes: number
}

/** Daily summary */
export interface DailySummary {
  /** Date (YYYY-MM-DD) */
  date: string
  /** Total coding minutes */
  codingMinutes: number
  /** Total files touched */
  filesTouched: number
  /** Total lines changed */
  linesChanged: number
  /** Number of commits */
  commits: number
  /** Number of AI prompts used */
  aiPrompts: number
  /** Number of AI suggestions accepted */
  aiAccepted: number
  /** Number of tests run */
  testsRun: number
  /** Number of tests passed */
  testsPassed: number
  /** Number of builds */
  builds: number
  /** Number of successful builds */
  buildsSuccessful: number
  /** Focus sessions (blocks > 25 min) */
  focusSessions: number
  /** Total focus minutes */
  focusMinutes: number
  /** Productivity score (0-100) */
  score: number
  /** Hourly breakdown */
  hourly: HourlyBucket[]
}

/** Weekly trend */
export interface WeeklyTrend {
  /** Week start date */
  weekStart: string
  /** Total coding minutes */
  totalMinutes: number
  /** Average daily minutes */
  avgDailyMinutes: number
  /** Productivity trend vs prior week */
  trendPercent: number
  /** Most active day */
  mostActiveDay: string
  /** Peak hour */
  peakHour: number
  /** Top languages */
  topLanguages: Array<{ name: string; minutes: number; percent: number }>
}

// ---------------------------------------------------------------------------
// Flow state analysis
// ---------------------------------------------------------------------------

/** Focus / flow session */
export interface FlowSession {
  /** Session ID */
  id: string
  /** Start time ISO-8601 */
  startTime: string
  /** End time ISO-8601 */
  endTime?: string
  /** Duration in minutes */
  durationMinutes: number
  /** Flow quality score (0-100) */
  quality: number
  /** Interruptions during session */
  interruptions: number
  /** Files edited */
  filesEdited: string[]
  /** Lines changed */
  linesChanged: number
  /** AI prompts during session */
  aiPrompts: number
  /** Classification */
  classification: 'deep-focus' | 'productive' | 'moderate' | 'distracted' | 'fragmented'
}

/** Flow quality factors */
export interface FlowFactors {
  /** Session duration factor (longer = higher, caps at 90 min) */
  durationFactor: number
  /** Interruption penalty (fewer = higher) */
  interruptionFactor: number
  /** File switch penalty (fewer = higher) */
  contextSwitchFactor: number
  /** Time-of-day bonus (peak hours get bonus) */
  timeOfDayFactor: number
  /** AI assistance factor */
  aiAssistFactor: number
}

// ---------------------------------------------------------------------------
// Coding patterns
// ---------------------------------------------------------------------------

/** Detected coding pattern */
export interface CodingPattern {
  /** Pattern ID */
  id: string
  /** Pattern name */
  name: string
  /** Pattern category */
  category: 'temporal' | 'behavioral' | 'tool-usage' | 'quality'
  /** Description */
  description: string
  /** Confidence (0-100) */
  confidence: number
  /** Suggested insight */
  insight: string
  /** Impact: positive / negative / neutral */
  impact: 'positive' | 'negative' | 'neutral'
}

/** Language breakdown */
export interface LanguageStats {
  /** Language name */
  name: string
  /** Minutes spent */
  minutes: number
  /** Files edited */
  filesEdited: number
  /** Lines changed */
  linesChanged: number
  /** Percent of total time */
  percent: number
  /** Average session length in minutes */
  avgSessionMinutes: number
}

// ---------------------------------------------------------------------------
// Analytics engine
// ---------------------------------------------------------------------------

export interface DeveloperAnalyticsConfig {
  /** Max events to retain in memory */
  maxEvents: number
  /** Session gap threshold (ms) — gap > this starts a new session */
  sessionGapMs: number
  /** Focus threshold (minutes) — uninterrupted block > this = focus session */
  focusThresholdMinutes: number
  /** Flow quality minimum for 'deep-focus' */
  deepFocusMinutes: number
  /** Enable auto-pattern detection */
  enablePatterns: boolean
  /** Persist to localStorage */
  persistToStorage: boolean
  /** Storage key prefix */
  storageKey: string
}

const DEFAULT_ANALYTICS_CONFIG: DeveloperAnalyticsConfig = {
  maxEvents: 10000,
  sessionGapMs: 5 * 60 * 1000, // 5 minutes
  focusThresholdMinutes: 25,
  deepFocusMinutes: 60,
  enablePatterns: true,
  persistToStorage: true,
  storageKey: 'idexal-analytics',
}

export class DeveloperAnalyticsEngine {
  private config: DeveloperAnalyticsConfig
  private events: ActivityEvent[] = []
  private listeners: Set<(event: AnalyticsEvent) => void> = new Set()

  constructor(config: Partial<DeveloperAnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config }
    if (this.config.persistToStorage) this.loadFromStorage()
  }

  // ---- Event recording ----

  record(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
    const full: ActivityEvent = {
      ...event,
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    }

    this.events.push(full)
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents)
    }

    if (this.config.persistToStorage) this.saveToStorage()
    this.emit({ type: 'event-recorded', event: full })
    return full
  }

  // ---- Daily summaries ----

  getDailySummary(date: string): DailySummary {
    const dayEvents = this.events.filter(e => e.timestamp.startsWith(date))
    const codingEvents = dayEvents.filter(e =>
      ['file-edit', 'file-save', 'file-open'].includes(e.type)
    )
    const commitEvents = dayEvents.filter(e => e.type === 'git-commit')
    const aiPrompts = dayEvents.filter(e => e.type === 'ai-prompt')
    const aiAccepted = dayEvents.filter(e => e.type === 'ai-accept')
    const testEvents = dayEvents.filter(e => e.type === 'test-run')
    const testPass = dayEvents.filter(e => e.type === 'test-pass')
    const buildEvents = dayEvents.filter(e => e.type === 'build-run')
    const buildPass = dayEvents.filter(e => e.type === 'build-pass')

    const codingMinutes = this.calculateActiveMinutes(codingEvents)
    const filesTouched = new Set(codingEvents.map(e => e.filePath).filter(Boolean)).size
    const linesChanged = codingEvents.reduce((sum, e) => sum + (e.linesChanged ?? 0), 0)

    // Hourly breakdown
    const hourly: HourlyBucket[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      events: 0,
      linesChanged: 0,
      filesTouched: 0,
      activeMinutes: 0,
    }))

    for (const evt of codingEvents) {
      const h = new Date(evt.timestamp).getHours()
      hourly[h]!.events++
      hourly[h]!.linesChanged += evt.linesChanged ?? 0
      if (evt.filePath) hourly[h]!.filesTouched++
    }

    // Calculate active minutes per hour
    for (const evt of codingEvents) {
      const h = new Date(evt.timestamp).getHours()
      hourly[h]!.activeMinutes++
    }

    // Focus sessions
    const focusSessions = this.detectFocusSessions(dayEvents)
    const focusMinutes = focusSessions.reduce((s, f) => s + f.durationMinutes, 0)

    // Productivity score
    const score = this.calculateProductivityScore({
      codingMinutes,
      commits: commitEvents.length,
      aiPrompts: aiPrompts.length,
      aiAccepted: aiAccepted.length,
      testsRun: testEvents.length,
      testsPassed: testPass.length,
      builds: buildEvents.length,
      buildsSuccessful: buildPass.length,
      focusMinutes,
      filesTouched,
      linesChanged,
    })

    return {
      date,
      codingMinutes,
      filesTouched,
      linesChanged,
      commits: commitEvents.length,
      aiPrompts: aiPrompts.length,
      aiAccepted: aiAccepted.length,
      testsRun: testEvents.length,
      testsPassed: testPass.length,
      builds: buildEvents.length,
      buildsSuccessful: buildPass.length,
      focusSessions: focusSessions.length,
      focusMinutes,
      score,
      hourly,
    }
  }

  /** Get summaries for a date range */
  getDailyRange(startDate: string, endDate: string): DailySummary[] {
    const summaries: DailySummary[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      summaries.push(this.getDailySummary(current.toISOString().slice(0, 10)))
      current.setDate(current.getDate() + 1)
    }

    return summaries
  }

  // ---- Weekly trends ----

  getWeeklyTrend(weekStart: string): WeeklyTrend {
    const start = new Date(weekStart)
    const days: DailySummary[] = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      days.push(this.getDailySummary(d.toISOString().slice(0, 10)))
    }

    const totalMinutes = days.reduce((s, d) => s + d.codingMinutes, 0)
    const avgDailyMinutes = Math.round(totalMinutes / 7)

    // Previous week for comparison
    const prevStart = new Date(start)
    prevStart.setDate(prevStart.getDate() - 7)
    let prevTotal = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(prevStart)
      d.setDate(d.getDate() + i)
      prevTotal += this.getDailySummary(d.toISOString().slice(0, 10)).codingMinutes
    }

    const trendPercent = prevTotal > 0 ? Math.round(((totalMinutes - prevTotal) / prevTotal) * 100) : 0

    // Most active day
    const mostActiveDay = [...days].sort((a, b) => b.codingMinutes - a.codingMinutes)[0]!.date

    // Peak hour
    const hourlyTotals = Array.from({ length: 24 }, (_, h) =>
      days.reduce((s, d) => s + (d.hourly[h]?.activeMinutes ?? 0), 0)
    )
    const peakHour = hourlyTotals.indexOf(Math.max(...hourlyTotals))

    // Language breakdown
    const langMap = new Map<string, { minutes: number; files: number; lines: number }>()
    const dayEvents = this.events.filter(e => {
      const d = e.timestamp.slice(0, 10)
      return d >= weekStart && d < new Date(start.getTime() + 7 * 86400000).toISOString().slice(0, 10)
    })

    for (const evt of dayEvents) {
      if (evt.language) {
        const existing = langMap.get(evt.language) ?? { minutes: 0, files: 0, lines: 0 }
        existing.minutes++
        if (evt.filePath) existing.files++
        existing.lines += evt.linesChanged ?? 0
        langMap.set(evt.language, existing)
      }
    }

    const topLanguages = [...langMap.entries()]
      .sort((a, b) => b[1].minutes - a[1].minutes)
      .slice(0, 5)
      .map(([name, stats]) => ({
        name,
        minutes: stats.minutes,
        percent: totalMinutes > 0 ? Math.round((stats.minutes / totalMinutes) * 100) : 0,
      }))

    return {
      weekStart,
      totalMinutes,
      avgDailyMinutes,
      trendPercent,
      mostActiveDay,
      peakHour,
      topLanguages,
    }
  }

  // ---- Flow analysis ----

  getFlowSessions(date: string): FlowSession[] {
    const dayEvents = this.events.filter(e => e.timestamp.startsWith(date))
    return this.detectFocusSessions(dayEvents)
  }

  getFlowStats(date: string): {
    totalSessions: number
    totalMinutes: number
    avgQuality: number
    deepFocusMinutes: number
    interruptionCount: number
    bestSession: FlowSession | null
  } {
    const sessions = this.getFlowSessions(date)
    if (sessions.length === 0) {
      return { totalSessions: 0, totalMinutes: 0, avgQuality: 0, deepFocusMinutes: 0, interruptionCount: 0, bestSession: null }
    }

    return {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((s, f) => s + f.durationMinutes, 0),
      avgQuality: Math.round(sessions.reduce((s, f) => s + f.quality, 0) / sessions.length),
      deepFocusMinutes: sessions.filter(f => f.classification === 'deep-focus').reduce((s, f) => s + f.durationMinutes, 0),
      interruptionCount: sessions.reduce((s, f) => s + f.interruptions, 0),
      bestSession: [...sessions].sort((a, b) => b.quality - a.quality)[0] ?? null,
    }
  }

  // ---- Pattern detection ----

  detectPatterns(): CodingPattern[] {
    if (!this.config.enablePatterns) return []

    const patterns: CodingPattern[] = []
    const recent = this.events.slice(-500)

    // Peak productivity hours
    const hourlyCounts = Array.from({ length: 24 }, (_, h) =>
      recent.filter(e => new Date(e.timestamp).getHours() === h && ['file-edit', 'file-save'].includes(e.type)).length
    )
    const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts))
    const peakCount = hourlyCounts[peakHour]!

    if (peakCount > 10) {
      patterns.push({
        id: 'peak-hour',
        name: 'Peak Productivity Hour',
        category: 'temporal',
        description: `Your most productive hour is ${peakHour}:00 with ${peakCount} edit events.`,
        confidence: Math.min(100, peakCount * 5),
        insight: `Schedule deep work around ${peakHour}:00 for maximum productivity.`,
        impact: 'positive',
      })
    }

    // AI acceptance rate
    const aiPrompts = recent.filter(e => e.type === 'ai-prompt').length
    const aiAccepted = recent.filter(e => e.type === 'ai-accept').length
    if (aiPrompts > 5) {
      const rate = Math.round((aiAccepted / aiPrompts) * 100)
      patterns.push({
        id: 'ai-acceptance',
        name: 'AI Suggestion Acceptance',
        category: 'behavioral',
        description: `You accept ${rate}% of AI suggestions (${aiAccepted}/${aiPrompts}).`,
        confidence: Math.min(100, aiPrompts * 3),
        insight: rate > 70
          ? 'High acceptance rate — AI suggestions align well with your style.'
          : rate < 30
            ? 'Low acceptance — consider refining prompts or adjusting AI settings.'
            : 'Moderate acceptance — healthy critical evaluation of AI suggestions.',
        impact: rate > 50 ? 'positive' : 'neutral',
      })
    }

    // Test-driven development
    const testRuns = recent.filter(e => e.type === 'test-run').length
    const testPasses = recent.filter(e => e.type === 'test-pass').length
    if (testRuns > 3) {
      const passRate = Math.round((testPasses / testRuns) * 100)
      patterns.push({
        id: 'tdd-pattern',
        name: 'Test Discipline',
        category: 'quality',
        description: `Test pass rate: ${passRate}% (${testPasses}/${testRuns}).`,
        confidence: Math.min(100, testRuns * 5),
        insight: passRate > 90
          ? 'Excellent test discipline — high pass rate indicates quality code.'
          : passRate < 70
            ? 'Low pass rate — review failing tests before committing.'
            : 'Decent test discipline with room for improvement.',
        impact: passRate > 80 ? 'positive' : 'negative',
      })
    }

    // Context switching
    const fileSwitches = recent.reduce((count, evt, i) => {
      if (i === 0) return 0
      if (evt.filePath && evt.filePath !== recent[i - 1]?.filePath) return count + 1
      return count
    }, 0)

    if (recent.length > 20) {
      const switchRate = Math.round((fileSwitches / recent.length) * 100)
      patterns.push({
        id: 'context-switching',
        name: 'Context Switching',
        category: 'behavioral',
        description: `File switch rate: ${switchRate}% (${fileSwitches} switches in ${recent.length} events).`,
        confidence: Math.min(100, recent.length),
        insight: switchRate > 50
          ? 'High context switching reduces focus. Try grouping related tasks.'
          : switchRate < 20
            ? 'Low switching — good focus on individual files.'
            : 'Moderate context switching.',
        impact: switchRate > 50 ? 'negative' : 'positive',
      })
    }

    // Commit frequency
    const commits = recent.filter(e => e.type === 'git-commit').length
    const daySpan = recent.length > 0
      ? (new Date(recent[recent.length - 1]!.timestamp).getTime() - new Date(recent[0]!.timestamp).getTime()) / 86400000
      : 1
    const commitsPerDay = Math.round((commits / Math.max(daySpan, 1)) * 10) / 10

    if (commits > 2) {
      patterns.push({
        id: 'commit-frequency',
        name: 'Commit Frequency',
        category: 'behavioral',
        description: `${commitsPerDay} commits per day average.`,
        confidence: Math.min(100, commits * 10),
        insight: commitsPerDay > 5
          ? 'High commit frequency — small, incremental commits are great for review.'
          : commitsPerDay < 1
            ? 'Low commit frequency — consider smaller, more frequent commits.'
            : 'Healthy commit cadence.',
        impact: commitsPerDay >= 1 && commitsPerDay <= 8 ? 'positive' : 'neutral',
      })
    }

    // Build success rate
    const builds = recent.filter(e => e.type === 'build-run').length
    const buildPasses = recent.filter(e => e.type === 'build-pass').length
    if (builds > 2) {
      const buildRate = Math.round((buildPasses / builds) * 100)
      patterns.push({
        id: 'build-success',
        name: 'Build Success Rate',
        category: 'quality',
        description: `Build success rate: ${buildRate}% (${buildPasses}/${builds}).`,
        confidence: Math.min(100, builds * 8),
        insight: buildRate > 90
          ? 'Excellent build reliability.'
          : 'Consider running lint/typecheck before committing.',
        impact: buildRate > 85 ? 'positive' : 'negative',
      })
    }

    return patterns.sort((a, b) => b.confidence - a.confidence)
  }

  // ---- Language stats ----

  getLanguageStats(date?: string): LanguageStats[] {
    const events = date
      ? this.events.filter(e => e.timestamp.startsWith(date))
      : this.events

    const langMap = new Map<string, { minutes: number; files: Set<string>; lines: number; sessions: number[] }>()

    for (const evt of events) {
      if (!evt.language || !['file-edit', 'file-save'].includes(evt.type)) continue
      const existing = langMap.get(evt.language) ?? { minutes: 0, files: new Set(), lines: 0, sessions: [] }
      existing.minutes++
      if (evt.filePath) existing.files.add(evt.filePath)
      existing.lines += evt.linesChanged ?? 0
      existing.sessions.push(new Date(evt.timestamp).getTime())
      langMap.set(evt.language, existing)
    }

    const totalMinutes = [...langMap.values()].reduce((s, v) => s + v.minutes, 0)

    return [...langMap.entries()]
      .sort((a, b) => b[1].minutes - a[1].minutes)
      .map(([name, stats]) => ({
        name,
        minutes: stats.minutes,
        filesEdited: stats.files.size,
        linesChanged: stats.lines,
        percent: totalMinutes > 0 ? Math.round((stats.minutes / totalMinutes) * 100) : 0,
        avgSessionMinutes: stats.sessions.length > 0
          ? Math.round(stats.minutes / stats.sessions.length)
          : 0,
      }))
  }

  // ---- Export ----

  exportReport(format: 'json' | 'markdown' | 'csv'): string {
    const today = new Date().toISOString().slice(0, 10)
    const summary = this.getDailySummary(today)
    const patterns = this.detectPatterns()
    const languages = this.getLanguageStats(today)

    if (format === 'json') {
      return JSON.stringify({ summary, patterns, languages, totalEvents: this.events.length }, null, 2)
    }

    if (format === 'csv') {
      const header = 'Metric,Value\n'
      const rows = [
        `Date,${summary.date}`,
        `Coding Minutes,${summary.codingMinutes}`,
        `Files Touched,${summary.filesTouched}`,
        `Lines Changed,${summary.linesChanged}`,
        `Commits,${summary.commits}`,
        `AI Prompts,${summary.aiPrompts}`,
        `AI Accepted,${summary.aiAccepted}`,
        `Tests Run,${summary.testsRun}`,
        `Tests Passed,${summary.testsPassed}`,
        `Builds,${summary.builds}`,
        `Builds Successful,${summary.buildsSuccessful}`,
        `Focus Sessions,${summary.focusSessions}`,
        `Focus Minutes,${summary.focusMinutes}`,
        `Score,${summary.score}`,
      ].join('\n')
      return header + rows
    }

    // Markdown
    const lines = [
      `# Developer Analytics Report — ${summary.date}`,
      '',
      '## Productivity',
      `- **Coding Time:** ${summary.codingMinutes} minutes`,
      `- **Files Touched:** ${summary.filesTouched}`,
      `- **Lines Changed:** ${summary.linesChanged}`,
      `- **Score:** ${summary.score}/100`,
      '',
      '## Activity',
      `- **Commits:** ${summary.commits}`,
      `- **AI Prompts:** ${summary.aiPrompts} (${summary.aiAccepted} accepted)`,
      `- **Tests:** ${summary.testsRun} run, ${summary.testsPassed} passed`,
      `- **Builds:** ${summary.builds} run, ${summary.buildsSuccessful} successful`,
      '',
      '## Focus',
      `- **Focus Sessions:** ${summary.focusSessions}`,
      `- **Focus Minutes:** ${summary.focusMinutes}`,
      '',
      '## Languages',
    ]

    for (const lang of languages) {
      lines.push(`- **${lang.name}:** ${lang.minutes} min (${lang.percent}%)`)
    }

    if (patterns.length > 0) {
      lines.push('', '## Insights')
      for (const p of patterns) {
        const icon = p.impact === 'positive' ? '✅' : p.impact === 'negative' ? '⚠️' : 'ℹ️'
        lines.push(`- ${icon} **${p.name}:** ${p.insight}`)
      }
    }

    return lines.join('\n')
  }

  // ---- All events ----

  getEvents(): ActivityEvent[] {
    return [...this.events]
  }

  getEventCount(): number {
    return this.events.length
  }

  clearEvents(): void {
    this.events = []
    if (this.config.persistToStorage) this.saveToStorage()
    this.emit({ type: 'data-cleared' })
  }

  // ---- Listeners ----

  on(listener: (event: AnalyticsEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  // ---- Internal ----

  private detectFocusSessions(events: ActivityEvent[]): FlowSession[] {
    const sessions: FlowSession[] = []
    const editEvents = events.filter(e => ['file-edit', 'file-save'].includes(e.type))
    if (editEvents.length === 0) return sessions

    let sessionStart = new Date(editEvents[0]!.timestamp).getTime()
    let lastEvent = sessionStart
    let interruptionCount = 0
    const filesInSession = new Set<string>()
    let linesChanged = 0
    let aiPrompts = 0

    for (let i = 1; i < editEvents.length; i++) {
      const current = new Date(editEvents[i]!.timestamp).getTime()
      const gap = current - lastEvent

      if (gap > this.config.sessionGapMs) {
        // End current session
        const durationMs = lastEvent - sessionStart
        const durationMinutes = Math.round(durationMs / 60000)

        if (durationMinutes >= this.config.focusThresholdMinutes) {
          const quality = this.calculateFlowQuality(durationMinutes, interruptionCount, filesInSession.size, aiPrompts)
          sessions.push({
            id: `flow-${sessionStart}`,
            startTime: new Date(sessionStart).toISOString(),
            endTime: new Date(lastEvent).toISOString(),
            durationMinutes,
            quality,
            interruptions: interruptionCount,
            filesEdited: [...filesInSession],
            linesChanged,
            aiPrompts,
            classification: this.classifySession(durationMinutes, quality, interruptionCount),
          })
        }

        // Start new session
        sessionStart = current
        interruptionCount = 0
        filesInSession.clear()
        linesChanged = 0
        aiPrompts = 0
      } else if (gap > 60000) {
        interruptionCount++
      }

      lastEvent = current
      if (editEvents[i]!.filePath) filesInSession.add(editEvents[i]!.filePath!)
      linesChanged += editEvents[i]!.linesChanged ?? 0
    }

    // Final session
    const durationMs = lastEvent - sessionStart
    const durationMinutes = Math.round(durationMs / 60000)
    if (durationMinutes >= this.config.focusThresholdMinutes) {
      const quality = this.calculateFlowQuality(durationMinutes, interruptionCount, filesInSession.size, aiPrompts)
      sessions.push({
        id: `flow-${sessionStart}`,
        startTime: new Date(sessionStart).toISOString(),
        endTime: new Date(lastEvent).toISOString(),
        durationMinutes,
        quality,
        interruptions: interruptionCount,
        filesEdited: [...filesInSession],
        linesChanged,
        aiPrompts,
        classification: this.classifySession(durationMinutes, quality, interruptionCount),
      })
    }

    return sessions
  }

  private calculateFlowQuality(
    durationMinutes: number,
    interruptions: number,
    fileCount: number,
    aiPrompts: number,
  ): number {
    // Duration factor: peaks at 60-90 min
    const durationFactor = Math.min(100, durationMinutes <= 90
      ? (durationMinutes / 90) * 100
      : 100 - (durationMinutes - 90) * 0.5)

    // Interruption penalty
    const interruptionFactor = Math.max(0, 100 - interruptions * 15)

    // Context switch penalty
    const contextSwitchFactor = Math.max(0, 100 - Math.max(0, fileCount - 3) * 10)

    // AI assist factor (moderate use is good)
    const aiAssistFactor = aiPrompts > 0 && aiPrompts <= 5 ? 90 : aiPrompts > 5 ? 70 : 80

    return Math.round(
      durationFactor * 0.35 +
      interruptionFactor * 0.30 +
      contextSwitchFactor * 0.20 +
      aiAssistFactor * 0.15
    )
  }

  private classifySession(
    durationMinutes: number,
    quality: number,
    interruptions: number,
  ): FlowSession['classification'] {
    if (durationMinutes >= this.config.deepFocusMinutes && quality >= 80) return 'deep-focus'
    if (quality >= 65 && interruptions <= 2) return 'productive'
    if (quality >= 45) return 'moderate'
    if (interruptions > 5) return 'fragmented'
    return 'distracted'
  }

  private calculateActiveMinutes(events: ActivityEvent[]): number {
    if (events.length === 0) return 0
    const times = events.map(e => new Date(e.timestamp).getTime())
    let activeMs = 0
    for (let i = 1; i < times.length; i++) {
      const gap = times[i]! - times[i - 1]!
      if (gap < this.config.sessionGapMs) activeMs += gap
    }
    return Math.round(activeMs / 60000)
  }

  private calculateProductivityScore(data: {
    codingMinutes: number
    commits: number
    aiPrompts: number
    aiAccepted: number
    testsRun: number
    testsPassed: number
    builds: number
    buildsSuccessful: number
    focusMinutes: number
    filesTouched: number
    linesChanged: number
  }): number {
    let score = 0

    // Coding time (0-25)
    score += Math.min(25, data.codingMinutes / 4)

    // Commits (0-15)
    score += Math.min(15, data.commits * 3)

    // Test discipline (0-15)
    if (data.testsRun > 0) {
      score += Math.round((data.testsPassed / data.testsRun) * 15)
    }

    // Build reliability (0-10)
    if (data.builds > 0) {
      score += Math.round((data.buildsSuccessful / data.builds) * 10)
    }

    // Focus quality (0-20)
    score += Math.min(20, data.focusMinutes / 5)

    // AI efficiency (0-10)
    if (data.aiPrompts > 0) {
      score += Math.round((data.aiAccepted / data.aiPrompts) * 10)
    }

    // Code output (0-5)
    score += Math.min(5, data.linesChanged / 50)

    return Math.round(Math.min(100, Math.max(0, score)))
  }

  // ---- Persistence ----

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return
    try {
      const data = JSON.stringify(this.events.slice(-this.config.maxEvents))
      localStorage.setItem(this.config.storageKey, data)
    } catch { /* quota exceeded */ }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(this.config.storageKey)
      if (raw) this.events = JSON.parse(raw)
    } catch { /* corrupt data */ }
  }

  private emit(event: AnalyticsEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type AnalyticsEventType = 'event-recorded' | 'data-cleared'

export type AnalyticsEvent =
  | { type: 'event-recorded'; event: ActivityEvent }
  | { type: 'data-cleared' }

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: DeveloperAnalyticsEngine | null = null

export function getDeveloperAnalyticsEngine(
  config?: Partial<DeveloperAnalyticsConfig>,
): DeveloperAnalyticsEngine {
  if (!instance) {
    instance = new DeveloperAnalyticsEngine(config)
  }
  return instance
}

export function resetDeveloperAnalyticsEngine(): void {
  instance = null
}
