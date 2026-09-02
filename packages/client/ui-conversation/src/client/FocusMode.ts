/**
 * Focus Mode Engine for Idexal Agents.
 * Provides distraction-free coding with time tracking,
 * break reminders, and productivity analytics.
 */

/** Focus mode state */
export type FocusState = 'idle' | 'focused' | 'break' | 'paused'

/** Focus session */
export interface FocusSession {
  /** Session ID */
  id: string
  /** Session start time */
  startTime: number
  /** Session end time */
  endTime?: number
  /** Duration in milliseconds */
  duration: number
  /** Number of breaks taken */
  breaks: number
  /** Lines of code written */
  linesWritten: number
  /** Files modified */
  filesModified: number
  /** Focus score (0-100) */
  score: number
}

/** Focus config */
export interface FocusConfig {
  /** Pomodoro duration in minutes */
  pomodoroDuration: number
  /** Short break duration in minutes */
  shortBreakDuration: number
  /** Long break duration in minutes */
  longBreakDuration: number
  /** Sessions before long break */
  sessionsBeforeLongBreak: number
  /** Enable break reminders */
  enableBreakReminders: boolean
  /** Enable ambient sounds */
  enableAmbientSounds: boolean
  /** Enable productivity tracking */
  enableProductivityTracking: boolean
  /** Auto-start break */
  autoStartBreak: boolean
}

/** Focus state */
export interface FocusModeState {
  /** Current state */
  state: FocusState
  /** Current session */
  currentSession: FocusSession | null
  /** Time remaining in ms */
  timeRemaining: number
  /** Total focused time today in ms */
  totalFocusedTime: number
  /** Sessions completed today */
  sessionsCompleted: number
  /** Current streak */
  currentStreak: number
  /** Best streak */
  bestStreak: number
  /** Today's productivity score */
  productivityScore: number
}

/** Ambient sound type */
export type AmbientSound = 'rain' | 'forest' | 'ocean' | 'cafe' | 'whitenoise' | 'none'

/**
 * Focus Mode Engine.
 */
export class FocusModeEngine {
  private config: FocusConfig
  private state: FocusModeState
  private timer: ReturnType<typeof setInterval> | null = null
  private linesWritten: number = 0
  private filesModified: Set<string> = new Set()
  private listeners: Set<(state: FocusModeState) => void> = new Set()
  private breakCallback: (() => void) | null = null

  constructor(config: Partial<FocusConfig> = {}) {
    this.config = {
      pomodoroDuration: config.pomodoroDuration ?? 25,
      shortBreakDuration: config.shortBreakDuration ?? 5,
      longBreakDuration: config.longBreakDuration ?? 15,
      sessionsBeforeLongBreak: config.sessionsBeforeLongBreak ?? 4,
      enableBreakReminders: config.enableBreakReminders ?? true,
      enableAmbientSounds: config.enableAmbientSounds ?? false,
      enableProductivityTracking: config.enableProductivityTracking ?? true,
      autoStartBreak: config.autoStartBreak ?? false,
    }

    this.state = {
      state: 'idle',
      currentSession: null,
      timeRemaining: 0,
      totalFocusedTime: 0,
      sessionsCompleted: 0,
      currentStreak: 0,
      bestStreak: 0,
      productivityScore: 0,
    }

    this.loadState()
  }

  /**
   * Start a focus session.
   */
  startSession(): void {
    if (this.state.state === 'focused') return

    const session: FocusSession = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      duration: 0,
      breaks: 0,
      linesWritten: 0,
      filesModified: 0,
      score: 0,
    }

    this.state.currentSession = session
    this.state.state = 'focused'
    this.state.timeRemaining = this.config.pomodoroDuration * 60 * 1000
    this.linesWritten = 0
    this.filesModified.clear()

