/**
 * Cross-tab Settings Sync via BroadcastChannel.
 * Syncs settings changes between browser tabs in real-time.
 * Falls back to localStorage events when BroadcastChannel is unavailable.
 */

/** Sync message types */
type SyncAction = 'update' | 'delete' | 'clear' | 'ping' | 'pong'

/** Message sent over the channel */
interface SyncMessage {
  /** Message action */
  action: SyncAction
  /** Settings key (null for clear) */
  key: string | null
  /** New value (null for delete) */
  value: unknown
  /** Originating tab ID */
  tabId: string
  /** Timestamp */
  timestamp: number
}

/** Settings change listener */
type ChangeListener = (key: string, value: unknown, source: 'local' | 'remote') => void

/** Sync configuration */
interface SettingsSyncConfig {
  /** Channel name */
  channelName: string
  /** Tab heartbeat interval (ms) */
  heartbeatInterval: number
  /** Tab stale timeout (ms) */
  staleTimeout: number
  /** Enable presence tracking */
  enablePresence: boolean
}

const DEFAULT_CONFIG: SettingsSyncConfig = {
  channelName: 'idexal-settings-sync',
  heartbeatInterval: 5000,
  staleTimeout: 15000,
  enablePresence: true,
}

/**
 * Cross-tab settings synchronization.
 *
 * Usage:
 * ```ts
 * const sync = getSettingsSync()
 * sync.set('theme', 'dark')
 * sync.get('theme') // 'dark' in all tabs
 * sync.onChange((key, value, source) => {
 *   console.log(`Tab ${source} changed ${key} to ${value}`)
 * })
 * ```
 */
export class SettingsSync {
  private config: SettingsSyncConfig
  private tabId: string
  private channel: BroadcastChannel | null = null
  private listeners: Set<ChangeListener> = new Set()
  private tabPresence: Map<string, { lastSeen: number; userAgent: string }> = new Map()
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null
  private disposed = false

  constructor(config: Partial<SettingsSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.tabId = this.generateTabId()

    this.openChannel()
    this.startHeartbeat()
    this.registerStorageListener()

    // Announce presence
    this.sendPresence()
  }

  // ---- Public API ----

