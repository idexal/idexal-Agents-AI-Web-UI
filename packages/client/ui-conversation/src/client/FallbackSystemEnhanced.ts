/**
 * Enhanced Fallback System for Idexal Agents.
 * Provides intelligent provider routing with cost optimization, load balancing, and real-time health monitoring.
 */

/** Provider status types */
export type ProviderStatus = 'healthy' | 'degraded' | 'down' | 'unknown' | 'circuit-open'

/** Routing strategy types */
export type RoutingStrategy = 'priority' | 'latency' | 'cost' | 'round-robin' | 'weighted' | 'smart' | 'capability-based'

/** Load balancing strategy */
export type LoadBalancingStrategy = 'least-connections' | 'round-robin' | 'weighted' | 'random' | 'adaptive'

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
  costPer1kTokens: number
  maxConcurrency: number
  activeRequests: number
  weight: number
  features: ProviderFeatures
  /** Provider-specific configuration */
  config: ProviderConfig
  /** Performance history */
  performanceHistory: PerformanceRecord[]
  /** Circuit breaker state */
  circuitState: CircuitState
  /** Consecutive failures */
  consecutiveFailures: number
  /** Last error */
  lastError: string | undefined
}

/** Provider configuration */
export interface ProviderConfig {
  /** Timeout in milliseconds */
  timeout: number
  /** Maximum retries */
  maxRetries: number
  /** Enable streaming */
  enableStreaming: boolean
  /** Custom headers */
  headers: Record<string, string>
  /** Rate limit (requests per minute) */
  rateLimit: number
  /** Current rate usage */
  rateUsage: number
}

/** Performance record */
export interface PerformanceRecord {
  timestamp: Date
  responseTime: number
  success: boolean
  tokensUsed: number
  cost: number
}

/** Circuit breaker state */
export type CircuitState = 'closed' | 'open' | 'half-open'

/** Provider features */
export interface ProviderFeatures {
  streaming: boolean
  vision: boolean
  functionCalling: boolean
  embeddings: boolean
  fineTuning: boolean
  codeGeneration: boolean
  multilingual: boolean
  contextWindow: number
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
  capabilities: ModelCapabilities
  /** Model-specific configuration */
  config: ModelConfig
  /** Usage statistics */
  usage: ModelUsage
}

/** Model configuration */
export interface ModelConfig {
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stop: string[]
}

/** Model usage statistics */
export interface ModelUsage {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
  lastUsed: Date | undefined
}

/** Model capabilities */
export interface ModelCapabilities {
  textGeneration: boolean
  codeGeneration: boolean
  translation: boolean
  summarization: boolean
  questionAnswering: boolean
  analysis: boolean
  creativity: boolean
}

/** Fallback configuration */
export interface FallbackConfig {
  enabled: boolean
  maxAttempts: number
  healthCheckInterval: number
  responseTimeThreshold: number
  errorRateThreshold: number
  smartRouting: boolean
  costOptimization: boolean
  routingStrategy: RoutingStrategy
  loadBalancingStrategy: LoadBalancingStrategy
  circuitBreakerThreshold: number
  circuitBreakerTimeout: number
  enableModelFallback: boolean
  enableCostTracking: boolean
  enablePerformanceHistory: boolean
  maxPerformanceRecords: number
  onFallback: ((from: Provider, to: Provider, reason: string) => void) | undefined
  onStatusChange: ((provider: Provider, oldStatus: ProviderStatus, newStatus: ProviderStatus) => void) | undefined
  onMetricsUpdate: ((metrics: FallbackMetrics) => void) | undefined
  onCostUpdate: ((cost: CostReport) => void) | undefined
}

/** Fallback state */
export interface FallbackState {
  providers: Map<string, Provider>
  currentProvider: string | null
  currentModel: string | null
  fallbackCount: number
  lastFallback: Date | null
  requestCounter: number
  /** Total cost tracking */
  totalCost: number
  /** Request queue for when all providers are down */
  requestQueue: QueuedRequest[]
}

/** Queued request */
export interface QueuedRequest {
  id: string
  timestamp: Date
  request: RoutingRequest
  resolve: (result: { provider: Provider; model: Model }) => void
  reject: (error: Error) => void
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
  totalCost: number
  averageCostPerToken: number
  requestQueueSize: number
}

