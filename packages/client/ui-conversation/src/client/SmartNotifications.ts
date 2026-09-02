/**
 * Smart Notification System for Idexal Agents.
 * Context-aware notifications with priority, batching,
 * scheduling, and user preference management.
 */

/** Notification type */
export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'task'
  | 'reminder'
  | 'collaboration'
  | 'system'

/** Notification priority */
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low'

/** Notification position */
export type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

/** Notification */
export interface Notification {
  /** Notification ID */
  id: string
  /** Type */
  type: NotificationType
  /** Priority */
  priority: NotificationPriority
  /** Title */
  title: string
  /** Message body */
  message: string
  /** Optional action */
  action?: { label: string; url: string }
  /** Icon */
  icon?: string
  /** Timestamp */
  timestamp: number
  /** Expiration time */
  expiresAt?: number
  /** Read status */
  read: boolean
  /** Dismissed status */
  dismissed: boolean
  /** Tags for grouping */
  tags: string[]
  /** Metadata */
  metadata?: Record<string, unknown>
}

/** Notification group */
export interface NotificationGroup {
  /** Group key */
  key: string
  /** Notifications in group */
  notifications: Notification[]
  /** Group count */
  count: number
  /** Latest timestamp */
  latestTimestamp: number
}

/** Notification preferences */
export interface NotificationPreferences {
  /** Enable notifications */
  enabled: boolean
  /** Enable sound */
  sound: boolean
  /** Enable vibration */
  vibration: boolean
  /** Position */
  position: NotificationPosition
  /** Max visible notifications */
  maxVisible: number
  /** Auto-dismiss timeout (ms) */
  autoDismissTimeout: number
  /** Enabled types */
  enabledTypes: NotificationType[]
  /** Minimum priority to show */
  minPriority: NotificationPriority
  /** Quiet hours */
  quietHours?: { start: string; end: string }
  /** Batch similar notifications */
  batchSimilar: boolean
  /** Max batch size */
  maxBatchSize: number
}

/** Notification stats */
export interface NotificationStats {
  /** Total received */
  total: number
  /** Total read */
  read: number
  /** Total dismissed */
  dismissed: number
  /** Active (unread) */
  active: number
  /** By type */
  byType: Record<NotificationType, number>
  /** By priority */
  byPriority: Record<NotificationPriority, number>
}

/** Default notification preferences */
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: false,
  position: 'top-right',
  maxVisible: 5,
  autoDismissTimeout: 5000,
  enabledTypes: ['info', 'success', 'warning', 'error', 'task', 'reminder', 'collaboration', 'system'],
  minPriority: 'low',
  batchSimilar: true,
  maxBatchSize: 5,
}

const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  urgent: 0, high: 1, normal: 2, low: 3,
}

/**
 * Smart Notification System.
 */
export class SmartNotificationEngine {
  private notifications: Map<string, Notification> = new Map()
  private preferences: NotificationPreferences
  private listeners: Set<(event: NotificationEvent) => void> = new Set()
  private dismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  constructor(config: Partial<NotificationPreferences> = {}) {
    this.preferences = { ...DEFAULT_PREFERENCES, ...config }
    this.loadPreferences()
  }

  /**
   * Show a notification.
   */
  show(notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>): Notification | null {
    if (!this.preferences.enabled) return null

    // Check type enabled
    if (!this.preferences.enabledTypes.includes(notification.type)) return null

    // Check priority threshold
    if (PRIORITY_ORDER[notification.priority] > PRIORITY_ORDER[this.preferences.minPriority]) return null

    // Check quiet hours
    if (this.isQuietHours()) return null

    const full: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      read: false,
      dismissed: false,
    }

    // Check for batching
    if (this.preferences.batchSimilar) {
      const existing = this.findSimilar(full)
      if (existing) {
        existing.count++
        existing.latestTimestamp = Date.now()
        this.notifyListeners({ type: 'group-updated', group: existing })
        const firstId = existing.notifications[0]?.id
        return (firstId !== undefined ? this.notifications.get(firstId) : undefined) ?? null
      }
    }

    this.notifications.set(full.id, full)

    // Auto-dismiss
    if (full.priority !== 'urgent' && this.preferences.autoDismissTimeout > 0) {
      const timer = setTimeout(() => this.dismiss(full.id), this.preferences.autoDismissTimeout)
      this.dismissTimers.set(full.id, timer)
    }

    // Trim old notifications
    this.trimNotifications()

