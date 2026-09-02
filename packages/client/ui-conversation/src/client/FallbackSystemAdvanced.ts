/**
 * Advanced Fallback System for Idexal Agents.
 * Provides intelligent provider routing with cost optimization and load balancing.
 */

/** Provider status types */
export type ProviderStatus = 'healthy' | 'degraded' | 'down' | 'unknown' | 'circuit-open'

/** Routing strategy types */
export type RoutingStrategy = 'priority' | 'latency' | 'cost' | 'round-robin' | 'weighted' | 'smart'

/** Load balancing strategy */
export type LoadBalancingStrategy = 'least-connections' | 'round-robin' | 'weighted' | 'random'

/** Provider interface */
export interface Provider {
  id: string
  name: string
  status: ProviderStatus
  priority: number
  baseUrl: string
  apiKey: string | undefined
  models: Model[]
  lastHealthCheck: Date
  responseTime: number
  errorRate: number
  totalRequests: number
  failedRequests: number
  /** Cost per 1k tokens */
  costPer1kTokens: number
  /** Maximum concurrent requests */
  maxConcurrency: number
  /** Current active requests */
  activeRequests: number
  /** Weight for load balancing */
  weight: number
  /** Supported features */
  features: ProviderFeatures
}

/** Provider features */
export interface ProviderFeatures {
  streaming: boolean
  vision: boolean
  functionCalling: boolean
  embeddings: boolean
  fineTuning: boolean
}

/** Model interface */
export interface Model {
  id: string
  name: string
  providerId: string
  maxTokens: number
  supportsStreaming: boolean
  supportsVision: boolean
  costPer1kTokens: number
  isAvailable: boolean
  /** Model capabilities */
  capabilities: ModelCapabilities
}

/** Model capabilities */
export interface ModelCapabilities {
  textGeneration: boolean
  codeGeneration: boolean
  translation: boolean
  summarization: boolean
  questionAnswering: boolean
}

/** Fallback configuration */
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
  /** Routing strategy */
  routingStrategy: RoutingStrategy
  /** Load balancing strategy */
  loadBalancingStrategy: LoadBalancingStrategy
  /** Circuit breaker threshold */
  circuitBreakerThreshold: number
  /** Circuit breaker timeout (ms) */
  circuitBreakerTimeout: number
  /** Enable retry with different models */
  enableModelFallback: boolean
  /** Callback when fallback occurs */
  onFallback: ((from: Provider, to: Provider, reason: string) => void) | undefined
  /** Callback when provider status changes */
  onStatusChange: ((provider: Provider, oldStatus: ProviderStatus, newStatus: ProviderStatus) => void) | undefined
  /** Callback for metrics updates */
  onMetricsUpdate: ((metrics: FallbackMetrics) => void) | undefined
}

/** Fallback state */
export interface FallbackState {
  providers: Map<string, Provider>
  currentProvider: string | null
  currentModel: string | null
  fallbackCount: number
  lastFallback: Date | null
  /** Request counter for round-robin */
  requestCounter: number
}

/** Metrics for monitoring */
export interface FallbackMetrics {
  totalProviders: number
  healthyProviders: number
  degradedProviders: number
  downProviders: number
  totalRequests: number
  failedRequests: number
  averageResponseTime: number
  costPerRequest: number
  uptime: number
}

/** Routing request */
export interface RoutingRequest {
  /** Required capabilities */
  requiredCapabilities: string[]
  /** Preferred model (if any) */
  preferredModel: string | undefined
  /** Maximum cost per 1k tokens */
  maxCost: number | undefined
  /** Maximum response time (ms) */
  maxResponseTime: number | undefined
  /** Request metadata */
  metadata: Record<string, unknown>
}

/**
 * Advanced Fallback Manager.
 */
