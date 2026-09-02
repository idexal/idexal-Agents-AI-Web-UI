/**
 * Real-time Search Index for Idexal Agents.
 * Automatically indexes messages and provides instant search results.
 */

import type { SearchQuery, SearchResult, SearchStats } from './AdvancedSearch.ts'

/** Message event types */
export type MessageEventType = 'added' | 'updated' | 'deleted'

/** Message event payload */
export interface MessageEvent {
  type: MessageEventType
  conversationId: string
  messageId: string
  message?: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    attachments?: Array<{ type: string }>
    tags?: string[]
  }
}

/** Indexed message entry */
export interface IndexedMessage {
  /** Message ID */
  id: string
  /** Conversation ID */
  conversationId: string
  /** Message role */
  role: 'user' | 'assistant' | 'system'
  /** Message content (lowercase for indexing) */
  content: string
  /** Original content */
  originalContent: string
  /** Message timestamp */
  timestamp: Date
  /** Word tokens for fast lookup */
  tokens: Set<string>
  /** Bigram tokens for phrase matching */
  bigrams: Set<string>
  /** Message attachments */
  attachments: Array<{ type: string }> | undefined
  /** Message tags */
  tags: string[] | undefined
}

/** Indexed conversation entry */
export interface IndexedConversation {
  /** Conversation ID */
  id: string
  /** Conversation title (lowercase) */
  title: string
  /** Original title */
  originalTitle: string
  /** Creation timestamp */
  createdAt: Date
  /** Last update timestamp */
  updatedAt: Date
  /** Message IDs in this conversation */
  messageIds: Set<string>
}

/** Search index configuration */
export interface RealtimeSearchConfig {
  /** Enable real-time indexing */
  enabled: boolean
  /** Debounce delay for batch updates (ms) */
  debounceDelay: number
  /** Maximum messages to index per conversation */
  maxMessagesPerConversation: number
  /** Enable bigram indexing for phrase matching */
  enableBigrams: boolean
  /** Minimum word length to index */
  minWordLength: number
  /** Maximum index size (number of messages) */
  maxIndexSize: number
  /** Enable search suggestions */
  enableSuggestions: boolean
  /** Maximum suggestions to return */
  maxSuggestions: number
  /** Callback when index is updated */
  onIndexUpdate: ((stats: IndexStats) => void) | undefined
}

/** Index statistics */
export interface IndexStats {
  /** Total indexed messages */
  totalMessages: number
  /** Total indexed conversations */
  totalConversations: number
  /** Total indexed tokens */
  totalTokens: number
  /** Last update timestamp */
  lastUpdate: Date
  /** Index size in bytes (estimated) */
  estimatedSizeBytes: number
}

/** Search listener type */
export type SearchListener = (results: SearchResult[], stats: SearchStats) => void

/**
 * Real-time Search Index Manager.
 * Provides instant search with automatic indexing of new messages.
 */
export class RealtimeSearchIndex {
  private config: RealtimeSearchConfig
  private messages: Map<string, IndexedMessage> = new Map()
  private conversations: Map<string, IndexedConversation> = new Map()
  private invertedIndex: Map<string, Set<string>> = new Map() // token -> message IDs
  private eventListeners: Set<(event: MessageEvent) => void> = new Set()
  private searchListeners: Set<SearchListener> = new Set()
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private pendingEvents: MessageEvent[] = []
  private stats: IndexStats = {
    totalMessages: 0,
    totalConversations: 0,
    totalTokens: 0,
    lastUpdate: new Date(),
    estimatedSizeBytes: 0,
  }