    this.notifyListeners({ type: 'notification-shown', notification: full })
    return full
  }

  /**
   * Convenience methods for each type.
   */
  info(title: string, message: string, tags: string[] = []): Notification | null {
    return this.show({ type: 'info', priority: 'normal', title, message, tags })
  }

  success(title: string, message: string, tags: string[] = []): Notification | null {
    return this.show({ type: 'success', priority: 'normal', title, message, tags })
  }

  warn(title: string, message: string, tags: string[] = []): Notification | null {
    return this.show({ type: 'warning', priority: 'high', title, message, tags })
  }

  error(title: string, message: string, tags: string[] = []): Notification | null {
    return this.show({ type: 'error', priority: 'urgent', title, message, tags })
  }

  /**
   * Dismiss a notification.
   */
  dismiss(id: string): void {
    const notification = this.notifications.get(id)
    if (!notification) return

    notification.dismissed = true

    const timer = this.dismissTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.dismissTimers.delete(id)
    }

    this.notifyListeners({ type: 'notification-dismissed', notification })
    this.notifications.delete(id)
  }

  /**
   * Mark notification as read.
   */
  markRead(id: string): void {
    const notification = this.notifications.get(id)
    if (notification) {
      notification.read = true
      this.notifyListeners({ type: 'notification-read', notification })
    }
  }

  /**
   * Mark all as read.
   */
  markAllRead(): void {
    for (const notification of this.notifications.values()) {
      notification.read = true
    }
    this.notifyListeners({ type: 'all-read' })
  }

  /**
   * Clear all notifications.
   */
  clearAll(): void {
    this.notifications.clear()
    for (const timer of this.dismissTimers.values()) {
      clearTimeout(timer)
    }
    this.dismissTimers.clear()
    this.notifyListeners({ type: 'all-cleared' })
  }

  /**
   * Get active (unread) notifications.
   */
  getActive(): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => !n.read && !n.dismissed)
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.timestamp - a.timestamp)
  }

  /**
   * Get all notifications.
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get notifications by type.
   */
  getByType(type: NotificationType): Notification[] {
    return this.getAll().filter(n => n.type === type)
  }

  /**
   * Get grouped notifications.
   */
  getGrouped(): NotificationGroup[] {
    const groups = new Map<string, NotificationGroup>()

    for (const notification of this.getAll()) {
      const tag0 = notification.tags[0]
      const key = tag0 ?? notification.type
      const existing = groups.get(key)
      if (existing) {
        existing.notifications.push(notification)
        existing.count++
        existing.latestTimestamp = Math.max(existing.latestTimestamp, notification.timestamp)
      } else {
        groups.set(key, {
          key,
          notifications: [notification],
          count: 1,
          latestTimestamp: notification.timestamp,
        })
      }
    }

    return Array.from(groups.values())
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
  }

  /**
   * Get notification stats.
   */
  getStats(): NotificationStats {
    const all = this.getAll()
    const byType: Record<NotificationType, number> = {
      info: 0, success: 0, warning: 0, error: 0,
      task: 0, reminder: 0, collaboration: 0, system: 0,
    }
    const byPriority: Record<NotificationPriority, number> = {
      urgent: 0, high: 0, normal: 0, low: 0,
    }

    for (const n of all) {
      byType[n.type]++
      byPriority[n.priority]++
    }

    return {
      total: all.length,
      read: all.filter(n => n.read).length,
      dismissed: all.filter(n => n.dismissed).length,
      active: all.filter(n => !n.read && !n.dismissed).length,
      byType,
      byPriority,
    }
  }

  /**
   * Update preferences.
   */
  updatePreferences(update: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...update }
    this.savePreferences()
    this.notifyListeners({ type: 'preferences-updated', preferences: this.preferences })
  }

  /**
   * Get preferences.
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  private findSimilar(notification: Notification): NotificationGroup | undefined {
    const groups = this.getGrouped()
    return groups.find(g =>
      g.notifications[0]?.type === notification.type &&
      g.notifications[0]?.title === notification.title
    )
  }

  private trimNotifications(): void {
    const all = this.getAll()
    if (all.length > 100) {
      const toRemove = all.slice(100)
      for (const n of toRemove) {
        this.dismiss(n.id)
      }
    }
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHours) return false
    const now = new Date()
    const hours = now.getHours()
    const start = parseInt(this.preferences.quietHours.start.split(':')[0] ?? '0', 10)
    const end = parseInt(this.preferences.quietHours.end.split(':')[0] ?? '0', 10)

    if (start > end) {
      return hours >= start || hours < end
    }
    return hours >= start && hours < end
  }

  private loadPreferences(): void {
    if (typeof localStorage === 'undefined') return
    try {
      const stored = localStorage.getItem('idexal-notifications')
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) }
      }
    } catch { /* ignore */ }
  }

  private savePreferences(): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem('idexal-notifications', JSON.stringify(this.preferences))
    } catch { /* ignore */ }
  }

  /**
   * Subscribe to notification events.
   */
  subscribe(listener: (event: NotificationEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: NotificationEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }

  /**
   * Cleanup.
   */
  destroy(): void {
    for (const timer of this.dismissTimers.values()) {
      clearTimeout(timer)
    }
    this.dismissTimers.clear()
    this.notifications.clear()
  }
}

/** Notification event */
export interface NotificationEvent {
  type: 'notification-shown' | 'notification-dismissed' | 'notification-read' | 'all-read' | 'all-cleared' | 'group-updated' | 'preferences-updated'
  notification?: Notification
  group?: NotificationGroup
  preferences?: NotificationPreferences
}

/** Singleton instance */
let instance: SmartNotificationEngine | null = null

export function getSmartNotificationEngine(
  config?: Partial<NotificationPreferences>
): SmartNotificationEngine {
  if (!instance) {
    instance = new SmartNotificationEngine(config)
  }
  return instance
}

export function resetSmartNotificationEngine(): void {
  instance?.destroy()
  instance = null
}
