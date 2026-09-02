/**
 * Task Collaboration Engine for Idexal Agents.
 * Provides real-time team task management with assignments, comments, activity feed, and notifications.
 */



/** Task collaborator */
export interface TaskCollaborator {
  id: string
  name: string
  avatar: string | undefined
  role: 'owner' | 'assignee' | 'viewer'
  status: 'online' | 'away' | 'offline'
  lastSeen: Date
}

/** Task comment */
export interface TaskComment {
  id: string
  taskId: string
  userId: string
  content: string
  timestamp: Date
  editedAt: Date | undefined
  mentions: string[]
  reactions: TaskReaction[]
  isDeleted: boolean
}

/** Task reaction */
export interface TaskReaction {
  emoji: string
  users: string[]
  timestamp: Date
}

/** Task activity entry */
export interface TaskActivity {
  id: string
  taskId: string
  userId: string
  action: TaskAction
  details: TaskActionDetails
  timestamp: Date
}

/** Task action types */
export type TaskAction =
  | 'created'
  | 'updated'
  | 'status-changed'
  | 'priority-changed'
  | 'assigned'
  | 'unassigned'
  | 'commented'
  | 'due-date-changed'
  | 'tag-added'
  | 'tag-removed'
  | 'completed'

/** Task action details */
export interface TaskActionDetails {
  field?: string
  oldValue?: string
  newValue?: string
  message?: string
}

/** Task notification */
export interface TaskNotification {
  id: string
  taskId: string
  userId: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

/** Notification types */
export type NotificationType =
  | 'assignment'
  | 'mention'
  | 'comment'
  | 'status-change'
  | 'due-date'
  | 'reminder'

/** Task collaboration event types */
export type TaskCollabEventType =
  | 'task-updated'
  | 'task-assigned'
  | 'task-commented'
  | 'task-activity'
  | 'notification'

/** Task collaboration event */
export interface TaskCollabEvent {
  type: TaskCollabEventType
  taskId: string
  userId: string
  data: Record<string, unknown>
  timestamp: Date
}

/** Task collaboration configuration */
export interface TaskCollabConfig {
  enabled: boolean
  userId: string
  userName: string
  userAvatar: string | undefined
  enableComments: boolean
  enableActivityFeed: boolean
  enableNotifications: boolean
  maxComments: number
  maxActivity: number
  onEvent: ((event: TaskCollabEvent) => void) | undefined
}

/** Task collaboration state */
export interface TaskCollabState {
  collaborators: Map<string, TaskCollaborator>
  comments: Map<string, TaskComment[]>
  activity: Map<string, TaskActivity[]>
  notifications: TaskNotification[]
  onlineUsers: Set<string>
}

/**
 * Task Collaboration Engine.
 */
export class TaskCollaborationEngine {
  private config: TaskCollabConfig
  private state: TaskCollabState
  private eventListeners = new Set<(event: TaskCollabEvent) => void>()
  private stateListeners = new Set<() => void>()

  constructor(config: Partial<TaskCollabConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      userId: config.userId ?? `user-${Date.now()}`,
      userName: config.userName ?? 'Anonymous',
      userAvatar: config.userAvatar,
      enableComments: config.enableComments ?? true,
      enableActivityFeed: config.enableActivityFeed ?? true,
      enableNotifications: config.enableNotifications ?? true,
      maxComments: config.maxComments ?? 100,
      maxActivity: config.maxActivity ?? 50,
      onEvent: config.onEvent,
    }

    this.state = {
      collaborators: new Map(),
      comments: new Map(),
      activity: new Map(),
      notifications: [],
      onlineUsers: new Set(),
    }

    // Add current user as collaborator
    this.state.collaborators.set(this.config.userId, {
      id: this.config.userId,
      name: this.config.userName,
      avatar: this.config.userAvatar,
      role: 'owner',
      status: 'online',
      lastSeen: new Date(),
    })
  }

  // === Task Comments ===

  /** Add a comment to a task */
  addComment(taskId: string, content: string): TaskComment | undefined {
    if (!this.config.enableComments) return undefined

    const comment: TaskComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId,
      userId: this.config.userId,
      content,
      timestamp: new Date(),
      editedAt: undefined,
      mentions: this.extractMentions(content),
      reactions: [],
      isDeleted: false,
    }

    const comments = this.state.comments.get(taskId) ?? []
    comments.push(comment)
    if (comments.length > this.config.maxComments) {
      comments.shift()
    }
    this.state.comments.set(taskId, comments)

    // Add activity
    this.addActivity(taskId, 'commented', { message: content.substring(0, 100) })

