/**
 * Keyboard Shortcuts Settings Section for Idexal Agents.
 * Allows users to view and customize keyboard shortcuts.
 */

import { useState, useEffect, useCallback } from 'react'
import css from './GeneralSection.module.css'

/** Language type */
type Language = 'en' | 'ar' | 'zh'

/** Shortcut category */
interface ShortcutCategory {
  id: string
  name: string
  shortcuts: ShortcutItem[]
}

/** Shortcut item */
interface ShortcutItem {
  id: string
  name: string
  keys: string[]
  modifiers: string[]
  enabled: boolean
}

/** Translations */
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    title: 'Keyboard Shortcuts',
    subtitle: 'Customize keyboard shortcuts for faster navigation',
    search: 'Search shortcuts...',
    resetAll: 'Reset All',
    save: 'Save Changes',
    cancel: 'Cancel',
    edit: 'Edit',
    reset: 'Reset',
    noResults: 'No shortcuts found',
    pressKeys: 'Press your desired key combination...',
    pressEsc: 'Press Esc to cancel',
    saved: 'Shortcuts saved successfully!',
    resetConfirm: 'Reset all shortcuts to default?',
    categoryNavigation: 'Navigation',
    categoryChat: 'Chat',
    categoryEdit: 'Edit',
    categoryView: 'View',
    categoryGeneral: 'General',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
  ar: {
    title: 'اختصارات لوحة المفاتيح',
    subtitle: 'تخصيص اختصارات لوحة المفاتيح للتنقل الأسرع',
    search: 'بحث في الاختصارات...',
    resetAll: 'إعادة تعيين الكل',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    edit: 'تعديل',
    reset: 'إعادة تعيين',
    noResults: 'لا توجد اختصارات',
    pressKeys: 'اضغط على组合 المفاتيح المطلوبة...',
    pressEsc: 'اضغط Esc للإلغاء',
    saved: 'تم حفظ الاختصارات بنجاح!',
    resetConfirm: 'إعادة تعيين جميع الاختصارات للافتراضي؟',
    categoryNavigation: 'التنقل',
    categoryChat: 'المحادثة',
    categoryEdit: 'التعديل',
    categoryView: 'العرض',
    categoryGeneral: 'عام',
    enabled: 'مفعّل',
    disabled: 'معطّل',
  },
  zh: {
    title: '键盘快捷键',
    subtitle: '自定义键盘快捷键以实现更快的导航',
    search: '搜索快捷键...',
    resetAll: '全部重置',
    save: '保存更改',
    cancel: '取消',
    edit: '编辑',
    reset: '重置',
    noResults: '未找到快捷键',
    pressKeys: '按下您想要的快捷键组合...',
    pressEsc: '按 Esc 取消',
    saved: '快捷键保存成功！',
    resetConfirm: '将所有快捷键重置为默认值？',
    categoryNavigation: '导航',
    categoryChat: '聊天',
    categoryEdit: '编辑',
    categoryView: '视图',
    categoryGeneral: '通用',
    enabled: '已启用',
    disabled: '已禁用',
  },
}

