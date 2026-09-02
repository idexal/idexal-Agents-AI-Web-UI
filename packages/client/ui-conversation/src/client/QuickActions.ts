/**
 * Quick Actions Engine for Idexal Agents.
 * Keyboard shortcuts, command palette, and quick actions
 * with customizable bindings and context-aware suggestions.
 */

/** Action category */
export type ActionCategory = 'navigation' | 'editing' | 'search' | 'view' | 'tool' | 'git' | 'debug'

/** Action context */
export type ActionContext = 'global' | 'editor' | 'terminal' | 'sidebar' | 'chat'

/** Quick action */
export interface QuickAction {
  id: string
  name: string
  description: string
  category: ActionCategory
  context: ActionContext
  /** Keyboard shortcut */
  shortcut?: string
  /** Icon */
  icon: string
  /** Action handler */
  action: string
  /** Is this action enabled? */
  enabled: boolean
  /** Priority for display ordering */
  priority: number
  /** Tags for search */
  tags: string[]
}

/** Keyboard binding */
export interface KeyBinding {
  id: string
  action: string
  keys: string
  context: ActionContext
  /** Is this a custom binding? */
  custom: boolean
}

/** Command palette item */
export interface CommandPaletteItem {
  id: string
  label: string
  description: string
  category: ActionCategory
  shortcut?: string
  icon: string
  action: string
}

/** Quick actions config */
export interface QuickActionsConfig {
  enableShortcuts: boolean
  enableCommandPalette: boolean
  context: ActionContext
}