    // Notify mentioned users
    if (comment.mentions.length > 0) {
      this.notifyMentionedUsers(taskId, comment.mentions, content)
    }

    this.emitEvent({ type: 'task-commented', taskId, userId: this.config.userId, data: { comment }, timestamp: new Date() })
    this.notifyStateListeners()
    return comment
  }

  /** Get comments for a task */
  getComments(taskId: string): TaskComment[] {
    return this.state.comments.get(taskId) ?? []
  }

  /** Edit a comment */
  editComment(taskId: string, commentId: string, newContent: string): boolean {
    const comments = this.state.comments.get(taskId)
    if (!comments) return false

    const comment = comments.find(c => c.id === commentId && c.userId === this.config.userId)
    if (!comment) return false

    comment.content = newContent
    comment.editedAt = new Date()
    comment.mentions = this.extractMentions(newContent)

    this.notifyStateListeners()
    return true
  }

  /** Delete a comment */
  deleteComment(taskId: string, commentId: string): boolean {
    const comments = this.state.comments.get(taskId)
    if (!comments) return false

    const comment = comments.find(c => c.id === commentId && c.userId === this.config.userId)
    if (!comment) return false

    comment.isDeleted = true
    comment.content = 'This comment was deleted'

    this.notifyStateListeners()
    return true
  }

  /** Add reaction to a comment */
  addCommentReaction(taskId: string, commentId: string, emoji: string): boolean {
    const comments = this.state.comments.get(taskId)
    if (!comments) return false

    const comment = comments.find(c => c.id === commentId)
    if (!comment) return false

    const existingReaction = comment.reactions.find(r => r.emoji === emoji)
    if (existingReaction) {
      if (!existingReaction.users.includes(this.config.userId)) {
        existingReaction.users.push(this.config.userId)
      }
    } else {
      comment.reactions.push({ emoji, users: [this.config.userId], timestamp: new Date() })
    }

    this.notifyStateListeners()
    return true
  }

  // === Task Activity Feed ===

  /** Add an activity entry */
  addActivity(taskId: string, action: TaskAction, details: TaskActionDetails = {}): TaskActivity | undefined {
    if (!this.config.enableActivityFeed) return undefined

    const activity: TaskActivity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId,
      userId: this.config.userId,
      action,
      details,
      timestamp: new Date(),
    }

    const activities = this.state.activity.get(taskId) ?? []
    activities.unshift(activity)
    if (activities.length > this.config.maxActivity) {
      activities.pop()
    }
    this.state.activity.set(taskId, activities)

    this.emitEvent({ type: 'task-activity', taskId, userId: this.config.userId, data: { activity }, timestamp: new Date() })
    this.notifyStateListeners()
    return activity
  }

  /** Get activity for a task */
  getActivity(taskId: string, limit: number = 20): TaskActivity[] {
    return (this.state.activity.get(taskId) ?? []).slice(0, limit)
  }

  /** Track task changes */
  trackTaskUpdate(taskId: string, field: string, oldValue: string, newValue: string): void {
    const action: TaskAction = field === 'status' ? 'status-changed'
      : field === 'priority' ? 'priority-changed'
      : field === 'dueDate' ? 'due-date-changed'
      : 'updated'

    this.addActivity(taskId, action, { field, oldValue, newValue })
  }

  /** Track assignment */
  trackAssignment(taskId: string, assigneeId: string, assigned: boolean): void {
    this.addActivity(taskId, assigned ? 'assigned' : 'unassigned', { newValue: assigneeId })
  }

  // === Collaborators ===

  /** Add a collaborator to a task */
  addCollaborator(taskId: string, userId: string, role: TaskCollaborator['role'] = 'assignee'): void {
    const collaborator: TaskCollaborator = {
      id: userId,
      name: this.getCollaboratorName(userId),
      avatar: this.getCollaboratorAvatar(userId),
      role,
      status: 'online',
      lastSeen: new Date(),
    }
    this.state.collaborators.set(userId, collaborator)
    this.trackAssignment(taskId, userId, true)
  }

  /** Remove a collaborator */
  removeCollaborator(taskId: string, userId: string): void {
    this.state.collaborators.delete(userId)
    this.trackAssignment(taskId, userId, false)
  }

  /** Get task collaborators */
  getCollaborators(_taskId: string): TaskCollaborator[] {
    return Array.from(this.state.collaborators.values())
  }

  /** Get online collaborators */
  getOnlineCollaborators(): TaskCollaborator[] {
    return Array.from(this.state.collaborators.values()).filter(c => c.status === 'online')
  }

  // === Notifications ===

  /** Create a notification */
  createNotification(taskId: string, type: NotificationType, title: string, message: string): TaskNotification | undefined {
    if (!this.config.enableNotifications) return undefined

    const notification: TaskNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId,
      userId: this.config.userId,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
    }

    this.state.notifications.unshift(notification)
    if (this.state.notifications.length > 50) {
      this.state.notifications.pop()
    }

    this.notifyStateListeners()
    return notification
  }

  /** Get notifications */
  getNotifications(): TaskNotification[] {
    return this.state.notifications
  }

  /** Get unread count */
  getUnreadCount(): number {
    return this.state.notifications.filter(n => !n.read).length
  }

  /** Mark notification as read */
  markAsRead(notificationId: string): void {
    const notification = this.state.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.notifyStateListeners()
    }
  }

  /** Mark all as read */
  markAllAsRead(): void {
    for (const notification of this.state.notifications) {
      notification.read = true
    }
    this.notifyStateListeners()
  }

  // === Event Listeners ===

  /** Subscribe to events */
  onEvent(listener: (event: TaskCollabEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => { this.eventListeners.delete(listener) }
  }

  /** Subscribe to state changes */
  onStateChange(listener: () => void): () => void {
    this.stateListeners.add(listener)
    return () => { this.stateListeners.delete(listener) }
  }

  /** Get state */
  getState(): Readonly<TaskCollabState> {
    return this.state
  }

  /** Destroy the engine */
  destroy(): void {
    this.eventListeners.clear()
    this.stateListeners.clear()
  }

  // === Private Methods ===

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match[1]) mentions.push(match[1])
    }
    return mentions
  }

  private notifyMentionedUsers(taskId: string, mentions: string[], content: string): void {
    for (const _mention of mentions) {
      this.createNotification(taskId, 'mention', 'You were mentioned', `${this.config.userName} mentioned you: ${content.substring(0, 50)}...`)
    }
  }

  private getCollaboratorName(userId: string): string {
    const user = this.state.collaborators.get(userId)
    return user?.name ?? userId
  }

  private getCollaboratorAvatar(userId: string): string | undefined {
    const user = this.state.collaborators.get(userId)
    return user?.avatar
  }

  private emitEvent(event: TaskCollabEvent): void {
    this.config.onEvent?.(event)
    for (const listener of this.eventListeners) {
      try { listener(event) } catch (error) { console.error('Task collab event error:', error) }
    }
  }

  private notifyStateListeners(): void {
    for (const listener of this.stateListeners) {
      try { listener() } catch (error) { console.error('Task collab state error:', error) }
    }
  }
}

