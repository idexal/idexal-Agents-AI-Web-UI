/**
 * Keyboard Shortcuts & Command Palette Engine for Idexal Agents.
 * Provides customizable shortcuts, command registration, and command palette.
 */

/** Modifier keys */
export type Modifier = 'ctrl' | 'meta' | 'shift' | 'alt'

/** Keyboard shortcut definition */
export interface KeyboardShortcut {
  id: string
  keys: string[]
  modifiers: Modifier[]
  description: string
  category: string
  enabled: boolean
  action: () => void
}

/** Command definition */
export interface Command {
  id: string
  name: string
  description: string
  category: string
  shortcut: string | undefined
  icon: string | undefined
  action: () => void
  keywords: string[]
  enabled: boolean
}

/** Shortcut category */
export interface ShortcutCategory {
  id: string
  name: string
  description: string
  shortcuts: KeyboardShortcut[]
}

/** Command palette state */
export interface CommandPaletteState {
  isOpen: boolean
  query: string
  selectedIndex: number
  filteredCommands: Command[]
  recentCommands: string[]
}

/** Configuration */
export interface KeyboardShortcutsConfig {
  enabled: boolean
  storageKey: string
  enableCommandPalette: boolean
  commandPaletteTrigger: string[]
  maxRecentCommands: number
  onShortcutTriggered: ((shortcut: KeyboardShortcut) => void) | undefined
  onCommandExecuted: ((command: Command) => void) | undefined
}

/** Translations */
export const SHORTCUT_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    commandPalette: 'Command Palette',
    searchCommands: 'Search commands...',
    recentCommands: 'Recent',
    allCommands: 'All Commands',
    noResults: 'No commands found',
    pressEnter: 'Press Enter to execute',
    pressEsc: 'Press Esc to close',
    customShortcuts: 'Custom Shortcuts',
    resetShortcuts: 'Reset to Default',
    save: 'Save',
    cancel: 'Cancel',
    categoryNavigation: 'Navigation',
    categoryChat: 'Chat',
    categoryEdit: 'Edit',
    categoryView: 'View',
    categoryGeneral: 'General',
    categoryTheme: 'Theme',
  },
  ar: {
    commandPalette: '\u0644\u0648\u062d\u0629 \u0627\u0644\u0623\u0648\u0627\u0645\u0631',
    searchCommands: '\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0623\u0648\u0627\u0645\u0631...',
    recentCommands: '\u0627\u0644\u0623\u062e\u064a\u0631\u0629',
    allCommands: '\u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0648\u0627\u0645\u0631',
    noResults: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c',
    pressEnter: '\u0627\u0636\u063a\u0637 Enter \u0644\u0644\u062a\u0646\u0641\u064a\u0630',
    pressEsc: '\u0627\u0636\u063a\u0637 Esc \u0644\u0644\u0625\u063a\u0644\u0627\u0642',
    customShortcuts: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062e\u0635\u0635\u0629',
    resetShortcuts: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646',
    save: '\u062d\u0641\u0638',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    categoryNavigation: '\u0627\u0644\u062a\u0646\u0642\u0644',
    categoryChat: '\u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629',
    categoryEdit: '\u0627\u0644\u062a\u0639\u062f\u064a\u0644',
    categoryView: '\u0627\u0644\u0639\u0631\u0636',
    categoryGeneral: '\u0639\u0627\u0645',
    categoryTheme: '\u0627\u0644\u0633\u0645\u0629',
  },
  zh: {
    commandPalette: '\u547d\u4ee4\u9762\u677f',
    searchCommands: '\u641c\u7d22\u547d\u4ee4...',
    recentCommands: '\u6700\u8fd1\u4f7f\u7528',
    allCommands: '\u6240\u6709\u547d\u4ee4',
    noResults: '\u672a\u627e\u5230\u547d\u4ee4',
    pressEnter: '\u6309 Enter \u6267\u884c',
    pressEsc: '\u6309 Esc \u5173\u95ed',
    customShortcuts: '\u81ea\u5b9a\u4e49\u5feb\u6377\u952e',
    resetShortcuts: '\u91cd\u7f6e\u4e3a\u9ed8\u8ba4',
    save: '\u4fdd\u5b58',
    cancel: '\u53d6\u6d88',
    categoryNavigation: '\u5bfc\u822a',
    categoryChat: '\u5bf9\u8bdd',
    categoryEdit: '\u7f16\u8f91',
    categoryView: '\u89c6\u56fe',
    categoryGeneral: '\u901a\u7528',
    categoryTheme: '\u4e3b\u9898',
  },
}