    this.startTimer()
    this.notifyListeners()
  }

  /**
   * Pause the current session.
   */
  pauseSession(): void {
    if (this.state.state !== 'focused') return

    this.state.state = 'paused'
    this.stopTimer()
    this.notifyListeners()
  }

  /**
   * Resume a paused session.
   */
  resumeSession(): void {
    if (this.state.state !== 'paused') return

    this.state.state = 'focused'
    this.startTimer()
    this.notifyListeners()
  }

  /**
   * End the current session.
   */
  endSession(): FocusSession | null {
    if (!this.state.currentSession) return null

    const session = this.state.currentSession
    session.endTime = Date.now()
    session.duration = session.endTime - session.startTime
    session.linesWritten = this.linesWritten
    session.filesModified = this.filesModified.size
    session.score = this.calculateSessionScore(session)

    // Update state
    this.state.totalFocusedTime += session.duration
    this.state.sessionsCompleted++
    this.state.currentStreak++
    this.state.bestStreak = Math.max(this.state.bestStreak, this.state.currentStreak)
    this.state.productivityScore = this.calculateProductivityScore()

    // Reset
    this.state.state = 'idle'
    this.state.currentSession = null
    this.state.timeRemaining = 0
    this.stopTimer()
    this.saveState()
    this.notifyListeners()

    return session
  }

  /**
   * Start a break.
   */
  startBreak(): void {
    const isLongBreak = this.state.sessionsCompleted % this.config.sessionsBeforeLongBreak === 0
    const breakDuration = isLongBreak
      ? this.config.longBreakDuration
      : this.config.shortBreakDuration

    this.state.state = 'break'
    this.state.timeRemaining = breakDuration * 60 * 1000
    if (this.state.currentSession) {
      this.state.currentSession.breaks++
    }

    this.startTimer()
    this.notifyListeners()
  }

  /**
   * Record a line written.
   */
  recordLineWritten(filePath: string): void {
    this.linesWritten++
    this.filesModified.add(filePath)
  }

  /**
   * Get time formatted as MM:SS.
   */
  getFormattedTime(): string {
    const seconds = Math.floor(this.state.timeRemaining / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Get progress percentage.
   */
  getProgress(): number {
    if (this.state.state === 'idle') return 0

    const totalDuration = this.state.state === 'break'
      ? (this.state.sessionsCompleted % this.config.sessionsBeforeLongBreak === 0
        ? this.config.longBreakDuration
        : this.config.shortBreakDuration) * 60 * 1000
      : this.config.pomodoroDuration * 60 * 1000

    return Math.round(((totalDuration - this.state.timeRemaining) / totalDuration) * 100)
  }

  /**
   * Get current state.
   */
  getState(): Readonly<FocusModeState> {
    return this.state
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: FocusModeState) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /**
   * Set break callback.
   */
  onBreak(callback: () => void): void {
    this.breakCallback = callback
  }

  /**
   * Cleanup.
   */
  destroy(): void {
    this.stopTimer()
    this.listeners.clear()
  }

  private startTimer(): void {
    this.stopTimer()

    this.timer = setInterval(() => {
      this.state.timeRemaining = Math.max(0, this.state.timeRemaining - 1000)

      if (this.state.timeRemaining <= 0) {
        this.stopTimer()

        if (this.state.state === 'focused') {
          // Session complete
          if (this.config.enableBreakReminders) {
            this.breakCallback?.()
            if (this.config.autoStartBreak) {
              this.startBreak()
            } else {
              this.state.state = 'idle'
            }
          } else {
            this.endSession()
          }
        } else if (this.state.state === 'break') {
          // Break complete
          this.state.state = 'idle'
          this.state.timeRemaining = 0
        }
      }

      this.notifyListeners()
    }, 1000)
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private calculateSessionScore(session: FocusSession): number {
    let score = 50

    // Duration score
    const expectedDuration = this.config.pomodoroDuration * 60 * 1000
    const durationRatio = session.duration / expectedDuration
    if (durationRatio >= 0.9) score += 20
    else if (durationRatio >= 0.7) score += 10

    // Productivity score
    if (session.linesWritten > 10) score += 15
    else if (session.linesWritten > 5) score += 10

    // Break penalty (too many breaks = lower score)
    if (session.breaks > 2) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  private calculateProductivityScore(): number {
    const sessions = this.state.sessionsCompleted
    if (sessions === 0) return 0

    let score = 50

    // Sessions bonus
    if (sessions >= 4) score += 25
    else if (sessions >= 2) score += 15
    else score += 5

    // Streak bonus
    if (this.state.currentStreak >= 3) score += 15
    else if (this.state.currentStreak >= 1) score += 10

    // Focus time bonus (target: 2 hours)
    const focusHours = this.state.totalFocusedTime / (60 * 60 * 1000)
    if (focusHours >= 2) score += 10
    else if (focusHours >= 1) score += 5

    return Math.max(0, Math.min(100, score))
  }

  private loadState(): void {
    if (typeof localStorage === 'undefined') return
    try {
      const stored = localStorage.getItem('idexal-focus-state')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.state.totalFocusedTime = parsed.totalFocusedTime ?? 0
        this.state.sessionsCompleted = parsed.sessionsCompleted ?? 0
        this.state.currentStreak = parsed.currentStreak ?? 0
        this.state.bestStreak = parsed.bestStreak ?? 0
      }
    } catch { /* ignore */ }
  }

  private saveState(): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem('idexal-focus-state', JSON.stringify({
        totalFocusedTime: this.state.totalFocusedTime,
        sessionsCompleted: this.state.sessionsCompleted,
        currentStreak: this.state.currentStreak,
        bestStreak: this.state.bestStreak,
      }))
    } catch { /* ignore */ }
  }

  private notifyListeners(): void {
    const state = { ...this.state }
    for (const listener of this.listeners) {
      try { listener(state) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: FocusModeEngine | null = null

export function getFocusModeEngine(
  config?: Partial<FocusConfig>
): FocusModeEngine {
  if (!instance) {
    instance = new FocusModeEngine(config)
  }
  return instance
}

export function resetFocusModeEngine(): void {
  instance?.destroy()
  instance = null
}
