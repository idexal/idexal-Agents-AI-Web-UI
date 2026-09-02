/**
 * Advanced Auto-Resume System for Idexal Agents.
 * Provides intelligent agent recovery with multiple strategies and monitoring.
 */

/** Agent status types */
export type AgentStatus = 'running' | 'paused' | 'stopped' | 'error' | 'recovering' | 'circuit-open'

/** Recovery strategy types */
export type RecoveryStrategy = 'immediate' | 'exponential-backoff' | 'linear-backoff' | 'fixed-interval' | 'adaptive'

/** Circuit breaker state */
export type CircuitState = 'closed' | 'open' | 'half-open'

/** Agent interface */
export interface Agent {
  id: string
  name: string
  status: AgentStatus
  lastActivity: Date
  retryCount: number
  maxRetries: number
  error: string | undefined
  sessionId: string | undefined
  /** Circuit breaker state */
  circuitState: CircuitState
  /** Consecutive failures */
  consecutiveFailures: number
  /** Last error timestamp */
  lastErrorTime: Date | undefined
  /** Recovery strategy */
  recoveryStrategy: RecoveryStrategy
  /** Custom metadata */
  metadata: Record<string, unknown>
}

/** Auto-resume configuration */
export interface AutoResumeConfig {
  /** Maximum number of retries before giving up */
  maxRetries: number
  /** Base delay between retries in milliseconds */
  baseDelay: number
  /** Maximum delay between retries in milliseconds */
  maxDelay: number
  /** Enable exponential backoff */
  exponentialBackoff: boolean
  /** Enable jitter to prevent thundering herd */
  jitter: boolean
  /** Health check interval in milliseconds */
  healthCheckInterval: number
  /** Enable automatic recovery */
  autoRecover: boolean
  /** Circuit breaker threshold (consecutive failures to open) */
  circuitBreakerThreshold: number
  /** Circuit breaker recovery timeout (ms) */
  circuitBreakerTimeout: number
  /** Default recovery strategy */
  defaultRecoveryStrategy: RecoveryStrategy
  /** Enable detailed logging */
  enableLogging: boolean
  /** Callback when agent resumes */
  onResume: ((agent: Agent) => void) | undefined
  /** Callback when agent fails permanently */
  onPermanentFailure: ((agent: Agent) => void) | undefined
  /** Callback when status changes */
  onStatusChange: ((agent: Agent, oldStatus: AgentStatus, newStatus: AgentStatus) => void) | undefined
  /** Callback when circuit breaker trips */
  onCircuitBreak: ((agent: Agent) => void) | undefined
  /** Callback for metrics updates */
  onMetricsUpdate: ((metrics: AutoResumeMetrics) => void) | undefined
}

/** Auto-resume state */
export interface AutoResumeState {
  agents: Map<string, Agent>
  enabled: boolean
  totalRetries: number
  totalRecoveries: number
  totalFailures: number
  totalCircuitBreaks: number
}

/** Metrics for monitoring */
export interface AutoResumeMetrics {
  totalAgents: number
  activeAgents: number
  recoveredAgents: number
  failedAgents: number
  circuitBrokenAgents: number
  averageRecoveryTime: number
  successRate: number
  uptime: number
}

/** Recovery event log entry */
export interface RecoveryEvent {
  timestamp: Date
  agentId: string
  agentName: string
  event: 'error' | 'retry' | 'recovery' | 'failure' | 'circuit-break' | 'circuit-reset'
  details: string
  duration?: number
}

/**
 * Advanced Auto-Resume Manager.
 */
export class AdvancedAutoResumeManager {
  private config: AutoResumeConfig
  private state: AutoResumeState
  private healthCheckTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private circuitResetTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private listeners: Set<(state: AutoResumeState) => void> = new Set()
  private eventLog: RecoveryEvent[] = []
  private metrics: AutoResumeMetrics
  private startTime: Date = new Date()

  constructor(config: Partial<AutoResumeConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 5,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      exponentialBackoff: config.exponentialBackoff ?? true,
      jitter: config.jitter ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 10000,
      autoRecover: config.autoRecover ?? true,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout ?? 60000,
      defaultRecoveryStrategy: config.defaultRecoveryStrategy ?? 'exponential-backoff',
      enableLogging: config.enableLogging ?? true,
      onResume: config.onResume,
      onPermanentFailure: config.onPermanentFailure,
      onStatusChange: config.onStatusChange,
      onCircuitBreak: config.onCircuitBreak,
      onMetricsUpdate: config.onMetricsUpdate,
    }

