/**
 * Keyboard Shortcuts component for Idexal Agents.
 * Displays and allows customization of keyboard shortcuts.
 */

import { useState, useEffect } from 'react'

interface Shortcut {
  id: string
  category: string
  name: string
  description: string
  keys: string[]
  customizable: boolean
}

interface KeyboardShortcutsProps {
  /** Callback when shortcuts are updated */
  onUpdate?: (shortcuts: Record<string, string[]>) => void
}

const defaultShortcuts: Shortcut[] = [
  // General
  { id: 'command-palette', category: 'General', name: 'Command Palette', description: 'Open command palette', keys: ['Ctrl', 'K'], customizable: true },
  { id: 'toggle-sidebar', category: 'General', name: 'Toggle Sidebar', description: 'Show/hide sidebar', keys: ['Ctrl', '/'], customizable: true },
  { id: 'settings', category: 'General', name: 'Settings', description: 'Open settings', keys: ['Ctrl', ','], customizable: true },
  { id: 'search', category: 'General', name: 'Search', description: 'Global search', keys: ['Ctrl', 'Shift', 'F'], customizable: true },
  { id: 'help', category: 'General', name: 'Help', description: 'Show keyboard shortcuts', keys: ['?'], customizable: false },

  // Chat
  { id: 'new-chat', category: 'Chat', name: 'New Chat', description: 'Start new conversation', keys: ['Ctrl', 'N'], customizable: true },
  { id: 'send-message', category: 'Chat', name: 'Send Message', description: 'Send current message', keys: ['Ctrl', 'Enter'], customizable: false },
  { id: 'stop-generation', category: 'Chat', name: 'Stop Generation', description: 'Stop AI response', keys: ['Ctrl', '.'], customizable: true },
  { id: 'clear-chat', category: 'Chat', name: 'Clear Chat', description: 'Clear current conversation', keys: ['Ctrl', 'Shift', 'D'], customizable: true },
  { id: 'export-chat', category: 'Chat', name: 'Export Chat', description: 'Export conversation', keys: ['Ctrl', 'Shift', 'E'], customizable: true },

  // Navigation
  { id: 'next-chat', category: 'Navigation', name: 'Next Chat', description: 'Go to next conversation', keys: ['Alt', 'ArrowDown'], customizable: true },
  { id: 'prev-chat', category: 'Navigation', name: 'Previous Chat', description: 'Go to previous conversation', keys: ['Alt', 'ArrowUp'], customizable: true },
  { id: 'focus-input', category: 'Navigation', name: 'Focus Input', description: 'Focus message input', keys: ['Ctrl', 'L'], customizable: true },

  // Editing
  { id: 'undo', category: 'Editing', name: 'Undo', description: 'Undo last action', keys: ['Ctrl', 'Z'], customizable: false },
  { id: 'redo', category: 'Editing', name: 'Redo', description: 'Redo last action', keys: ['Ctrl', 'Shift', 'Z'], customizable: false },
  { id: 'copy', category: 'Editing', name: 'Copy', description: 'Copy selection', keys: ['Ctrl', 'C'], customizable: false },
  { id: 'paste', category: 'Editing', name: 'Paste', description: 'Paste from clipboard', keys: ['Ctrl', 'V'], customizable: false },
]

const translations = {
  en: {
    title: 'Keyboard Shortcuts',
    description: 'Customize your keyboard shortcuts',
    category: 'Category',
    shortcut: 'Shortcut',
    keys: 'Keys',
    action: 'Action',
    reset: 'Reset to Default',
    resetAll: 'Reset All',
    save: 'Save Changes',
    cancel: 'Cancel',
    edit: 'Edit',
    pressKeys: 'Press keys...',
    recorded: 'Recorded',
    invalid: 'Invalid combination',
    alreadyUsed: 'This shortcut is already in use',
  },
  ar: {
    title: 'اختصارات لوحة المفاتيح',
    description: 'تخصيص اختصارات لوحة المفاتيح',
    category: 'الفئة',
    shortcut: 'الاختصار',
    keys: 'المفاتيح',
    action: 'الإجراء',
    reset: 'إعادة تعيين للافتراضي',
    resetAll: 'إعادة تعيين الكل',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    edit: 'تعديل',
    pressKeys: 'اضغط المفاتيح...',
    recorded: 'تم التسجيل',
    invalid: 'تركيب غير صالح',
    alreadyUsed: 'هذا الاختصار مستخدم بالفعل',
  },
  zh: {
    title: '键盘快捷键',
    description: '自定义键盘快捷键',
    category: '类别',
    shortcut: '快捷键',
    keys: '按键',
    action: '操作',
    reset: '重置为默认',
    resetAll: '全部重置',
    save: '保存更改',
    cancel: '取消',
    edit: '编辑',
    pressKeys: '按下按键...',
    recorded: '已记录',
    invalid: '无效组合',
    alreadyUsed: '此快捷键已被使用',
  },
}

