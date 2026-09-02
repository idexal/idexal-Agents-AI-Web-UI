/**
 * Notifications Center UI for Idexal Agents.
 * Notification center with grouping, preferences, and real-time updates.
 */

import { useState, useCallback } from 'react'

type Language = 'en' | 'ar' | 'zh'
type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'reminder'
type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low'

interface NotificationsCenterProps {
  language?: Language
}

interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: number
  read: boolean
  tags: string[]
}

const NC_I18N: Record<Language, {
  title: string
  markAllRead: string
  clearAll: string
  preferences: string
  noNotifications: string
  enableSound: string
  enableVibration: string
  minPriority: string
  quietHours: string
  positions: Record<string, string>
}> = {
  en: {
    title: 'Notifications', markAllRead: 'Mark All Read', clearAll: 'Clear All',
    preferences: 'Preferences', noNotifications: 'No notifications',
    enableSound: 'Enable Sound', enableVibration: 'Enable Vibration',
    minPriority: 'Minimum Priority', quietHours: 'Quiet Hours',
    positions: { 'top-right': 'Top Right', 'top-left': 'Top Left', 'bottom-right': 'Bottom Right', 'bottom-left': 'Bottom Left' },
  },
  ar: {
    title: 'الإشعارات', markAllRead: 'تحديد الكل كمقروء', clearAll: 'مسح الكل',
    preferences: 'التفضيلات', noNotifications: 'لا توجد إشعارات',
    enableSound: 'تفعيل الصوت', enableVibration: 'تفعيل الاهتزاز',
    minPriority: 'الحد الأدنى للأولوية', quietHours: 'ساعات الهدوء',
    positions: { 'top-right': 'أعلى اليمين', 'top-left': 'أعلى اليسار', 'bottom-right': 'أسفل اليمين', 'bottom-left': 'أسفل اليسار' },
  },
  zh: {
    title: '通知', markAllRead: '全部标为已读', clearAll: '清除全部',
    preferences: '偏好设置', noNotifications: '没有通知',
    enableSound: '启用声音', enableVibration: '启用振动',
    minPriority: '最低优先级', quietHours: '免打扰时段',
    positions: { 'top-right': '右上角', 'top-left': '左上角', 'bottom-right': '右下角', 'bottom-left': '左下角' },
  },
}

const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; label: string }> = {
  info: { icon: 'ℹ️', color: '#3b82f6', label: 'Info' },
  success: { icon: '✅', color: '#10b981', label: 'Success' },
  warning: { icon: '⚠️', color: '#f59e0b', label: 'Warning' },
  error: { icon: '❌', color: '#ef4444', label: 'Error' },
  task: { icon: '📋', color: '#8b5cf6', label: 'Task' },
  reminder: { icon: '⏰', color: '#ec4899', label: 'Reminder' },
}