/** Cost report */
export interface CostReport {
  totalCost: number
  costByProvider: Map<string, number>
  costByModel: Map<string, number>
  averageCostPerRequest: number
  projectedMonthlyCost: number
}

/** Routing request */
export interface RoutingRequest {
  requiredCapabilities: string[]
  preferredModel: string | undefined
  maxCost: number | undefined
  maxResponseTime: number | undefined
  metadata: Record<string, unknown>
  /** Priority (1 = highest) */
  priority: number
  /** User ID for cost tracking */
  userId: string | undefined
}

/**
 * Enhanced Fallback Manager with intelligent routing and cost optimization.
 */
export class EnhancedFallbackManager {
  private config: FallbackConfig
  private state: FallbackState
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private circuitResetTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private queueProcessTimer: ReturnType<typeof setInterval> | null = null
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
      enableCostTracking: config.enableCostTracking ?? true,
      enablePerformanceHistory: config.enablePerformanceHistory ?? true,
      maxPerformanceRecords: config.maxPerformanceRecords ?? 100,
      onFallback: config.onFallback,
      onStatusChange: config.onStatusChange,
      onMetricsUpdate: config.onMetricsUpdate,
      onCostUpdate: config.onCostUpdate,
    }

    this.state = {
      providers: new Map(),
      currentProvider: null,
      currentModel: null,
      fallbackCount: 0,
      lastFallback: null,
      requestCounter: 0,
      totalCost: 0,
      requestQueue: [],
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
    if (available.length === 0) {
      // Queue the request if all providers are down
      if (this.config.enabled) {
        this.queueRequest(request)
      }
      return null
    }

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
   * Get cost report.
   */
  getCostReport(): CostReport {
    const providers = Array.from(this.state.providers.values())
    const costByProvider = new Map<string, number>()
    const costByModel = new Map<string, number>()

    let totalCost = 0
    let totalTokens = 0

    for (const provider of providers) {
      const providerCost = provider.performanceHistory.reduce((sum, r) => sum + r.cost, 0)
      costByProvider.set(provider.id, providerCost)
      totalCost += providerCost

      for (const model of provider.models) {
        const modelCost = model.usage.totalCost
        costByModel.set(model.id, modelCost)
        totalTokens += model.usage.totalTokens
      }
    }

    const averageCostPerRequest = this.metrics.totalRequests > 0
      ? totalCost / this.metrics.totalRequests
      : 0

    // Project monthly cost (assuming 30 days)
    const uptimeDays = (Date.now() - this.startTime.getTime()) / (1000 * 60 * 60 * 24)
    const dailyCost = uptimeDays > 0 ? totalCost / uptimeDays : 0
    const projectedMonthlyCost = dailyCost * 30

    return {
      totalCost,
      costByProvider,
      costByModel,
      averageCostPerRequest,
      projectedMonthlyCost,
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

    // Start queue processing
    this.queueProcessTimer = setInterval(() => {
      this.processRequestQueue()
    }, 5000)
  }

  /**
   * Stop health checks.
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
    if (this.queueProcessTimer) {
      clearInterval(this.queueProcessTimer)
      this.queueProcessTimer = null
    }
  }

  /**
   * Cleanup resources.
   */
  destroy(): void {
    this.stopHealthChecks()
    this.state.providers.clear()
    this.listeners.clear()
    // Reject all queued requests
    for (const queued of this.state.requestQueue) {
      queued.reject(new Error('Fallback manager destroyed'))
    }
    this.state.requestQueue = []
  }

  /**
   * Manually reset circuit breaker for a provider.
   */
  resetCircuitBreaker(providerId: string): void {
    const provider = this.state.providers.get(providerId)
    if (provider && provider.status === 'circuit-open') {
      provider.status = 'unknown'
      provider.circuitState = 'half-open'
      provider.consecutiveFailures = 0
      this.notifyListeners()
      this.scheduleCircuitReset(providerId)
    }
  }

  /**
   * Record request performance.
   */
  recordPerformance(providerId: string, modelId: string, record: PerformanceRecord): void {
    const provider = this.state.providers.get(providerId)
    if (!provider) return

    provider.performanceHistory.push(record)
    if (provider.performanceHistory.length > this.config.maxPerformanceRecords) {
      provider.performanceHistory = provider.performanceHistory.slice(-this.config.maxPerformanceRecords)
    }

    // Update provider stats
    provider.totalRequests++
    if (!record.success) {
      provider.failedRequests++
      provider.consecutiveFailures++
    } else {
      provider.consecutiveFailures = 0
    }

    provider.errorRate = provider.totalRequests > 0
      ? provider.failedRequests / provider.totalRequests
      : 0

    provider.responseTime = record.responseTime

    // Update model usage
    const model = provider.models.find(m => m.id === modelId)
    if (model) {
      model.usage.totalRequests++
      model.usage.totalTokens += record.tokensUsed
      model.usage.totalCost += record.cost
      model.usage.lastUsed = new Date()
      model.usage.averageResponseTime = 
        (model.usage.averageResponseTime * (model.usage.totalRequests - 1) + record.responseTime) / 
        model.usage.totalRequests
    }

    // Update cost tracking
    if (this.config.enableCostTracking) {
      this.state.totalCost += record.cost
      this.config.onCostUpdate?.(this.getCostReport())
    }

    this.updateMetrics()
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

      case 'capability-based':
        return this.selectByCapabilities(providers)

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

  private selectByCapabilities(providers: Provider[]): Provider {
    // Score providers based on feature completeness
    const scored = providers.map(p => ({
      provider: p,
      score: this.calculateCapabilityScore(p),
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored[0]!.provider
  }

  private calculateCapabilityScore(provider: Provider): number {
    let score = 0
    const features = provider.features

    if (features.streaming) score += 20
    if (features.vision) score += 15
    if (features.functionCalling) score += 20
    if (features.embeddings) score += 10
    if (features.fineTuning) score += 10
    if (features.codeGeneration) score += 15
    if (features.multilingual) score += 10

    // Bonus for larger context window
    score += Math.min(features.contextWindow / 1000, 20)

    return score
  }

  private selectSmart(providers: Provider[]): Provider {
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

    // Bonus for performance history
    if (this.config.enablePerformanceHistory && provider.performanceHistory.length > 0) {
      const recentRecords = provider.performanceHistory.slice(-10)
      const successRate = recentRecords.filter(r => r.success).length / recentRecords.length
      score += successRate * 20
    }

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
        case 'code-generation': return provider.features.codeGeneration
        case 'multilingual': return provider.features.multilingual
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
        case 'analysis': return model.capabilities.analysis
        case 'creativity': return model.capabilities.creativity
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

  private queueRequest(request: RoutingRequest): void {
    const queuedRequest: QueuedRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      request,
      resolve: () => {}, // Will be replaced
      reject: () => {}, // Will be replaced
    }

    this.state.requestQueue.push(queuedRequest)
    this.notifyListeners()
  }

  private processRequestQueue(): void {
    if (this.state.requestQueue.length === 0) return

    const available = this.getAvailableProviders()
    if (available.length === 0) return

    // Process oldest requests first
    const queued = this.state.requestQueue.shift()
    if (queued) {
      const result = this.routeRequest(queued.request)
      if (result) {
        queued.resolve(result)
      } else {
        // Re-queue if still no providers available
        this.state.requestQueue.unshift(queued)
      }
    }
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
        provider.lastError = String(error)
        provider.consecutiveFailures++

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
    if (provider.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      return 'circuit-open'
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
        provider.circuitState = 'half-open'
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

    const totalTokens = providers.reduce((sum, p) => 
      sum + p.models.reduce((mSum, m) => mSum + m.usage.totalTokens, 0), 0)
    const averageCostPerToken = totalTokens > 0 ? this.state.totalCost / totalTokens : 0

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
      totalCost: this.state.totalCost,
      averageCostPerToken,
      requestQueueSize: this.state.requestQueue.length,
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
let instance: EnhancedFallbackManager | null = null

export function getEnhancedFallbackManager(
  config?: Partial<FallbackConfig>
): EnhancedFallbackManager {
  if (!instance) {
    instance = new EnhancedFallbackManager(config)
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

/**
 * Format cost for display.
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${(cost * 1000).toFixed(2)}K`
  return `$${cost.toFixed(2)}`
}

/**
 * Format tokens for display.
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens} tokens`
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K tokens`
  return `${(tokens / 1000000).toFixed(1)}M tokens`
}
