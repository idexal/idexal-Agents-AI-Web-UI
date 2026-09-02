/**
 * Real-time Collaboration Engine for Idexal Agents Team Chat.
 * Provides presence tracking, live cursors, reactions, channels, threads, and mentions.
 */

/** User presence status */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

/** Collaborator user */
export interface CollabUser {
  id: string
  name: string
  avatar: string | undefined
  status: PresenceStatus
  lastSeen: Date
  cursor: CursorPosition | undefined
  isTyping: boolean
  typingChannel: string | undefined
  metadata: Record<string, unknown>
}

/** Cursor position in the editor */
export interface CursorPosition {
  line: number
  column: number
  selection: { start: number; end: number } | undefined
  elementId: string | undefined
}

/** Chat channel */
export interface Channel {
  id: string
  name: string
  description: string | undefined
  type: 'public' | 'private' | 'direct'
  members: string[]
  createdBy: string
  createdAt: Date
  lastMessage: Message | undefined
  unreadCount: number
  isPinned: boolean
  topic: string | undefined
}

/** Chat message */
export interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  timestamp: Date
  editedAt: Date | undefined
  replyTo: string | undefined
  threadId: string | undefined
  reactions: Reaction[]
  mentions: string[]
  attachments: Attachment[]
  isDeleted: boolean
  isPinned: boolean
  readBy: string[]
}

/** Message reaction */
export interface Reaction {
  emoji: string
  users: string[]
  timestamp: Date
}

/** Message attachment */
export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail: string | undefined
}

/** Thread */
export interface Thread {
  id: string
  parentMessageId: string
  channelId: string
  participants: string[]
  messageCount: number
  lastActivity: Date
  isResolved: boolean
}

/** Collaboration event types */
export type CollabEventType =
  | 'user-joined'
  | 'user-left'
  | 'user-status-changed'
  | 'cursor-moved'
  | 'typing-started'
  | 'typing-stopped'
  | 'message-sent'
  | 'message-edited'
  | 'message-deleted'
  | 'reaction-added'
  | 'reaction-removed'
  | 'channel-created'
  | 'channel-updated'
  | 'thread-created'
  | 'mention'

/** Collaboration event */
export interface CollabEvent {
  type: CollabEventType
  userId: string
  channelId: string
  data: Record<string, unknown>
  timestamp: Date
}

/** Collaboration configuration */
export interface CollabConfig {
  /** Enable real-time collaboration */
  enabled: boolean
  /** User ID for this client */
  userId: string
  /** User name */
  userName: string
  /** User avatar URL */
  userAvatar: string | undefined
  /** Presence update interval (ms) */
  presenceInterval: number
  /** Typing indicator timeout (ms) */
  typingTimeout: number
  /** Cursor broadcast interval (ms) */
  cursorInterval: number
  /** Max message history per channel */
  maxHistory: number
  /** Enable read receipts */
  enableReadReceipts: boolean
  /** Enable typing indicators */
  enableTypingIndicators: boolean
  /** Enable reactions */
  enableReactions: boolean
  /** Enable threads */
  enableThreads: boolean
  /** Callbacks */
  onEvent: ((event: CollabEvent) => void) | undefined
  onPresenceChange: ((users: CollabUser[]) => void) | undefined
  onMessage: ((message: Message) => void) | undefined
}

/** Collaboration state */
export interface CollabState {
  /** Current user */
  currentUser: CollabUser
  /** Online users */
  onlineUsers: Map<string, CollabUser>
  /** Channels */
  channels: Map<string, Channel>
  /** Messages by channel */
  messages: Map<string, Message[]>
  /** Threads */
  threads: Map<string, Thread>
  /** Active channel */
  activeChannel: string | undefined
  /** Is connected */
  isConnected: boolean
}

/**
 * Real-time Collaboration Engine.
 */
export class RealtimeCollaborationEngine {
  private config: CollabConfig
  private state: CollabState
  private presenceTimer: ReturnType<typeof setInterval> | null = null
  private typingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private cursorTimer: ReturnType<typeof setInterval> | null = null
  private eventListeners: Set<(event: CollabEvent) => void> = new Set()
  private stateListeners: Set<(state: CollabState) => void> = new Set()