const PRIORITY_CONFIG: Record<NotificationPriority, { color: string; label: string }> = {
  urgent: { color: '#ef4444', label: '🔴 Urgent' },
  high: { color: '#f59e0b', label: '🟡 High' },
  normal: { color: '#3b82f6', label: '🔵 Normal' },
  low: { color: '#94a3b8', label: '⚪ Low' },
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function createDemoNotifications(): Notification[] {
  return [
    { id: '1', type: 'error', priority: 'urgent', title: 'Critical Security Issue', message: 'Hardcoded API key detected in config.ts', timestamp: Date.now() - 120000, read: false, tags: ['security'] },
    { id: '2', type: 'warning', priority: 'high', title: 'Code Review Warning', message: '12 warnings found in your last commit', timestamp: Date.now() - 300000, read: false, tags: ['review'] },
    { id: '3', type: 'success', priority: 'normal', title: 'Tests Passed', message: 'All 47 unit tests passed', timestamp: Date.now() - 600000, read: true, tags: ['testing'] },
    { id: '4', type: 'info', priority: 'low', title: 'New Update Available', message: 'Idexal Agents v0.1.8 is ready', timestamp: Date.now() - 3600000, read: false, tags: ['system'] },
    { id: '5', type: 'task', priority: 'normal', title: 'Task Assigned', message: 'Fix authentication module bug', timestamp: Date.now() - 7200000, read: true, tags: ['tasks'] },
    { id: '6', type: 'reminder', priority: 'low', title: 'Focus Session', message: 'Time for a 5-minute break!', timestamp: Date.now() - 1800000, read: false, tags: ['focus'] },
  ]
}

/**
 * Notifications Center UI component.
 */
export function NotificationsCenterUI({ language = 'en' }: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(createDemoNotifications)
  const [showPrefs, setShowPrefs] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [minPriority, setMinPriority] = useState<NotificationPriority>('low')
  const [filter, setFilter] = useState<'all' | NotificationType>('all')

  const t = NC_I18N[language] ?? NC_I18N.en
  const unread = notifications.filter(n => !n.read).length

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const toggleRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))
  }, [])

  const filtered = notifications.filter(n => {
    if (filter !== 'all' && n.type !== filter) return false
    return true
  })

  const typeCounts: Record<string, number> = {}
  for (const n of notifications) {
    typeCounts[n.type] = (typeCounts[n.type] ?? 0) + 1
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0f172a', color: '#f8fafc', borderRadius: '16px', overflow: 'hidden', maxWidth: '500px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{t.title}</h2>
          {unread > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
              {unread}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={markAllRead} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            ✓ {t.markAllRead}
          </button>
          <button onClick={() => setShowPrefs(!showPrefs)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPrefs && (
        <div style={{ background: '#1e293b', padding: '16px 24px', borderBottom: '1px solid #334155' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>{t.preferences}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
              🔊 {t.enableSound}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span>🎯 {t.minPriority}:</span>
              <select value={minPriority} onChange={e => setMinPriority(e.target.value as NotificationPriority)} style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', fontSize: '12px' }}>
                {(['urgent', 'high', 'normal', 'low'] as const).map(p => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Type Filters */}
      <div style={{ display: 'flex', padding: '12px 24px', gap: '6px', overflowX: 'auto' }}>
        <button onClick={() => setFilter('all')} style={{
          background: filter === 'all' ? '#6366f1' : '#1e293b',
          border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '16px',
          cursor: 'pointer', fontSize: '12px', fontWeight: filter === 'all' ? 600 : 400, whiteSpace: 'nowrap',
        }}>
          All ({notifications.length})
        </button>
        {(Object.keys(TYPE_CONFIG) as NotificationType[]).map(type => {
          const count = typeCounts[type] ?? 0
          if (count === 0) return null
          return (
            <button key={type} onClick={() => setFilter(filter === type ? 'all' : type)} style={{
              background: filter === type ? TYPE_CONFIG[type].color : '#1e293b',
              border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '16px',
              cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap',
            }}>
              {TYPE_CONFIG[type].icon} {count}
            </button>
          )
        })}
      </div>

      {/* Notifications List */}
      <div style={{ padding: '0 16px 16px', maxHeight: '400px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
            <p>{t.noNotifications}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map(n => (
              <div key={n.id} style={{
                background: n.read ? '#1e293b' : '#1e293b',
                border: `1px solid ${n.read ? '#334155' : TYPE_CONFIG[n.type].color + '40'}`,
                borderRadius: '10px', padding: '12px 14px',
                opacity: n.read ? 0.7 : 1,
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <span style={{ fontSize: '20px', marginTop: '2px' }}>{TYPE_CONFIG[n.type].icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{n.title}</span>
                        {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: TYPE_CONFIG[n.type].color }} />}
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>{n.message}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                        <span>{timeAgo(n.timestamp)}</span>
                        <span style={{ color: PRIORITY_CONFIG[n.priority].color }}>{PRIORITY_CONFIG[n.priority].label}</span>
                        {n.tags.map(tag => (
                          <span key={tag} style={{ background: '#334155', padding: '1px 6px', borderRadius: '4px' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => toggleRead(n.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '4px' }} title={n.read ? 'Mark unread' : 'Mark read'}>
                      {n.read ? '📭' : '📬'}
                    </button>
                    <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '4px' }} title="Dismiss">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div style={{ padding: '12px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'center' }}>
          <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
            🗑️ {t.clearAll}
          </button>
        </div>
      )}
    </div>
  )
}

export type { NotificationsCenterProps, Notification, NotificationType as NCNotificationType, NotificationPriority as NCNotificationPriority }
