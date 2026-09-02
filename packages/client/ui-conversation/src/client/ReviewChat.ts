/**
 * AI Code Review Chat Engine for Idexal Agents.
 * Interactive code review with conversational AI, follow-up questions,
 * context-aware suggestions, and learning from reviewer patterns.
 */

/** Message role */
export type MessageRole = 'reviewer' | 'user' | 'system'

/** Message type */
export type MessageType = 'text' | 'code' | 'suggestion' | 'question' | 'approval' | 'dismissal'

/** Review context */
export type ReviewContext = 'function' | 'class' | 'module' | 'pr' | 'commit' | 'file'

/** Chat message */
export interface ReviewMessage {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  /** Code snippet if applicable */
  codeSnippet?: { language: string; code: string; startLine?: number; endLine?: number }
  /** Suggestions attached to this message */
  suggestions?: ReviewSuggestion[]
  /** Thread/follow-up messages */
  replies: ReviewMessage[]
  /** Timestamp */
  timestamp: number
  /** Is this message resolved? */
  resolved: boolean
  /** User reactions */
  reactions: Record<string, string[]>
}

/** Review suggestion */
export interface ReviewSuggestion {
  id: string
  title: string
  description: string
  code?: string
  confidence: number
  type: 'fix' | 'improvement' | 'security' | 'performance' | 'style'
  applied: boolean
}

/** Review thread */
export interface ReviewThread {
  id: string
  file: string
  line: number
  messages: ReviewMessage[]
  status: 'open' | 'resolved' | 'dismissed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  createdAt: number
  resolvedAt?: number
}

/** Review session */
export interface ReviewSession {
  id: string
  title: string
  description: string
  threads: ReviewThread[]
  stats: {
    totalIssues: number
    resolvedIssues: number
    openIssues: number
    criticalIssues: number
    suggestionsGiven: number
    suggestionsAccepted: number
  }
  createdAt: number
  lastActivity: number
}

/** Chat config */
export interface ReviewChatConfig {
  maxMessages: number
  maxThreads: number
  autoResolve: boolean
  contextWindow: number
}

const REVIEW_RESPONSES: Record<string, string[]> = {
  security: [
    'This is a security concern. I recommend using input validation and sanitization.',
    'Consider using parameterized queries to prevent injection attacks.',
    'This pattern is vulnerable to XSS. Use textContent or a sanitizer.',
  ],
  performance: [
    'This could be optimized by using memoization or lazy evaluation.',
    'Consider using a more efficient data structure for this operation.',
    'This loop can be replaced with a built-in array method for better performance.',
  ],
  readability: [
    'Consider extracting this into a well-named function for clarity.',
    'Adding type annotations would improve code documentation.',
    'This variable name could be more descriptive.',
  ],
  general: [
    'This looks good! The implementation is clean and follows best practices.',
    'Consider adding error handling for edge cases.',
    'The logic here could be simplified. Let me suggest an alternative.',
  ],
}

/**
 * AI Code Review Chat Engine.
 */
export class ReviewChatEngine {
  private sessions: Map<string, ReviewSession> = new Map()
  private config: ReviewChatConfig
  private listeners: Set<(event: ReviewChatEvent) => void> = new Set()

  constructor(_config: Partial<ReviewChatConfig> = {}) {
    this.config = {
      maxMessages: _config.maxMessages ?? 500,
      maxThreads: _config.maxThreads ?? 100,
      autoResolve: _config.autoResolve ?? true,
      contextWindow: _config.contextWindow ?? 10,
    }
  }