  constructor(config: Partial<CollabConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      userId: config.userId ?? `user-${Date.now()}`,
      userName: config.userName ?? 'Anonymous',
      userAvatar: config.userAvatar,
      presenceInterval: config.presenceInterval ?? 30000,
      typingTimeout: config.typingTimeout ?? 3000,
      cursorInterval: config.cursorInterval ?? 100,
      maxHistory: config.maxHistory ?? 100,
      enableReadReceipts: config.enableReadReceipts ?? true,
      enableTypingIndicators: config.enableTypingIndicators ?? true,
      enableReactions: config.enableReactions ?? true,
      enableThreads: config.enableThreads ?? true,
      onEvent: config.onEvent,
      onPresenceChange: config.onPresenceChange,
      onMessage: config.onMessage,
    }

    this.state = {
      currentUser: {
        id: this.config.userId,
        name: this.config.userName,
        avatar: this.config.userAvatar,
        status: 'online',
        lastSeen: new Date(),
        cursor: undefined,
        isTyping: false,
        typingChannel: undefined,
        metadata: {},
      },
      onlineUsers: new Map(),
      channels: new Map(),
      messages: new Map(),
      threads: new Map(),
      activeChannel: undefined,
      isConnected: true,
    }

    // Create default general channel
    this.createChannel({
      id: 'general',
      name: 'General',
      description: 'General discussion channel',
      type: 'public',
      members: [this.config.userId],
      createdBy: this.config.userId,
    })