const DEFAULT_ACTIONS: QuickAction[] = [
  // Navigation
  { id: 'nav-home', name: 'Go to Home', description: 'Navigate to home screen', category: 'navigation', context: 'global', shortcut: 'Ctrl+H', icon: '🏠', action: 'navigate:home', enabled: true, priority: 10, tags: ['home', 'navigation'] },
  { id: 'nav-settings', name: 'Go to Settings', description: 'Open settings page', category: 'navigation', context: 'global', shortcut: 'Ctrl+,', icon: '⚙️', action: 'navigate:settings', enabled: true, priority: 10, tags: ['settings', 'preferences'] },
  { id: 'nav-search', name: 'Search', description: 'Open search panel', category: 'navigation', context: 'global', shortcut: 'Ctrl+K', icon: '🔍', action: 'navigate:search', enabled: true, priority: 10, tags: ['search', 'find'] },

  // Editing
  { id: 'edit-undo', name: 'Undo', description: 'Undo last action', category: 'editing', context: 'editor', shortcut: 'Ctrl+Z', icon: '↩️', action: 'edit:undo', enabled: true, priority: 20, tags: ['undo', 'history'] },
  { id: 'edit-redo', name: 'Redo', description: 'Redo last action', category: 'editing', context: 'editor', shortcut: 'Ctrl+Shift+Z', icon: '↪️', action: 'edit:redo', enabled: true, priority: 20, tags: ['redo', 'history'] },
  { id: 'edit-copy', name: 'Copy', description: 'Copy selection', category: 'editing', context: 'editor', shortcut: 'Ctrl+C', icon: '📋', action: 'edit:copy', enabled: true, priority: 20, tags: ['copy', 'clipboard'] },
  { id: 'edit-paste', name: 'Paste', description: 'Paste from clipboard', category: 'editing', context: 'editor', shortcut: 'Ctrl+V', icon: '📄', action: 'edit:paste', enabled: true, priority: 20, tags: ['paste', 'clipboard'] },
  { id: 'edit-format', name: 'Format Code', description: 'Format selected code', category: 'editing', context: 'editor', shortcut: 'Shift+Alt+F', icon: '✨', action: 'edit:format', enabled: true, priority: 15, tags: ['format', 'prettier'] },

  // Search
  { id: 'search-find', name: 'Find in File', description: 'Find text in current file', category: 'search', context: 'editor', shortcut: 'Ctrl+F', icon: '🔍', action: 'search:find', enabled: true, priority: 15, tags: ['find', 'search'] },
  { id: 'search-replace', name: 'Find and Replace', description: 'Find and replace text', category: 'search', context: 'editor', shortcut: 'Ctrl+H', icon: '🔄', action: 'search:replace', enabled: true, priority: 15, tags: ['replace', 'find'] },
  { id: 'search-symbol', name: 'Go to Symbol', description: 'Navigate to symbol', category: 'search', context: 'editor', shortcut: 'Ctrl+Shift+O', icon: '🔤', action: 'search:symbol', enabled: true, priority: 15, tags: ['symbol', 'navigation'] },

  // View
  { id: 'view-sidebar', name: 'Toggle Sidebar', description: 'Show/hide sidebar', category: 'view', context: 'global', shortcut: 'Ctrl+B', icon: '📏', action: 'view:sidebar', enabled: true, priority: 10, tags: ['sidebar', 'toggle'] },
  { id: 'view-terminal', name: 'Toggle Terminal', description: 'Show/hide terminal', category: 'view', context: 'global', shortcut: 'Ctrl+`', icon: '💻', action: 'view:terminal', enabled: true, priority: 10, tags: ['terminal', 'toggle'] },
  { id: 'view-zoom-in', name: 'Zoom In', description: 'Zoom in', category: 'view', context: 'global', shortcut: 'Ctrl++', icon: '🔎', action: 'view:zoom-in', enabled: true, priority: 5, tags: ['zoom', 'magnify'] },
  { id: 'view-zoom-out', name: 'Zoom Out', description: 'Zoom out', category: 'view', context: 'global', shortcut: 'Ctrl+-', icon: '🔎', action: 'view:zoom-out', enabled: true, priority: 5, tags: ['zoom', 'shrink'] },

  // Tools
  { id: 'tool-review', name: 'Run Code Review', description: 'Review current code', category: 'tool', context: 'editor', shortcut: 'Ctrl+Shift+R', icon: '🤖', action: 'tool:review', enabled: true, priority: 15, tags: ['review', 'lint'] },
  { id: 'tool-test', name: 'Run Tests', description: 'Run tests for current file', category: 'tool', context: 'editor', shortcut: 'Ctrl+Shift+T', icon: '🧪', action: 'tool:test', enabled: true, priority: 15, tags: ['test', 'jest'] },
  { id: 'tool-build', name: 'Build Project', description: 'Build the project', category: 'tool', context: 'global', shortcut: 'Ctrl+Shift+B', icon: '🔨', action: 'tool:build', enabled: true, priority: 15, tags: ['build', 'compile'] },

  // Git
  { id: 'git-commit', name: 'Git Commit', description: 'Commit changes', category: 'git', context: 'global', shortcut: 'Ctrl+Shift+G', icon: '📝', action: 'git:commit', enabled: true, priority: 15, tags: ['git', 'commit'] },
  { id: 'git-push', name: 'Git Push', description: 'Push commits', category: 'git', context: 'global', shortcut: 'Ctrl+Shift+P', icon: '📤', action: 'git:push', enabled: true, priority: 15, tags: ['git', 'push'] },
  { id: 'git-pull', name: 'Git Pull', description: 'Pull latest changes', category: 'git', context: 'global', shortcut: 'Ctrl+Shift+L', icon: '📥', action: 'git:pull', enabled: true, priority: 15, tags: ['git', 'pull'] },

  // Debug
  { id: 'debug-start', name: 'Start Debugging', description: 'Start debug session', category: 'debug', context: 'editor', shortcut: 'F5', icon: '🐛', action: 'debug:start', enabled: true, priority: 20, tags: ['debug', 'start'] },
  { id: 'debug-stop', name: 'Stop Debugging', description: 'Stop debug session', category: 'debug', context: 'editor', shortcut: 'Shift+F5', icon: '🛑', action: 'debug:stop', enabled: true, priority: 20, tags: ['debug', 'stop'] },
  { id: 'debug-breakpoint', name: 'Toggle Breakpoint', description: 'Toggle breakpoint', category: 'debug', context: 'editor', shortcut: 'F9', icon: '🔴', action: 'debug:breakpoint', enabled: true, priority: 20, tags: ['debug', 'breakpoint'] },
]

/**
 * Quick Actions Engine.
 */
