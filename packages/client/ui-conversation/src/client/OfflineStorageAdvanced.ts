/**
 * Advanced Offline Storage for Idexal Agents.
 * Provides IndexedDB-based storage with sync capabilities.
 */

/** Storage configuration */
export interface OfflineStorageConfig {
  /** Database name */
  dbName: string
  /** Database version */
  dbVersion: number
  /** Maximum storage size in MB */
  maxStorageSize: number
  /** Enable auto-cleanup of old data */
  autoCleanup: boolean
  /** Maximum age for cached conversations (days) */
  maxConversationAge: number
  /** Enable encryption for sensitive data */
  enableEncryption: boolean
  /** Encryption key (if enabled) */
  encryptionKey: string | undefined
}

/** Stored message */
export interface StoredMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments: StoredAttachment[]
  metadata: Record<string, unknown>
  /** Sync status */
  syncStatus: SyncStatus
  /** Local ID for offline changes */
  localId: string
  /** Version for conflict resolution */
  version: number
}

/** Stored attachment */
export interface StoredAttachment {
  id: string
  name: string
  type: string
  size: number
  data: Blob | string
  url: string | undefined
}

/** Stored conversation */
export interface StoredConversation {
  id: string
  title: string
  messages: StoredMessage[]
  createdAt: Date
  updatedAt: Date
  /** Sync status */
  syncStatus: SyncStatus
  /** Local ID for offline changes */
  localId: string
  /** Version for conflict resolution */
  version: number
  /** Tags */
  tags: string[]
  /** Metadata */
  metadata: Record<string, unknown>
}

/** Sync status */
export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'failed'

/** Sync queue item */
export interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'conversation' | 'message'
  entityId: string
  data: unknown
  timestamp: Date
  retryCount: number
  maxRetries: number
  status: SyncStatus
}

/** Storage statistics */
export interface StorageStats {
  totalConversations: number
  totalMessages: number
  totalAttachments: number
  storageUsed: number
  pendingSync: number
  failedSync: number
}

/** Conflict resolution result */
export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge'
  resolved: StoredConversation | StoredMessage
}

/** Default configuration */
export const DEFAULT_OFFLINE_CONFIG: OfflineStorageConfig = {
  dbName: 'idexal-agents-offline',
  dbVersion: 1,
  maxStorageSize: 100,
  autoCleanup: true,
  maxConversationAge: 30,
  enableEncryption: false,
  encryptionKey: undefined,
}

/**
 * Advanced Offline Storage Manager.
 */
export class AdvancedOfflineStorage {
  private config: OfflineStorageConfig
  private db: IDBDatabase | null = null
  private syncQueue: SyncQueueItem[] = []
  private listeners: Set<(event: OfflineStorageEvent) => void> = new Set()

  constructor(config: Partial<OfflineStorageConfig> = {}) {
    this.config = { ...DEFAULT_OFFLINE_CONFIG, ...config }
  }

  /**
   * Initialize the storage database.
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion)

      request.onerror = () => {
        reject(new Error('Failed to open database'))
      }

      request.onsuccess = () => {
        this.db = request.result
        this.emit({ type: 'initialized' })
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationStore = db.createObjectStore('conversations', { keyPath: 'id' })
          conversationStore.createIndex('localId', 'localId', { unique: true })
          conversationStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          conversationStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
          messageStore.createIndex('conversationId', 'conversationId', { unique: false })
          messageStore.createIndex('localId', 'localId', { unique: true })
          messageStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          messageStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Attachments store
        if (!db.objectStoreNames.contains('attachments')) {
          const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' })
          attachmentStore.createIndex('messageId', 'messageId', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncStore.createIndex('status', 'status', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Save a conversation.
   */
  async saveConversation(conversation: StoredConversation): Promise<void> {
    this.ensureInitialized()

    const tx = this.db!.transaction('conversations', 'readwrite')
    const store = tx.objectStore('conversations')

    const stored = {
      ...conversation,
      localId: this.generateLocalId(),
      syncStatus: 'pending' as SyncStatus,
      version: (conversation.version ?? 0) + 1,
      updatedAt: new Date(),
    }

    return new Promise((resolve, reject) => {
      const request = store.put(stored)
      request.onsuccess = () => {
        this.addToSyncQueue({
          type: 'update',
          entityType: 'conversation',
          entityId: conversation.id,
          data: stored,
        })
        this.emit({ type: 'conversation-saved', conversationId: conversation.id })
        resolve()
      }
      request.onerror = () => reject(new Error('Failed to save conversation'))
    })
  }

