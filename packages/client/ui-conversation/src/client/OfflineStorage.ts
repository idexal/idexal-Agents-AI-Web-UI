/**
 * Offline storage service for Idexal Agents.
 * Provides local storage for conversations when offline.
 */

export interface StoredConversation {
  id: string
  title: string
  messages: StoredMessage[]
  createdAt: string
  updatedAt: string
  synced: boolean
  metadata?: Record<string, unknown>
}

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  synced: boolean
  attachments?: { id: string; filename: string; type: string; size: number }[]
}

const DB_NAME = 'idexal-offline'
const DB_VERSION = 1
const STORE_NAME = 'conversations'

/**
 * OfflineStorage class for managing offline conversation data.
 */
export class OfflineStorage {
  private db: IDBDatabase | null = null

  /**
   * Initialize the offline storage database.
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
          store.createIndex('synced', 'synced', { unique: false })
        }
      }
    })
  }

  /**
   * Save a conversation to offline storage.
   */
  async saveConversation(conversation: StoredConversation): Promise<void> {
    this.ensureDb()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(conversation)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get a conversation from offline storage.
   */
  async getConversation(id: string): Promise<StoredConversation | undefined> {
    this.ensureDb()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Get all conversations from offline storage.
   */
  async getAllConversations(): Promise<StoredConversation[]> {
    this.ensureDb()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  /**
   * Delete a conversation from offline storage.
   */
  async deleteConversation(id: string): Promise<void> {
    this.ensureDb()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get conversations that need to be synced.
   */
  async getUnsyncedConversations(): Promise<StoredConversation[]> {
    this.ensureDb()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('synced')
      const request = index.getAll(0 as unknown as IDBValidKey)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  /**
   * Mark a conversation as synced.
   */
  async markAsSynced(id: string): Promise<void> {
    const conversation = await this.getConversation(id)
    if (conversation) {
      conversation.synced = true
      conversation.messages = conversation.messages.map(msg => ({ ...msg, synced: true }))
      await this.saveConversation(conversation)
    }
  }

  /**
   * Clear all offline data.
   */
  async clearAll(): Promise<void> {
    this.ensureDb()
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get storage usage statistics.
   */
  async getStorageStats(): Promise<{ total: number; unsynced: number; size: number }> {
    const conversations = await this.getAllConversations()
    const unsynced = conversations.filter(c => !c.synced)
    const size = new Blob([JSON.stringify(conversations)]).size

    return {
      total: conversations.length,
      unsynced: unsynced.length,
      size,
    }
  }

  private ensureDb(): void {
    if (!this.db) {
      throw new Error('OfflineStorage not initialized. Call init() first.')
    }
  }
}

/**
 * Create a singleton instance of OfflineStorage.
 */
let instance: OfflineStorage | null = null

export function getOfflineStorage(): OfflineStorage {
  if (!instance) {
    instance = new OfflineStorage()
  }
  return instance
}

/**
 * Format storage size for display.
 */
export function formatStorageSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
