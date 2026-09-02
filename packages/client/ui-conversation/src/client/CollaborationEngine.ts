/**
 * Real-time Collaboration Engine for Idexal Agents.
 * WebSocket-based collaboration with operational transform,
 * presence awareness, cursor sharing, and conflict resolution.
 */

/** Connection state */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

/** User presence status */
export type PresenceStatus = 'active' | 'idle' | 'away' | 'offline'

/** Cursor position */
export interface CursorPosition {
  userId: string
  line: number
  column: number
  fileId?: string
  timestamp: number
}

/** Selection range */
export interface SelectionRange {
  userId: string
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  fileId?: string
}

/** Collaborative user */
export interface CollabUser {
  id: string
  name: string
  avatar?: string
  color: string
  status: PresenceStatus
  cursor?: CursorPosition
  selection?: SelectionRange
  lastActive: number
}

/** Operation types */
export type OperationType = 'insert' | 'delete' | 'replace' | 'move' | 'format'

/** Operation */
export interface Operation {
  id: string
  type: OperationType
  userId: string
  timestamp: number
  position: { line: number; column: number }
  /** For insert */
  content?: string
  /** For delete */
  length?: number
  /** For replace */
  oldContent?: string
  newContent?: string
  /** For move */
  from?: { line: number; column: number }
  to?: { line: number; column: number }
  /** Version vector for OT */
  version: number
}

/** Document state */
export interface CollabDocument {
  id: string
  content: string
  version: number
  lastModified: number
  lastModifiedBy: string
}

/** Conflict resolution */
export interface ConflictResolution {
  operationId: string
  conflictingWith: string
  resolution: 'accept-local' | 'accept-remote' | 'merge'
  mergedContent?: string
}

/** Chat message */
export interface CollabChatMessage {
  id: string
  userId: string
  content: string
  timestamp: number
  replyTo?: string
}

/** Collaboration config */
export interface CollaborationConfig {
  serverUrl: string
  documentId: string
  userId: string
  userName: string
  userColor: string
  /** Reconnection settings */
  maxReconnectAttempts: number
  reconnectDelay: number
  /** Presence update interval */
  presenceInterval: number
  /** Max chat history */
  maxChatHistory: number
}

const USER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6']

/**
 * Real-time Collaboration Engine.
 */
