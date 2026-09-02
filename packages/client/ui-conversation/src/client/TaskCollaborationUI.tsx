/**
 * Task Collaboration UI for Idexal Agents.
 * Provides real-time collaboration interface for team task management.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getTaskCollaborationEngine,
  formatActivityAction,
  getActivityIcon,
  getNotificationIcon,
  formatRelativeTime,
  type TaskComment,
  type TaskActivity,
  type TaskNotification,
  type TaskCollaborator,
} from './TaskCollaboration'

type Language = 'en' | 'ar' | 'zh'

const T: Record<Language, Record<string, string>> = {
  en: {
    comments: 'Comments',
    addComment: 'Add a comment...',
    postComment: 'Post',
    activity: 'Activity',
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    assignees: 'Assignees',
    addAssignee: 'Add assignee',
    noComments: 'No comments yet',
    noActivity: 'No activity yet',
    noNotifications: 'No notifications',
    edited: 'edited',
    mentioned: 'mentioned',
    youWereMentioned: 'You were mentioned',
    online: 'Online',
    offline: 'Offline',
    collaborators: 'Collaborators',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    reply: 'Reply',
    reactions: 'Reactions',
  },
  ar: {
    comments: '\u0627\u0644\u062A\u0639\u0644\u064A\u0642\u0627\u062A',
    addComment: '\u0623\u0636\u0641 \u062A\u0639\u0644\u064A\u0642\u0627\u064B...',
    postComment: '\u0646\u0634\u0631',
    activity: '\u0627\u0644\u0646\u0634\u0627\u0637',
    notifications: '\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A',
    markAllRead: '\u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0643\u0644',
    assignees: '\u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064A\u0646',
    addAssignee: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u0624\u0648\u0644',
    noComments: '\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0639\u0644\u064A\u0642\u0627\u062A',
    noActivity: '\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u0634\u0627\u0637',
    noNotifications: '\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A',
    edited: '\u0639\u062F\u0644',
    mentioned: '\u0634\u064A\u0631\u063A',
    youWereMentioned: '\u062A\u0645 \u0630\u0643\u0631\u0643',
    online: '\u0645\u062A\u0635\u0644',
    offline: '\u063A\u064A\u0631 \u0645\u062A\u0635\u0644',
    collaborators: '\u0627\u0644\u0645\u062A\u0639\u0627\u0648\u0646\u064A\u0646',
    cancel: '\u0625\u0644\u063A\u0627\u0621',
    save: '\u062D\u0641\u0638',
    delete: '\u062D\u0630\u0641',
    edit: '\u062A\u0639\u062F\u064A\u0644',
    reply: '\u0631\u062F',
    reactions: '\u0627\u0644\u062A\u0641\u0627\u0639\u0648\u0644\u0627\u062A',
  },
  zh: {
    comments: '\u8BC4\u8BBA',
    addComment: '\u6DFB\u52A0\u8BC4\u8BBA...',
    postComment: '\u53D1\u5E03',
    activity: '\u6D3B\u52A8',
    notifications: '\u901A\u77E5',
    markAllRead: '\u5168\u90E8\u5DF2\u8BFB',
    assignees: '\u8D1F\u8D23\u4EBA',
    addAssignee: '\u6DFB\u52A0\u8D1F\u8D23\u4EBA',
    noComments: '\u6682\u65E0\u8BC4\u8BBA',
    noActivity: '\u6682\u65E0\u6D3B\u52A8',
    noNotifications: '\u6682\u65E0\u901A\u77E5',
    edited: '\u5DF2\u7F16\u8F91',
    mentioned: '\u63D0\u53CA',
    youWereMentioned: '\u60A8\u88AB\u63D0\u53CA',
    online: '\u5728\u7EBF',
    offline: '\u79BB\u7EBF',
    collaborators: '\u534F\u4F5C\u8005',
    cancel: '\u53D6\u6D88',
    save: '\u4FDD\u5B58',
    delete: '\u5220\u9664',
    edit: '\u7F16\u8F91',
    reply: '\u56DE\u590D',
    reactions: '\u53CD\u5E94',
  },
}

export interface TaskCollaborationUIProps {
  taskId: string
  language?: Language
  currentUserId?: string
  onComment?: (comment: TaskComment) => void
}

/**
 * Task Collaboration UI Component.
 */