/** Default shortcuts */
const DEFAULT_SHORTCUTS: ShortcutCategory[] = [
  {
    id: 'navigation',
    name: 'Navigation',
    shortcuts: [
      { id: 'nav-home', name: 'Go to Home', keys: ['1'], modifiers: ['alt'], enabled: true },
      { id: 'nav-chat', name: 'Go to Chat', keys: ['2'], modifiers: ['alt'], enabled: true },
      { id: 'nav-settings', name: 'Go to Settings', keys: ['3'], modifiers: ['alt'], enabled: true },
      { id: 'nav-search', name: 'Open Search', keys: ['k'], modifiers: ['ctrl'], enabled: true },
    ],
  },
  {
    id: 'chat',
    name: 'Chat',
    shortcuts: [
      { id: 'chat-new', name: 'New Chat', keys: ['n'], modifiers: ['ctrl'], enabled: true },
      { id: 'chat-send', name: 'Send Message', keys: ['Enter'], modifiers: [], enabled: true },
      { id: 'chat-stop', name: 'Stop Generation', keys: ['Escape'], modifiers: [], enabled: true },
      { id: 'chat-clear', name: 'Clear Chat', keys: ['Delete'], modifiers: ['ctrl', 'shift'], enabled: true },
    ],
  },
  {
    id: 'edit',
    name: 'Edit',
    shortcuts: [
      { id: 'edit-undo', name: 'Undo', keys: ['z'], modifiers: ['ctrl'], enabled: true },
      { id: 'edit-redo', name: 'Redo', keys: ['z'], modifiers: ['ctrl', 'shift'], enabled: true },
      { id: 'edit-copy', name: 'Copy', keys: ['c'], modifiers: ['ctrl'], enabled: true },
      { id: 'edit-paste', name: 'Paste', keys: ['v'], modifiers: ['ctrl'], enabled: true },
    ],
  },
  {
    id: 'view',
    name: 'View',
    shortcuts: [
      { id: 'view-sidebar', name: 'Toggle Sidebar', keys: ['b'], modifiers: ['ctrl'], enabled: true },
      { id: 'view-fullscreen', name: 'Toggle Fullscreen', keys: ['f'], modifiers: ['ctrl', 'shift'], enabled: true },
      { id: 'view-zoom-in', name: 'Zoom In', keys: ['='], modifiers: ['ctrl'], enabled: true },
      { id: 'view-zoom-out', name: 'Zoom Out', keys: ['-'], modifiers: ['ctrl'], enabled: true },
    ],
  },
  {
    id: 'general',
    name: 'General',
    shortcuts: [
      { id: 'general-palette', name: 'Command Palette', keys: ['k'], modifiers: ['ctrl', 'shift'], enabled: true },
      { id: 'general-theme', name: 'Toggle Theme', keys: ['t'], modifiers: ['ctrl', 'shift'], enabled: true },
      { id: 'general-help', name: 'Show Shortcuts', keys: ['/'], modifiers: ['ctrl', 'shift'], enabled: true },
    ],
  },
]

/** Keyboard Shortcuts Section Props */
export interface KeyboardShortcutsSectionProps {
  /** Locale language */
  locale?: Language
  /** Callback when shortcuts change */
  onChange?: (shortcuts: ShortcutCategory[]) => void
}

/**
 * Keyboard Shortcuts Settings Section.
 */
