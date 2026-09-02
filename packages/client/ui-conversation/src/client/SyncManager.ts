/**
 * Sync Manager for Idexal Agents.
 * Handles synchronization between offline storage and server.
 */

import {
  AdvancedOfflineStorage,
  getOfflineStorage,
  type StoredConversation,
  type SyncQueueItem,
} from './OfflineStorageAdvanced.ts'

/** Sync configuration */
export interface SyncConfig {
  /** Enable auto-sync when online */
  autoSync: boolean
  /** Sync interval in milliseconds */
  syncInterval: number
  /** Maximum retry attempts */
  maxRetries: number
  /** Retry delay in milliseconds */
  retryDelay: number
  /** Enable conflict detection */
  enableConflictDetection: boolean
  /** Conflict resolution strategy */
  conflictStrategy: 'local-wins' | 'remote-wins' | 'manual' | 'merge'
  /** Enable background sync */
  backgroundSync: boolean
  /** Sync on reconnect */
  syncOnReconnect: boolean
  /** Callback when sync starts */
  onSyncStart: (() => void) | undefined
  /** Callback when sync completes */
  onSyncComplete: ((result: SyncResult) => void) | undefined
  /** Callback when sync fails */
  onSyncError: ((error: Error) => void) | undefined
  /** Callback for progress updates */
  onProgress: ((progress: SyncProgress) => void) | undefined
}

/** Sync result */
export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  conflicts: number
  duration: number
  errors: string[]
}

/** Sync progress */
export interface SyncProgress {
  total: number
  current: number
  phase: 'preparing' | 'uploading' | 'downloading' | 'conflict-resolution' | 'cleanup'
  message: string
}

/** Connection status */
export type ConnectionStatus = 'online' | 'offline' | 'syncing' | 'error'

/** Sync state */
export interface SyncState {
  status: ConnectionStatus
  lastSync: Date | null
  pendingChanges: number
  isSyncing: boolean
  error: string | null
}

/** Default sync configuration */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 30000,
  maxRetries: 3,
  retryDelay: 5000,
  enableConflictDetection: true,
  conflictStrategy: 'merge',
  backgroundSync: true,
  syncOnReconnect: true,
  onSyncStart: undefined,
  onSyncComplete: undefined,
  onSyncError: undefined,
  onProgress: undefined,
}

/**
 * Sync Manager.
 */