export function TaskCollaborationUI({
  taskId,
  language = 'en',
  currentUserId = 'user-1',
  onComment,
}: TaskCollaborationUIProps) {
  const t = T[language] ?? T.en
  const isRTL = language === 'ar'

  const [engine] = useState(() => getTaskCollaborationEngine({ userId: currentUserId }))
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'notifications'>('comments')
  const [comments, setComments] = useState<TaskComment[]>([])
  const [activity, setActivity] = useState<TaskActivity[]>([])
  const [notifications, setNotifications] = useState<TaskNotification[]>([])
  const [commentText, setCommentText] = useState('')
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = engine.onStateChange(() => {
      setComments(engine.getComments(taskId))
      setActivity(engine.getActivity(taskId))
      setNotifications(engine.getNotifications())
      setCollaborators(engine.getCollaborators(taskId))
      setUnreadCount(engine.getUnreadCount())
    })

    setComments(engine.getComments(taskId))
    setActivity(engine.getActivity(taskId))
    setCollaborators(engine.getCollaborators(taskId))

    return unsub
  }, [engine, taskId])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handlePostComment = useCallback(() => {
    if (!commentText.trim()) return

    const comment = engine.addComment(taskId, commentText)
    if (comment) {
      onComment?.(comment)
      setCommentText('')
    }
  }, [engine, taskId, commentText, onComment])

  const handleReaction = useCallback((commentId: string, emoji: string) => {
    engine.addCommentReaction(taskId, commentId, emoji)
  }, [engine, taskId])

  const handleMarkAllRead = useCallback(() => {
    engine.markAllAsRead()
  }, [engine])

  const quickReactions = ['\uD83D\uDC4D', '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE4C', '\uD83D\uDD25']

  return (
    <div className="task-collab" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="collab-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div className="collab-tabs">
          <button
            className={`collab-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            {t.comments} ({comments.length})
          </button>
          <button
            className={`collab-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            {t.activity}
          </button>
          <button
            className={`collab-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            {t.notifications} {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
          </button>
        </div>
      </div>

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <div className="collaborators-section">
          <h4>{t.collaborators}</h4>
          <div className="collaborators-list">
            {collaborators.map((collab) => (
              <div key={collab.id} className="collaborator-item">
                <div className="collaborator-avatar">
                  {collab.avatar ? (
                    <img src={collab.avatar} alt={collab.name} />
                  ) : (
                    <span>{collab.name.charAt(0).toUpperCase()}</span>
                  )}
                  <span className={`status-dot ${collab.status}`} />
                </div>
                <span className="collaborator-name">{collab.name}</span>
                <span className="collaborator-role">{collab.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="collab-content">
        {activeTab === 'comments' && (
          <div className="comments-section">
            {comments.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">{'\uD83D\uDCAC'}</span>
                <p>{t.noComments}</p>
              </div>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    language={language}
                    onReaction={(emoji) => handleReaction(comment.id, emoji)}
                  />
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* Comment Input */}
            <div className="comment-input" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <input
                type="text"
                placeholder={t.addComment}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment() } }}
                style={{ textAlign: isRTL ? 'right' : 'left' }}
              />
              <button className="post-btn" onClick={handlePostComment} disabled={!commentText.trim()}>
                {t.postComment}
              </button>
            </div>

            {/* Quick Reactions */}
            <div className="quick-reactions">
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  className="quick-reaction"
                  onClick={() => {
                    if (commentText.trim()) {
                      handlePostComment()
                    }
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-section">
            {activity.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">{'\uD83D\uDCCB'}</span>
                <p>{t.noActivity}</p>
              </div>
            ) : (
              <div className="activity-list">
                {activity.map((item) => (
                  <ActivityItem key={item.id} activity={item} language={language} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-section">
            <div className="notifications-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <span>{notifications.length} {(t.notifications ?? 'notifications').toLowerCase()}</span>
              {unreadCount > 0 && (
                <button className="mark-read-btn" onClick={handleMarkAllRead}>
                  {t.markAllRead}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">{'\uD83D\uDD14'}</span>
                <p>{t.noNotifications}</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notif) => (
                  <NotificationItem key={notif.id} notification={notif} language={language} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .task-collab { display: flex; flex-direction: column; height: 100%; background: var(--bg-primary, #ffffff); font-family: var(--font-family, system-ui, -apple-system, sans-serif); }
        .collab-header { padding: 12px 16px; border-bottom: 1px solid var(--border-primary, #e5e7eb); }
        .collab-tabs { display: flex; gap: 4px; }
        .collab-tab { padding: 8px 16px; background: none; border: none; border-bottom: 2px solid transparent; font-size: 13px; font-weight: 500; color: var(--text-secondary, #6b7280); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
        .collab-tab:hover { color: var(--text-primary, #111827); }
        .collab-tab.active { color: var(--color-primary, #3b82f6); border-bottom-color: var(--color-primary, #3b82f6); }
        .unread-badge { padding: 2px 6px; background: var(--color-primary, #3b82f6); color: white; border-radius: 10px; font-size: 10px; font-weight: 600; }
        .collaborators-section { padding: 12px 16px; border-bottom: 1px solid var(--border-primary, #e5e7eb); }
        .collaborators-section h4 { margin: 0 0 8px; font-size: 12px; font-weight: 600; color: var(--text-secondary, #6b7280); text-transform: uppercase; }
        .collaborators-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .collaborator-item { display: flex; align-items: center; gap: 8px; padding: 4px 8px; background: var(--bg-secondary, #f3f4f6); border-radius: 6px; }
        .collaborator-avatar { position: relative; width: 24px; height: 24px; border-radius: 50%; overflow: visible; }
        .collaborator-avatar img, .collaborator-avatar span { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .collaborator-avatar span { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; }
        .status-dot { position: absolute; bottom: 0; right: 0; width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--bg-primary, #ffffff); }
        .status-dot.online { background: #10b981; }
        .status-dot.away { background: #f59e0b; }
        .status-dot.offline { background: #6b7280; }
        .collaborator-name { font-size: 12px; color: var(--text-primary, #111827); }
        .collaborator-role { font-size: 10px; color: var(--text-secondary, #6b7280); text-transform: capitalize; }
        .collab-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .comments-section, .activity-section, .notifications-section { flex: 1; display: flex; flex-direction: column; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: var(--text-secondary, #6b7280); }
        .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }
        .empty-state p { margin: 0; font-size: 14px; }
        .comments-list, .activity-list, .notifications-list { flex: 1; overflow-y: auto; padding: 12px; }
        .comment-input { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border-primary, #e5e7eb); }
        .comment-input input { flex: 1; padding: 10px 16px; border: 1px solid var(--border-primary, #e5e7eb); border-radius: 8px; font-size: 14px; outline: none; }
        .comment-input input:focus { border-color: var(--color-primary, #3b82f6); }
        .post-btn { padding: 10px 20px; background: var(--color-primary, #3b82f6); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
        .post-btn:hover:not(:disabled) { background: var(--color-primary-hover, #2563eb); }
        .post-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .quick-reactions { display: flex; gap: 8px; padding: 8px 16px; border-top: 1px solid var(--border-light, #f3f4f6); }
        .quick-reaction { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary, #f3f4f6); border: none; border-radius: 6px; cursor: pointer; font-size: 16px; transition: all 0.15s; }
        .quick-reaction:hover { background: var(--bg-hover, #e5e7eb); transform: scale(1.1); }
        .notifications-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; font-size: 12px; color: var(--text-secondary, #6b7280); }
        .mark-read-btn { padding: 4px 8px; background: none; border: 1px solid var(--border-primary, #e5e7eb); border-radius: 4px; font-size: 11px; cursor: pointer; color: var(--color-primary, #3b82f6); }
        .mark-read-btn:hover { background: var(--bg-hover, #f3f4f6); }
      `}</style>
    </div>
  )
}