  /**
   * Get a conversation by ID.
   */
  async getConversation(id: string): Promise<StoredConversation | null> {
    this.ensureInitialized()

    const tx = this.db!.transaction('conversations', 'readonly')
    const store = tx.objectStore('conversations')

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(new Error('Failed to get conversation'))
    })
  }

  /**
   * Get all conversations.
   */
  async getAllConversations(): Promise<StoredConversation[]> {
    this.ensureInitialized()

    const tx = this.db!.transaction('conversations', 'readonly')
    const store = tx.objectStore('conversations')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result ?? [])
      request.onerror = () => reject(new Error('Failed to get conversations'))
    })
  }

  /**
   * Delete a conversation.
   */
  async deleteConversation(id: string): Promise<void> {
    this.ensureInitialized()

    const tx = this.db!.transaction(['conversations', 'messages', 'attachments'], 'readwrite')
    
    // Delete conversation
    const convStore = tx.objectStore('conversations')
    convStore.delete(id)

    // Delete associated messages
    const msgStore = tx.objectStore('messages')
    const msgRequest = msgStore.openCursor(IDBKeyRange.only(id))
    
    msgRequest.onsuccess = () => {
      const cursor = msgRequest.result
      if (cursor) {
        // Delete attachments first
        const attStore = tx.objectStore('attachments')
        const attRequest = attStore.openCursor(IDBKeyRange.only(cursor.value.id))
        
        attRequest.onsuccess = () => {
          const attCursor = attRequest.result
          if (attCursor) {
            attCursor.delete()
            attCursor.continue()
          }
        }
        
        cursor.delete()
        cursor.continue()
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        this.addToSyncQueue({
          type: 'delete',
          entityType: 'conversation',
          entityId: id,
          data: null,
        })
        this.emit({ type: 'conversation-deleted', conversationId: id })
        resolve()
      }
      tx.onerror = () => reject(new Error('Failed to delete conversation'))
    })
  }

  /**
   * Save a message.
   */
  async saveMessage(message: StoredMessage): Promise<void> {
    this.ensureInitialized()

    const tx = this.db!.transaction('messages', 'readwrite')
    const store = tx.objectStore('messages')

    const stored = {
      ...message,
      localId: this.generateLocalId(),
      syncStatus: 'pending' as SyncStatus,
      version: (message.version ?? 0) + 1,
    }

    return new Promise((resolve, reject) => {
      const request = store.put(stored)
      request.onsuccess = () => {
        this.addToSyncQueue({
          type: 'update',
          entityType: 'message',
          entityId: message.id,
          data: stored,
        })
        this.emit({ type: 'message-saved', messageId: message.id })
        resolve()
      }
      request.onerror = () => reject(new Error('Failed to save message'))
    })
  }

  /**
   * Get messages for a conversation.
   */
  async getMessages(conversationId: string): Promise<StoredMessage[]> {
    this.ensureInitialized()

    const tx = this.db!.transaction('messages', 'readonly')
    const store = tx.objectStore('messages')
    const index = store.index('conversationId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationId)
      request.onsuccess = () => {
        const messages = request.result ?? []
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        resolve(messages)
      }
      request.onerror = () => reject(new Error('Failed to get messages'))
    })
  }

  /**
   * Get storage statistics.
   */
  async getStats(): Promise<StorageStats> {
    this.ensureInitialized()

    const conversations = await this.getAllConversations()
    let totalMessages = 0
    let totalAttachments = 0

    for (const conv of conversations) {
      const messages = await this.getMessages(conv.id)
      totalMessages += messages.length
      for (const msg of messages) {
        totalAttachments += msg.attachments.length
      }
    }

    const syncQueue = await this.getSyncQueue()
    const pendingSync = syncQueue.filter(item => item.status === 'pending').length
    const failedSync = syncQueue.filter(item => item.status === 'failed').length

    // Estimate storage size
    const storageUsed = await this.estimateStorageSize()

    return {
      totalConversations: conversations.length,
      totalMessages,
      totalAttachments,
      storageUsed,
      pendingSync,
      failedSync,
    }
  }

  /**
   * Get sync queue.
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    this.ensureInitialized()

    const tx = this.db!.transaction('syncQueue', 'readonly')
    const store = tx.objectStore('syncQueue')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result ?? [])
      request.onerror = () => reject(new Error('Failed to get sync queue'))
    })
  }

  /**
   * Clear sync queue.
   */
  async clearSyncQueue(): Promise<void> {
    this.ensureInitialized()

    const tx = this.db!.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear sync queue'))
    })
  }

  /**
   * Clean up old data.
   */
  async cleanup(): Promise<void> {
    if (!this.config.autoCleanup) return

    const conversations = await this.getAllConversations()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.maxConversationAge)

    for (const conv of conversations) {
      if (conv.updatedAt < cutoffDate) {
        await this.deleteConversation(conv.id)
      }
    }
  }

  /**
   * Subscribe to storage events.
   */
  onEvent(listener: (event: OfflineStorageEvent) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Close the database.
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  private ensureInitialized(): void {
    if (!this.db) {
      throw new Error('Storage not initialized. Call initialize() first.')
    }
  }

  private generateLocalId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount' | 'maxRetries' | 'status'>): void {
    const queueItem: SyncQueueItem = {
      ...item,
      id: this.generateLocalId(),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    }
    this.syncQueue.push(queueItem)
    this.saveSyncQueueItem(queueItem)
  }

  private async saveSyncQueueItem(item: SyncQueueItem): Promise<void> {
    if (!this.db) return

    const tx = this.db.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')
    store.put(item)
  }

  private async estimateStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage ?? 0
    }
    return 0
  }

  private emit(event: OfflineStorageEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('OfflineStorage event listener error:', error)
      }
    }
  }
}

/** Offline storage event types */
export type OfflineStorageEventType =
  | 'initialized'
  | 'conversation-saved'
  | 'conversation-deleted'
  | 'message-saved'
  | 'sync-started'
  | 'sync-completed'
  | 'sync-failed'

/** Offline storage event */
export interface OfflineStorageEvent {
  type: OfflineStorageEventType
  conversationId?: string
  messageId?: string
  error?: string
}

/**
 * Singleton instance.
 */
let instance: AdvancedOfflineStorage | null = null

export function getOfflineStorage(
  config?: Partial<OfflineStorageConfig>
): AdvancedOfflineStorage {
  if (!instance) {
    instance = new AdvancedOfflineStorage(config)
  }
  return instance
}

/**
 * Format storage size for display.
 */
export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
