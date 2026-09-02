/**
 * Command Palette UI for Idexal Agents.
 * Spotlight-style command palette with fuzzy search,
 * keyboard navigation, and categorized actions.
 */

import { useState, useCallback, useEffect, useRef } from 'react'

type Language = 'en' | 'ar' | 'zh'

interface CommandPaletteUIProps {
  language?: Language
  isOpen: boolean
  onClose: () => void
  onExecute?: (action: string) => void
}

interface Command {
  id: string
  label: string
  description: string
  category: string
  shortcut?: string
  icon: string
  action: string
}

const PALETTE_I18N: Record<Language, Record<string, string>> = {
  en: { placeholder: 'Type a command...', noResults: 'No commands found', recent: 'Recent', navigation: 'Navigation', editing: 'Editing', tools: 'Tools', git: 'Git', view: 'View' },
  ar: { placeholder: 'اكتب أمراً...', noResults: 'لم يتم العثور على أوامر', recent: 'الأخيرة', navigation: 'التنقل', editing: 'التحرير', tools: 'الأدوات', git: 'Git', view: 'عرض' },
  zh: { placeholder: '输入命令...', noResults: '未找到命令', recent: '最近', navigation: '导航', editing: '编辑', tools: '工具', git: 'Git', view: '视图' },
}

const ALL_COMMANDS: Command[] = [
  { id: 'nav-home', label: 'Go to Home', description: 'Navigate to home screen', category: 'navigation', shortcut: 'Ctrl+H', icon: '🏠', action: 'navigate:home' },
  { id: 'nav-settings', label: 'Go to Settings', description: 'Open settings', category: 'navigation', shortcut: 'Ctrl+,', icon: '⚙️', action: 'navigate:settings' },
  { id: 'nav-search', label: 'Search', description: 'Open search', category: 'navigation', shortcut: 'Ctrl+K', icon: '🔍', action: 'navigate:search' },
  { id: 'edit-format', label: 'Format Code', description: 'Format document', category: 'editing', shortcut: 'Shift+Alt+F', icon: '✨', action: 'edit:format' },
  { id: 'edit-undo', label: 'Undo', description: 'Undo last action', category: 'editing', shortcut: 'Ctrl+Z', icon: '↩️', action: 'edit:undo' },
  { id: 'edit-redo', label: 'Redo', description: 'Redo last action', category: 'editing', shortcut: 'Ctrl+Shift+Z', icon: '↪️', action: 'edit:redo' },
  { id: 'tool-review', label: 'Run Code Review', description: 'Review current code', category: 'tools', shortcut: 'Ctrl+Shift+R', icon: '🤖', action: 'tool:review' },
  { id: 'tool-test', label: 'Run Tests', description: 'Run tests', category: 'tools', shortcut: 'Ctrl+Shift+T', icon: '🧪', action: 'tool:test' },
  { id: 'tool-build', label: 'Build Project', description: 'Build the project', category: 'tools', shortcut: 'Ctrl+Shift+B', icon: '🔨', action: 'tool:build' },
  { id: 'tool-docs', label: 'Generate Docs', description: 'Generate documentation', category: 'tools', icon: '📝', action: 'tool:docs' },
  { id: 'tool-format', label: 'Format Code', description: 'Format with Prettier', category: 'tools', icon: '✨', action: 'tool:format' },
  { id: 'tool-migrate', label: 'Migration Planner', description: 'Plan code migration', category: 'tools', icon: '🔄', action: 'tool:migrate' },
  { id: 'git-commit', label: 'Git Commit', description: 'Commit changes', category: 'git', shortcut: 'Ctrl+Shift+G', icon: '📝', action: 'git:commit' },
  { id: 'git-push', label: 'Git Push', description: 'Push commits', category: 'git', shortcut: 'Ctrl+Shift+P', icon: '📤', action: 'git:push' },
  { id: 'git-pull', label: 'Git Pull', description: 'Pull changes', category: 'git', shortcut: 'Ctrl+Shift+L', icon: '📥', action: 'git:pull' },
  { id: 'git-status', label: 'Git Status', description: 'Show git status', category: 'git', icon: '📊', action: 'git:status' },
  { id: 'view-sidebar', label: 'Toggle Sidebar', description: 'Show/hide sidebar', category: 'view', shortcut: 'Ctrl+B', icon: '📏', action: 'view:sidebar' },
  { id: 'view-terminal', label: 'Toggle Terminal', description: 'Show/hide terminal', category: 'view', shortcut: 'Ctrl+`', icon: '💻', action: 'view:terminal' },
  { id: 'view-zoom-in', label: 'Zoom In', description: 'Zoom in', category: 'view', shortcut: 'Ctrl++', icon: '🔎', action: 'view:zoom-in' },
  { id: 'view-zoom-out', label: 'Zoom Out', description: 'Zoom out', category: 'view', shortcut: 'Ctrl+-', icon: '🔎', action: 'view:zoom-out' },
  { id: 'theme-toggle', label: 'Toggle Theme', description: 'Switch dark/light theme', category: 'view', shortcut: 'Ctrl+Shift+D', icon: '🎨', action: 'theme:toggle' },
  { id: 'lang-switch', label: 'Switch Language', description: 'Change display language', category: 'view', icon: '🌐', action: 'lang:switch' },
]