    if (this.config.enabled) {
      this.startPresenceUpdates()
      this.startCursorBroadcast()
    }
  }

  // === Channel Management ===

  /**
   * Create a new channel.
   */
  createChannel(data: Partial<Channel>): Channel {
    const channel: Channel = {
      id: data.id ?? `ch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: data.name ?? 'New Channel',
      description: data.description,
      type: data.type ?? 'public',
      members: data.members ?? [this.config.userId],
      createdBy: data.createdBy ?? this.config.userId,
      createdAt: new Date(),
      lastMessage: undefined,
      unreadCount: 0,
      isPinned: false,
      topic: data.topic,
    }

    this.state.channels.set(channel.id, channel)
    this.state.messages.set(channel.id, [])

    this.emitEvent({
      type: 'channel-created',
      userId: this.config.userId,
      channelId: channel.id,
      data: { channel },
      timestamp: new Date(),
    })

    this.notifyStateListeners()
    return channel
  }

  /**
   * Join a channel.
   */
  joinChannel(channelId: string): boolean {
    const channel = this.state.channels.get(channelId)
    if (!channel) return false

    if (!channel.members.includes(this.config.userId)) {
      channel.members.push(this.config.userId)
    }

    this.state.activeChannel = channelId
    this.notifyStateListeners()
    return true
  }

  /**
   * Leave a channel.
   */
  leaveChannel(channelId: string): void {
    const channel = this.state.channels.get(channelId)
    if (!channel) return

    channel.members = channel.members.filter(m => m !== this.config.userId)

    if (this.state.activeChannel === channelId) {
      this.state.activeChannel = undefined
    }

    this.notifyStateListeners()
  }

  /**
   * Get user channels.
   */
  getUserChannels(): Channel[] {
    return Array.from(this.state.channels.values())
      .filter(ch => ch.members.includes(this.config.userId))
  }

  // === Message Management ===

  /**
   * Send a message.
   */
  sendMessage(channelId: string, content: string, options: Partial<Message> = {}): Message {
    const message: Message = {
      id: options.id ?? `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      channelId,
      userId: this.config.userId,
      content,
      timestamp: new Date(),
      editedAt: undefined,
      replyTo: options.replyTo,
      threadId: options.threadId,
      reactions: [],
      mentions: this.extractMentions(content),
      attachments: options.attachments ?? [],
      isDeleted: false,
      isPinned: false,
      readBy: [this.config.userId],
    }

    const messages = this.state.messages.get(channelId) ?? []
    messages.push(message)
    this.state.messages.set(channelId, messages)

    // Update channel last message
    const channel = this.state.channels.get(channelId)
    if (channel) {
      channel.lastMessage = message
    }

    // Handle mentions
    if (message.mentions.length > 0) {
      this.emitEvent({
        type: 'mention',
        userId: this.config.userId,
        channelId,
        data: { message, mentions: message.mentions },
        timestamp: new Date(),
      })
    }

    // Handle threads
    if (options.threadId) {
      const thread = this.state.threads.get(options.threadId)
      if (thread) {
        thread.messageCount++
        thread.lastActivity = new Date()
        if (!thread.participants.includes(this.config.userId)) {
          thread.participants.push(this.config.userId)
        }
      }
    }

    this.emitEvent({
      type: 'message-sent',
      userId: this.config.userId,
      channelId,
      data: { message },
      timestamp: new Date(),
    })

    this.config.onMessage?.(message)
    this.notifyStateListeners()
    return message
  }

  /**
   * Edit a message.
   */
  editMessage(messageId: string, channelId: string, newContent: string): boolean {
    const messages = this.state.messages.get(channelId)
    if (!messages) return false

    const message = messages.find(m => m.id === messageId && m.userId === this.config.userId)
    if (!message) return false

    message.content = newContent
    message.editedAt = new Date()
    message.mentions = this.extractMentions(newContent)

    this.emitEvent({
      type: 'message-edited',
      userId: this.config.userId,
      channelId,
      data: { message },
      timestamp: new Date(),
    })

    this.notifyStateListeners()
    return true
  }

  /**
   * Delete a message.
   */
  deleteMessage(messageId: string, channelId: string): boolean {
    const messages = this.state.messages.get(channelId)
    if (!messages) return false

    const message = messages.find(m => m.id === messageId && m.userId === this.config.userId)
    if (!message) return false

    message.isDeleted = true
    message.content = 'This message was deleted'

    this.emitEvent({
      type: 'message-deleted',
      userId: this.config.userId,
      channelId,
      data: { messageId },
      timestamp: new Date(),
    })

    this.notifyStateListeners()
    return true
  }

  /**
   * Get channel messages.
   */
  getMessages(channelId: string, limit: number = 50): Message[] {
    const messages = this.state.messages.get(channelId) ?? []
    return messages.slice(-limit)
  }

  // === Reactions ===

  /**
   * Add a reaction to a message.
   */
  addReaction(messageId: string, channelId: string, emoji: string): boolean {
    if (!this.config.enableReactions) return false

    const messages = this.state.messages.get(channelId)
    if (!messages) return false

    const message = messages.find(m => m.id === messageId)
    if (!message) return false

    const existingReaction = message.reactions.find(r => r.emoji === emoji)
    if (existingReaction) {
      if (!existingReaction.users.includes(this.config.userId)) {
        existingReaction.users.push(this.config.userId)
      }
    } else {
      message.reactions.push({
        emoji,
        users: [this.config.userId],
        timestamp: new Date(),
      })
    }

    this.emitEvent({
      type: 'reaction-added',
      userId: this.config.userId,
      channelId,
      data: { messageId, emoji },
      timestamp: new Date(),
    })

    this.notifyStateListeners()
    return true
  }

  /**
   * Remove a reaction from a message.
   */
  removeReaction(messageId: string, channelId: string, emoji: string): boolean {
    if (!this.config.enableReactions) return false

    const messages = this.state.messages.get(channelId)
    if (!messages) return false

    const message = messages.find(m => m.id === messageId)
    if (!message) return false

    const reaction = message.reactions.find(r => r.emoji === emoji)
    if (!reaction) return false

    reaction.users = reaction.users.filter(u => u !== this.config.userId)
    if (reaction.users.length === 0) {
      message.reactions = message.reactions.filter(r => r.emoji !== emoji)
    }

    this.emitEvent({
      type: 'reaction-removed',
      userId: this.config.userId,
      channelId,
      data: { messageId, emoji },
      timestamp: new Date(),
    })

    this.notifyStateListeners()
    return true
  }

  // === Threads ===

  /**
   * Create a thread from a message.
   */
  createThread(messageId: string, channelId: string): Thread | undefined {
    if (!this.config.enableThreads) return undefined

    const messages = this.state.messages.get(channelId)
    if (!messages) return undefined

    const parentMessage = messages.find(m => m.id === messageId)
    if (!parentMessage) return undefined

    const thread: Thread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      parentMessageId: messageId,
      channelId,
      participants: [this.config.userId],
      messageCount: 0,
      lastActivity: new Date(),
      isResolved: false,
    }

    this.state.threads.set(thread.id, thread)
    parentMessage.threadId = thread.id

    this.emitEvent({
      type: 'thread-created',
      userId: this.config.userId,
      channelId,
      data: { thread, parentMessageId: messageId },
      timestamp: new Date(),
    })

    this.notifyStateListeners()
    return thread
  }

  /**
   * Get thread messages.
   */
  getThreadMessages(threadId: string): Message[] {
    const thread = this.state.threads.get(threadId)
    if (!thread) return []

    const messages = this.state.messages.get(thread.channelId) ?? []
    return messages.filter(m => m.threadId === threadId)
  }

  // === Presence ===

  /**
   * Update user presence.
   */
  updatePresence(status: PresenceStatus): void {
    this.state.currentUser.status = status
    this.state.currentUser.lastSeen = new Date()

    this.emitEvent({
      type: 'user-status-changed',
      userId: this.config.userId,
      channelId: this.state.activeChannel ?? '',
      data: { status },
      timestamp: new Date(),
    })

    this.notifyStateListeners()
  }

  /**
   * Get online users.
   */
  getOnlineUsers(): CollabUser[] {
    return Array.from(this.state.onlineUsers.values())
      .filter(u => u.status !== 'offline')
  }

  /**
   * Get channel members with presence.
   */
  getChannelMembers(channelId: string): CollabUser[] {
    const channel = this.state.channels.get(channelId)
    if (!channel) return []

    const members: CollabUser[] = []
    for (const memberId of channel.members) {
      if (memberId === this.config.userId) {
        members.push(this.state.currentUser)
      } else {
        const user = this.state.onlineUsers.get(memberId)
        if (user) {
          members.push(user)
        }
      }
    }
    return members
  }

  // === Typing Indicators ===

  /**
   * Start typing indicator.
   */
  startTyping(channelId: string): void {
    if (!this.config.enableTypingIndicators) return

    this.state.currentUser.isTyping = true
    this.state.currentUser.typingChannel = channelId

    this.emitEvent({
      type: 'typing-started',
      userId: this.config.userId,
      channelId,
      data: {},
      timestamp: new Date(),
    })

    // Auto-stop typing after timeout
    const existingTimer = this.typingTimers.get(this.config.userId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      this.stopTyping()
    }, this.config.typingTimeout)

    this.typingTimers.set(this.config.userId, timer)
    this.notifyStateListeners()
  }

  /**
   * Stop typing indicator.
   */
  stopTyping(): void {
    this.state.currentUser.isTyping = false
    this.state.currentUser.typingChannel = undefined

    const timer = this.typingTimers.get(this.config.userId)
    if (timer) {
      clearTimeout(timer)
      this.typingTimers.delete(this.config.userId)
    }

    this.emitEvent({
      type: 'typing-stopped',
      userId: this.config.userId,
      channelId: this.state.activeChannel ?? '',
      data: {},
      timestamp: new Date(),
    })

    this.notifyStateListeners()
  }

  /**
   * Get typing users in a channel.
   */
  getTypingUsers(channelId: string): CollabUser[] {
    return Array.from(this.state.onlineUsers.values())
      .filter(u => u.isTyping && u.typingChannel === channelId && u.id !== this.config.userId)
  }

  // === Cursors ===

  /**
   * Update cursor position.
   */
  updateCursor(position: CursorPosition): void {
    this.state.currentUser.cursor = position

    this.emitEvent({
      type: 'cursor-moved',
      userId: this.config.userId,
      channelId: this.state.activeChannel ?? '',
      data: { position },
      timestamp: new Date(),
    })
  }

  /**
   * Get user cursors in a channel.
   */
  getUserCursors(_channelId: string): Map<string, CursorPosition> {
    const cursors = new Map<string, CursorPosition>()

    for (const [userId, user] of this.state.onlineUsers) {
      if (user.cursor && userId !== this.config.userId) {
        cursors.set(userId, user.cursor)
      }
    }

    return cursors
  }

  // === State Management ===

  /**
   * Get current state.
   */
  getState(): Readonly<CollabState> {
    return this.state
  }

  /**
   * Get active channel.
   */
  getActiveChannel(): Channel | undefined {
    if (!this.state.activeChannel) return undefined
    return this.state.channels.get(this.state.activeChannel)
  }

  /**
   * Subscribe to events.
   */
  onEvent(listener: (event: CollabEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => {
      this.eventListeners.delete(listener)
    }
  }

  /**
   * Subscribe to state changes.
   */
  onStateChange(listener: (state: CollabState) => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Destroy the engine.
   */
  destroy(): void {
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer)
    }
    if (this.cursorTimer) {
      clearInterval(this.cursorTimer)
    }
    for (const timer of this.typingTimers.values()) {
      clearTimeout(timer)
    }
    this.typingTimers.clear()
    this.eventListeners.clear()
    this.stateListeners.clear()
  }

  // === Private Methods ===

  private startPresenceUpdates(): void {
    this.presenceTimer = setInterval(() => {
      this.state.currentUser.lastSeen = new Date()

      // Simulate other users joining/leaving
      this.simulatePresenceChanges()

      this.config.onPresenceChange?.(this.getOnlineUsers())
    }, this.config.presenceInterval)
  }

  private startCursorBroadcast(): void {
    this.cursorTimer = setInterval(() => {
      // Broadcast cursor position to other users
      if (this.state.currentUser.cursor) {
        this.updateCursor(this.state.currentUser.cursor)
      }
    }, this.config.cursorInterval)
  }

  private simulatePresenceChanges(): void {
    // Simulate random user status changes for demo
    const statuses: PresenceStatus[] = ['online', 'away', 'busy']

    for (const [, user] of this.state.onlineUsers) {
      if (Math.random() > 0.9) {
        user.status = statuses[Math.floor(Math.random() * statuses.length)]!
        user.lastSeen = new Date()
      }
    }
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[1]) {
        mentions.push(match[1])
      }
    }

    return mentions
  }

  private emitEvent(event: CollabEvent): void {
    this.config.onEvent?.(event)

    for (const listener of this.eventListeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Collab event listener error:', error)
      }
    }
  }

  private notifyStateListeners(): void {
    for (const listener of this.stateListeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Collab state listener error:', error)
      }
    }
  }
}

