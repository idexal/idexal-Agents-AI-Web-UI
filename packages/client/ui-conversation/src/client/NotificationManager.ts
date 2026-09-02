/**
 * Smart Notification Manager engine.
 *
 * Aggregates, prioritises, and delivers notifications across multiple
 * channels (browser, sound, badge).  Supports grouping, snoozing,
 * quiet hours, rate limiting, and per-type preferences.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationChannel = 'browser' | 'sound' | 'badge' | 'toast' | 'email'
export type NotificationPriority = 'urgent' | 'high' | 'medium' | 'low' | 'silent'
export type NotificationCategory = 'system' | 'task' | 'review' | 'build' | 'security' | 'mention' | 'reminder'

export interface SmartNotification {
  readonly id: string
  readonly title: string
  readonly body: string
  readonly category: NotificationCategory
  readonly priority: NotificationPriority
  readonly channels: readonly NotificationChannel[]
  readonly createdAt: number
  readonly read: boolean
  readonly snoozedUntil?: number
  readonly groupId?: string
  readonly actionUrl?: string
  readonly metadata?: Record<string, unknown>
}

export interface NotificationPreferences {
  readonly enabled: boolean
  readonly quietHoursStart: number   // 0-23
  readonly quietHoursEnd: number
  readonly channelsPerPriority: Record<NotificationPriority, readonly NotificationChannel[]>
  readonly categoriesEnabled: Record<NotificationCategory, boolean>
  readonly maxPerMinute: number
  readonly groupDelayMs: number
}

export interface NotificationStats {
  readonly total: number
  readonly unread: number
  readonly byCategory: Record<NotificationCategory, number>
  readonly byPriority: Record<NotificationPriority, number>
  readonly sentToday: number
}

export interface NotificationManagerConfig {
  readonly maxHistory: number
  readonly defaultPreferences: Partial<NotificationPreferences>
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SmartNotificationManagerEngine {
  private readonly notifications: SmartNotification[] = []
  private readonly groupBuffer: SmartNotification[] = []
  private preferences: NotificationPreferences
  private readonly config: NotificationManagerConfig
  private recentCount = 0
  private lastMinuteReset = Date.now()

  constructor(config?: Partial<NotificationManagerConfig>) {
    this.config = { maxHistory: config?.maxHistory ?? 500, defaultPreferences: config?.defaultPreferences ?? {} }
    this.preferences = this.buildPreferences(config?.defaultPreferences)
  }

  /** Queue a notification (respects rate limits, quiet hours, preferences). */
  push(notification: Omit<SmartNotification, 'id' | 'createdAt' | 'read'>): SmartNotification | null {
    if (!this.preferences.enabled) return null
    const now = Date.now()
    if (this.isQuietHours(now)) return null
    if (this.isRateLimited(now)) return null
    if (!this.preferences.categoriesEnabled[notification.category]) return null

    const entry: SmartNotification = { ...notification, id: `n_${now}_${Math.random().toString(36).slice(2, 6)}`, createdAt: now, read: false }

    // Grouping
    if (notification.groupId && this.preferences.groupDelayMs > 0) {
      this.groupBuffer.push(entry)
      const sameGroup = this.groupBuffer.filter(n => n.groupId === notification.groupId)
      if (sameGroup.length >= 3 || notification.priority === 'urgent') {
        for (const n of sameGroup) this.addNotification(n)
        this.groupBuffer.splice(0, this.groupBuffer.length, ...this.groupBuffer.filter(n => n.groupId !== notification.groupId))
        return entry
      }
      return null // will be delivered when buffer fills or delay passes
    }

    this.addNotification(entry)
    return entry
  }

  markRead(id: string): boolean {
    const idx = this.notifications.findIndex(n => n.id === id)
    if (idx < 0) return false
    this.notifications[idx] = { ...this.notifications[idx]!, read: true }
    return true
  }

  markAllRead(): void {
    for (let i = 0; i < this.notifications.length; i++) {
      if (!this.notifications[i]!.read) this.notifications[i] = { ...this.notifications[i]!, read: true }
    }
  }

  snooze(id: string, durationMs: number): boolean {
    const idx = this.notifications.findIndex(n => n.id === id)
    if (idx < 0) return false
    this.notifications[idx] = { ...this.notifications[idx]!, snoozedUntil: Date.now() + durationMs }
    return true
  }

  dismiss(id: string): boolean {
    const idx = this.notifications.findIndex(n => n.id === id)
    if (idx < 0) return false
    this.notifications.splice(idx, 1)
    return true
  }

  getNotifications(category?: NotificationCategory, unreadOnly?: boolean): SmartNotification[] {
    const now = Date.now()
    return this.notifications.filter(n =>
      (!category || n.category === category) &&
      (!unreadOnly || !n.read) &&
      (!n.snoozedUntil || n.snoozedUntil <= now),
    )
  }

  getStats(): NotificationStats {
    const byCategory: Record<NotificationCategory, number> = { system: 0, task: 0, review: 0, build: 0, security: 0, mention: 0, reminder: 0 }
    const byPriority: Record<NotificationPriority, number> = { urgent: 0, high: 0, medium: 0, low: 0, silent: 0 }
    const today = new Date().toISOString().slice(0, 10)
    let sentToday = 0
    for (const n of this.notifications) {
      byCategory[n.category]++
      byPriority[n.priority]++
      if (new Date(n.createdAt).toISOString().slice(0, 10) === today) sentToday++
    }
    return { total: this.notifications.length, unread: this.notifications.filter(n => !n.read).length, byCategory, byPriority, sentToday }
  }

  updatePreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private addNotification(entry: SmartNotification): void {
    this.notifications.push(entry)
    if (this.notifications.length > this.config.maxHistory) {
      this.notifications.splice(0, this.notifications.length - this.config.maxHistory)
    }
  }

  private isQuietHours(now: number): boolean {
    const hour = new Date(now).getHours()
    const { quietHoursStart, quietHoursEnd } = this.preferences
    if (quietHoursStart < quietHoursEnd) return hour >= quietHoursStart && hour < quietHoursEnd
    return hour >= quietHoursStart || hour < quietHoursEnd
  }

  private isRateLimited(now: number): boolean {
    if (now - this.lastMinuteReset > 60_000) { this.recentCount = 0; this.lastMinuteReset = now }
    this.recentCount++
    return this.recentCount > this.preferences.maxPerMinute
  }

  private buildPreferences(partial?: Partial<NotificationPreferences>): NotificationPreferences {
    return {
      enabled: partial?.enabled ?? true,
      quietHoursStart: partial?.quietHoursStart ?? 22,
      quietHoursEnd: partial?.quietHoursEnd ?? 7,
      channelsPerPriority: partial?.channelsPerPriority ?? {
        urgent: ['browser', 'sound', 'badge', 'toast'],
        high: ['browser', 'toast'],
        medium: ['toast'],
        low: ['badge'],
        silent: [],
      },
      categoriesEnabled: partial?.categoriesEnabled ?? { system: true, task: true, review: true, build: true, security: true, mention: true, reminder: true },
      maxPerMinute: partial?.maxPerMinute ?? 30,
      groupDelayMs: partial?.groupDelayMs ?? 5000,
    }
  }
}

let _instance: SmartNotificationManagerEngine | undefined
export function getSmartNotificationManagerEngine(config?: Partial<NotificationManagerConfig>): SmartNotificationManagerEngine {
  _instance ??= new SmartNotificationManagerEngine(config)
  return _instance
}
export function resetSmartNotificationManagerEngine(): void { _instance = undefined }