export function KeyboardShortcuts({ onUpdate }: KeyboardShortcutsProps) {
  const [language] = useState<'en' | 'ar' | 'zh'>('en')
  const [shortcuts, setShortcuts] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('idexal-shortcuts')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {}
      }
    }
    return {}
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [recordingKeys, setRecordingKeys] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const t = translations[language]
  const isRTL = language === 'ar'

  // Get current keys for a shortcut
  const getKeys = (shortcut: Shortcut): string[] => {
    return shortcuts[shortcut.id] || shortcut.keys
  }

  // Check if a key combination is already used
  const isKeysUsed = (keys: string[], excludeId?: string): boolean => {
    return defaultShortcuts.some(s => {
      if (s.id === excludeId) return false
      const currentKeys = getKeys(s)
      return currentKeys.length === keys.length && 
             currentKeys.every((k, i) => k === keys[i])
    })
  }

  // Handle recording keys
  useEffect(() => {
    if (!editingId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const key = e.key === ' ' ? 'Space' : 
                  e.key === 'Escape' ? 'Escape' :
                  e.key === 'Enter' ? 'Enter' :
                  e.key === 'Backspace' ? 'Backspace' :
                  e.key

      if (key === 'Escape') {
        setEditingId(null)
        setRecordingKeys([])
        return
      }

      if (key === 'Backspace') {
        setRecordingKeys(prev => prev.slice(0, -1))
        return
      }

      const newKeys = [...recordingKeys, key]
      setRecordingKeys(newKeys)
    }

    const handleKeyUp = (_e: KeyboardEvent) => {
      if (recordingKeys.length > 0 && editingId) {
        // Check if combination is valid
        if (recordingKeys.length >= 2 && !isKeysUsed(recordingKeys, editingId)) {
          setShortcuts(prev => ({
            ...prev,
            [editingId]: recordingKeys,
          }))
          setHasChanges(true)
        }
        setEditingId(null)
        setRecordingKeys([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [editingId, recordingKeys])

  // Save shortcuts
  const handleSave = () => {
    localStorage.setItem('idexal-shortcuts', JSON.stringify(shortcuts))
    onUpdate?.(shortcuts)
    setHasChanges(false)
  }

  // Reset shortcuts
  const handleReset = (id?: string) => {
    if (id) {
      setShortcuts(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } else {
      setShortcuts({})
    }
    setHasChanges(true)
  }

  // Group shortcuts by category
  const categories = [...new Set(defaultShortcuts.map(s => s.category))]

  return (
    <div className={`keyboard-shortcuts ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="shortcuts-header">
        <div className="header-content">
          <h2>⌨️ {t.title}</h2>
          <p>{t.description}</p>
        </div>
        <div className="header-actions">
          {hasChanges && (
            <>
              <button className="action-button cancel" onClick={() => { setShortcuts({}); setHasChanges(false) }}>
                {t.cancel}
              </button>
              <button className="action-button save" onClick={handleSave}>
                {t.save}
              </button>
            </>
          )}
          <button className="action-button reset" onClick={() => handleReset()}>
            {t.resetAll}
          </button>
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="shortcuts-list">
        {categories.map(category => (
          <div key={category} className="shortcut-category">
            <h3 className="category-title">{category}</h3>
            <div className="category-shortcuts">
              {defaultShortcuts
                .filter(s => s.category === category)
                .map(shortcut => {
                  const currentKeys = getKeys(shortcut)
                  const isEditing = editingId === shortcut.id

                  return (
                    <div key={shortcut.id} className="shortcut-item">
                      <div className="shortcut-info">
                        <span className="shortcut-name">{shortcut.name}</span>
                        <span className="shortcut-description">{shortcut.description}</span>
                      </div>
                      <div className="shortcut-keys">
                        {isEditing ? (
                          <div className="recording">
                            {recordingKeys.length > 0 ? (
                              recordingKeys.map((key, i) => (
                                <kbd key={i}>{key}</kbd>
                              ))
                            ) : (
                              <span className="press-hint">{t.pressKeys}</span>
                            )}
                          </div>
                        ) : (
                          currentKeys.map((key, i) => (
                            <kbd key={i}>{key}</kbd>
                          ))
                        )}
                      </div>
                      <div className="shortcut-actions">
                        {shortcut.customizable && (
                          <button
                            className="edit-button"
                            onClick={() => {
                              setEditingId(isEditing ? null : shortcut.id)
                              setRecordingKeys([])
                            }}
                          >
                            {isEditing ? '✓' : '✏️'}
                          </button>
                        )}
                        {shortcuts[shortcut.id] && (
                          <button
                            className="reset-button"
                            onClick={() => handleReset(shortcut.id)}
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .keyboard-shortcuts {
          padding: 24px;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
        }

        .keyboard-shortcuts.rtl {
          direction: rtl;
        }

        .shortcuts-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-primary, #e2e8f0);
        }

        .header-content h2 {
          margin: 0 0 4px 0;
          font-size: 1.5rem;
          color: var(--text-primary, #0f172a);
        }

        .header-content p {
          margin: 0;
          color: var(--text-secondary, #475569);
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button.cancel {
          background: none;
          border: 1px solid var(--border-primary, #e2e8f0);
          color: var(--text-secondary, #475569);
        }

        .action-button.cancel:hover {
          background: var(--bg-hover, #f1f5f9);
        }

        .action-button.save {
          background: var(--color-primary, #2563eb);
          border: none;
          color: white;
        }

        .action-button.save:hover {
          background: var(--color-primary-hover, #1d4ed8);
        }

        .action-button.reset {
          background: none;
          border: 1px solid var(--border-primary, #e2e8f0);
          color: var(--text-secondary, #475569);
        }

        .action-button.reset:hover {
          background: var(--bg-hover, #f1f5f9);
        }

        .shortcuts-list {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .shortcut-category {
          background: var(--bg-secondary, #f8fafc);
          border-radius: 12px;
          padding: 16px;
        }

        .category-title {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary, #475569);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .category-shortcuts {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-primary, #e2e8f0);
        }

        .shortcut-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .shortcut-name {
          font-weight: 500;
          color: var(--text-primary, #0f172a);
        }

        .shortcut-description {
          font-size: 13px;
          color: var(--text-secondary, #475569);
        }

        .shortcut-keys {
          display: flex;
          gap: 4px;
          margin: 0 16px;
        }

        .shortcut-keys kbd {
          padding: 4px 8px;
          background: var(--bg-secondary, #f1f5f9);
          border: 1px solid var(--border-primary, #e2e8f0);
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          min-width: 24px;
          text-align: center;
        }

        .recording {
          display: flex;
          gap: 4px;
          padding: 4px 8px;
          background: var(--color-primary-light, #eff6ff);
          border: 2px dashed var(--color-primary, #2563eb);
          border-radius: 4px;
          animation: pulse 1s infinite;
        }

        .recording kbd {
          background: var(--color-primary, #2563eb);
          color: white;
          border-color: var(--color-primary, #2563eb);
        }

        .press-hint {
          font-size: 12px;
          color: var(--color-primary, #2563eb);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .shortcut-actions {
          display: flex;
          gap: 4px;
        }

        .edit-button,
        .reset-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid var(--border-primary, #e2e8f0);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-button:hover,
        .reset-button:hover {
          background: var(--bg-hover, #f1f5f9);
        }

        .edit-button:active {
          background: var(--color-primary-light, #eff6ff);
          border-color: var(--color-primary, #2563eb);
        }

        @media (max-width: 640px) {
          .shortcuts-header {
            flex-direction: column;
            gap: 16px;
          }

          .shortcut-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .shortcut-keys {
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default KeyboardShortcuts