export class AdvancedFallbackManager {
  private config: FallbackConfig
  private state: FallbackState
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private circuitResetTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private listeners: Set<(state: FallbackState) => void> = new Set()
  private metrics: FallbackMetrics
  private startTime: Date = new Date()

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxAttempts: config.maxAttempts ?? 3,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
      responseTimeThreshold: config.responseTimeThreshold ?? 5000,
      errorRateThreshold: config.errorRateThreshold ?? 0.3,
      smartRouting: config.smartRouting ?? true,
      costOptimization: config.costOptimization ?? false,
      routingStrategy: config.routingStrategy ?? 'smart',
      loadBalancingStrategy: config.loadBalancingStrategy ?? 'weighted',
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout ?? 60000,
      enableModelFallback: config.enableModelFallback ?? true,
      onFallback: config.onFallback,
      onStatusChange: config.onStatusChange,
      onMetricsUpdate: config.onMetricsUpdate,
    }

    this.state = {
      providers: new Map(),
      currentProvider: null,
      currentModel: null,
      fallbackCount: 0,
      lastFallback: null,
      requestCounter: 0,
    }

    this.metrics = this.calculateMetrics()
  }

  /**
   * Register a provider.
   */
  registerProvider(provider: Provider): void {
    this.state.providers.set(provider.id, provider)
    this.notifyListeners()
    this.updateMetrics()
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
    this.updateMetrics()
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
    if (!provider || provider.status === 'down' || provider.status === 'circuit-open') {
      return false
    }

    this.state.currentProvider = providerId
    this.state.currentModel = modelId ?? provider.models[0]?.id ?? null

    this.notifyListeners()
    return true
  }

  /**
   * Route a request to the best available provider.
   */
  routeRequest(request: RoutingRequest): { provider: Provider; model: Model } | null {
    const available = this.getAvailableProviders()
    if (available.length === 0) return null

    // Filter by capabilities
    const capable = available.filter(p => 
      this.providerHasCapabilities(p, request.requiredCapabilities)
    )
    if (capable.length === 0) return null

    // Filter by cost
    const affordable = request.maxCost !== undefined
      ? capable.filter(p => p.costPer1kTokens <= request.maxCost!)
      : capable
    if (affordable.length === 0) return capable[0] ? { provider: capable[0], model: capable[0].models[0]! } : null

    // Filter by response time
    const fast = request.maxResponseTime !== undefined
      ? affordable.filter(p => p.responseTime <= request.maxResponseTime!)
      : affordable
    if (fast.length === 0) return affordable[0] ? { provider: affordable[0], model: affordable[0].models[0]! } : null

    // Select based on routing strategy
    const selected = this.selectByStrategy(fast)
    if (!selected) return null

    const model = this.selectBestModel(selected, request)
    return { provider: selected, model }
  }

  /**
   * Request fallback to next available provider.
   */
  requestFallback(reason: string): boolean {
    if (!this.config.enabled) return false

    const currentProvider = this.getCurrentProvider()
    const availableProviders = this.getAvailableProviders()

    if (availableProviders.length <= 1) {
      return false
    }

    const nextProvider = this.findNextProvider(currentProvider?.id)
    if (!nextProvider) return false

    const oldProvider = currentProvider
    this.state.currentProvider = nextProvider.id
    this.state.currentModel = nextProvider.models[0]?.id ?? null
    this.state.fallbackCount++
    this.state.lastFallback = new Date()

    if (oldProvider) {
      this.config.onFallback?.(oldProvider, nextProvider, reason)
    }

    this.notifyListeners()
    this.updateMetrics()
    return true
  }

  /**
   * Get all available providers.
   */
  getAvailableProviders(): Provider[] {
    return Array.from(this.state.providers.values())
      .filter(p => p.status !== 'down' && p.status !== 'circuit-open')
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
    circuitOpen: number
  } {
    const providers = Array.from(this.state.providers.values())
    return {
      total: providers.length,
      healthy: providers.filter(p => p.status === 'healthy').length,
      degraded: providers.filter(p => p.status === 'degraded').length,
      down: providers.filter(p => p.status === 'down').length,
      circuitOpen: providers.filter(p => p.status === 'circuit-open').length,
    }
  }

  /**
   * Get state snapshot.
   */
  getState(): Readonly<FallbackState> {
    return this.state
  }

  /**
   * Get metrics.
   */
  getMetrics(): FallbackMetrics {
    return { ...this.metrics }
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

  /**
   * Manually reset circuit breaker for a provider.
   */
  resetCircuitBreaker(providerId: string): void {
    const provider = this.state.providers.get(providerId)
    if (provider && provider.status === 'circuit-open') {
      provider.status = 'unknown'
      this.notifyListeners()
      this.scheduleCircuitReset(providerId)
    }
  }

  private selectByStrategy(providers: Provider[]): Provider | null {
    if (providers.length === 0) return null

    switch (this.config.routingStrategy) {
      case 'priority':
        return providers[0]!

      case 'latency':
        return providers.reduce((best, p) => 
          p.responseTime < best.responseTime ? p : best
        )

      case 'cost':
        return providers.reduce((best, p) => 
          p.costPer1kTokens < best.costPer1kTokens ? p : best
        )

      case 'round-robin':
        this.state.requestCounter++
        const index = this.state.requestCounter % providers.length
        return providers[index]!

      case 'weighted':
        return this.selectByWeight(providers)

      case 'smart':
      default:
        return this.selectSmart(providers)
    }
  }

  private selectByWeight(providers: Provider[]): Provider {
    const totalWeight = providers.reduce((sum, p) => sum + p.weight, 0)
    let random = Math.random() * totalWeight

    for (const provider of providers) {
      random -= provider.weight
      if (random <= 0) return provider
    }

    return providers[0]!
  }

  private selectSmart(providers: Provider[]): Provider {
    // Smart routing: consider multiple factors
    const scored = providers.map(p => ({
      provider: p,
      score: this.calculateProviderScore(p),
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored[0]!.provider
  }

  private calculateProviderScore(provider: Provider): number {
    let score = 100

    // Penalize high response time
    score -= (provider.responseTime / 1000) * 10

    // Penalize high error rate
    score -= provider.errorRate * 50

    // Penalize high cost if cost optimization enabled
    if (this.config.costOptimization) {
      score -= provider.costPer1kTokens * 5
    }

    // Penalize high load
    const loadRatio = provider.activeRequests / provider.maxConcurrency
    score -= loadRatio * 20

    // Bonus for higher priority
    score += (10 - provider.priority) * 2

    return Math.max(0, score)
  }

  private selectBestModel(provider: Provider, request: RoutingRequest): Model {
    const available = provider.models.filter(m => m.isAvailable)
    if (available.length === 0) return provider.models[0]!

    // If preferred model exists, use it
    if (request.preferredModel) {
      const preferred = available.find(m => m.id === request.preferredModel)
      if (preferred) return preferred
    }

    // Select based on capabilities
    const capable = available.filter(m => 
      this.modelHasCapabilities(m, request.requiredCapabilities)
    )
    if (capable.length > 0) return capable[0]!

    return available[0]!
  }

  private providerHasCapabilities(provider: Provider, capabilities: string[]): boolean {
    return capabilities.every(cap => {
      switch (cap) {
        case 'streaming': return provider.features.streaming
        case 'vision': return provider.features.vision
        case 'function-calling': return provider.features.functionCalling
        case 'embeddings': return provider.features.embeddings
        case 'fine-tuning': return provider.features.fineTuning
        default: return true
      }
    })
  }

  private modelHasCapabilities(model: Model, capabilities: string[]): boolean {
    return capabilities.every(cap => {
      switch (cap) {
        case 'text-generation': return model.capabilities.textGeneration
        case 'code-generation': return model.capabilities.codeGeneration
        case 'translation': return model.capabilities.translation
        case 'summarization': return model.capabilities.summarization
        case 'question-answering': return model.capabilities.questionAnswering
        default: return true
      }
    })
  }

  private findNextProvider(currentId: string | undefined): Provider | null {
    const available = this.getAvailableProviders()
    const currentIndex = available.findIndex(p => p.id === currentId)

    if (available.length === 0) return null

    if (currentIndex === -1 || currentIndex >= available.length - 1) {
      return available[0] ?? null
    }

    return available[currentIndex + 1] ?? available[0] ?? null
  }

  private async performHealthChecks(): Promise<void> {
    for (const provider of this.state.providers.values()) {
      try {
        const startTime = Date.now()
        await this.checkProviderHealth(provider)
        const responseTime = Date.now() - startTime

        provider.responseTime = responseTime
        provider.lastHealthCheck = new Date()

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

    this.updateMetrics()
  }

  private async checkProviderHealth(_provider: Provider): Promise<void> {
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

    const best = this.selectByStrategy(available)
    if (best) {
      this.state.currentProvider = best.id
      this.state.currentModel = best.models[0]?.id ?? null
    }
  }

  private scheduleCircuitReset(providerId: string): void {
    this.cancelCircuitReset(providerId)

    const timer = setTimeout(() => {
      const provider = this.state.providers.get(providerId)
      if (provider && provider.status === 'circuit-open') {
        provider.status = 'unknown'
        this.notifyListeners()
      }
    }, this.config.circuitBreakerTimeout)

    this.circuitResetTimers.set(providerId, timer)
  }

  private cancelCircuitReset(providerId: string): void {
    const timer = this.circuitResetTimers.get(providerId)
    if (timer) {
      clearTimeout(timer)
      this.circuitResetTimers.delete(providerId)
    }
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

  private calculateMetrics(): FallbackMetrics {
    const providers = Array.from(this.state.providers.values())
    const uptime = Date.now() - this.startTime.getTime()

    const totalRequests = providers.reduce((sum, p) => sum + p.totalRequests, 0)
    const failedRequests = providers.reduce((sum, p) => sum + p.failedRequests, 0)
    const avgResponseTime = providers.length > 0
      ? providers.reduce((sum, p) => sum + p.responseTime, 0) / providers.length
      : 0
    const avgCost = providers.length > 0
      ? providers.reduce((sum, p) => sum + p.costPer1kTokens, 0) / providers.length
      : 0

    return {
      totalProviders: providers.length,
      healthyProviders: providers.filter(p => p.status === 'healthy').length,
      degradedProviders: providers.filter(p => p.status === 'degraded').length,
      downProviders: providers.filter(p => p.status === 'down').length,
      totalRequests,
      failedRequests,
      averageResponseTime: avgResponseTime,
      costPerRequest: avgCost,
      uptime,
    }
  }

  private updateMetrics(): void {
    this.metrics = this.calculateMetrics()
    this.config.onMetricsUpdate?.(this.metrics)
  }
}

/**
 * Singleton instance.
 */
let instance: AdvancedFallbackManager | null = null

export function getAdvancedFallbackManager(
  config?: Partial<FallbackConfig>
): AdvancedFallbackManager {
  if (!instance) {
    instance = new AdvancedFallbackManager(config)
  }
  return instance
}

/**
 * Format provider status.
 */
export function formatProviderStatus(status: ProviderStatus): string {
  switch (status) {
    case 'healthy':
      return '🟢 Healthy'
    case 'degraded':
      return '🟡 Degraded'
    case 'down':
      return '🔴 Down'
    case 'circuit-open':
      return '🔴 Circuit Open'
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
    case 'circuit-open':
      return '#DC2626'
    case 'unknown':
      return '#9CA3AF'
    default:
      return '#9CA3AF'
  }
}