/** Comment Item Props */
interface CommentItemProps {
  comment: TaskComment
  currentUserId: string
  language: Language
  onReaction: (emoji: string) => void
}

function CommentItem({ comment, currentUserId, language, onReaction }: CommentItemProps) {
  const t = T[language] ?? T.en
  const isRTL = language === 'ar'

  return (
    <div className={`comment-item ${comment.isDeleted ? 'deleted' : ''}`}>
      <div className="comment-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div className="comment-avatar">
          <span>{comment.userId.charAt(0).toUpperCase()}</span>
        </div>
        <div className="comment-meta">
          <span className="comment-user">{comment.userId}</span>
          <span className="comment-time">{formatRelativeTime(comment.timestamp)}</span>
          {comment.editedAt && <span className="edited-badge">({t.edited})</span>}
        </div>
      </div>

      <div className="comment-content">{comment.content}</div>

      {comment.mentions.length > 0 && (
        <div className="comment-mentions">
          {comment.mentions.map((mention) => (
            <span key={mention} className="mention">@{mention}</span>
          ))}
        </div>
      )}

      {comment.reactions.length > 0 && (
        <div className="comment-reactions">
          {comment.reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              className={`reaction-chip ${reaction.users.includes(currentUserId) ? 'active' : ''}`}
              onClick={() => onReaction(reaction.emoji)}
            >
              <span className="emoji">{reaction.emoji}</span>
              <span className="count">{reaction.users.length}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .comment-item { padding: 12px; border-radius: 8px; transition: background 0.15s; }
        .comment-item:hover { background: var(--bg-hover, #f9fafb); }
        .comment-item.deleted { opacity: 0.5; font-style: italic; }
        .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .comment-meta { display: flex; align-items: center; gap: 8px; }
        .comment-user { font-size: 13px; font-weight: 600; color: var(--text-primary, #111827); }
        .comment-time { font-size: 11px; color: var(--text-secondary, #9ca3af); }
        .edited-badge { font-size: 11px; color: var(--text-secondary, #9ca3af); }
        .comment-content { font-size: 14px; color: var(--text-primary, #111827); line-height: 1.5; margin-left: 36px; }
        .comment-mentions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; margin-left: 36px; }
        .mention { padding: 2px 6px; background: #dbeafe; color: #2563eb; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .comment-reactions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; margin-left: 36px; }
        .reaction-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--bg-secondary, #f3f4f6); border: 1px solid var(--border-primary, #e5e7eb); border-radius: 16px; cursor: pointer; font-size: 12px; }
        .reaction-chip:hover { background: var(--bg-hover, #e5e7eb); }
        .reaction-chip.active { background: #dbeafe; border-color: #3b82f6; }
      `}</style>
    </div>
  )
}

/** Activity Item Props */
interface ActivityItemProps {
  activity: TaskActivity
  language: Language
}

function ActivityItem({ activity, language }: ActivityItemProps) {
  const isRTL = language === 'ar'

  return (
    <div className="activity-item" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
      <div className="activity-icon">{getActivityIcon(activity.action)}</div>
      <div className="activity-content">
        <span className="activity-user">{activity.userId}</span>
        <span className="activity-action"> {formatActivityAction(activity.action)}</span>
        {activity.details.field && (
          <span className="activity-details">
            {activity.details.oldValue && ` from ${activity.details.oldValue}`}
            {activity.details.newValue && ` to ${activity.details.newValue}`}
          </span>
        )}
        {activity.details.message && (
          <span className="activity-message">: {activity.details.message}</span>
        )}
        <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
      </div>

      <style>{`
        .activity-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 8px; }
        .activity-item:hover { background: var(--bg-hover, #f9fafb); }
        .activity-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary, #f3f4f6); border-radius: 8px; font-size: 16px; flex-shrink: 0; }
        .activity-content { flex: 1; font-size: 13px; color: var(--text-primary, #111827); line-height: 1.4; }
        .activity-user { font-weight: 600; }
        .activity-action { color: var(--text-secondary, #6b7280); }
        .activity-details { color: var(--text-secondary, #6b7280); }
        .activity-message { color: var(--text-secondary, #6b7280); }
        .activity-time { display: block; font-size: 11px; color: var(--text-secondary, #9ca3af); margin-top: 4px; }
      `}</style>
    </div>
  )
}

/** Notification Item Props */
interface NotificationItemProps {
  notification: TaskNotification
  language: Language
}

function NotificationItem({ notification, language }: NotificationItemProps) {
  const isRTL = language === 'ar'

  return (
    <div
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
    >
      <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
      <div className="notification-content">
        <span className="notification-title">{notification.title}</span>
        <span className="notification-message">{notification.message}</span>
        <span className="notification-time">{formatRelativeTime(notification.timestamp)}</span>
      </div>
      {!notification.read && <div className="unread-dot" />}

      <style>{`
        .notification-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
        .notification-item:hover { background: var(--bg-hover, #f9fafb); }
        .notification-item.unread { background: var(--color-primary-light, #dbeafe); }
        .notification-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary, #f3f4f6); border-radius: 8px; font-size: 16px; flex-shrink: 0; }
        .notification-item.unread .notification-icon { background: var(--color-primary, #3b82f6); color: white; }
        .notification-content { flex: 1; }
        .notification-title { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary, #111827); }
        .notification-message { display: block; font-size: 12px; color: var(--text-secondary, #6b7280); margin-top: 2px; }
        .notification-time { display: block; font-size: 11px; color: var(--text-secondary, #9ca3af); margin-top: 4px; }
        .unread-dot { width: 8px; height: 8px; background: var(--color-primary, #3b82f6); border-radius: 50%; flex-shrink: 0; }
      `}</style>
    </div>
  )
}

export default TaskCollaborationUI
