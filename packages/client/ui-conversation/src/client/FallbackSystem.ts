/**
 * Fallback System for Idexal Agents.
 * Provides automatic fallback between providers and models.
 */

export type ProviderStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export interface Provider {
  id: string
  name: string
  status: ProviderStatus
  priority: number
  baseUrl: string
  apiKey?: string
  models: Model[]
  lastHealthCheck: Date
  responseTime: number
  errorRate: number
  totalRequests: number
  failedRequests: number
}

export interface Model {
  id: string
  name: string
  providerId: string
  maxTokens: number
  supportsStreaming: boolean
  supportsVision: boolean
  costPer1kTokens: number
  isAvailable: boolean
}

export interface FallbackConfig {
  /** Enable automatic fallback */
  enabled: boolean
  /** Maximum number of fallback attempts */
  maxAttempts: number
  /** Health check interval in milliseconds */
  healthCheckInterval: number
  /** Response time threshold for degraded status (ms) */
  responseTimeThreshold: number
  /** Error rate threshold for degraded status (0-1) */
  errorRateThreshold: number
  /** Enable smart routing based on performance */
  smartRouting: boolean
  /** Enable cost optimization */
  costOptimization: boolean
  /** Callback when fallback occurs */
  onFallback: ((from: Provider, to: Provider, reason: string) => void) | undefined
  /** Callback when provider status changes */
  onStatusChange: ((provider: Provider, oldStatus: ProviderStatus, newStatus: ProviderStatus) => void) | undefined
}

export interface FallbackState {
  providers: Map<string, Provider>
  currentProvider: string | null
  currentModel: string | null
  fallbackCount: number
  lastFallback: Date | null
}