  /** Get a setting value (reads from localStorage) */
  get<T = unknown>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(this.storageKey(key))
      return raw ? (JSON.parse(raw) as T) : undefined
    } catch {
      return undefined
    }
  }

  /** Set a setting value (writes to localStorage + broadcasts) */
  set(key: string, value: unknown): void {
    this.writeLocal(key, value)
    this.broadcast({ action: 'update', key, value, tabId: this.tabId, timestamp: Date.now() })
  }

  /** Delete a setting */
  delete(key: string): void {
    localStorage.removeItem(this.storageKey(key))
    this.broadcast({ action: 'delete', key, value: null, tabId: this.tabId, timestamp: Date.now() })
  }

  /** Clear all synced settings */
  clear(): void {
    const keys = this.getSyncedKeys()
    for (const key of keys) {
      localStorage.removeItem(this.storageKey(key))
    }
    this.broadcast({ action: 'clear', key: null, value: null, tabId: this.tabId, timestamp: Date.now() })
  }

  /** Check if a key exists */
  has(key: string): boolean {
    return localStorage.getItem(this.storageKey(key)) !== null
  }

  /** Get all synced keys */
  keys(): string[] {
    return this.getSyncedKeys()
  }

  /** Get all synced settings as an object */
  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const key of this.keys()) {
      result[key] = this.get(key)
    }
    return result
  }

  /** Subscribe to changes */
  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Get connected tab count */
  getTabCount(): number {
    return this.tabPresence.size + 1
  }

  /** Get connected tabs info */
  getTabs(): Array<{ id: string; lastSeen: number; age: number }> {
    const now = Date.now()
    return [
      { id: this.tabId, lastSeen: now, age: 0 },
      ...[...this.tabPresence.entries()].map(([id, info]) => ({
        id,
        lastSeen: info.lastSeen,
        age: now - info.lastSeen,
      })),
    ]
  }

  /** Get current tab ID */
  getTabId(): string {
    return this.tabId
  }

  /** Dispose and clean up */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true

    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null }
    if (this.staleCheckTimer) { clearInterval(this.staleCheckTimer); this.staleCheckTimer = null }


    // Announce departure
    this.broadcast({ action: 'ping', key: null, value: 'disconnect', tabId: this.tabId, timestamp: Date.now() })

    this.channel?.close()
    this.channel = null

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent)
    }
  }

  // ---- Channel management ----

  private openChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.config.channelName)
        this.channel.onmessage = (ev) => this.handleBroadcastMessage(ev.data as SyncMessage)
      } catch {
        // Fallback to localStorage events only
      }
    }
  }

  // ---- Broadcasting ----

  private broadcast(msg: SyncMessage): void {
    // Primary: BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg)
      } catch {
        // Channel closed
      }
    }

    // Fallback: localStorage event (BroadcastChannel may not fire for same-tab)
    try {
      localStorage.setItem(this.fallbackKey(msg), JSON.stringify(msg))
      // Clean up the signal key immediately
      setTimeout(() => localStorage.removeItem(this.fallbackKey(msg)), 50)
    } catch {
      // Quota exceeded
    }
  }

  // ---- Message handling ----

  private handleBroadcastMessage(msg: SyncMessage): void {
    if (msg.tabId === this.tabId) return // Ignore own messages

    switch (msg.action) {
      case 'update':
        this.writeLocal(msg.key!, msg.value, false)
        this.notifyListeners(msg.key!, msg.value, 'remote')
        break
      case 'delete':
        localStorage.removeItem(this.storageKey(msg.key!))
        this.notifyListeners(msg.key!, undefined, 'remote')
        break
      case 'clear':
        this.getSyncedKeys().forEach(k => localStorage.removeItem(this.storageKey(k)))
        break
      case 'ping':
        if (msg.value === 'disconnect') {
          this.tabPresence.delete(msg.tabId)
        } else {
          this.tabPresence.set(msg.tabId, { lastSeen: msg.timestamp, userAgent: '' })
          this.sendPong()
        }
        break
      case 'pong':
        this.tabPresence.set(msg.tabId, { lastSeen: msg.timestamp, userAgent: '' })
        break
    }
  }

  // ---- Storage fallback ----

  private registerStorageListener(): void {
    if (typeof window === 'undefined') return
    window.addEventListener('storage', this.handleStorageEvent)
  }

  private handleStorageEvent = (ev: StorageEvent): void => {
    if (!ev.key?.startsWith(this.fallbackPrefix)) return
    if (ev.newValue === null) return

    try {
      const msg = JSON.parse(ev.newValue) as SyncMessage
      if (msg.tabId === this.tabId) return

      switch (msg.action) {
        case 'update':
          this.writeLocal(msg.key!, msg.value, false)
          this.notifyListeners(msg.key!, msg.value, 'remote')
          break
        case 'delete':
          localStorage.removeItem(this.storageKey(msg.key!))
          this.notifyListeners(msg.key!, undefined, 'remote')
          break
        case 'clear':
          this.getSyncedKeys().forEach(k => localStorage.removeItem(this.storageKey(k)))
          break
      }
    } catch {
      // Malformed message
    }
  }

  // ---- Local writes ----

  private writeLocal(key: string, value: unknown, notify = true): void {
    try {
      localStorage.setItem(this.storageKey(key), JSON.stringify(value))
      if (notify) this.notifyListeners(key, value, 'local')
    } catch {
      // Quota exceeded
    }
  }

  // ---- Presence / heartbeat ----

  private startHeartbeat(): void {
    if (!this.config.enablePresence) return
    this.sendPresence()

    this.heartbeatTimer = setInterval(() => this.sendPresence(), this.config.heartbeatInterval)

    this.staleCheckTimer = setInterval(() => {
      const now = Date.now()
      for (const [id, info] of this.tabPresence) {
        if (now - info.lastSeen > this.config.staleTimeout) {
          this.tabPresence.delete(id)
        }
      }
    }, this.config.staleTimeout)
  }

  private sendPresence(): void {
    this.broadcast({ action: 'ping', key: null, value: 'heartbeat', tabId: this.tabId, timestamp: Date.now() })
  }

  private sendPong(): void {
    this.broadcast({ action: 'pong', key: null, value: 'pong', tabId: this.tabId, timestamp: Date.now() })
  }

  // ---- Helpers ----

  private notifyListeners(key: string, value: unknown, source: 'local' | 'remote'): void {
    for (const listener of this.listeners) {
      try { listener(key, value, source) } catch { /* ignore */ }
    }
  }

  private storageKey(key: string): string {
    return `__idexal_sync_${key}`
  }

  private getSyncedKeys(): string[] {
    const prefix = '__idexal_sync_'
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(prefix)) {
        keys.push(k.slice(prefix.length))
      }
    }
    return keys
  }

  private fallbackPrefix = '__idexal_sync_channel_'

  private fallbackKey(msg: SyncMessage): string {
    return `${this.fallbackPrefix}${msg.timestamp}-${msg.tabId}`
  }

  private generateTabId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
    return id
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: SettingsSync | null = null

export function getSettingsSync(config?: Partial<SettingsSyncConfig>): SettingsSync {
  if (!instance) {
    instance = new SettingsSync(config)
  }
  return instance
}

export function resetSettingsSync(): void {
  instance?.dispose()
  instance = null
}
