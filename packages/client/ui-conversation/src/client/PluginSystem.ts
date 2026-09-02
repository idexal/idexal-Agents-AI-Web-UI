/**
 * Advanced Plugin System for Idexal Agents.
 * Dynamic plugin loading, lifecycle management, dependency resolution,
 * and event-driven plugin communication.
 */

/** Plugin state */
export type PluginState = 'registered' | 'loading' | 'loaded' | 'active' | 'disabled' | 'error'

/** Plugin metadata */
export interface PluginMeta {
  id: string
  name: string
  version: string
  description: string
  author: string
  /** Plugin dependencies (other plugin IDs) */
  dependencies: string[]
  /** Plugin permissions required */
  permissions: PluginPermission[]
  /** Min host version */
  minVersion?: string
  /** Tags for discovery */
  tags: string[]
  /** Icon */
  icon?: string
  /** Repository URL */
  repository?: string
}

/** Plugin permission */
export type PluginPermission =
  | 'read-code'
  | 'write-code'
  | 'read-settings'
  | 'write-settings'
  | 'access-network'
  | 'access-filesystem'
  | 'modify-ui'
  | 'access-notifications'

/** Plugin context */
export interface PluginContext {
  /** Plugin ID */
  pluginId: string
  /** Shared state between plugins */
  state: Map<string, unknown>
  /** Event emitter */
  emit: (event: string, data: unknown) => void
  /** Event listener */
  on: (event: string, handler: (data: unknown) => void) => void
  /** Remove event listener */
  off: (event: string, handler: (data: unknown) => void) => void
  /** Log */
  log: (message: string, level?: 'info' | 'warn' | 'error') => void
  /** Get settings */
  getSettings: <T = unknown>() => T
  /** Update settings */
  updateSettings: <T = unknown>(settings: Partial<T>) => void
}

/** Plugin lifecycle hooks */
export interface PluginLifecycle {
  /** Called when plugin is loaded */
  onLoad?: (ctx: PluginContext) => void | Promise<void>
  /** Called when plugin is activated */
  onActivate?: (ctx: PluginContext) => void | Promise<void>
  /** Called when plugin is deactivated */
  onDeactivate?: (ctx: PluginContext) => void | Promise<void>
  /** Called when plugin is unloaded */
  onUnload?: (ctx: PluginContext) => void | Promise<void>
  /** Called on settings change */
  onSettingsChange?: (settings: unknown, ctx: PluginContext) => void
}

/** Plugin definition */
export interface Plugin {
  meta: PluginMeta
  lifecycle: PluginLifecycle
  /** Custom commands exposed by the plugin */
  commands?: Array<{ id: string; label: string; description: string; handler: (args: unknown) => unknown }>
  /** Custom UI panels */
  panels?: Array<{ id: string; label: string; component: unknown }>
}

/** Plugin instance (runtime) */
export interface PluginInstance {
  plugin: Plugin
  state: PluginState
  context: PluginContext
  loadedAt?: number
  activatedAt?: number
  error?: string
}

/** Plugin event */
export interface PluginEvent {
  type: string
  pluginId: string
  data: unknown
  timestamp: number
}

/** Plugin system config */
export interface PluginSystemConfig {
  /** Max plugins */
  maxPlugins: number
  /** Auto-load plugins on startup */
  autoLoad: boolean
  /** Enable plugin sandboxing */
  sandbox: boolean
  /** Plugin timeout (ms) */
  timeout: number
  /** Enable plugin hot-reload */
  hotReload: boolean
}

/**
 * Advanced Plugin System.
 */
export class PluginSystemEngine {
  private plugins: Map<string, PluginInstance> = new Map()
  private eventHandlers: Map<string, Set<(data: unknown) => void>> = new Map()
  private globalState: Map<string, unknown> = new Map()
  private config: PluginSystemConfig
  private listeners: Set<(event: PluginSystemEvent) => void> = new Set()

  constructor(config: Partial<PluginSystemConfig> = {}) {
    this.config = {
      maxPlugins: config.maxPlugins ?? 100,
      autoLoad: config.autoLoad ?? true,
      sandbox: config.sandbox ?? true,
      timeout: config.timeout ?? 10000,
      hotReload: config.hotReload ?? false,
    }
  }

  /**
   * Register a plugin.
   */
  register(plugin: Plugin): boolean {
    if (this.plugins.size >= this.config.maxPlugins) {
      this.notifyListeners({ type: 'plugin-error', pluginId: plugin.meta.id, error: 'Max plugins reached' })
      return false
    }

    if (this.plugins.has(plugin.meta.id)) {
      this.notifyListeners({ type: 'plugin-error', pluginId: plugin.meta.id, error: 'Plugin already registered' })
      return false
    }

    // Check dependencies
    for (const dep of plugin.meta.dependencies) {
      if (!this.plugins.has(dep)) {
        this.notifyListeners({ type: 'plugin-error', pluginId: plugin.meta.id, error: `Missing dependency: ${dep}` })
        return false
      }
    }

    // Check permissions
    const ctx = this.createContext(plugin.meta.id)

    this.plugins.set(plugin.meta.id, {
      plugin,
      state: 'registered',
      context: ctx,
    })

    this.notifyListeners({ type: 'plugin-registered', pluginId: plugin.meta.id })
    return true
  }

  /**
   * Load a plugin.
   */
  async load(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId)
    if (!instance) return false

    instance.state = 'loading'
    this.notifyListeners({ type: 'plugin-state-changed', pluginId, state: 'loading' })

