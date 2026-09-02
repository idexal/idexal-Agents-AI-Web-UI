/**
 * Command Palette UI for Idexal Agents.
 * Beautiful command palette with search, keyboard navigation, and categories.
 * Now with automatic RTL layout support for Arabic.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  KeyboardShortcutsEngine,
  getKeyboardShortcutsEngine,
  SHORTCUT_TRANSLATIONS,
  type Command,
  type CommandPaletteState,
  type KeyboardShortcut,
} from './KeyboardShortcuts.ts'

/** Language type */
type Language = 'en' | 'ar' | 'zh'

/** Command Palette Props */
export interface CommandPaletteProps {
  language?: Language
  onCommandExecute?: (commandId: string) => void
  onShortcutCustomize?: (shortcutId: string) => void
}

/**
 * Command Palette Component.
 */
export function CommandPalette({
  language = 'en',
  onCommandExecute,
  onShortcutCustomize,
}: CommandPaletteProps) {
  const t = SHORTCUT_TRANSLATIONS[language] ?? SHORTCUT_TRANSLATIONS.en ?? {}
  const isRTL = language === 'ar'

  const [engine] = useState(() => getKeyboardShortcutsEngine())
  const [state, setState] = useState<CommandPaletteState>(engine.getPaletteState())
  const [activeTab, setActiveTab] = useState<'commands' | 'shortcuts'>('commands')

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = engine.onPaletteChange(setState)
    return unsub
  }, [engine])

  useEffect(() => {
    if (state.isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state.isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector('.command-selected')
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [state.selectedIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        engine.navigatePalette('down')
        break
      case 'ArrowUp':
        e.preventDefault()
        engine.navigatePalette('up')
        break
      case 'Enter':
        e.preventDefault()
        const success = engine.executeSelectedCommand()
        if (success) {
          onCommandExecute?.(state.filteredCommands[state.selectedIndex]?.id ?? '')
        }
        break
      case 'Escape':
        e.preventDefault()
        engine.closePalette()
        break
    }
  }, [engine, state.filteredCommands, state.selectedIndex, onCommandExecute])

  const handleBackdropClick = useCallback(() => {
    engine.closePalette()
  }, [engine])

  if (!state.isOpen) return null

  const groupedCommands = groupCommands(state.filteredCommands)
  const recentCommands = state.recentCommands
    .map(id => engine.getCommand(id))
    .filter((cmd): cmd is Command => cmd !== undefined)

  return (
    <div
      className="command-palette-overlay"
      onClick={handleBackdropClick}
      dir={isRTL ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="palette-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder={t.searchCommands}
            value={state.query}
            onChange={(e) => engine.updatePaletteQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
            role="combobox"
            aria-expanded={state.filteredCommands.length > 0}
            aria-controls="palette-listbox"
            aria-activedescendant={state.filteredCommands[state.selectedIndex]?.id ? `palette-item-${state.filteredCommands[state.selectedIndex]!.id}` : undefined}
            aria-label={t.searchCommands}
            aria-autocomplete="list"
          />
          <kbd className="palette-esc">Esc</kbd>
        </div>

        {/* Tabs */}
        <div className="palette-tabs" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <button
            className={`palette-tab ${activeTab === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveTab('commands')}
          >
            {t.allCommands}
          </button>
          <button
            className={`palette-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            {t.customShortcuts}
          </button>
        </div>

        {/* Content */}
        <div className="palette-content" ref={listRef} id="palette-listbox" role="listbox" aria-label="Commands">
          {activeTab === 'commands' ? (
            <>
              {/* Recent Commands */}
              {!state.query && recentCommands.length > 0 && (
                <div className="command-section">
                  <div className="section-label">{t.recentCommands}</div>
                  {recentCommands.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      isSelected={false}
                      id={`palette-item-${cmd.id}`}
                      onClick={() => {
                        engine.executeCommand(cmd.id)
                        onCommandExecute?.(cmd.id)
                      }}
                      formatShortcut={engine.formatShortcut.bind(engine)}
                      isRTL={isRTL}
                    />
                  ))}
                </div>
              )}

              {/* Command Groups */}
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="command-section">
                  <div className="section-label">{category}</div>
                  {commands.map((cmd) => {
                    const globalIndex = state.filteredCommands.indexOf(cmd)
                    return (
                      <CommandItem
                        key={cmd.id}
                        command={cmd}
                        isSelected={globalIndex === state.selectedIndex}
                        id={`palette-item-${cmd.id}`}
                        onClick={() => {
                          engine.executeCommand(cmd.id)
                          onCommandExecute?.(cmd.id)
                        }}
                        formatShortcut={engine.formatShortcut.bind(engine)}
                        isRTL={isRTL}
                      />
                    )
                  })}
                </div>
              ))}

              {/* No Results */}
              {state.filteredCommands.length === 0 && (
                <div className="no-results">
                  <span>{t.noResults}</span>
                </div>
              )}
            </>
          ) : (
            /* Shortcuts Tab */
            <ShortcutsList
              engine={engine}
              language={language}
              isRTL={isRTL}
              onCustomize={(id) => {
                onShortcutCustomize?.(id)
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="palette-footer">
          <div className="footer-hints" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
            <span className="hint">
              <kbd>{isRTL ? '↓↑' : '↑↓'}</kbd> {isRTL ? 'التنقل' : 'Navigate'}
            </span>
            <span className="hint">
              <kbd>Enter</kbd> {t.pressEnter}
            </span>
            <span className="hint">
              <kbd>Esc</kbd> {t.pressEsc}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .command-palette-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 15vh;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }

        .command-palette {
          width: 560px;
          max-width: 95vw;
          max-height: 450px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .palette-header {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-light, #f3f4f6);
        }

        .palette-input {
          flex: 1;
          padding: 8px 0;
          background: none;
          border: none;
          font-size: 16px;
          color: var(--text-primary, #111827);
          outline: none;
        }

        .palette-input::placeholder {
          color: var(--text-muted, #9ca3af);
        }

        .palette-esc {
          padding: 4px 8px;
          background: var(--bg-secondary, #f3f4f6);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
          color: var(--text-secondary, #6b7280);
        }

        .palette-tabs {
          display: flex;
          padding: 0 16px;
          border-bottom: 1px solid var(--border-light, #f3f4f6);
        }

        .palette-tab {
          padding: 10px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          transition: all 0.15s;
        }

        .palette-tab:hover {
          color: var(--text-primary, #111827);
        }

        .palette-tab.active {
          color: var(--color-primary, #3b82f6);
          border-bottom-color: var(--color-primary, #3b82f6);
        }

        .palette-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .command-section {
          margin-bottom: 8px;
        }

        .section-label {
          padding: 8px 12px 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted, #9ca3af);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .command-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.1s;
        }

        .command-item:hover,
        .command-item.selected {
          background: var(--bg-hover, #f3f4f6);
        }

        .command-item.selected {
          background: var(--color-primary-light, #dbeafe);
        }

        .command-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary, #f3f4f6);
          border-radius: 8px;
          font-size: 16px;
          flex-shrink: 0;
        }

        .command-info {
          flex: 1;
          min-width: 0;
        }

        .command-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #111827);
        }

        .command-desc {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .command-shortcut {
          display: flex;
          gap: 4px;
        }

        .command-shortcut kbd {
          padding: 2px 6px;
          background: var(--bg-secondary, #f3f4f6);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
          color: var(--text-secondary, #6b7280);
        }

        .no-results {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          color: var(--text-muted, #9ca3af);
          font-size: 14px;
        }

        .palette-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-light, #f3f4f6);
          background: var(--bg-secondary, #f9fafb);
        }

        .footer-hints {
          display: flex;
          gap: 16px;
        }

        .hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .hint kbd {
          padding: 2px 6px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
        }

        .shortcuts-list {
          padding: 8px;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          transition: background 0.1s;
        }

        .shortcut-item:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        .shortcut-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shortcut-keys {
          display: flex;
          gap: 4px;
        }

        .shortcut-keys kbd {
          padding: 4px 8px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 6px;
          font-size: 12px;
          font-family: monospace;
          color: var(--text-primary, #111827);
          min-width: 28px;
          text-align: center;
        }

        .shortcut-actions {
          display: flex;
          gap: 8px;
        }

        .shortcut-btn {
          padding: 4px 8px;
          font-size: 11px;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          cursor: pointer;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }

        .shortcut-btn:hover {
          background: var(--bg-hover, #f3f4f6);
          color: var(--text-primary, #111827);
        }

        .shortcut-btn.customizing {
          background: var(--color-primary, #3b82f6);
          border-color: var(--color-primary, #3b82f6);
          color: white;
        }

        .shortcut-category {
          padding: 12px 12px 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted, #9ca3af);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  )
}

/** Command Item Props */
interface CommandItemProps {
  command: Command
  isSelected: boolean
  onClick: () => void
  formatShortcut: (shortcut: KeyboardShortcut) => string
  isRTL: boolean
  id?: string
}

function CommandItem({ command, isSelected, onClick, formatShortcut: _formatShortcut, isRTL, id }: CommandItemProps) {
  return (
    <div
      className={`command-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
      role="option"
      id={id}
      aria-selected={isSelected}
    >
      <div className="command-icon">
        {command.icon || '\u{1F4C1}'}
      </div>
      <div className="command-info" style={{ textAlign: isRTL ? 'right' : 'left' }}>
        <div className="command-name">{command.name}</div>
        <div className="command-desc">{command.description}</div>
      </div>
      {command.shortcut && (
        <div className="command-shortcut">
          {command.shortcut.split('+').map((key, i) => (
            <kbd key={i}>{key.trim()}</kbd>
          ))}
        </div>
      )}
    </div>
  )
}

/** Shortcuts List Props */
interface ShortcutsListProps {
  engine: KeyboardShortcutsEngine
  language: Language
  isRTL: boolean
  onCustomize: (shortcutId: string) => void
}

function ShortcutsList({ engine, language: _language, isRTL, onCustomize }: ShortcutsListProps) {
  const categories = engine.getCategories()
  const [customizing, setCustomizing] = useState<string | null>(null)

  const editLabel = isRTL ? 'تعديل' : 'Edit'
  const pressKeysLabel = isRTL ? 'اضغط المفاتيح' : 'Press keys...'

  return (
    <div className="shortcuts-list">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="shortcut-category">{category.name}</div>
          {category.shortcuts.map((shortcut) => (
            <div key={shortcut.id} className="shortcut-item" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <div className="shortcut-info" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div className="shortcut-name">{shortcut.description}</div>
              </div>
              <div className="shortcut-actions">
                <div className="shortcut-keys">
                  {engine.formatShortcut(shortcut).split(' + ').map((key, i) => (
                    <kbd key={i}>{key}</kbd>
                  ))}
                </div>
                <button
                  className={`shortcut-btn ${customizing === shortcut.id ? 'customizing' : ''}`}
                  onClick={() => {
                    setCustomizing(customizing === shortcut.id ? null : shortcut.id)
                    onCustomize(shortcut.id)
                  }}
                >
                  {customizing === shortcut.id ? pressKeysLabel : editLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Group commands by category */
function groupCommands(commands: Command[]): Record<string, Command[]> {
  const grouped: Record<string, Command[]> = {}

  for (const command of commands) {
    const category = command.category || 'Other'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(command)
  }

  return grouped
}

export default CommandPalette
