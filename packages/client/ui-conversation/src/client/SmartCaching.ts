/**
 * Smart Caching System for Idexal Agents.
 * Multi-level caching with automatic invalidation,
 * predictive prefetching, and cache analytics.
 */

/** Cache level */
export type CacheLevel = 'memory' | 'session' | 'local' | 'indexed'

/** Cache entry status */
export type CacheEntryStatus = 'active' | 'expired' | 'evicted'

/** Cache entry */
export interface CacheEntry<T> {
  /** Cache key */
  key: string
  /** Cached value */
  value: T
  /** Cache level */
  level: CacheLevel
  /** Creation time */
  createdAt: number
  /** Expiration time */
  expiresAt: number
  /** Last access time */
  lastAccessed: number
  /** Access count */
  accessCount: number
  /** Size in bytes */
  size: number
  /** Tags for grouped invalidation */
  tags: string[]
  /** Status */
  status: CacheEntryStatus
}

/** Cache stats */
export interface CacheStats {
  /** Total entries */
  totalEntries: number
  /** Total size in bytes */
  totalSize: number
  /** Hit rate */
  hitRate: number
  /** Miss rate */
  missRate: number
  /** Total hits */
  hits: number
  /** Total misses */
  misses: number
  /** Evictions */
  evictions: number
  /** Per-level stats */
  byLevel: Record<CacheLevel, { entries: number; size: number }>
}

/** Prefetch rule */
export interface PrefetchRule {
  /** Rule ID */
  id: string
  /** Pattern to match */
  pattern: RegExp
  /** Keys to prefetch */
  keys: string[]
  /** Priority */
  priority: 'high' | 'medium' | 'low'
  /** Enabled */
  enabled: boolean
}

/** Cache config */
export interface SmartCacheConfig {
  /** Max entries per level */
  maxEntriesPerLevel: number
  /** Max size per level (bytes) */
  maxSizePerLevel: number
  /** Default TTL (ms) */
  defaultTTL: number
  /** Enable predictive prefetching */
  enablePrefetching: boolean
  /** Enable cache analytics */
  enableAnalytics: boolean
  /** Enable tags */
  enableTags: boolean
  /** Eviction strategy */
  evictionStrategy: 'lru' | 'lfu' | 'fifo'
  /** Cleanup interval (ms) */
  cleanupInterval: number
}

/**
 * Smart Caching System.
 */