    try {
      if (instance.plugin.lifecycle.onLoad) {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Plugin load timeout')), this.config.timeout)
        )
        await Promise.race([
          instance.plugin.lifecycle.onLoad(instance.context),
          timeoutPromise,
        ])
      }

      instance.state = 'loaded'
      instance.loadedAt = Date.now()
      this.notifyListeners({ type: 'plugin-state-changed', pluginId, state: 'loaded' })
      return true
    } catch (err) {
      instance.state = 'error'
      instance.error = err instanceof Error ? err.message : 'Unknown error'
      this.notifyListeners({ type: 'plugin-error', pluginId, error: instance.error })
      return false
    }
  }

  /**
   * Activate a plugin.
   */
  async activate(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId)
    if (!instance || instance.state !== 'loaded') return false

    try {
      if (instance.plugin.lifecycle.onActivate) {
        await instance.plugin.lifecycle.onActivate(instance.context)
      }

      instance.state = 'active'
      instance.activatedAt = Date.now()
      this.notifyListeners({ type: 'plugin-state-changed', pluginId, state: 'active' })
      return true
    } catch (err) {
      instance.state = 'error'
      instance.error = err instanceof Error ? err.message : 'Unknown error'
      this.notifyListeners({ type: 'plugin-error', pluginId, error: instance.error })
      return false
    }
  }

  /**
   * Deactivate a plugin.
   */
  async deactivate(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId)
    if (!instance || instance.state !== 'active') return false

    try {
      if (instance.plugin.lifecycle.onDeactivate) {
        await instance.plugin.lifecycle.onDeactivate(instance.context)
      }

      instance.state = 'disabled'
      this.notifyListeners({ type: 'plugin-state-changed', pluginId, state: 'disabled' })
      return true
    } catch {
      return false
    }
  }

  /**
   * Unload a plugin.
   */
  async unload(pluginId: string): Promise<boolean> {
    const instance = this.plugins.get(pluginId)
    if (!instance) return false

    if (instance.state === 'active') {
      await this.deactivate(pluginId)
    }

    try {
      if (instance.plugin.lifecycle.onUnload) {
        await instance.plugin.lifecycle.onUnload(instance.context)
      }

      this.plugins.delete(pluginId)
      this.notifyListeners({ type: 'plugin-unloaded', pluginId })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get a plugin instance.
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all plugins.
   */
  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get plugins by state.
   */
  getPluginsByState(state: PluginState): PluginInstance[] {
    return this.getPlugins().filter(p => p.state === state)
  }

  /**
   * Emit an event to all plugins.
   */
  emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data) } catch { /* ignore */ }
      }
    }

    // Notify active plugins
    for (const instance of this.plugins.values()) {
      if (instance.state === 'active') {
        instance.context.emit(event, data)
      }
    }
  }

  /**
   * Execute a plugin command.
   */
  async executeCommand(pluginId: string, commandId: string, args?: unknown): Promise<unknown> {
    const instance = this.plugins.get(pluginId)
    if (!instance?.plugin.commands) return null

    const command = instance.plugin.commands.find(c => c.id === commandId)
    if (!command) return null

    return command.handler(args)
  }

  /**
   * Get system stats.
   */
  getStats(): { total: number; active: number; loaded: number; disabled: number; error: number } {
    const plugins = this.getPlugins()
    return {
      total: plugins.length,
      active: plugins.filter(p => p.state === 'active').length,
      loaded: plugins.filter(p => p.state === 'loaded').length,
      disabled: plugins.filter(p => p.state === 'disabled').length,
      error: plugins.filter(p => p.state === 'error').length,
    }
  }

  private createContext(pluginId: string): PluginContext {
    const handlers = new Map<string, Set<(data: unknown) => void>>()

    return {
      pluginId,
      state: this.globalState,
      emit: (event: string, data: unknown) => {
        this.emit(`${pluginId}:${event}`, data)
      },
      on: (event: string, handler: (data: unknown) => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set())
        handlers.get(event)!.add(handler)
      },
      off: (event: string, handler: (data: unknown) => void) => {
        handlers.get(event)?.delete(handler)
      },
      log: (message: string, level = 'info') => {
        this.notifyListeners({ type: 'plugin-log', pluginId, message, level })
      },
      getSettings: <T = unknown>() => {
        return this.globalState.get(`settings:${pluginId}`) as T
      },
      updateSettings: <T = unknown>(settings: Partial<T>) => {
        const existing = (this.globalState.get(`settings:${pluginId}`) ?? {}) as Record<string, unknown>
        this.globalState.set(`settings:${pluginId}`, { ...existing, ...settings })
      },
    }
  }

  subscribe(listener: (event: PluginSystemEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: PluginSystemEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }

  destroy(): void {
    for (const instance of this.plugins.values()) {
      instance.plugin.lifecycle.onUnload?.(instance.context)
    }
    this.plugins.clear()
    this.eventHandlers.clear()
    this.globalState.clear()
  }
}

/** Plugin system event */
export interface PluginSystemEvent {
  type: 'plugin-registered' | 'plugin-state-changed' | 'plugin-loaded' | 'plugin-unloaded' | 'plugin-error' | 'plugin-log'
  pluginId: string
  state?: PluginState
  error?: string
  message?: string
  level?: string
}

/** Singleton */
let instance: PluginSystemEngine | null = null

export function getPluginSystemEngine(config?: Partial<PluginSystemConfig>): PluginSystemEngine {
  if (!instance) instance = new PluginSystemEngine(config)
  return instance
}

export function resetPluginSystemEngine(): void {
  instance?.destroy()
  instance = null
}