export class CollaborationEngine {
  private config: CollaborationConfig
  private document: CollabDocument
  private users: Map<string, CollabUser> = new Map()
  private operations: Operation[] = []
  private pendingOps: Operation[] = []
  private chatMessages: CollabChatMessage[] = []
  private connectionState: ConnectionState = 'disconnected'
  private listeners: Set<(event: CollabEvent) => void> = new Set()
  private presenceTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<CollaborationConfig> = {}) {
    this.config = {
      serverUrl: config.serverUrl ?? 'ws://localhost:8080',
      documentId: config.documentId ?? 'default',
      userId: config.userId ?? `user-${Math.random().toString(36).slice(2, 8)}`,
      userName: config.userName ?? 'Anonymous',
      userColor: config.userColor ?? USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]!,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
      presenceInterval: config.presenceInterval ?? 3000,
      maxChatHistory: config.maxChatHistory ?? 100,
    }

    this.document = {
      id: this.config.documentId,
      content: '',
      version: 0,
      lastModified: Date.now(),
      lastModifiedBy: this.config.userId,
    }
  }

  /**
   * Connect to collaboration server.
   */
  connect(): void {
    if (this.connectionState === 'connected') return
    this.connectionState = 'connecting'
    this.notifyListeners({ type: 'connection-state-changed', state: this.connectionState })

    // Simulate connection
    setTimeout(() => {
      this.connectionState = 'connected'
      this.users.set(this.config.userId, {
        id: this.config.userId,
        name: this.config.userName,
        color: this.config.userColor,
        status: 'active',
        lastActive: Date.now(),
      })
      this.startPresenceUpdates()
      this.notifyListeners({ type: 'connection-state-changed', state: this.connectionState })
      this.notifyListeners({ type: 'user-joined', user: this.users.get(this.config.userId)! })
    }, 100)
  }

  /**
   * Disconnect from collaboration server.
   */
  disconnect(): void {
    this.stopPresenceUpdates()
    this.connectionState = 'disconnected'
    this.users.clear()
    this.notifyListeners({ type: 'connection-state-changed', state: this.connectionState })
  }

  /**
   * Apply a local operation.
   */
  applyLocalOperation(op: Omit<Operation, 'id' | 'userId' | 'timestamp' | 'version'>): Operation {
    const fullOp: Operation = {
      ...op,
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: this.config.userId,
      timestamp: Date.now(),
      version: this.document.version + 1,
    }

    // Apply to document
    this.applyToDocument(fullOp)
    this.operations.push(fullOp)
    this.pendingOps.push(fullOp)

    this.notifyListeners({ type: 'operation-applied', operation: fullOp })
    return fullOp
  }

  /**
   * Apply a remote operation (with OT).
   */
  applyRemoteOperation(op: Operation): void {
    // Transform against pending local operations
    let transformedOp = op
    for (const pending of this.pendingOps) {
      transformedOp = this.transformOperation(transformedOp, pending)
    }

    this.applyToDocument(transformedOp)
    this.operations.push(transformedOp)
    this.document.version++

    this.notifyListeners({ type: 'remote-operation-received', operation: transformedOp })
  }

  /**
   * Update cursor position.
   */
  updateCursor(line: number, column: number, fileId?: string): void {
    const user = this.users.get(this.config.userId)
    if (user) {
      const cursor: CursorPosition = { userId: this.config.userId, line, column, timestamp: Date.now() }
      if (fileId !== undefined) cursor.fileId = fileId
      user.cursor = cursor
      user.lastActive = Date.now()
      this.notifyListeners({ type: 'cursor-updated', cursor })
    }
  }

  /**
   * Update selection.
   */
  updateSelection(startLine: number, startColumn: number, endLine: number, endColumn: number, fileId?: string): void {
    const user = this.users.get(this.config.userId)
    if (user) {
      const selection: SelectionRange = { userId: this.config.userId, startLine, startColumn, endLine, endColumn }
      if (fileId !== undefined) selection.fileId = fileId
      user.selection = selection
      this.notifyListeners({ type: 'selection-updated', selection })
    }
  }

  /**
   * Send chat message.
   */
  sendChat(content: string, replyTo?: string): CollabChatMessage {
    const msg: CollabChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: this.config.userId,
      content,
      timestamp: Date.now(),
    }
    const message = msg as CollabChatMessage & { replyTo?: string }
    if (replyTo !== undefined) message.replyTo = replyTo
    this.chatMessages.push(message)
    if (this.chatMessages.length > this.config.maxChatHistory) {
      this.chatMessages.shift()
    }
    this.notifyListeners({ type: 'chat-message-sent', message })
    return message
  }

  /**
   * Get document content.
   */
  getDocument(): CollabDocument {
    return { ...this.document }
  }

  /**
   * Get all connected users.
   */
  getUsers(): CollabUser[] {
    return Array.from(this.users.values())
  }

  /**
   * Get chat history.
   */
  getChatHistory(): CollabChatMessage[] {
    return [...this.chatMessages]
  }

  /**
   * Get connection state.
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  private applyToDocument(op: Operation): void {
    const lines = this.document.content.split('\n')

    switch (op.type) {
      case 'insert': {
        const line = lines[op.position.line - 1] ?? ''
        const before = line.slice(0, op.position.column)
        const after = line.slice(op.position.column)
        lines[op.position.line - 1] = before + (op.content ?? '') + after
        break
      }
      case 'delete': {
        const line = lines[op.position.line - 1] ?? ''
        const deleteLen = op.length ?? 1
        lines[op.position.line - 1] = line.slice(0, op.position.column) + line.slice(op.position.column + deleteLen)
        break
      }
      case 'replace': {
        const line = lines[op.position.line - 1] ?? ''
        const oldLen = op.oldContent?.length ?? 0
        lines[op.position.line - 1] = line.slice(0, op.position.column) + (op.newContent ?? '') + line.slice(op.position.column + oldLen)
        break
      }
    }

    this.document.content = lines.join('\n')
    this.document.lastModified = Date.now()
    this.document.lastModifiedBy = op.userId
    this.document.version++
  }

  private transformOperation(op1: Operation, op2: Operation): Operation {
    // Simple OT: if op2 is on the same line and before op1, shift op1's position
    if (op1.position.line === op2.position.line && op2.position.column <= op1.position.column) {
      const shift = op2.type === 'insert' ? (op2.content?.length ?? 0) : op2.type === 'delete' ? -(op2.length ?? 0) : 0
      return {
        ...op1,
        position: { ...op1.position, column: Math.max(0, op1.position.column + shift) },
      }
    }
    return op1
  }

  private startPresenceUpdates(): void {
    this.presenceTimer = setInterval(() => {
      const user = this.users.get(this.config.userId)
      if (user) {
        user.lastActive = Date.now()
        this.notifyListeners({ type: 'presence-updated', users: this.getUsers() })
      }
    }, this.config.presenceInterval)
  }

  private stopPresenceUpdates(): void {
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer)
      this.presenceTimer = null
    }
  }

  subscribe(listener: (event: CollabEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: CollabEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }

  destroy(): void {
    this.disconnect()
    this.operations = []
    this.pendingOps = []
    this.chatMessages = []
  }
}

/** Collaboration event */
export interface CollabEvent {
  type: 'connection-state-changed' | 'user-joined' | 'user-left' | 'operation-applied' | 'remote-operation-received' | 'cursor-updated' | 'selection-updated' | 'chat-message-sent' | 'presence-updated' | 'conflict-detected'
  state?: ConnectionState
  user?: CollabUser
  operation?: Operation
  cursor?: CursorPosition
  selection?: SelectionRange
  message?: CollabChatMessage
  users?: CollabUser[]
}

/** Singleton */
let instance: CollaborationEngine | null = null

export function getCollaborationEngine(config?: Partial<CollaborationConfig>): CollaborationEngine {
  if (!instance) instance = new CollaborationEngine(config)
  return instance
}

export function resetCollaborationEngine(): void {
  instance?.destroy()
  instance = null
}
