/**
 * Offline sync manager for Idexal Agents.
 * Handles synchronization between local storage and server.
 */

import { getOfflineStorage, type StoredConversation } from './OfflineStorage'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'complete'

export interface SyncEvent {
  type: 'SYNC_START' | 'SYNC_COMPLETE' | 'SYNC_ERROR' | 'STATUS_CHANGE'
  status?: SyncStatus
  synced?: number
  error?: string
  timestamp: Date
}

export type SyncEventListener = (event: SyncEvent) => void

/**
 * OfflineSync class for managing data synchronization.
 */
export class OfflineSync {
  private storage = getOfflineStorage()
  private listeners: Set<SyncEventListener> = new Set()
  private status: SyncStatus = 'idle'
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private isOnline = navigator.onLine

  /**
   * Initialize the sync manager.
   */
  async init(): Promise<void> {
    await this.storage.init()

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Register service worker
    await this.registerServiceWorker()

    // Listen for messages from service worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this))
    }

    // Start auto-sync if online
    if (this.isOnline) {
      this.startAutoSync()
    }
  }

  /**
   * Register the service worker.
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('Service Worker registered:', registration.scope)

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  /**
   * Handle online event.
   */
  private handleOnline(): void {
    this.isOnline = true
    this.emit({ type: 'STATUS_CHANGE', status: 'idle', timestamp: new Date() })
    this.startAutoSync()
    this.syncNow()
  }

  /**
   * Handle offline event.
   */
  private handleOffline(): void {
    this.isOnline = false
    this.emit({ type: 'STATUS_CHANGE', status: 'idle', timestamp: new Date() })
    this.stopAutoSync()
  }

  /**
   * Handle messages from service worker.
   */
  private handleSWMessage(event: MessageEvent): void {
    const { type, synced, error } = event.data

    switch (type) {
      case 'SYNC_START':
        this.setStatus('syncing')
        break
      case 'SYNC_COMPLETE':
        this.setStatus('complete')
        this.emit({ type: 'SYNC_COMPLETE', synced, timestamp: new Date() })
        // Reset to idle after a delay
        setTimeout(() => this.setStatus('idle'), 2000)
        break
      case 'SYNC_ERROR':
        this.setStatus('error')
        this.emit({ type: 'SYNC_ERROR', error, timestamp: new Date() })
        break
    }
  }

  /**
   * Set sync status and emit event.
   */
  private setStatus(status: SyncStatus): void {
    this.status = status
    this.emit({ type: 'STATUS_CHANGE', status, timestamp: new Date() })
  }

  /**
   * Start automatic sync interval.
   */
  private startAutoSync(): void {
    this.stopAutoSync()
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.status !== 'syncing') {
        this.syncNow()
      }
    }, 5 * 60 * 1000)
  }

  /**
   * Stop automatic sync interval.
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Trigger immediate sync.
   */
  async syncNow(): Promise<void> {
    if (!this.isOnline || this.status === 'syncing') {
      return
    }

    this.setStatus('syncing')
    this.emit({ type: 'SYNC_START', timestamp: new Date() })

    try {
      // Request background sync if available
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready
        // Use type assertion for SyncManager API
        await (registration as any).sync.register('sync-conversations')
      } else {
        // Fallback: sync directly
        await this.syncDirectly()
      }
    } catch (error) {
      this.setStatus('error')
      this.emit({ type: 'SYNC_ERROR', error: (error as Error).message, timestamp: new Date() })
    }
  }

  /**
   * Sync conversations directly without service worker.
   */
  private async syncDirectly(): Promise<void> {
    const unsynced = await this.storage.getUnsyncedConversations()
    let syncedCount = 0

    for (const conversation of unsynced) {
      try {
        const response = await fetch('/api/conversations/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conversation),
        })

        if (response.ok) {
          await this.storage.markAsSynced(conversation.id)
          syncedCount++
        }
      } catch (error) {
        console.error('Failed to sync conversation:', conversation.id, error)
      }
    }

    this.setStatus('complete')
    this.emit({ type: 'SYNC_COMPLETE', synced: syncedCount, timestamp: new Date() })

    // Reset to idle after a delay
    setTimeout(() => this.setStatus('idle'), 2000)
  }

  /**
   * Save a conversation offline and queue for sync.
   */
  async saveOffline(conversation: StoredConversation): Promise<void> {
    conversation.synced = false
    await this.storage.saveConversation(conversation)

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncNow()
    }
  }

  /**
   * Get all offline conversations.
   */
  async getOfflineConversations(): Promise<StoredConversation[]> {
    return this.storage.getAllConversations()
  }

  /**
   * Get sync status.
   */
  getStatus(): SyncStatus {
    return this.status
  }

  /**
   * Check if currently online.
   */
  isCurrentlyOnline(): boolean {
    return this.isOnline
  }

  /**
   * Get storage statistics.
   */
  async getStats(): Promise<{ total: number; unsynced: number; size: number }> {
    return this.storage.getStorageStats()
  }

  /**
   * Subscribe to sync events.
   */
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Emit a sync event.
   */
  private emit(event: SyncEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Sync listener error:', error)
      }
    }
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    this.stopAutoSync()
    this.listeners.clear()
  }
}

/**
 * Create a singleton instance of OfflineSync.
 */
let instance: OfflineSync | null = null

export function getOfflineSync(): OfflineSync {
  if (!instance) {
    instance = new OfflineSync()
  }
  return instance
}

/**
 * Format sync status for display.
 */
export function formatSyncStatus(status: SyncStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready to sync'
    case 'syncing':
      return 'Syncing...'
    case 'error':
      return 'Sync failed'
    case 'complete':
      return 'Sync complete'
    default:
      return status
  }
}

/**
 * Get status icon for sync status.
 */
export function getSyncStatusIcon(status: SyncStatus): string {
  switch (status) {
    case 'idle':
      return '✓'
    case 'syncing':
      return '⟳'
    case 'error':
      return '✗'
    case 'complete':
      return '✓'
    default:
      return '?'
  }
}