export class QuickActionsEngine {
  private actions: Map<string, QuickAction> = new Map()
  private bindings: Map<string, KeyBinding> = new Map()
  private config: QuickActionsConfig
  private listeners: Set<(event: QuickActionEvent) => void> = new Set()

  constructor(_config: Partial<QuickActionsConfig> = {}) {
    this.config = {
      enableShortcuts: _config.enableShortcuts ?? true,
      enableCommandPalette: _config.enableCommandPalette ?? true,
      context: _config.context ?? 'global',
    }

    // Register default actions
    for (const action of DEFAULT_ACTIONS) {
      this.actions.set(action.id, action)
      if (action.shortcut) {
        this.bindings.set(action.shortcut, {
          id: `binding-${action.id}`,
          action: action.id,
          keys: action.shortcut,
          context: action.context,
          custom: false,
        })
      }
    }
  }

  /**
   * Get all actions.
   */
  getAllActions(): QuickAction[] {
    return Array.from(this.actions.values()).filter(a => a.enabled || this.config.enableShortcuts)
  }

  /**
   * Get actions by category.
   */
  getActionsByCategory(category: ActionCategory): QuickAction[] {
    return this.getAllActions().filter(a => a.category === category)
  }

  /**
   * Get actions by context.
   */
  getActionsByContext(context: ActionContext): QuickAction[] {
    return this.getAllActions().filter(a => a.context === context || a.context === 'global')
  }

  /**
   * Search actions.
   */
  search(query: string): QuickAction[] {
    const q = query.toLowerCase()
    return this.getAllActions().filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some(t => t.includes(q))
    ).sort((a, b) => a.priority - b.priority)
  }

  /**
   * Get command palette items.
   */
  getCommandPaletteItems(query?: string): CommandPaletteItem[] {
    const actions = query ? this.search(query) : this.getAllActions()
    return actions.map(a => {
      const item: CommandPaletteItem = {
        id: a.id,
        label: a.name,
        description: a.description,
        category: a.category,
        icon: a.icon,
        action: a.action,
      }
      if (a.shortcut !== undefined) item.shortcut = a.shortcut
      return item
    })
  }

  /**
   * Get key bindings.
   */
  getKeyBindings(): KeyBinding[] {
    return Array.from(this.bindings.values())
  }

  /**
   * Add custom key binding.
   */
  addBinding(actionId: string, keys: string, context: ActionContext): boolean {
    if (!this.actions.has(actionId)) return false

    // Check for conflicts
    const existing = this.bindings.get(keys)
    if (existing) return false

    this.bindings.set(keys, {
      id: `binding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: actionId,
      keys,
      context,
      custom: true,
    })

    return true
  }

  /**
   * Remove key binding.
   */
  removeBinding(keys: string): boolean {
    const binding = this.bindings.get(keys)
    if (!binding || !binding.custom) return false
    this.bindings.delete(keys)
    return true
  }

  /**
   * Execute an action.
   */
  execute(actionId: string): boolean {
    const action = this.actions.get(actionId)
    if (!action || !action.enabled) return false

    this.notifyListeners({ type: 'action-executed', action })
    return true
  }

  /**
   * Handle keyboard event.
   */
  handleKeydown(event: { key: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): string | null {
    const keys = this.eventToKeys(event)
    const binding = this.bindings.get(keys)

    if (binding) {
      const action = this.actions.get(binding.action)
      if (action && action.enabled) {
        this.notifyListeners({ type: 'action-executed', action })
        return action.action
      }
    }

    return null
  }

  private eventToKeys(event: { key: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }): string {
    const parts: string[] = []
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')
    parts.push(event.key.toUpperCase())
    return parts.join('+')
  }

  subscribe(listener: (event: QuickActionEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: QuickActionEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Quick action event */
export interface QuickActionEvent {
  type: 'action-executed' | 'binding-added' | 'binding-removed'
  action?: QuickAction
  binding?: KeyBinding
}

/** Singleton */
let instance: QuickActionsEngine | null = null

export function getQuickActionsEngine(config?: Partial<QuickActionsConfig>): QuickActionsEngine {
  if (!instance) instance = new QuickActionsEngine(config)
  return instance
}

export function resetQuickActionsEngine(): void { instance = null }