export class FallbackManager {
  private config: FallbackConfig
  private state: FallbackState
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private listeners: Set<(state: FallbackState) => void> = new Set()

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxAttempts: config.maxAttempts ?? 3,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
      responseTimeThreshold: config.responseTimeThreshold ?? 5000,
      errorRateThreshold: config.errorRateThreshold ?? 0.3,
      smartRouting: config.smartRouting ?? true,
      costOptimization: config.costOptimization ?? false,
      onFallback: config.onFallback,
      onStatusChange: config.onStatusChange,
    }

    this.state = {
      providers: new Map(),
      currentProvider: null,
      currentModel: null,
      fallbackCount: 0,
      lastFallback: null,
    }
  }

  /**
   * Register a provider.
   */
  registerProvider(provider: Provider): void {
    this.state.providers.set(provider.id, provider)
    this.notifyListeners()
  }

  /**
   * Unregister a provider.
   */
  unregisterProvider(providerId: string): void {
    this.state.providers.delete(providerId)
    if (this.state.currentProvider === providerId) {
      this.state.currentProvider = null
      this.selectBestProvider()
    }
    this.notifyListeners()
  }

  /**
   * Get the current provider.
   */
  getCurrentProvider(): Provider | null {
    if (!this.state.currentProvider) return null
    return this.state.providers.get(this.state.currentProvider) ?? null
  }

  /**
   * Get the current model.
   */
  getCurrentModel(): Model | null {
    const provider = this.getCurrentProvider()
    if (!provider || !this.state.currentModel) return null
    return provider.models.find(m => m.id === this.state.currentModel) ?? null
  }

  /**
   * Select a specific provider and model.
   */
  selectProvider(providerId: string, modelId?: string): boolean {
    const provider = this.state.providers.get(providerId)
    if (!provider || provider.status === 'down') return false

    this.state.currentProvider = providerId
    this.state.currentModel = modelId ?? provider.models[0]?.id ?? null

    this.notifyListeners()
    return true
  }

  /**
   * Request fallback to next available provider.
   */
  requestFallback(reason: string): boolean {
    if (!this.config.enabled) return false

    const currentProvider = this.getCurrentProvider()
    const availableProviders = this.getAvailableProviders()

    if (availableProviders.length <= 1) {
      return false // No other providers available
    }

    // Find the next best provider
    const nextProvider = this.findNextProvider(currentProvider?.id)
    if (!nextProvider) return false

    // Perform fallback
    const oldProvider = currentProvider
    this.state.currentProvider = nextProvider.id
    this.state.currentModel = nextProvider.models[0]?.id ?? null
    this.state.fallbackCount++
    this.state.lastFallback = new Date()

    if (oldProvider) {
      this.config.onFallback?.(oldProvider, nextProvider, reason)
    }

    this.notifyListeners()
    return true
  }

  /**
   * Get all available providers.
   */
  getAvailableProviders(): Provider[] {
    return Array.from(this.state.providers.values())
      .filter(p => p.status !== 'down')
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Get provider status summary.
   */
  getStatusSummary(): {
    total: number
    healthy: number
    degraded: number
    down: number
    unknown: number
  } {
    const providers = Array.from(this.state.providers.values())
    return {
      total: providers.length,
      healthy: providers.filter(p => p.status === 'healthy').length,
      degraded: providers.filter(p => p.status === 'degraded').length,
      down: providers.filter(p => p.status === 'down').length,
      unknown: providers.filter(p => p.status === 'unknown').length,
    }
  }

  /**
   * Get state snapshot.
   */
  getState(): Readonly<FallbackState> {
    return this.state
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: FallbackState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Start health checks.
   */
  startHealthChecks(): void {
    this.stopHealthChecks()

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks()
    }, this.config.healthCheckInterval)
  }

  /**
   * Stop health checks.
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.stopHealthChecks()
    this.state.providers.clear()
    this.listeners.clear()
  }

  private async performHealthChecks(): Promise<void> {
    for (const provider of this.state.providers.values()) {
      try {
        const startTime = Date.now()
        // Simulate health check
        await this.checkProviderHealth(provider)
        const responseTime = Date.now() - startTime

        provider.responseTime = responseTime
        provider.lastHealthCheck = new Date()

        // Update status based on metrics
        const oldStatus = provider.status
        provider.status = this.calculateProviderStatus(provider)

        if (oldStatus !== provider.status) {
          this.config.onStatusChange?.(provider, oldStatus, provider.status)
          this.notifyListeners()
        }

        // Check if current provider needs fallback
        if (provider.id === this.state.currentProvider && provider.status === 'down') {
          this.requestFallback(`Provider ${provider.name} is down`)
        }
      } catch (error) {
        const oldStatus = provider.status
        provider.status = 'down'
        provider.lastHealthCheck = new Date()

        if (oldStatus !== provider.status) {
          this.config.onStatusChange?.(provider, oldStatus, provider.status)
          this.notifyListeners()
        }

        if (provider.id === this.state.currentProvider) {
          this.requestFallback(`Health check failed: ${error}`)
        }
      }
    }
  }

  private async checkProviderHealth(_provider: Provider): Promise<void> {
    // In a real implementation, this would make an API call to check health
    // For now, we'll simulate it
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 100)
    })
  }

  private calculateProviderStatus(provider: Provider): ProviderStatus {
    if (provider.errorRate > this.config.errorRateThreshold) {
      return 'degraded'
    }
    if (provider.responseTime > this.config.responseTimeThreshold) {
      return 'degraded'
    }
    return 'healthy'
  }

  private selectBestProvider(): void {
    const available = this.getAvailableProviders()
    if (available.length === 0) return

    const first = available[0]!
    const firstModel = first.models[0]

    if (this.config.smartRouting) {
      // Smart routing: consider response time and error rate
      const sorted = [...available].sort((a, b) => {
        const scoreA = a.priority - (a.responseTime / 1000) - (a.errorRate * 10)
        const scoreB = b.priority - (b.responseTime / 1000) - (b.errorRate * 10)
        return scoreB - scoreA
      })
      const best = sorted[0]!
      this.state.currentProvider = best.id
      this.state.currentModel = best.models[0]?.id ?? null
    } else {
      // Simple priority-based selection
      this.state.currentProvider = first.id
      this.state.currentModel = firstModel?.id ?? null
    }
  }

  private findNextProvider(currentId: string | undefined): Provider | null {
    const available = this.getAvailableProviders()
    const currentIndex = available.findIndex(p => p.id === currentId)

    if (available.length === 0) return null

    if (currentIndex === -1 || currentIndex >= available.length - 1) {
      const first = available[0]
      return first ?? null
    }

    const next = available[currentIndex + 1]
    const first = available[0]
    return next ?? first ?? null
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Fallback listener error:', error)
      }
    }
  }
}

/**
 * Singleton instance of FallbackManager.
 */
let instance: FallbackManager | null = null

export function getFallbackManager(config?: Partial<FallbackConfig>): FallbackManager {
  if (!instance) {
    instance = new FallbackManager(config)
  }
  return instance
}

/**
 * Format provider status for display.
 */
export function formatProviderStatus(status: ProviderStatus): string {
  switch (status) {
    case 'healthy':
      return '🟢 Healthy'
    case 'degraded':
      return '🟡 Degraded'
    case 'down':
      return '🔴 Down'
    case 'unknown':
      return '⚪ Unknown'
    default:
      return '❓ Unknown'
  }
}

/**
 * Get provider status color.
 */
export function getProviderStatusColor(status: ProviderStatus): string {
  switch (status) {
    case 'healthy':
      return '#10B981'
    case 'degraded':
      return '#F59E0B'
    case 'down':
      return '#EF4444'
    case 'unknown':
      return '#9CA3AF'
    default:
      return '#9CA3AF'
  }
}