export class SyncManager {
  private config: SyncConfig
  private storage: AdvancedOfflineStorage
  private state: SyncState
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private listeners: Set<(state: SyncState) => void> = new Set()
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor(
    config: Partial<SyncConfig> = {},
    storage?: AdvancedOfflineStorage
  ) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config }
    this.storage = storage ?? getOfflineStorage()

    this.state = {
      status: navigator.onLine ? 'online' : 'offline',
      lastSync: null,
      pendingChanges: 0,
      isSyncing: false,
      error: null,
    }

    this.setupNetworkListeners()
  }

  /**
   * Start the sync manager.
   */
  async start(): Promise<void> {
    // Initialize storage if needed
    await this.storage.initialize()

    // Start auto-sync if enabled
    if (this.config.autoSync) {
      this.startAutoSync()
    }

    // Initial sync if online
    if (this.isOnline && this.config.syncOnReconnect) {
      await this.sync()
    }

    this.emit({ type: 'started' })
  }

  /**
   * Stop the sync manager.
   */
  stop(): void {
    this.stopAutoSync()
    this.emit({ type: 'stopped' })
  }

  /**
   * Manually trigger a sync.
   */
  async sync(): Promise<SyncResult> {
    if (this.state.isSyncing) {
      return { success: false, synced: 0, failed: 0, conflicts: 0, duration: 0, errors: ['Sync already in progress'] }
    }

    this.state.isSyncing = true
    this.state.status = 'syncing'
    this.state.error = null
    this.notifyListeners()

    const startTime = Date.now()
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      duration: 0,
      errors: [],
    }

    try {
      this.config.onSyncStart?.()
      this.reportProgress({ total: 0, current: 0, phase: 'preparing', message: 'Preparing sync...' })

      // Get sync queue
      const queue = await this.storage.getSyncQueue()
      const pendingItems = queue.filter(item => item.status === 'pending')

      this.reportProgress({ total: pendingItems.length, current: 0, phase: 'uploading', message: 'Uploading changes...' })

      // Process each item
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i]!
        this.reportProgress({
          total: pendingItems.length,
          current: i + 1,
          phase: 'uploading',
          message: `Syncing ${item.entityType} ${i + 1}/${pendingItems.length}...`,
        })

        try {
          await this.syncItem(item)
          result.synced++
        } catch (error) {
          result.failed++
          result.errors.push(String(error))

          // Update retry count
          item.retryCount++
          if (item.retryCount >= item.maxRetries) {
            item.status = 'failed'
          }
        }
      }

      // Clear completed items
      await this.storage.clearSyncQueue()

      this.state.lastSync = new Date()
      this.state.pendingChanges = 0
    } catch (error) {
      result.success = false
      result.errors.push(String(error))
      this.state.error = String(error)
    } finally {
      this.state.isSyncing = false
      this.state.status = this.isOnline ? 'online' : 'offline'
      result.duration = Date.now() - startTime
      this.notifyListeners()
      this.config.onSyncComplete?.(result)
    }

    return result
  }

  /**
   * Get current sync state.
   */
  getState(): SyncState {
    return { ...this.state }
  }

  /**
   * Subscribe to state changes.
   */
  onStateChange(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Subscribe to sync events.
   */
  onEvent(listener: (event: SyncEvent) => void): () => void {
    const unsubStorage = this.storage.onEvent((storageEvent) => {
      if (storageEvent.type.includes('saved') || storageEvent.type.includes('deleted')) {
        listener({
          type: 'local-change',
          entityType: storageEvent.conversationId ? 'conversation' : 'message',
          entityId: storageEvent.conversationId ?? storageEvent.messageId ?? '',
        })
      }
    })
    return unsubStorage
  }

  /**
   * Check if online.
   */
  isOnlineStatus(): boolean {
    return this.isOnline
  }

  /**
   * Queue a local change for sync.
   */
  async queueChange(
    _type: 'create' | 'update' | 'delete',
    _entityType: 'conversation' | 'message',
    _entityId: string,
    data: unknown
  ): Promise<void> {
    await this.storage.saveConversation(data as StoredConversation)
    this.state.pendingChanges++
    this.notifyListeners()
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.state.status = 'online'
      this.state.error = null
      this.notifyListeners()
      this.emit({ type: 'online' })

      if (this.config.syncOnReconnect) {
        this.sync()
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.state.status = 'offline'
      this.notifyListeners()
      this.emit({ type: 'offline' })
    })
  }

  private startAutoSync(): void {
    this.stopAutoSync()
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.state.isSyncing) {
        this.sync()
      }
    }, this.config.syncInterval)
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // Simulate sync with server
    // In production, this would make API calls
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 95% success rate simulation
        if (Math.random() > 0.05) {
          resolve()
        } else {
          reject(new Error(`Failed to sync ${item.entityType}`))
        }
      }, 100)
    })
  }

  private reportProgress(progress: SyncProgress): void {
    this.config.onProgress?.(progress)
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('SyncManager listener error:', error)
      }
    }
  }

  private emit(event: SyncEvent): void {
    // Emit event for external listeners
    console.log('Sync event:', event)
  }
}

/** Sync event types */
export type SyncEventType = 'started' | 'stopped' | 'online' | 'offline' | 'local-change'

/** Sync event */
export interface SyncEvent {
  type: SyncEventType
  entityType?: 'conversation' | 'message'
  entityId?: string
}

/**
 * Singleton instance.
 */
let instance: SyncManager | null = null

export function getSyncManager(
  config?: Partial<SyncConfig>,
  storage?: AdvancedOfflineStorage
): SyncManager {
  if (!instance) {
    instance = new SyncManager(config, storage)
  }
  return instance
}

/**
 * Format sync status for display.
 */
export function formatSyncStatus(status: ConnectionStatus): string {
  switch (status) {
    case 'online':
      return '🟢 Online'
    case 'offline':
      return '🔴 Offline'
    case 'syncing':
      return '🔄 Syncing'
    case 'error':
      return '⚠️ Error'
    default:
      return '❓ Unknown'
  }
}

/**
 * Get status color.
 */
export function getStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'online':
      return '#10B981'
    case 'offline':
      return '#EF4444'
    case 'syncing':
      return '#3B82F6'
    case 'error':
      return '#F59E0B'
    default:
      return '#9CA3AF'
  }
}