    this.state = {
      agents: new Map(),
      enabled: true,
      totalRetries: 0,
      totalRecoveries: 0,
      totalFailures: 0,
      totalCircuitBreaks: 0,
    }

    this.metrics = this.calculateMetrics()
  }

  /**
   * Register an agent for auto-resume monitoring.
   */
  registerAgent(
    agentId: string,
    name: string,
    options: {
      sessionId?: string
      maxRetries?: number
      recoveryStrategy?: RecoveryStrategy
      metadata?: Record<string, unknown>
    } = {}
  ): void {
    const agent: Agent = {
      id: agentId,
      name,
      status: 'running',
      lastActivity: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      error: undefined,
      sessionId: options.sessionId,
      circuitState: 'closed',
      consecutiveFailures: 0,
      lastErrorTime: undefined,
      recoveryStrategy: options.recoveryStrategy ?? this.config.defaultRecoveryStrategy,
      metadata: options.metadata ?? {},
    }

    this.state.agents.set(agentId, agent)
    this.startHealthCheck(agentId)
    this.notifyListeners()
    this.logEvent(agentId, name, 'recovery', 'Agent registered')
  }

  /**
   * Unregister an agent.
   */
  unregisterAgent(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (agent) {
      this.stopHealthCheck(agentId)
      this.cancelRetry(agentId)
      this.cancelCircuitReset(agentId)
      this.state.agents.delete(agentId)
      this.notifyListeners()
    }
  }

  /**
   * Report agent activity (resets health check).
   */
  reportActivity(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (agent) {
      agent.lastActivity = new Date()
      agent.consecutiveFailures = 0

      if (agent.status === 'recovering' || agent.status === 'circuit-open') {
        this.updateAgentStatus(agentId, 'running')
        agent.retryCount = 0
        agent.circuitState = 'closed'
        this.state.totalRecoveries++
        this.logEvent(agentId, agent.name, 'recovery', 'Agent recovered successfully')
      }

      this.updateMetrics()
    }
  }

  /**
   * Report agent error.
   */
  reportError(agentId: string, error: string): void {
    const agent = this.state.agents.get(agentId)
    if (!agent) return

    agent.error = error
    agent.lastActivity = new Date()
    agent.lastErrorTime = new Date()
    agent.consecutiveFailures++

    this.logEvent(agentId, agent.name, 'error', error)

    // Check circuit breaker
    if (agent.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      this.tripCircuitBreaker(agentId)
      return
    }

    // Attempt recovery
    if (this.config.autoRecover && agent.retryCount < agent.maxRetries) {
      this.updateAgentStatus(agentId, 'error')
      this.scheduleRetry(agentId)
    } else {
      this.updateAgentStatus(agentId, 'stopped')
      this.state.totalFailures++
      this.config.onPermanentFailure?.(agent)
      this.logEvent(agentId, agent.name, 'failure', `Permanent failure after ${agent.retryCount} retries`)
    }

    this.updateMetrics()
  }

  /**
   * Manually pause an agent.
   */
  pauseAgent(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (agent) {
      this.updateAgentStatus(agentId, 'paused')
      this.cancelRetry(agentId)
    }
  }

  /**
   * Manually resume a paused agent.
   */
  resumeAgent(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (agent && agent.status === 'paused') {
      this.updateAgentStatus(agentId, 'running')
      agent.retryCount = 0
      agent.circuitState = 'closed'
      agent.consecutiveFailures = 0
    }
  }

  /**
   * Get agent status.
   */
  getAgentStatus(agentId: string): Agent | undefined {
    return this.state.agents.get(agentId)
  }

  /**
   * Get all agents.
   */
  getAllAgents(): Agent[] {
    return Array.from(this.state.agents.values())
  }

  /**
   * Get agents by status.
   */
  getAgentsByStatus(status: AgentStatus): Agent[] {
    return this.getAllAgents().filter(a => a.status === status)
  }

  /**
   * Get state snapshot.
   */
  getState(): Readonly<AutoResumeState> {
    return this.state
  }

  /**
   * Get metrics.
   */
  getMetrics(): AutoResumeMetrics {
    return { ...this.metrics }
  }

  /**
   * Get event log.
   */
  getEventLog(limit: number = 100): RecoveryEvent[] {
    return this.eventLog.slice(-limit)
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: (state: AutoResumeState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Enable auto-resume.
   */
  enable(): void {
    this.state.enabled = true
    this.notifyListeners()
  }

  /**
   * Disable auto-resume.
   */
  disable(): void {
    this.state.enabled = false
    this.stopAllHealthChecks()
    this.cancelAllRetries()
    this.notifyListeners()
  }

  /**
   * Cleanup all resources.
   */
  destroy(): void {
    this.disable()
    this.state.agents.clear()
    this.listeners.clear()
    this.eventLog = []
  }

  /**
   * Update agent recovery strategy.
   */
  setRecoveryStrategy(agentId: string, strategy: RecoveryStrategy): void {
    const agent = this.state.agents.get(agentId)
    if (agent) {
      agent.recoveryStrategy = strategy
    }
  }

  /**
   * Manually reset circuit breaker for an agent.
   */
  resetCircuitBreaker(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (agent && agent.circuitState === 'open') {
      agent.circuitState = 'half-open'
      this.logEvent(agentId, agent.name, 'circuit-reset', 'Circuit breaker manually reset')
      this.scheduleCircuitReset(agentId)
    }
  }

  private updateAgentStatus(agentId: string, newStatus: AgentStatus): void {
    const agent = this.state.agents.get(agentId)
    if (!agent) return

    const oldStatus = agent.status
    agent.status = newStatus

    if (oldStatus !== newStatus) {
      this.config.onStatusChange?.(agent, oldStatus, newStatus)
      this.notifyListeners()
    }
  }

  private scheduleRetry(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (!agent) return

    this.cancelRetry(agentId)

    const delay = this.calculateDelay(agent)
    agent.retryCount++
    this.state.totalRetries++

    this.updateAgentStatus(agentId, 'recovering')
    this.logEvent(agentId, agent.name, 'retry', `Retry ${agent.retryCount}/${agent.maxRetries} in ${delay}ms`)

    const timer = setTimeout(() => {
      this.attemptRecovery(agentId)
    }, delay)

    this.retryTimers.set(agentId, timer)
  }

  private calculateDelay(agent: Agent): number {
    let delay = this.config.baseDelay

    switch (agent.recoveryStrategy) {
      case 'immediate':
        return 0

      case 'fixed-interval':
        delay = this.config.baseDelay
        break

      case 'linear-backoff':
        delay = this.config.baseDelay * (agent.retryCount + 1)
        break

      case 'exponential-backoff':
        delay = this.config.baseDelay * Math.pow(2, agent.retryCount)
        break

      case 'adaptive':
        // Adaptive based on error type and history
        const errorWeight = agent.consecutiveFailures > 3 ? 2 : 1
        delay = this.config.baseDelay * Math.pow(1.5, agent.retryCount) * errorWeight
        break
    }

    delay = Math.min(delay, this.config.maxDelay)

    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.round(delay)
  }

  private async attemptRecovery(agentId: string): Promise<void> {
    const agent = this.state.agents.get(agentId)
    if (!agent || agent.status !== 'recovering') return

    try {
      // Simulate recovery attempt
      // In production, this would:
      // 1. Reconnect to backend
      // 2. Re-establish session
      // 3. Resume from checkpoint
      await this.performRecovery(agent)

      this.updateAgentStatus(agentId, 'running')
      agent.retryCount = 0
      agent.consecutiveFailures = 0
      agent.circuitState = 'closed'
      this.state.totalRecoveries++

      this.config.onResume?.(agent)
      this.logEvent(agentId, agent.name, 'recovery', 'Agent recovered successfully')
      this.notifyListeners()
    } catch (error) {
      this.reportError(agentId, String(error))
    }

    this.updateMetrics()
  }

  private async performRecovery(_agent: Agent): Promise<void> {
    // Simulate recovery with delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 90% success rate simulation
        if (Math.random() > 0.1) {
          resolve()
        } else {
          reject(new Error('Recovery failed'))
        }
      }, 100)
    })
  }

  private tripCircuitBreaker(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (!agent) return

    agent.circuitState = 'open'
    this.updateAgentStatus(agentId, 'circuit-open')
    this.state.totalCircuitBreaks++

    this.logEvent(agentId, agent.name, 'circuit-break', 
      `Circuit breaker tripped after ${agent.consecutiveFailures} consecutive failures`)

    this.config.onCircuitBreak?.(agent)
    this.scheduleCircuitReset(agentId)
    this.updateMetrics()
  }

  private scheduleCircuitReset(agentId: string): void {
    this.cancelCircuitReset(agentId)

    const timer = setTimeout(() => {
      const agent = this.state.agents.get(agentId)
      if (agent && agent.circuitState === 'open') {
        agent.circuitState = 'half-open'
        this.logEvent(agentId, agent.name, 'circuit-reset', 'Circuit breaker half-open')
        // Attempt recovery
        this.attemptRecovery(agentId)
      }
    }, this.config.circuitBreakerTimeout)

    this.circuitResetTimers.set(agentId, timer)
  }

  private cancelCircuitReset(agentId: string): void {
    const timer = this.circuitResetTimers.get(agentId)
    if (timer) {
      clearTimeout(timer)
      this.circuitResetTimers.delete(agentId)
    }
  }

  private startHealthCheck(agentId: string): void {
    this.stopHealthCheck(agentId)

    const timer = setInterval(() => {
      const agent = this.state.agents.get(agentId)
      if (!agent || agent.status !== 'running') return

      const timeSinceActivity = Date.now() - agent.lastActivity.getTime()
      const timeout = this.config.healthCheckInterval * 3

      if (timeSinceActivity > timeout) {
        this.reportError(agentId, 'Health check timeout')
      }
    }, this.config.healthCheckInterval)

    this.healthCheckTimers.set(agentId, timer)
  }

  private stopHealthCheck(agentId: string): void {
    const timer = this.healthCheckTimers.get(agentId)
    if (timer) {
      clearInterval(timer)
      this.healthCheckTimers.delete(agentId)
    }
  }

  private stopAllHealthChecks(): void {
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer)
    }
    this.healthCheckTimers.clear()
  }

  private cancelRetry(agentId: string): void {
    const timer = this.retryTimers.get(agentId)
    if (timer) {
      clearTimeout(timer)
      this.retryTimers.delete(agentId)
    }
  }

  private cancelAllRetries(): void {
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer)
    }
    this.retryTimers.clear()
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('AutoResume listener error:', error)
      }
    }
  }

  private logEvent(
    agentId: string,
    agentName: string,
    event: RecoveryEvent['event'],
    details: string
  ): void {
    if (!this.config.enableLogging) return

    const entry: RecoveryEvent = {
      timestamp: new Date(),
      agentId,
      agentName,
      event,
      details,
    }

    this.eventLog.push(entry)

    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-1000)
    }
  }

  private calculateMetrics(): AutoResumeMetrics {
    const agents = this.getAllAgents()
    const uptime = Date.now() - this.startTime.getTime()

    const activeAgents = agents.filter(a => a.status === 'running').length
    const recoveredAgents = this.state.totalRecoveries
    const failedAgents = this.state.totalFailures
    const circuitBrokenAgents = agents.filter(a => a.circuitState === 'open').length

    const totalAttempts = this.state.totalRetries + this.state.totalRecoveries + this.state.totalFailures
    const successRate = totalAttempts > 0 ? this.state.totalRecoveries / totalAttempts : 1

    return {
      totalAgents: agents.length,
      activeAgents,
      recoveredAgents,
      failedAgents,
      circuitBrokenAgents,
      averageRecoveryTime: this.config.baseDelay,
      successRate,
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
let instance: AdvancedAutoResumeManager | null = null

export function getAdvancedAutoResumeManager(
  config?: Partial<AutoResumeConfig>
): AdvancedAutoResumeManager {
  if (!instance) {
    instance = new AdvancedAutoResumeManager(config)
  }
  return instance
}

/**
 * Format agent status for display.
 */
export function formatAgentStatus(status: AgentStatus): string {
  switch (status) {
    case 'running':
      return '🟢 Running'
    case 'paused':
      return '⏸️ Paused'
    case 'stopped':
      return '🔴 Stopped'
    case 'error':
      return '⚠️ Error'
    case 'recovering':
      return '🔄 Recovering'
    case 'circuit-open':
      return '🔴 Circuit Open'
    default:
      return '❓ Unknown'
  }
}

/**
 * Get status color.
 */
export function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case 'running':
      return '#10B981'
    case 'paused':
      return '#6B7280'
    case 'stopped':
      return '#EF4444'
    case 'error':
      return '#F59E0B'
    case 'recovering':
      return '#3B82F6'
    case 'circuit-open':
      return '#DC2626'
    default:
      return '#9CA3AF'
  }
}

/**
 * Format circuit state.
 */
export function formatCircuitState(state: CircuitState): string {
  switch (state) {
    case 'closed':
      return '🟢 Closed'
    case 'open':
      return '🔴 Open'
    case 'half-open':
      return '🟡 Half-Open'
    default:
      return '❓ Unknown'
  }
}