/** Singleton instance */
let instance: TaskCollaborationEngine | null = null

/** Get or create singleton */
export function getTaskCollaborationEngine(config?: Partial<TaskCollabConfig>): TaskCollaborationEngine {
  if (!instance) {
    instance = new TaskCollaborationEngine(config)
  }
  return instance
}

/** Format activity action */
export function formatActivityAction(action: TaskAction): string {
  const actions: Record<TaskAction, string> = {
    'created': 'created this task',
    'updated': 'updated the task',
    'status-changed': 'changed status',
    'priority-changed': 'changed priority',
    'assigned': 'assigned the task',
    'unassigned': 'unassigned the task',
    'commented': 'commented',
    'due-date-changed': 'changed due date',
    'tag-added': 'added a tag',
    'tag-removed': 'removed a tag',
    'completed': 'completed the task',
  }
  return actions[action] ?? action
}

/** Get activity icon */
export function getActivityIcon(action: TaskAction): string {
  const icons: Record<TaskAction, string> = {
    'created': '\uD83D\uDCDD',
    'updated': '\u270F\uFE0F',
    'status-changed': '\uD83D\uDD04',
    'priority-changed': '\u26A0\uFE0F',
    'assigned': '\uD83D\uDC64',
    'unassigned': '\uD83D\uDEAB',
    'commented': '\uD83D\uDCAC',
    'due-date-changed': '\uD83D\uDCC5',
    'tag-added': '\uD83C\uDFF7\uFE0F',
    'tag-removed': '\uD83D\uDDD1\uFE0F',
    'completed': '\u2705',
  }
  return icons[action] ?? '\u2022'
}

/** Get notification icon */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    'assignment': '\uD83D\uDC64',
    'mention': '@',
    'comment': '\uD83D\uDCAC',
    'status-change': '\uD83D\uDD04',
    'due-date': '\uD83D\uDCC5',
    'reminder': '\u23F0',
  }
  return icons[type] ?? '\uD83D\uDD14'
}

/** Format time relative */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default TaskCollaborationEngine