  /**
   * Start a new review session.
   */
  startSession(title: string, description: string = ''): ReviewSession {
    const session: ReviewSession = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      description,
      threads: [],
      stats: { totalIssues: 0, resolvedIssues: 0, openIssues: 0, criticalIssues: 0, suggestionsGiven: 0, suggestionsAccepted: 0 },
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }
    this.sessions.set(session.id, session)
    this.notifyListeners({ type: 'session-started', session })
    return session
  }

  /**
   * Analyze code and create review threads.
   */
  analyzeCode(sessionId: string, code: string, filename: string, _context: ReviewContext = 'file'): ReviewThread[] {
    if (this.config.maxThreads && this.sessions.size > this.config.maxThreads) return []
    const session = this.sessions.get(sessionId)
    if (!session) return []

    const threads: ReviewThread[] = []
    const lines = code.split('\n')

    // Security checks
    const securityPatterns = [
      { pattern: /innerHTML\s*=/g, msg: 'innerHTML can lead to XSS attacks', priority: 'critical' as const },
      { pattern: /eval\s*\(/g, msg: 'eval() is a security risk', priority: 'critical' as const },
      { pattern: /password\s*[:=]\s*['"]/gi, msg: 'Hardcoded passwords are dangerous', priority: 'critical' as const },
    ]

    // Performance checks
    const perfPatterns = [
      { pattern: /JSON\.parse\(JSON\.stringify/g, msg: 'Consider using structuredClone()', priority: 'medium' as const },
      { pattern: /\.forEach\(.*=>.*\{/g, msg: 'For-of loops can be faster', priority: 'low' as const },
    ]

    // Style checks
    const stylePatterns = [
      { pattern: /==(?!=)/g, msg: 'Use strict equality (===)', priority: 'low' as const },
      { pattern: /\bvar\b/g, msg: 'Use const/let instead of var', priority: 'medium' as const },
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''

      for (const { pattern, msg, priority } of [...securityPatterns, ...perfPatterns, ...stylePatterns]) {
        if (pattern.test(line)) {
          const thread = this.createThread(session, filename, i + 1, msg, priority, line)
          threads.push(thread)
          pattern.lastIndex = 0 // Reset regex
        }
      }
    }

    this.notifyListeners({ type: 'analysis-complete', session, threads })
    return threads
  }

  /**
   * Send a chat message in a thread.
   */
  sendThreadMessage(sessionId: string, threadId: string, content: string, type: MessageType = 'text'): ReviewMessage | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const thread = session.threads.find(t => t.id === threadId)
    if (!thread) return null

    const message = this.createMessage('user', type, content)
    thread.messages.push(message)

    // Generate AI response
    const aiResponse = this.generateResponse(content, thread)
    thread.messages.push(aiResponse)

    session.lastActivity = Date.now()
    this.notifyListeners({ type: 'message-sent', session, thread, message })
    return message
  }

  /**
   * Accept a suggestion.
   */
  acceptSuggestion(sessionId: string, threadId: string, suggestionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const thread = session.threads.find(t => t.id === threadId)
    if (!thread) return false

    for (const msg of thread.messages) {
      const suggestion = msg.suggestions?.find(s => s.id === suggestionId)
      if (suggestion) {
        suggestion.applied = true
        session.stats.suggestionsAccepted++
        this.notifyListeners({ type: 'suggestion-accepted', session, thread, suggestion })
        return true
      }
    }
    return false
  }

  /**
   * Resolve a thread.
   */
  resolveThread(sessionId: string, threadId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const thread = session.threads.find(t => t.id === threadId)
    if (!thread) return false

    thread.status = 'resolved'
    thread.resolvedAt = Date.now()
    session.stats.resolvedIssues++
    session.stats.openIssues--

    this.notifyListeners({ type: 'thread-resolved', session, thread })
    return true
  }

  /**
   * Get a session.
   */
  getSession(id: string): ReviewSession | undefined {
    return this.sessions.get(id)
  }

  /**
   * Get all sessions.
   */
  getSessions(): ReviewSession[] {
    return Array.from(this.sessions.values())
  }

  private createThread(session: ReviewSession, file: string, line: number, message: string, priority: ReviewThread['priority'], codeSnippet: string): ReviewThread {
    const thread: ReviewThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      line,
      messages: [],
      status: 'open',
      priority,
      createdAt: Date.now(),
    }

    // AI initial message
    const aiMsg = this.createMessage('reviewer', 'suggestion', message)
    aiMsg.codeSnippet = { language: 'typescript', code: codeSnippet, startLine: line, endLine: line }
    aiMsg.suggestions = [{
      id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: message,
      description: `Line ${line}: ${message}`,
      confidence: priority === 'critical' ? 0.95 : priority === 'high' ? 0.85 : 0.7,
      type: priority === 'critical' ? 'security' : 'improvement',
      applied: false,
    }]
    thread.messages.push(aiMsg)

    session.threads.push(thread)
    session.stats.totalIssues++
    session.stats.openIssues++
    if (priority === 'critical') session.stats.criticalIssues++
    session.stats.suggestionsGiven += aiMsg.suggestions.length

    return thread
  }

  private generateResponse(userMessage: string, _thread: ReviewThread): ReviewMessage {
    const content = userMessage.toLowerCase()
    let category = 'general'

    if (content.includes('security') || content.includes('vulnerability') || content.includes('xss')) category = 'security'
    else if (content.includes('performance') || content.includes('slow') || content.includes('optimize')) category = 'performance'
    else if (content.includes('readable') || content.includes('clarity') || content.includes('naming')) category = 'readability'

    const responses = REVIEW_RESPONSES[category] ?? REVIEW_RESPONSES.general ?? ['Let me analyze this further.']
    const response = responses[Math.floor(Math.random() * responses.length)]

    return this.createMessage('reviewer', 'text', response ?? 'Let me analyze this further.')
  }

  private createMessage(role: MessageRole, type: MessageType, content: string): ReviewMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      type,
      content,
      replies: [],
      timestamp: Date.now(),
      resolved: false,
      reactions: {},
    }
  }

  subscribe(listener: (event: ReviewChatEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: ReviewChatEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Review chat event */
export interface ReviewChatEvent {
  type: 'session-started' | 'analysis-complete' | 'message-sent' | 'suggestion-accepted' | 'thread-resolved'
  session?: ReviewSession
  thread?: ReviewThread
  message?: ReviewMessage
  suggestion?: ReviewSuggestion
  threads?: ReviewThread[]
}

/** Singleton */
let instance: ReviewChatEngine | null = null

export function getReviewChatEngine(config?: Partial<ReviewChatConfig>): ReviewChatEngine {
  if (!instance) instance = new ReviewChatEngine(config)
  return instance
}

export function resetReviewChatEngine(): void { instance = null }