  constructor(config: Partial<RealtimeSearchConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      debounceDelay: config.debounceDelay ?? 100,
      maxMessagesPerConversation: config.maxMessagesPerConversation ?? 1000,
      enableBigrams: config.enableBigrams ?? true,
      minWordLength: config.minWordLength ?? 2,
      maxIndexSize: config.maxIndexSize ?? 100000,
      enableSuggestions: config.enableSuggestions ?? true,
      maxSuggestions: config.maxSuggestions ?? 10,
      onIndexUpdate: config.onIndexUpdate,
    }
  }

  /**
   * Index a conversation with all its messages.
   */
  indexConversation(conversation: {
    id: string
    title: string
    messages: Array<{
      id: string
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: Date
      attachments?: Array<{ type: string }>
      tags?: string[]
    }>
    createdAt: Date
    updatedAt: Date
  }): void {
    // Index conversation metadata
    const indexedConversation: IndexedConversation = {
      id: conversation.id,
      title: conversation.title.toLowerCase(),
      originalTitle: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageIds: new Set(),
    }
    this.conversations.set(conversation.id, indexedConversation)

    // Index messages (limit to maxMessagesPerConversation)
    const messagesToIndex = conversation.messages.slice(
      0,
      this.config.maxMessagesPerConversation
    )

    for (const message of messagesToIndex) {
      this.indexMessage(conversation.id, message)
    }

    this.updateStats()
  }

  /**
   * Index a single message.
   */
  indexMessage(
    conversationId: string,
    message: {
      id: string
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: Date
      attachments?: Array<{ type: string }>
      tags?: string[]
    }
  ): void {
    // Check index size limit
    if (this.messages.size >= this.config.maxIndexSize) {
      // Remove oldest messages
      this.evictOldestMessages(1000)
    }

    const lowerContent = message.content.toLowerCase()
    const tokens = this.tokenize(lowerContent)
    const bigrams = this.config.enableBigrams
      ? this.generateBigrams(tokens)
      : new Set<string>()

    const indexedMessage: IndexedMessage = {
      id: message.id,
      conversationId,
      role: message.role,
      content: lowerContent,
      originalContent: message.content,
      timestamp: message.timestamp,
      tokens,
      bigrams,
      attachments: message.attachments,
      tags: message.tags,
    }

    // Remove old index entries for this message
    this.removeMessageFromIndex(message.id)

    // Add to messages map
    this.messages.set(message.id, indexedMessage)

    // Update conversation message IDs
    const conversation = this.conversations.get(conversationId)
    if (conversation) {
      conversation.messageIds.add(message.id)
      conversation.updatedAt = new Date()
    }

    // Update inverted index
    for (const token of tokens) {
      let messageIds = this.invertedIndex.get(token)
      if (!messageIds) {
        messageIds = new Set()
        this.invertedIndex.set(token, messageIds)
      }
      messageIds.add(message.id)
    }

    for (const bigram of bigrams) {
      let messageIds = this.invertedIndex.get(bigram)
      if (!messageIds) {
        messageIds = new Set()
        this.invertedIndex.set(bigram, messageIds)
      }
      messageIds.add(message.id)
    }

    this.updateStats()
  }

  /**
   * Handle a message event (add, update, delete).
   */
  handleMessageEvent(event: MessageEvent): void {
    if (!this.config.enabled) return

    // Add to pending events for batch processing
    this.pendingEvents.push(event)

    // Debounce processing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.processPendingEvents()
    }, this.config.debounceDelay)
  }

  /**
   * Process pending events immediately.
   */
  processPendingEvents(): void {
    const events = this.pendingEvents.splice(0)

    for (const event of events) {
      switch (event.type) {
        case 'added':
        case 'updated':
          if (event.message) {
            this.indexMessage(event.conversationId, event.message)
          }
          break
        case 'deleted':
          this.removeMessage(event.messageId)
          break
      }

      // Notify event listeners
      for (const listener of this.eventListeners) {
        try {
          listener(event)
        } catch (error) {
          console.error('Search index event listener error:', error)
        }
      }
    }

    this.updateStats()
    this.config.onIndexUpdate?.(this.stats)
  }

  /**
   * Remove a message from the index.
   */
  removeMessage(messageId: string): void {
    this.removeMessageFromIndex(messageId)
    this.messages.delete(messageId)
    this.updateStats()
  }

  /**
   * Remove a conversation and all its messages from the index.
   */
  removeConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return

    // Remove all messages
    for (const messageId of conversation.messageIds) {
      this.removeMessageFromIndex(messageId)
      this.messages.delete(messageId)
    }

    this.conversations.delete(conversationId)
    this.updateStats()
  }

  /**
   * Search the index with a query.
   */
  search(query: SearchQuery, maxResults: number = 100): {
    results: SearchResult[]
    stats: SearchStats
  } {
    const startTime = performance.now()
    const results: SearchResult[] = []

    if (!query.text) {
      // No text query, return recent messages
      const recentMessages = Array.from(this.messages.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, maxResults)

      for (const msg of recentMessages) {
        if (this.matchesFilters(msg, query)) {
          results.push(this.createSearchResult(msg, ''))
        }
      }
    } else {
      // Text search using inverted index
      const searchTokens = this.tokenize(query.text.toLowerCase())
      const candidateMessageIds = this.findCandidateMessages(searchTokens)

      // Score and filter candidates
      for (const messageId of candidateMessageIds) {
        const message = this.messages.get(messageId)
        if (!message) continue

        if (!this.matchesFilters(message, query)) continue

        const score = this.calculateRelevanceScore(message, searchTokens)
        if (score > 0) {
          results.push(this.createSearchResult(message, query.text, score))
        }
      }

      // Sort by score
      results.sort((a, b) => b.score - a.score)
    }

    const duration = performance.now() - startTime
    const uniqueConversations = new Set(results.map((r) => r.conversation.id))

    return {
      results: results.slice(0, maxResults),
      stats: {
        totalMatches: results.length,
        conversationsWithMatches: uniqueConversations.size,
        duration,
      },
    }
  }

  /**
   * Get search suggestions based on partial input.
   */
  getSuggestions(partialInput: string): string[] {
    if (!this.config.enableSuggestions || !partialInput) {
      return []
    }

    const lowerPartial = partialInput.toLowerCase()
    const suggestions = new Set<string>()

    // Check conversation titles
    for (const conversation of this.conversations.values()) {
      if (conversation.originalTitle.toLowerCase().includes(lowerPartial)) {
        suggestions.add(conversation.originalTitle)
      }
    }

    // Check indexed tokens
    for (const token of this.invertedIndex.keys()) {
      if (token.includes(lowerPartial) && token.length >= this.config.minWordLength) {
        suggestions.add(token)
      }
    }

    return Array.from(suggestions).slice(0, this.config.maxSuggestions)
  }

  /**
   * Get index statistics.
   */
  getStats(): IndexStats {
    return { ...this.stats }
  }

  /**
   * Subscribe to message events.
   */
  onMessageEvent(listener: (event: MessageEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => {
      this.eventListeners.delete(listener)
    }
  }

  /**
   * Subscribe to search results.
   */
  onSearchResults(listener: SearchListener): () => void {
    this.searchListeners.add(listener)
    return () => {
      this.searchListeners.delete(listener)
    }
  }

  /**
   * Enable or disable the index.
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * Clear the entire index.
   */
  clear(): void {
    this.messages.clear()
    this.conversations.clear()
    this.invertedIndex.clear()
    this.pendingEvents = []
    this.updateStats()
  }

  /**
   * Optimize the index (remove stale entries, compact).
   */
  optimize(): void {
    // Remove messages whose conversations no longer exist
    for (const [messageId, message] of this.messages) {
      if (!this.conversations.has(message.conversationId)) {
        this.removeMessageFromIndex(messageId)
        this.messages.delete(messageId)
      }
    }

    // Remove empty inverted index entries
    for (const [token, messageIds] of this.invertedIndex) {
      if (messageIds.size === 0) {
        this.invertedIndex.delete(token)
      }
    }

    this.updateStats()
  }

  /**
   * Export the index data for persistence.
   */
  exportIndex(): {
    conversations: Array<{
      id: string
      title: string
      createdAt: string
      updatedAt: string
    }>
    messages: Array<{
      id: string
      conversationId: string
      role: string
      content: string
      timestamp: string
    }>
  } {
    return {
      conversations: Array.from(this.conversations.values()).map((c) => ({
        id: c.id,
        title: c.originalTitle,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      messages: Array.from(this.messages.values()).map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.originalContent,
        timestamp: m.timestamp.toISOString(),
      })),
    }
  }

  /**
   * Import index data from persistence.
   */
  importIndex(data: {
    conversations: Array<{
      id: string
      title: string
      createdAt: string
      updatedAt: string
    }>
    messages: Array<{
      id: string
      conversationId: string
      role: string
      content: string
      timestamp: string
    }>
  }): void {
    this.clear()

    // Import conversations
    for (const conv of data.conversations) {
      this.conversations.set(conv.id, {
        id: conv.id,
        title: conv.title.toLowerCase(),
        originalTitle: conv.title,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messageIds: new Set(),
      })
    }

    // Import messages
    for (const msg of data.messages) {
      this.indexMessage(msg.conversationId, {
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      })
    }
  }

  // Private helper methods

  private removeMessageFromIndex(messageId: string): void {
    const message = this.messages.get(messageId)
    if (!message) return

    // Remove from inverted index
    for (const token of message.tokens) {
      const messageIds = this.invertedIndex.get(token)
      if (messageIds) {
        messageIds.delete(messageId)
        if (messageIds.size === 0) {
          this.invertedIndex.delete(token)
        }
      }
    }

    for (const bigram of message.bigrams) {
      const messageIds = this.invertedIndex.get(bigram)
      if (messageIds) {
        messageIds.delete(messageId)
        if (messageIds.size === 0) {
          this.invertedIndex.delete(bigram)
        }
      }
    }

    // Remove from conversation
    const conversation = this.conversations.get(message.conversationId)
    if (conversation) {
      conversation.messageIds.delete(messageId)
    }
  }

  private tokenize(text: string): Set<string> {
    const tokens = new Set<string>()
    const words = text.split(/[\s,.!?;:'"()\[\]{}<>]+/)

    for (const word of words) {
      const trimmed = word.trim()
      if (trimmed.length >= this.config.minWordLength) {
        tokens.add(trimmed)
      }
    }

    return tokens
  }

  private generateBigrams(tokens: Set<string>): Set<string> {
    const bigrams = new Set<string>()
    const tokenArray = Array.from(tokens)

    for (let i = 0; i < tokenArray.length - 1; i++) {
      const bigram = `${tokenArray[i]} ${tokenArray[i + 1]}`
      bigrams.add(bigram)
    }

    return bigrams
  }

  private findCandidateMessages(searchTokens: Set<string>): Set<string> {
    const candidateIds = new Set<string>()
    let first = true

    for (const token of searchTokens) {
      const messageIds = this.invertedIndex.get(token)
      if (!messageIds) {
        // Token not found, no candidates
        return new Set()
      }

      if (first) {
        for (const id of messageIds) {
          candidateIds.add(id)
        }
        first = false
      } else {
        // Intersection with existing candidates
        for (const id of candidateIds) {
          if (!messageIds.has(id)) {
            candidateIds.delete(id)
          }
        }
      }
    }

    return candidateIds
  }

  private calculateRelevanceScore(
    message: IndexedMessage,
    searchTokens: Set<string>
  ): number {
    let score = 0

    // Check how many search tokens match
    let matchCount = 0
    for (const token of searchTokens) {
      if (message.tokens.has(token)) {
        matchCount++
      }
    }

    // Base score from match ratio
    score = matchCount / searchTokens.size

    // Bonus for exact phrase match (bigrams)
    if (searchTokens.size > 1) {
      const searchPhrase = Array.from(searchTokens).join(' ')
      if (message.bigrams.has(searchPhrase)) {
        score += 0.5
      }
    }

    // Bonus for role (assistant messages often more relevant)
    if (message.role === 'assistant') {
      score += 0.1
    }

    // Bonus for recency
    const ageInHours =
      (Date.now() - message.timestamp.getTime()) / (1000 * 60 * 60)
    if (ageInHours < 24) {
      score += 0.2
    } else if (ageInHours < 168) {
      // 1 week
      score += 0.1
    }

    // Penalty for very long messages (less likely to be relevant)
    if (message.originalContent.length > 5000) {
      score *= 0.9
    }

    return score
  }

  private matchesFilters(
    message: IndexedMessage,
    query: SearchQuery
  ): boolean {
    // Date range filter
    if (query.dateRange) {
      const { from, to } = query.dateRange
      if (message.timestamp < from || message.timestamp > to) {
        return false
      }
    }

    // Role filter
    if (query.role && message.role !== query.role) {
      return false
    }

    // Message type filter
    if (query.messageType) {
      switch (query.messageType) {
        case 'text':
          if (message.attachments && message.attachments.length > 0) {
            return false
          }
          break
        case 'code':
          if (!message.originalContent.includes('```')) {
            return false
          }
          break
        case 'attachment':
          if (!message.attachments || message.attachments.length === 0) {
            return false
          }
          break
      }
    }

    // Tags filter
    if (query.tags && query.tags.length > 0) {
      if (
        !message.tags ||
        !query.tags.some((tag) => message.tags!.includes(tag))
      ) {
        return false
      }
    }

    // Length filters
    if (
      query.minLength !== undefined &&
      message.originalContent.length < query.minLength
    ) {
      return false
    }
    if (
      query.maxLength !== undefined &&
      message.originalContent.length > query.maxLength
    ) {
      return false
    }

    return true
  }

  private createSearchResult(
    message: IndexedMessage,
    searchText: string,
    baseScore: number = 1
  ): SearchResult {
    const conversation = this.conversations.get(message.conversationId)

    // Generate snippet
    let snippet = message.originalContent.substring(0, 200)
    if (message.originalContent.length > 200) {
      snippet += '...'
    }

    // Highlight search text if provided
    if (searchText) {
      const regex = new RegExp(`(${this.escapeRegex(searchText)})`, 'gi')
      snippet = snippet.replace(regex, '**$1**')
    }

    return {
      conversation: {
        id: message.conversationId,
        title: conversation?.originalTitle ?? 'Unknown',
        createdAt: conversation?.createdAt ?? message.timestamp,
        updatedAt: conversation?.updatedAt ?? message.timestamp,
      },
      message: {
        id: message.id,
        role: message.role,
        content: message.originalContent,
        timestamp: message.timestamp,
      },
      snippet,
      score: baseScore,
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private evictOldestMessages(count: number): void {
    const sortedMessages = Array.from(this.messages.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, count)

    for (const message of sortedMessages) {
      this.removeMessageFromIndex(message.id)
      this.messages.delete(message.id)
    }
  }

  private updateStats(): void {
    let totalTokens = 0
    for (const message of this.messages.values()) {
      totalTokens += message.tokens.size
    }

    // Estimate size (rough calculation)
    const estimatedMessageSize = 200 // bytes per message average
    const estimatedIndexSize = this.invertedIndex.size * 50 // bytes per index entry

    this.stats = {
      totalMessages: this.messages.size,
      totalConversations: this.conversations.size,
      totalTokens,
      lastUpdate: new Date(),
      estimatedSizeBytes:
        this.messages.size * estimatedMessageSize + estimatedIndexSize,
    }
  }
}

/**
 * Singleton instance of RealtimeSearchIndex.
 */
let instance: RealtimeSearchIndex | null = null

export function getRealtimeSearchIndex(
  config?: Partial<RealtimeSearchConfig>
): RealtimeSearchIndex {
  if (!instance) {
    instance = new RealtimeSearchIndex(config)
  }
  return instance
}

/**
 * Format index stats for display.
 */
export function formatIndexStats(stats: IndexStats): string {
  const sizeKB = (stats.estimatedSizeBytes / 1024).toFixed(1)
  return `${stats.totalMessages} messages indexed (${sizeKB} KB)`
}

/**
 * Get index health status.
 */
export function getIndexHealth(stats: IndexStats): {
  status: 'healthy' | 'warning' | 'critical'
  message: string
} {
  if (stats.totalMessages === 0) {
    return { status: 'warning', message: 'Index is empty' }
  }

  if (stats.estimatedSizeBytes > 50 * 1024 * 1024) {
    // 50MB
    return {
      status: 'warning',
      message: 'Index is large, consider optimizing',
    }
  }

  return { status: 'healthy', message: 'Index is healthy' }
}
