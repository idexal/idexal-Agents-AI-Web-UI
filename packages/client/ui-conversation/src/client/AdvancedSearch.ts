/**
 * Advanced search service for Idexal Agents.
 * Provides powerful search capabilities for conversations.
 */

export interface SearchQuery {
  /** Text to search for */
  text?: string
  /** Date range filter */
  dateRange?: { from: Date; to: Date }
  /** Filter by participant role */
  role?: 'user' | 'assistant' | 'system'
  /** Filter by message type */
  messageType?: 'text' | 'code' | 'attachment'
  /** Filter by tags */
  tags?: string[]
  /** Filter by conversation title */
  conversationTitle?: string
  /** Minimum message length */
  minLength?: number
  /** Maximum message length */
  maxLength?: number
}

export interface SearchResult {
  /** The conversation containing the match */
  conversation: {
    id: string
    title: string
    createdAt: Date
    updatedAt: Date
  }
  /** The matching message */
  message: {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
  }
  /** The matching text snippet with context */
  snippet: string
  /** The match score (higher is better) */
  score: number
}

export interface SearchStats {
  /** Total number of matches */
  totalMatches: number
  /** Number of conversations with matches */
  conversationsWithMatches: number
  /** Search duration in milliseconds */
  duration: number
}

/**
 * Search conversations with advanced filters.
 */
export function searchConversations(
  conversations: Array<{
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
  }>,
  query: SearchQuery,
  maxResults: number = 100
): { results: SearchResult[]; stats: SearchStats } {
  const startTime = performance.now()
  const results: SearchResult[] = []

  for (const conversation of conversations) {
    // Filter by conversation title if specified
    if (query.conversationTitle) {
      const titleMatch = conversation.title.toLowerCase().includes(query.conversationTitle.toLowerCase())
      if (!titleMatch) continue
    }

    for (const message of conversation.messages) {
      // Apply filters
      if (!matchesFilters(message, query)) continue

      // Search for text match
      const matchResult = findTextMatch(message.content, query.text)
      if (!matchResult) continue

      results.push({
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
        message: {
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        },
        snippet: matchResult.snippet,
        score: matchResult.score,
      })

      if (results.length >= maxResults) break
    }

    if (results.length >= maxResults) break
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score)

  const duration = performance.now() - startTime
  const uniqueConversations = new Set(results.map(r => r.conversation.id))

  return {
    results,
    stats: {
      totalMatches: results.length,
      conversationsWithMatches: uniqueConversations.size,
      duration,
    },
  }
}

/**
 * Check if a message matches the search filters.
 */
function matchesFilters(
  message: {
    role: string
    content: string
    timestamp: Date
    attachments?: Array<{ type: string }>
    tags?: string[]
  },
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
        // Text messages don't have attachments
        if (message.attachments && message.attachments.length > 0) {
          return false
        }
        break
      case 'code':
        // Code messages contain code blocks
        if (!message.content.includes('```')) {
          return false
        }
        break
      case 'attachment':
        // Attachment messages have attachments
        if (!message.attachments || message.attachments.length === 0) {
          return false
        }
        break
    }
  }

  // Tags filter
  if (query.tags && query.tags.length > 0) {
    if (!message.tags || !query.tags.some(tag => message.tags!.includes(tag))) {
      return false
    }
  }

  // Length filters
  if (query.minLength !== undefined && message.content.length < query.minLength) {
    return false
  }
  if (query.maxLength !== undefined && message.content.length > query.maxLength) {
    return false
  }

  return true
}

/**
 * Find text match in content and return snippet with context.
 */
function findTextMatch(
  content: string,
  searchText?: string
): { snippet: string; score: number } | null {
  if (!searchText) {
    // No text search specified, return full content as snippet
    return {
      snippet: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      score: 1,
    }
  }

  const lowerContent = content.toLowerCase()
  const lowerSearch = searchText.toLowerCase()
  const index = lowerContent.indexOf(lowerSearch)

  if (index === -1) {
    return null
  }

  // Calculate score based on match position and frequency
  let score = 1
  if (index === 0) score += 0.5 // Start of content
  if (content.length < 100) score += 0.3 // Short content means more relevant

  // Count all occurrences
  let count = 0
  let pos = 0
  while ((pos = lowerContent.indexOf(lowerSearch, pos)) !== -1) {
    count++
    pos += lowerSearch.length
  }
  score += Math.min(count * 0.1, 0.5) // Up to 0.5 bonus for multiple matches

  // Extract snippet with context
  const contextLength = 50
  const start = Math.max(0, index - contextLength)
  const end = Math.min(content.length, index + searchText.length + contextLength)
  let snippet = content.substring(start, end)

  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'

  // Highlight the match
  const matchStart = index - start + (start > 0 ? 3 : 0)
  const matchEnd = matchStart + searchText.length
  snippet =
    snippet.substring(0, matchStart) +
    '**' + snippet.substring(matchStart, matchEnd) + '**' +
    snippet.substring(matchEnd)

  return { snippet, score }
}

/**
 * Highlight search matches in text.
 */
export function highlightMatches(text: string, searchText: string): string {
  if (!searchText) return text

  const regex = new RegExp(`(${escapeRegex(searchText)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Escape special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Generate search suggestions based on partial input.
 */
export function generateSearchSuggestions(
  conversations: Array<{ title: string; messages: Array<{ content: string }> }>,
  partialInput: string,
  maxSuggestions: number = 5
): string[] {
  const suggestions = new Set<string>()
  const lowerPartial = partialInput.toLowerCase()

  for (const conversation of conversations) {
    // Check conversation title
    if (conversation.title.toLowerCase().includes(lowerPartial)) {
      suggestions.add(conversation.title)
    }

    // Check message content (sample first 10 messages)
    for (const message of conversation.messages.slice(0, 10)) {
      const words = message.content.split(/\s+/)
      for (const word of words) {
        if (word.toLowerCase().includes(lowerPartial) && word.length > 3) {
          suggestions.add(word)
        }
      }
    }

    if (suggestions.size >= maxSuggestions) break
  }

  return Array.from(suggestions).slice(0, maxSuggestions)
}