function fuzzyMatch(query: string, text: string): number {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t.includes(q)) return 1
  let qi = 0, matched = 0
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { matched++; qi++ }
  }
  return qi === q.length ? matched / q.length : 0
}

function highlightMatch(text: string, query: string): { text: string; highlighted: boolean }[] {
  if (!query) return [{ text, highlighted: false }]
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return [{ text, highlighted: false }]
  return [
    { text: text.slice(0, idx), highlighted: false },
    { text: text.slice(idx, idx + query.length), highlighted: true },
    { text: text.slice(idx + query.length), highlighted: false },
  ]
}

/**
 * Command Palette UI component.
 */
export function CommandPaletteUI({ language = 'en', isOpen, onClose, onExecute }: CommandPaletteUIProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const t = PALETTE_I18N[language] ?? PALETTE_I18N.en

  const filtered = query
    ? ALL_COMMANDS
        .map(cmd => ({ cmd, score: Math.max(fuzzyMatch(query, cmd.label), fuzzyMatch(query, cmd.description) * 0.7, fuzzyMatch(query, cmd.category) * 0.5) }))
        .filter(r => r.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .map(r => r.cmd)
    : ALL_COMMANDS

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    const cat = cmd.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(cmd)
    return acc
  }, {})

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[selectedIndex]
      if (cmd) {
        onExecute?.(cmd.action)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filtered, selectedIndex, onExecute, onClose])

  if (!isOpen) return null

  let globalIdx = 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ width: '560px', maxHeight: '480px', background: '#1e293b', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', overflow: 'hidden', border: '1px solid #334155' }} onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '16px', outline: 'none' }}
          />
          <kbd style={{ background: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: '#94a3b8' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
              <p>{t.noResults}</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, commands]) => (
              <div key={category} style={{ marginBottom: '8px' }}>
                <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t[category] ?? category}
                </div>
                {commands.map(cmd => {
                  const idx = globalIdx++
                  const isSelected = idx === selectedIndex
                  const labelParts = highlightMatch(cmd.label, query)
                  const descParts = highlightMatch(cmd.description, query)

                  return (
                    <div
                      key={cmd.id}
                      onClick={() => { onExecute?.(cmd.action); onClose() }}
                      style={{
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        background: isSelected ? '#334155' : 'transparent',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{cmd.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>
                          {labelParts.map((part, i) => (
                            <span key={i} style={part.highlighted ? { color: '#8b5cf6', fontWeight: 700 } : undefined}>{part.text}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {descParts.map((part, i) => (
                            <span key={i} style={part.highlighted ? { color: '#8b5cf6' } : undefined}>{part.text}</span>
                          ))}
                        </div>
                      </div>
                      {cmd.shortcut && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {cmd.shortcut.split('+').map((key, i) => (
                            <kbd key={i} style={{ background: '#0f172a', border: '1px solid #475569', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#94a3b8' }}>
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #334155', display: 'flex', gap: '16px', fontSize: '11px', color: '#64748b' }}>
          <span><kbd style={{ background: '#0f172a', padding: '1px 4px', borderRadius: '3px', border: '1px solid #475569' }}>↑↓</kbd> Navigate</span>
          <span><kbd style={{ background: '#0f172a', padding: '1px 4px', borderRadius: '3px', border: '1px solid #475569' }}>↵</kbd> Select</span>
          <span><kbd style={{ background: '#0f172a', padding: '1px 4px', borderRadius: '3px', border: '1px solid #475569' }}>esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}

export type { CommandPaletteUIProps, Command }