/**
 * Singleton instance.
 */
let instance: RealtimeCollaborationEngine | null = null

export function getCollaborationEngine(
  config?: Partial<CollabConfig>
): RealtimeCollaborationEngine {
  if (!instance) {
    instance = new RealtimeCollaborationEngine(config)
  }
  return instance
}

/**
 * Common emoji reactions.
 */
export const QUICK_REACTIONS = [
  '\u{1F44D}', // thumbs up
  '\u{1F44E}', // thumbs down
  '\u{2764}\u{FE0F}', // heart
  '\u{1F602}', // laughing
  '\u{1F62E}', // surprised
  '\u{1F4AF}', // 100
  '\u{1F525}', // fire
  '\u{1F389}', // party
  '\u{1F440}', // eyes
  '\u{1F64F}', // pray
]

/**
 * Format timestamp for messages.
 */
export function formatMessageTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}

/**
 * Format presence status.
 */
export function formatPresenceStatus(status: PresenceStatus): string {
  switch (status) {
    case 'online': return 'Online'
    case 'away': return 'Away'
    case 'busy': return 'Do Not Disturb'
    case 'offline': return 'Offline'
    default: return 'Unknown'
  }
}

/**
 * Get presence status color.
 */
export function getPresenceColor(status: PresenceStatus): string {
  switch (status) {
    case 'online': return '#10b981'
    case 'away': return '#f59e0b'
    case 'busy': return '#ef4444'
    case 'offline': return '#6b7280'
    default: return '#6b7280'
  }
}