/** Default shortcuts */
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { id: 'nav-home', keys: ['1'], modifiers: ['alt'], description: 'Go to Home', category: 'navigation', enabled: true, action: () => {} },
  { id: 'nav-chat', keys: ['2'], modifiers: ['alt'], description: 'Go to Chat', category: 'navigation', enabled: true, action: () => {} },
  { id: 'nav-settings', keys: ['3'], modifiers: ['alt'], description: 'Go to Settings', category: 'navigation', enabled: true, action: () => {} },
  { id: 'nav-search', keys: ['k'], modifiers: ['ctrl'], description: 'Open Search', category: 'navigation', enabled: true, action: () => {} },

  // Chat
  { id: 'chat-new', keys: ['n'], modifiers: ['ctrl'], description: 'New Chat', category: 'chat', enabled: true, action: () => {} },
  { id: 'chat-send', keys: ['Enter'], modifiers: [], description: 'Send Message', category: 'chat', enabled: true, action: () => {} },
  { id: 'chat-stop', keys: ['Escape'], modifiers: [], description: 'Stop Generation', category: 'chat', enabled: true, action: () => {} },
  { id: 'chat-clear', keys: ['Delete'], modifiers: ['ctrl', 'shift'], description: 'Clear Chat', category: 'chat', enabled: true, action: () => {} },

  // Edit
  { id: 'edit-undo', keys: ['z'], modifiers: ['ctrl'], description: 'Undo', category: 'edit', enabled: true, action: () => {} },
  { id: 'edit-redo', keys: ['z'], modifiers: ['ctrl', 'shift'], description: 'Redo', category: 'edit', enabled: true, action: () => {} },
  { id: 'edit-copy', keys: ['c'], modifiers: ['ctrl'], description: 'Copy', category: 'edit', enabled: true, action: () => {} },
  { id: 'edit-paste', keys: ['v'], modifiers: ['ctrl'], description: 'Paste', category: 'edit', enabled: true, action: () => {} },
  { id: 'edit-selectall', keys: ['a'], modifiers: ['ctrl'], description: 'Select All', category: 'edit', enabled: true, action: () => {} },

  // View
  { id: 'view-sidebar', keys: ['b'], modifiers: ['ctrl'], description: 'Toggle Sidebar', category: 'view', enabled: true, action: () => {} },
  { id: 'view-fullscreen', keys: ['f'], modifiers: ['ctrl', 'shift'], description: 'Toggle Fullscreen', category: 'view', enabled: true, action: () => {} },
  { id: 'view-zoom-in', keys: ['='], modifiers: ['ctrl'], description: 'Zoom In', category: 'view', enabled: true, action: () => {} },
  { id: 'view-zoom-out', keys: ['-'], modifiers: ['ctrl'], description: 'Zoom Out', category: 'view', enabled: true, action: () => {} },

  // General
  { id: 'general-palette', keys: ['k'], modifiers: ['ctrl', 'shift'], description: 'Command Palette', category: 'general', enabled: true, action: () => {} },
  { id: 'general-theme', keys: ['t'], modifiers: ['ctrl', 'shift'], description: 'Toggle Theme', category: 'general', enabled: true, action: () => {} },
  { id: 'general-help', keys: ['/'], modifiers: ['ctrl', 'shift'], description: 'Show Shortcuts', category: 'general', enabled: true, action: () => {} },
]

/**
 * Keyboard Shortcuts Engine.
 */