export function KeyboardShortcutsSection({ locale = 'en', onChange }: KeyboardShortcutsSectionProps) {
  const [language, setLanguage] = useState<Language>(locale)
  const [categories, setCategories] = useState<ShortcutCategory[]>(DEFAULT_SHORTCUTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [tempKeys, setTempKeys] = useState<string[]>([])
  const [tempModifiers, setTempModifiers] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const t = TRANSLATIONS[language]
  const isRTL = language === 'ar'

  const filteredCategories = categories.map(category => ({
    ...category,
    shortcuts: category.shortcuts.filter(shortcut =>
      shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.shortcuts.length > 0)

  useEffect(() => {
    if (!editingShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setEditingShortcut(null)
        setTempKeys([])
        setTempModifiers([])
        return
      }

      const mods: string[] = []
      if (e.ctrlKey) mods.push('ctrl')
      if (e.metaKey) mods.push('meta')
      if (e.shiftKey) mods.push('shift')
      if (e.altKey) mods.push('alt')

      const key = e.key === ' ' ? 'Space' : e.key

      setTempKeys([key])
      setTempModifiers(mods)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [editingShortcut])

  const handleEdit = useCallback((shortcutId: string) => {
    setEditingShortcut(shortcutId)
    setTempKeys([])
    setTempModifiers([])
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingShortcut || tempKeys.length === 0) return

    setCategories(prev => prev.map(category => ({
      ...category,
      shortcuts: category.shortcuts.map(shortcut =>
        shortcut.id === editingShortcut
          ? { ...shortcut, keys: tempKeys, modifiers: tempModifiers }
          : shortcut
      ),
    })))

    setEditingShortcut(null)
    setTempKeys([])
    setTempModifiers([])
    setHasChanges(true)
  }, [editingShortcut, tempKeys, tempModifiers])

  const handleToggle = useCallback((shortcutId: string) => {
    setCategories(prev => prev.map(category => ({
      ...category,
      shortcuts: category.shortcuts.map(shortcut =>
        shortcut.id === shortcutId
          ? { ...shortcut, enabled: !shortcut.enabled }
          : shortcut
      ),
    })))
    setHasChanges(true)
  }, [])

  const handleReset = useCallback((shortcutId?: string) => {
    if (shortcutId) {
      const defaultCategory = DEFAULT_SHORTCUTS.find(c =>
        c.shortcuts.some(s => s.id === shortcutId)
      )
      const defaultShortcut = defaultCategory?.shortcuts.find(s => s.id === shortcutId)

      if (defaultShortcut) {
        setCategories(prev => prev.map(category => ({
          ...category,
          shortcuts: category.shortcuts.map(shortcut =>
            shortcut.id === shortcutId
              ? { ...shortcut, keys: defaultShortcut.keys, modifiers: defaultShortcut.modifiers, enabled: defaultShortcut.enabled }
              : shortcut
          ),
        })))
      }
    } else {
      setCategories(DEFAULT_SHORTCUTS)
    }
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(() => {
    onChange?.(categories)
    setHasChanges(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }, [categories, onChange])

  const formatShortcut = useCallback((shortcut: ShortcutItem): string => {
    const parts: string[] = []
    if (shortcut.modifiers.includes('ctrl')) parts.push('Ctrl')
    if (shortcut.modifiers.includes('meta')) parts.push('Cmd')
    if (shortcut.modifiers.includes('shift')) parts.push('Shift')
    if (shortcut.modifiers.includes('alt')) parts.push('Alt')
    for (const key of shortcut.keys) {
      parts.push(key === ' ' ? 'Space' : key)
    }
    return parts.join(' + ')
  }, [])

  return (
    <div className={css.section} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={css.sectionHeader}>
        <h3>{t.title}</h3>
        <p>{t.subtitle}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={css.tabActive} onClick={() => setLanguage('en')}>English</button>
        <button className={css.tab} onClick={() => setLanguage('ar')}>العربية</button>
        <button className={css.tab} onClick={() => setLanguage('zh')}>中文</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 14,
            background: 'var(--bg-primary)',
            outline: 'none',
          }}
        />
        <button
          className={css.buttonDanger}
          onClick={() => {
            if (confirm(t.resetConfirm)) handleReset()
          }}
        >
          {t.resetAll}
        </button>
      </div>

      {showSaved && (
        <div style={{
          padding: '12px 16px',
          background: '#d1fae5',
          color: '#10b981',
          borderRadius: 8,
          fontSize: 14,
          marginBottom: 16,
        }}>
          {t.saved}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredCategories.map(category => (
          <div key={category.id} style={{
            background: 'var(--bg-secondary)',
            borderRadius: 12,
            padding: 16,
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {category.name}
            </h4>
            {category.shortcuts.map(shortcut => (
              <div key={shortcut.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                background: 'var(--bg-primary)',
                borderRadius: 8,
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>{shortcut.name}</span>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: shortcut.enabled ? '#d1fae5' : '#f3f4f6',
                    color: shortcut.enabled ? '#10b981' : '#6b7280',
                  }}>
                    {shortcut.enabled ? t.enabled : t.disabled}
                  </span>
                </div>

                {editingShortcut === shortcut.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: '#3b82f6' }}>{t.pressKeys}</span>
                    {tempKeys.length > 0 && (
                      <span style={{
                        padding: '4px 8px',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}>
                        {formatShortcut({ ...shortcut, keys: tempKeys, modifiers: tempModifiers })}
                      </span>
                    )}
                    <button className={css.buttonSmall} onClick={handleSaveEdit}>{t.save}</button>
                    <button className={css.tab} onClick={() => setEditingShortcut(null)}>{t.cancel}</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {shortcut.modifiers.map((mod, i) => (
                        <kbd key={`m-${i}`} style={{
                          padding: '4px 8px',
                          background: '#dbeafe',
                          border: '1px solid #3b82f6',
                          borderRadius: 6,
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: '#3b82f6',
                        }}>{mod}</kbd>
                      ))}
                      {shortcut.keys.map((key, i) => (
                        <kbd key={`k-${i}`} style={{
                          padding: '4px 8px',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          fontSize: 12,
                          fontFamily: 'monospace',
                        }}>{key}</kbd>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className={css.tab} onClick={() => handleToggle(shortcut.id)}>
                        {shortcut.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button className={css.buttonSmall} onClick={() => handleEdit(shortcut.id)}>{t.edit}</button>
                      <button className={css.tab} onClick={() => handleReset(shortcut.id)}>{t.reset}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>{t.noResults}</div>
        )}
      </div>

      {hasChanges && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: 16,
          marginTop: 20,
          borderTop: '1px solid var(--border)',
        }}>
          <button className={css.buttonPrimary} onClick={handleSave}>{t.save}</button>
          <button className={css.tab} onClick={() => { setCategories(DEFAULT_SHORTCUTS); setHasChanges(false) }}>{t.cancel}</button>
        </div>
      )}
    </div>
  )
}

export default KeyboardShortcutsSection