export class SmartCacheEngine {
  private config: SmartCacheConfig
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map()
  private sessionCache: Map<string, CacheEntry<unknown>> = new Map()
  private localCache: Map<string, CacheEntry<unknown>> = new Map()
  private indexedCache: Map<string, CacheEntry<unknown>> = new Map()
  private stats: { hits: number; misses: number; evictions: number } = { hits: 0, misses: 0, evictions: 0 }
  private prefetchRules: PrefetchRule[] = []
  private listeners: Set<(event: CacheEvent) => void> = new Set()
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<SmartCacheConfig> = {}) {
    this.config = {
      maxEntriesPerLevel: config.maxEntriesPerLevel ?? 1000,
      maxSizePerLevel: config.maxSizePerLevel ?? 5 * 1024 * 1024,
      defaultTTL: config.defaultTTL ?? 5 * 60 * 1000,
      enablePrefetching: config.enablePrefetching ?? true,
      enableAnalytics: config.enableAnalytics ?? true,
      enableTags: config.enableTags ?? true,
      evictionStrategy: config.evictionStrategy ?? 'lru',
      cleanupInterval: config.cleanupInterval ?? 60 * 1000,
    }

    this.startCleanup()
  }

  /**
   * Get a value from cache.
   */
  get<T>(key: string, level: CacheLevel = 'memory'): T | undefined {
    const cache = this.getCache(level)
    const entry = cache.get(key) as CacheEntry<T> | undefined

    if (!entry || entry.status !== 'active') {
      this.stats.misses++
      this.notifyListeners({ type: 'miss', key, level })
      return undefined
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      entry.status = 'expired'
      cache.delete(key)
      this.stats.misses++
      this.notifyListeners({ type: 'miss', key, level })
      return undefined
    }

    // Update access stats
    entry.lastAccessed = Date.now()
    entry.accessCount++
    this.stats.hits++

    // Trigger prefetch if enabled
    if (this.config.enablePrefetching) {
      this.triggerPrefetch(key)
    }

    this.notifyListeners({ type: 'hit', key, level })
    return entry.value
  }

  /**
   * Set a value in cache.
   */
  set<T>(
    key: string,
    value: T,
    options: {
      level?: CacheLevel
      ttl?: number
      tags?: string[]
    } = {}
  ): void {
    const level = options.level ?? 'memory'
    const ttl = options.ttl ?? this.config.defaultTTL
    const tags = options.tags ?? []
    const cache = this.getCache(level)

    // Calculate size (approximate)
    const size = this.estimateSize(value)

    // Check if we need to evict
    this.evictIfNeeded(level, size)

    const entry: CacheEntry<T> = {
      key,
      value,
      level,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      accessCount: 1,
      size,
      tags,
      status: 'active',
    }

    cache.set(key, entry as CacheEntry<unknown>)
    this.notifyListeners({ type: 'set', key, level })
  }

  /**
   * Delete a value from cache.
   */
  delete(key: string, level?: CacheLevel): boolean {
    if (level) {
      return this.getCache(level).delete(key)
    }

    // Delete from all levels
    let deleted = false
    for (const cache of [this.memoryCache, this.sessionCache, this.localCache, this.indexedCache]) {
      if (cache.delete(key)) deleted = true
    }

    if (deleted) {
      this.notifyListeners({ type: 'delete', key, level: 'memory' })
    }
    return deleted
  }

  /**
   * Invalidate by tags.
   */
  invalidateByTags(tags: string[]): number {
    let count = 0

    for (const cache of [this.memoryCache, this.sessionCache, this.localCache, this.indexedCache]) {
      for (const [key, entry] of cache) {
        if (entry.tags.some(t => tags.includes(t))) {
          cache.delete(key)
          count++
        }
      }
    }

    this.notifyListeners({ type: 'invalidate', key: `tags:${tags.join(',')}`, level: 'memory' })
    return count
  }

  /**
   * Clear all caches.
   */
  clear(level?: CacheLevel): void {
    if (level) {
      this.getCache(level).clear()
    } else {
      this.memoryCache.clear()
      this.sessionCache.clear()
      this.localCache.clear()
      this.indexedCache.clear()
    }
    this.notifyListeners({ type: 'clear', key: '*', level: level ?? 'memory' })
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      totalEntries: this.memoryCache.size + this.sessionCache.size + this.localCache.size + this.indexedCache.size,
      totalSize: this.calculateTotalSize(),
      hitRate: total > 0 ? this.stats.hits / total : 0,
      missRate: total > 0 ? this.stats.misses / total : 0,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      byLevel: {
        memory: { entries: this.memoryCache.size, size: this.calculateLevelSize('memory') },
        session: { entries: this.sessionCache.size, size: this.calculateLevelSize('session') },
        local: { entries: this.localCache.size, size: this.calculateLevelSize('local') },
        indexed: { entries: this.indexedCache.size, size: this.calculateLevelSize('indexed') },
      },
    }
  }

  /**
   * Add prefetch rule.
   */
  addPrefetchRule(rule: PrefetchRule): void {
    this.prefetchRules.push(rule)
  }

  /**
   * Export cache as JSON.
   */
  export(): string {
    const data = {
      memory: Array.from(this.memoryCache.entries()),
      session: Array.from(this.sessionCache.entries()),
      local: Array.from(this.localCache.entries()),
      stats: this.stats,
    }
    return JSON.stringify(data)
  }

  private getCache(level: CacheLevel): Map<string, CacheEntry<unknown>> {
    switch (level) {
      case 'memory': return this.memoryCache
      case 'session': return this.sessionCache
      case 'local': return this.localCache
      case 'indexed': return this.indexedCache
    }
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2
    } catch {
      return 100
    }
  }

  private calculateTotalSize(): number {
    return this.calculateLevelSize('memory') +
      this.calculateLevelSize('session') +
      this.calculateLevelSize('local') +
      this.calculateLevelSize('indexed')
  }

  private calculateLevelSize(level: CacheLevel): number {
    const cache = this.getCache(level)
    let size = 0
    for (const entry of cache.values()) {
      size += entry.size
    }
    return size
  }

  private evictIfNeeded(level: CacheLevel, incomingSize: number): void {
    const cache = this.getCache(level)
    const currentSize = this.calculateLevelSize(level)

    // Evict by count
    if (cache.size >= this.config.maxEntriesPerLevel) {
      this.evictOne(cache)
    }

    // Evict by size
    if (currentSize + incomingSize > this.config.maxSizePerLevel) {
      this.evictOne(cache)
    }
  }

  private evictOne(cache: Map<string, CacheEntry<unknown>>): void {
    if (cache.size === 0) return

    let evictKey = ''
    let evictValue: CacheEntry<unknown> | null = null

    switch (this.config.evictionStrategy) {
      case 'lru':
        for (const [key, entry] of cache) {
          if (!evictValue || entry.lastAccessed < evictValue.lastAccessed) {
            evictKey = key
            evictValue = entry
          }
        }
        break
      case 'lfu':
        for (const [key, entry] of cache) {
          if (!evictValue || entry.accessCount < evictValue.accessCount) {
            evictKey = key
            evictValue = entry
          }
        }
        break
      case 'fifo':
        for (const [key, entry] of cache) {
          if (!evictValue || entry.createdAt < evictValue.createdAt) {
            evictKey = key
            evictValue = entry
          }
        }
        break
    }

    if (evictKey) {
      cache.delete(evictKey)
      this.stats.evictions++
      this.notifyListeners({ type: 'evict', key: evictKey, level: 'memory' })
    }
  }

  private triggerPrefetch(key: string): void {
    for (const rule of this.prefetchRules) {
      if (rule.enabled && rule.pattern.test(key)) {
        for (const prefetchKey of rule.keys) {
          if (!this.memoryCache.has(prefetchKey)) {
            // Prefetch would trigger async load in real implementation
            this.notifyListeners({ type: 'prefetch', key: prefetchKey, level: 'memory' })
          }
        }
      }
    }
  }

  private startCleanup(): void {
    if (typeof setInterval === 'undefined') return

    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const cache of [this.memoryCache, this.sessionCache, this.localCache, this.indexedCache]) {
        for (const [key, entry] of cache) {
          if (now > entry.expiresAt) {
            cache.delete(key)
          }
        }
      }
    }, this.config.cleanupInterval)
  }

  /**
   * Stop cleanup timer.
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  subscribe(listener: (event: CacheEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: CacheEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Cache event */
export interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'clear' | 'invalidate' | 'prefetch'
  key: string
  level: CacheLevel
}

/** Singleton instance */
let instance: SmartCacheEngine | null = null

export function getSmartCacheEngine(
  config?: Partial<SmartCacheConfig>
): SmartCacheEngine {
  if (!instance) {
    instance = new SmartCacheEngine(config)
  }
  return instance
}

export function resetSmartCacheEngine(): void {
  instance?.destroy()
  instance = null
}