export class KeyboardShortcutsEngine {
  private config: KeyboardShortcutsConfig
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private commands: Map<string, Command> = new Map()
  private categories: Map<string, ShortcutCategory> = new Map()
  private paletteState: CommandPaletteState
  private listeners: Set<(state: CommandPaletteState) => void> = new Set()
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(config: Partial<KeyboardShortcutsConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      storageKey: config.storageKey ?? 'idexal-shortcuts',
      enableCommandPalette: config.enableCommandPalette ?? true,
      commandPaletteTrigger: config.commandPaletteTrigger ?? ['k'],
      maxRecentCommands: config.maxRecentCommands ?? 10,
      onShortcutTriggered: config.onShortcutTriggered,
      onCommandExecuted: config.onCommandExecuted,
    }

    this.paletteState = {
      isOpen: false,
      query: '',
      selectedIndex: 0,
      filteredCommands: [],
      recentCommands: this.loadRecentCommands(),
    }

    // Load default shortcuts
    for (const shortcut of DEFAULT_SHORTCUTS) {
      this.shortcuts.set(shortcut.id, { ...shortcut })
    }

    // Load custom shortcuts from storage
    this.loadCustomShortcuts()

    // Build categories
    this.buildCategories()

    // Setup keyboard listener
    if (this.config.enabled) {
      this.setupKeyboardListener()
    }
  }

  // === Shortcut Management ===

  /**
   * Register a shortcut.
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut)
    this.buildCategories()
  }

  /**
   * Update a shortcut.
   */
  updateShortcut(id: string, updates: Partial<KeyboardShortcut>): boolean {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return false

    const updated = { ...shortcut, ...updates }
    this.shortcuts.set(id, updated)
    this.saveCustomShortcuts()
    this.buildCategories()
    return true
  }

  /**
   * Get a shortcut by ID.
   */
  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id)
  }

  /**
   * Get all shortcuts.
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Get shortcuts by category.
   */
  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
      .filter(s => s.category === category)
  }

  /**
   * Get shortcut categories.
   */
  getCategories(): ShortcutCategory[] {
    return Array.from(this.categories.values())
  }

  /**
   * Reset shortcuts to default.
   */
  resetShortcuts(): void {
    this.shortcuts.clear()
    for (const shortcut of DEFAULT_SHORTCUTS) {
      this.shortcuts.set(shortcut.id, { ...shortcut })
    }
    this.saveCustomShortcuts()
    this.buildCategories()
  }

  /**
   * Format shortcut for display.
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = []

    if (shortcut.modifiers.includes('ctrl')) parts.push('Ctrl')
    if (shortcut.modifiers.includes('meta')) parts.push('Cmd')
    if (shortcut.modifiers.includes('shift')) parts.push('Shift')
    if (shortcut.modifiers.includes('alt')) parts.push('Alt')

    for (const key of shortcut.keys) {
      parts.push(this.formatKey(key))
    }

    return parts.join(' + ')
  }

  /**
   * Format key for display.
   */
  private formatKey(key: string): string {
    const keyMap: Record<string, string> = {
      'Escape': 'Esc',
      'Enter': 'Enter',
      'Backspace': 'Bksp',
      'Delete': 'Del',
      'ArrowUp': '\u2191',
      'ArrowDown': '\u2193',
      'ArrowLeft': '\u2190',
      'ArrowRight': '\u2192',
      ' ': 'Space',
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      'Shift': 'Shift',
      'Alt': 'Alt',
    }
    return keyMap[key] || key.toUpperCase()
  }

  // === Command Management ===

  /**
   * Register a command.
   */
  registerCommand(command: Command): void {
    this.commands.set(command.id, command)
  }

  /**
   * Get a command by ID.
   */
  getCommand(id: string): Command | undefined {
    return this.commands.get(id)
  }

  /**
   * Get all commands.
   */
  getAllCommands(): Command[] {
    return Array.from(this.commands.values())
  }

  /**
   * Get enabled commands.
   */
  getEnabledCommands(): Command[] {
    return this.getAllCommands().filter(c => c.enabled)
  }

  /**
   * Execute a command.
   */
  executeCommand(id: string): boolean {
    const command = this.commands.get(id)
    if (!command || !command.enabled) return false

    command.action()

    // Update recent commands
    this.paletteState.recentCommands = [
      id,
      ...this.paletteState.recentCommands.filter(r => r !== id),
    ].slice(0, this.config.maxRecentCommands)

    this.saveRecentCommands()
    this.config.onCommandExecuted?.(command)
    return true
  }

  // === Command Palette ===

  /**
   * Open command palette.
   */
  openPalette(): void {
    this.paletteState.isOpen = true
    this.paletteState.query = ''
    this.paletteState.selectedIndex = 0
    this.paletteState.filteredCommands = this.getEnabledCommands()
    this.notifyListeners()
  }

  /**
   * Close command palette.
   */
  closePalette(): void {
    this.paletteState.isOpen = false
    this.notifyListeners()
  }

  /**
   * Toggle command palette.
   */
  togglePalette(): void {
    if (this.paletteState.isOpen) {
      this.closePalette()
    } else {
      this.openPalette()
    }
  }

  /**
   * Update palette query.
   */
  updatePaletteQuery(query: string): void {
    this.paletteState.query = query
    this.paletteState.selectedIndex = 0

    if (!query.trim()) {
      this.paletteState.filteredCommands = this.getEnabledCommands()
    } else {
      const lowerQuery = query.toLowerCase()
      this.paletteState.filteredCommands = this.getEnabledCommands().filter(cmd => {
        return (
          cmd.name.toLowerCase().includes(lowerQuery) ||
          cmd.description.toLowerCase().includes(lowerQuery) ||
          cmd.category.toLowerCase().includes(lowerQuery) ||
          cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery))
        )
      })
    }

    this.notifyListeners()
  }

  /**
   * Navigate palette selection.
   */
  navigatePalette(direction: 'up' | 'down'): void {
    const max = this.paletteState.filteredCommands.length - 1
    if (direction === 'up') {
      this.paletteState.selectedIndex = Math.max(0, this.paletteState.selectedIndex - 1)
    } else {
      this.paletteState.selectedIndex = Math.min(max, this.paletteState.selectedIndex + 1)
    }
    this.notifyListeners()
  }

  /**
   * Execute selected command.
   */
  executeSelectedCommand(): boolean {
    const selected = this.paletteState.filteredCommands[this.paletteState.selectedIndex]
    if (!selected) return false

    this.closePalette()
    return this.executeCommand(selected.id)
  }

  /**
   * Get palette state.
   */
  getPaletteState(): Readonly<CommandPaletteState> {
    return this.paletteState
  }

  /**
   * Subscribe to palette state changes.
   */
  onPaletteChange(listener: (state: CommandPaletteState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // === Persistence ===

  /**
   * Save custom shortcuts.
   */
  private saveCustomShortcuts(): void {
    if (typeof window === 'undefined') return

    try {
      const custom: Record<string, Partial<KeyboardShortcut>> = {}
      for (const [id, shortcut] of this.shortcuts) {
        const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id)
        if (defaultShortcut) {
          if (
            shortcut.keys.join() !== defaultShortcut.keys.join() ||
            shortcut.modifiers.join() !== defaultShortcut.modifiers.join() ||
            shortcut.enabled !== defaultShortcut.enabled
          ) {
            custom[id] = {
              keys: shortcut.keys,
              modifiers: shortcut.modifiers,
              enabled: shortcut.enabled,
            }
          }
        }
      }
      localStorage.setItem(this.config.storageKey, JSON.stringify(custom))
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Load custom shortcuts.
   */
  private loadCustomShortcuts(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (!stored) return

      const custom = JSON.parse(stored) as Record<string, Partial<KeyboardShortcut>>
      for (const [id, updates] of Object.entries(custom)) {
        const shortcut = this.shortcuts.get(id)
        if (shortcut) {
          this.shortcuts.set(id, { ...shortcut, ...updates })
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  /**
   * Save recent commands.
   */
  private saveRecentCommands(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(
        `${this.config.storageKey}-recent`,
        JSON.stringify(this.paletteState.recentCommands)
      )
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Load recent commands.
   */
  private loadRecentCommands(): string[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(`${this.config.storageKey}-recent`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // === Keyboard Listener ===

  /**
   * Setup keyboard listener.
   */
  private setupKeyboardListener(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      // Command palette trigger
      if (
        this.config.enableCommandPalette &&
        this.matchesKeys(e, this.config.commandPaletteTrigger, ['ctrl', 'shift'])
      ) {
        e.preventDefault()
        this.togglePalette()
        return
      }

      // Execute matching shortcut
      for (const shortcut of this.shortcuts.values()) {
        if (!shortcut.enabled) continue

        if (this.matchesKeys(e, shortcut.keys, shortcut.modifiers)) {
          // Don't intercept if typing in an input
          const target = e.target as HTMLElement
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Allow some shortcuts in inputs
            if (!shortcut.id.startsWith('edit-') && !shortcut.id.startsWith('chat-')) {
              continue
            }
          }

          e.preventDefault()
          shortcut.action()
          this.config.onShortcutTriggered?.(shortcut)
          return
        }
      }
    }

    document.addEventListener('keydown', this.keydownHandler)
  }

  /**
   * Check if keyboard event matches keys and modifiers.
   */
  private matchesKeys(e: KeyboardEvent, keys: string[], modifiers: Modifier[]): boolean {
    // Check modifiers
    if (modifiers.includes('ctrl') && !e.ctrlKey && !e.metaKey) return false
    if (modifiers.includes('meta') && !e.metaKey) return false
    if (modifiers.includes('shift') && !e.shiftKey) return false
    if (modifiers.includes('alt') && !e.altKey) return false

    // Check if event key matches any of the target keys
    const eventKey = e.key.toLowerCase()
    return keys.some(key => key.toLowerCase() === eventKey)
  }

  // === Internal ===

  /**
   * Build categories from shortcuts.
   */
  private buildCategories(): void {
    this.categories.clear()

    for (const shortcut of this.shortcuts.values()) {
      let category = this.categories.get(shortcut.category)
      if (!category) {
        category = {
          id: shortcut.category,
          name: this.getCategoryName(shortcut.category),
          description: this.getCategoryDescription(shortcut.category),
          shortcuts: [],
        }
        this.categories.set(shortcut.category, category)
      }
      category.shortcuts.push(shortcut)
    }
  }

  /**
   * Get category display name.
   */
  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      navigation: 'Navigation',
      chat: 'Chat',
      edit: 'Edit',
      view: 'View',
      general: 'General',
      theme: 'Theme',
    }
    return names[category] || category
  }

  /**
   * Get category description.
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      navigation: 'Navigate between sections',
      chat: 'Chat-related actions',
      edit: 'Text editing shortcuts',
      view: 'View and display options',
      general: 'General application shortcuts',
      theme: 'Theme and appearance',
    }
    return descriptions[category] || ''
  }

  /**
   * Notify listeners.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.paletteState)
      } catch (error) {
        console.error('Command palette listener error:', error)
      }
    }
  }

  /**
   * Destroy the engine.
   */
  destroy(): void {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
    }
    this.listeners.clear()
  }
}

/**
 * Singleton instance.
 */
let instance: KeyboardShortcutsEngine | null = null

export function getKeyboardShortcutsEngine(
  config?: Partial<KeyboardShortcutsConfig>
): KeyboardShortcutsEngine {
  if (!instance) {
    instance = new KeyboardShortcutsEngine(config)
  }
  return instance
}

/**
 * Format key for display.
 */
export function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    'Escape': 'Esc',
    'Enter': 'Enter',
    'Backspace': 'Bksp',
    'Delete': 'Del',
    'ArrowUp': '\u2191',
    'ArrowDown': '\u2193',
    'ArrowLeft': '\u2190',
    'ArrowRight': '\u2192',
    ' ': 'Space',
    'Control': 'Ctrl',
    'Meta': 'Cmd',
    'Shift': 'Shift',
    'Alt': 'Alt',
  }
  return keyMap[key] || key.toUpperCase()
}
