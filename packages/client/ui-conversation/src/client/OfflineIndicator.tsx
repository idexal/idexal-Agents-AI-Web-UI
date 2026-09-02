/**
 * Offline Indicator for Idexal Agents.
 * Shows connection status and sync progress.
 */

import { useState, useEffect } from 'react'
import { getSyncManager, formatSyncStatus, getStatusColor, type SyncState } from './SyncManager.ts'
import { getOfflineStorage, formatStorageSize, type StorageStats } from './OfflineStorageAdvanced.ts'

/** Labels */
const LABELS = {
  en: {
    online: 'Online',
    offline: 'Offline',
    syncing: 'Syncing...',
    error: 'Sync Error',
    pendingChanges: 'Pending Changes',
    lastSync: 'Last Sync',
    storage: 'Storage',
    syncNow: 'Sync Now',
    retrySync: 'Retry Sync',
    viewDetails: 'View Details',
    hideDetails: 'Hide Details',
    conversations: 'Conversations',
    messages: 'Messages',
    never: 'Never',
  },
  ar: {
    online: 'متصل',
    offline: 'غير متصل',
    syncing: 'جاري المزامنة...',
    error: 'خطأ في المزامنة',
    pendingChanges: 'التغييرات المعلقة',
    lastSync: 'آخر مزامنة',
    storage: 'التخزين',
    syncNow: 'مزامنة الآن',
    retrySync: 'إعادة المحاولة',
    viewDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
    conversations: 'المحادثات',
    messages: 'الرسائل',
    never: 'أبداً',
  },
  zh: {
    online: '在线',
    offline: '离线',
    syncing: '同步中...',
    error: '同步错误',
    pendingChanges: '待同步更改',
    lastSync: '上次同步',
    storage: '存储',
    syncNow: '立即同步',
    retrySync: '重试同步',
    viewDetails: '查看详情',
    hideDetails: '隐藏详情',
    conversations: '对话',
    messages: '消息',
    never: '从未',
  },
}

export interface OfflineIndicatorProps {
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Show detailed stats */
  showDetails?: boolean
  /** Compact mode */
  compact?: boolean
}

/**
 * Offline Indicator Component.
 */
export function OfflineIndicator({
  language = 'en',
  showDetails = false,
  compact = false,
}: OfflineIndicatorProps) {
  const labels = LABELS[language] ?? LABELS.en
  const isRTL = language === 'ar'

  const [syncState, setSyncState] = useState<SyncState>({
    status: 'online',
    lastSync: null,
    pendingChanges: 0,
    isSyncing: false,
    error: null,
  })

  const [stats, setStats] = useState<StorageStats>({
    totalConversations: 0,
    totalMessages: 0,
    totalAttachments: 0,
    storageUsed: 0,
    pendingSync: 0,
    failedSync: 0,
  })

  const [showDetailsExpanded, setShowDetailsExpanded] = useState(showDetails)

  useEffect(() => {
    const syncManager = getSyncManager()
    const storage = getOfflineStorage()

    // Subscribe to sync state changes
    const unsubSync = syncManager.onStateChange((state) => {
      setSyncState(state)
    })

    // Subscribe to progress updates
    const unsubProgress = syncManager.onEvent((event) => {
      if (event.type === 'local-change') {
        // Refresh stats
        storage.getStats().then(setStats)
      }
    })

    // Load initial stats
    storage.getStats().then(setStats)

    return () => {
      unsubSync()
      unsubProgress()
    }
  }, [])

  const handleSync = async () => {
    const syncManager = getSyncManager()
    await syncManager.sync()
    // Refresh stats
    const storage = getOfflineStorage()
    storage.getStats().then(setStats)
  }

  const statusColor = getStatusColor(syncState.status)
  const lastSyncTime = syncState.lastSync?.toLocaleString() ?? labels.never

  // Compact mode
  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '16px',
          background: `${statusColor}20`,
          color: statusColor,
          fontSize: '13px',
          fontWeight: 500,
          direction: isRTL ? 'rtl' : 'ltr',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: statusColor,
          }}
        />
        <span>{formatSyncStatus(syncState.status)}</span>
        {syncState.pendingChanges > 0 && (
          <span style={{ marginLeft: isRTL ? 0 : '4px', marginRight: isRTL ? '4px' : 0 }}>
            ({syncState.pendingChanges})
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-bg-primary, #ffffff)',
        borderRadius: '12px',
        border: '1px solid var(--color-border, #e5e7eb)',
        overflow: 'hidden',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid var(--color-border, #e5e7eb)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: statusColor,
            }}
          />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
              {syncState.status === 'online' ? labels.online :
               syncState.status === 'offline' ? labels.offline :
               syncState.status === 'syncing' ? labels.syncing : labels.error}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
              {labels.lastSync}: {lastSyncTime}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: '6px',
              background: 'var(--color-bg-secondary, #f9fafb)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {showDetailsExpanded ? labels.hideDetails : labels.viewDetails}
          </button>
          <button
            onClick={handleSync}
            disabled={syncState.isSyncing || syncState.status === 'offline'}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: syncState.isSyncing || syncState.status === 'offline'
                ? 'var(--color-text-muted, #9ca3af)'
                : 'var(--color-primary, #3b82f6)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: syncState.isSyncing || syncState.status === 'offline' ? 'not-allowed' : 'pointer',
            }}
          >
            {syncState.isSyncing ? labels.syncing : 
             syncState.status === 'error' ? labels.retrySync : labels.syncNow}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {syncState.error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--color-error-light, #fee2e2)',
            color: 'var(--color-error, #ef4444)',
            fontSize: '13px',
          }}
        >
          {syncState.error}
        </div>
      )}

      {/* Details */}
      {showDetailsExpanded && (
        <div style={{ padding: '16px' }}>
          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ padding: '12px', background: 'var(--color-bg-secondary, #f9fafb)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
                {labels.conversations}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
                {stats.totalConversations}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--color-bg-secondary, #f9fafb)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
                {labels.messages}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
                {stats.totalMessages}
              </div>
            </div>
          </div>

          {/* Storage Info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'var(--color-bg-secondary, #f9fafb)',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary, #6b7280)' }}>{labels.storage}</span>
            <span style={{ color: 'var(--color-text-primary, #111827)' }}>
              {formatStorageSize(stats.storageUsed)}
            </span>
          </div>

          {/* Pending Changes */}
          {stats.pendingSync > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: 'var(--color-warning-light, #fef3c7)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--color-warning, #f59e0b)',
              }}
            >
              {stats.pendingSync} {labels.pendingChanges.toLowerCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default OfflineIndicator
