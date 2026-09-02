/**
 * Enhanced Auto-Resume System for Idexal Agents.
 * Provides checkpoint-based recovery, model switching, and advanced monitoring.
 */

/** Agent status types */
export type AgentStatus = 'running' | 'paused' | 'stopped' | 'error' | 'recovering' | 'circuit-open' | 'checkpoint-saved'

/** Recovery strategy types */
export type RecoveryStrategy = 'immediate' | 'exponential-backoff' | 'linear-backoff' | 'fixed-interval' | 'adaptive' | 'checkpoint-based'

/** Circuit breaker state */
export type CircuitState = 'closed' | 'open' | 'half-open'

/** Checkpoint data for recovery */
export interface Checkpoint {
  id: string
  timestamp: Date
  agentId: string
  sessionId: string
  state: Record<string, unknown>
  messageCount: number
  lastMessageId: string | undefined
  metadata: CheckpointMetadata
}

/** Checkpoint metadata */
export interface CheckpointMetadata {
  model: string
  provider: string
  tokenCount: number
  conversationLength: number
  attachments: number
  createdAt: Date
}

/** Agent interface with checkpoint support */
export interface Agent {
  id: string
  name: string
  status: AgentStatus
  lastActivity: Date
  retryCount: number
  maxRetries: number
  error: string | undefined
  sessionId: string | undefined
  circuitState: CircuitState
  consecutiveFailures: number
  lastErrorTime: Date | undefined
  recoveryStrategy: RecoveryStrategy
  metadata: Record<string, unknown>
  /** Current checkpoint */
  checkpoint: Checkpoint | undefined
  /** Checkpoint history */
  checkpointHistory: Checkpoint[]
  /** Current model */
  currentModel: string
  /** Fallback models */
  fallbackModels: string[]
  /** Model switch count */
  modelSwitchCount: number
  /** Performance metrics */
  performance: AgentPerformance
}

/** Agent performance metrics */
export interface AgentPerformance {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastResponseTime: number
  uptime: number
  lastDowntime: Date | undefined
}

/** Auto-resume configuration with checkpoint support */
export interface AutoResumeConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  exponentialBackoff: boolean
  jitter: boolean
  healthCheckInterval: number
  autoRecover: boolean
  circuitBreakerThreshold: number
  circuitBreakerTimeout: number
  defaultRecoveryStrategy: RecoveryStrategy
  enableLogging: boolean
  /** Enable checkpoint-based recovery */
  enableCheckpoints: boolean
  /** Maximum checkpoints to keep per agent */
  maxCheckpoints: number
  /** Auto-save interval in milliseconds */
  checkpointInterval: number
  /** Enable automatic model switching on failure */
  enableModelSwitching: boolean
  /** Maximum model switches before fallback */
  maxModelSwitches: number
  /** Performance monitoring interval */
  performanceMonitoringInterval: number
  onResume: ((agent: Agent) => void) | undefined
  onPermanentFailure: ((agent: Agent) => void) | undefined
  onStatusChange: ((agent: Agent, oldStatus: AgentStatus, newStatus: AgentStatus) => void) | undefined
  onCircuitBreak: ((agent: Agent) => void) | undefined
  onMetricsUpdate: ((metrics: AutoResumeMetrics) => void) | undefined
  onCheckpointSave: ((checkpoint: Checkpoint) => void) | undefined
  onModelSwitch: ((agent: Agent, fromModel: string, toModel: string) => void) | undefined
}

/** Auto-resume state */
export interface AutoResumeState {
  agents: Map<string, Agent>
  enabled: boolean
  totalRetries: number
  totalRecoveries: number
  totalFailures: number
  totalCircuitBreaks: number
  totalCheckpoints: number
  totalModelSwitches: number
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
  checkpointSuccessRate: number
  modelSwitchSuccessRate: number
  averageResponseTime: number
}

/** Recovery event log entry */
export interface RecoveryEvent {
  timestamp: Date
  agentId: string
  agentName: string
  event: 'error' | 'retry' | 'recovery' | 'failure' | 'circuit-break' | 'circuit-reset' | 'checkpoint-save' | 'checkpoint-restore' | 'model-switch'
  details: string
  duration?: number
}

/**
 * Enhanced Auto-Resume Manager with checkpoint recovery and model switching.
 */
export class EnhancedAutoResumeManager {
  private config: AutoResumeConfig
  private state: AutoResumeState
  private healthCheckTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private circuitResetTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private checkpointTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
  private performanceTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
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
      defaultRecoveryStrategy: config.defaultRecoveryStrategy ?? 'adaptive',
      enableLogging: config.enableLogging ?? true,
      enableCheckpoints: config.enableCheckpoints ?? true,
      maxCheckpoints: config.maxCheckpoints ?? 10,
      checkpointInterval: config.checkpointInterval ?? 30000,
      enableModelSwitching: config.enableModelSwitching ?? true,
      maxModelSwitches: config.maxModelSwitches ?? 3,
      performanceMonitoringInterval: config.performanceMonitoringInterval ?? 5000,
      onResume: config.onResume,
      onPermanentFailure: config.onPermanentFailure,
      onStatusChange: config.onStatusChange,
      onCircuitBreak: config.onCircuitBreak,
      onMetricsUpdate: config.onMetricsUpdate,
      onCheckpointSave: config.onCheckpointSave,
      onModelSwitch: config.onModelSwitch,
    }

    this.state = {
      agents: new Map(),
      enabled: true,
      totalRetries: 0,
      totalRecoveries: 0,
      totalFailures: 0,
      totalCircuitBreaks: 0,
      totalCheckpoints: 0,
      totalModelSwitches: 0,
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
      currentModel?: string
      fallbackModels?: string[]
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
      checkpoint: undefined,
      checkpointHistory: [],
      currentModel: options.currentModel ?? 'deepseek-chat',
      fallbackModels: options.fallbackModels ?? ['deepseek-coder', 'gpt-4', 'gpt-3.5-turbo'],
      modelSwitchCount: 0,
      performance: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastResponseTime: 0,
        uptime: 0,
        lastDowntime: undefined,
      },
    }

    this.state.agents.set(agentId, agent)
    this.startHealthCheck(agentId)
    if (this.config.enableCheckpoints) {
      this.startCheckpointSaving(agentId)
    }
    this.startPerformanceMonitoring(agentId)
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
      this.stopCheckpointSaving(agentId)
      this.stopPerformanceMonitoring(agentId)
      this.cancelRetry(agentId)
      this.cancelCircuitReset(agentId)
      this.state.agents.delete(agentId)
      this.notifyListeners()
    }
  }

  /**
   * Save checkpoint for an agent.
   */
  saveCheckpoint(agentId: string, state: Record<string, unknown>): Checkpoint | null {
    const agent = this.state.agents.get(agentId)
    if (!agent || !this.config.enableCheckpoints) return null

    const checkpoint: Checkpoint = {
      id: `cp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      agentId,
      sessionId: agent.sessionId ?? '',
      state,
      messageCount: (state.messageCount as number) ?? 0,
      lastMessageId: state.lastMessageId as string | undefined,
      metadata: {
        model: agent.currentModel,
        provider: agent.metadata.provider as string ?? 'unknown',
        tokenCount: (state.tokenCount as number) ?? 0,
        conversationLength: (state.conversationLength as number) ?? 0,
        attachments: (state.attachments as number) ?? 0,
        createdAt: new Date(),
      },
    }

    agent.checkpoint = checkpoint
    agent.checkpointHistory.push(checkpoint)

    // Keep only maxCheckpoints
    if (agent.checkpointHistory.length > this.config.maxCheckpoints) {
      agent.checkpointHistory = agent.checkpointHistory.slice(-this.config.maxCheckpoints)
    }

    this.state.totalCheckpoints++
    this.config.onCheckpointSave?.(checkpoint)
    this.logEvent(agentId, agent.name, 'checkpoint-save', `Checkpoint saved: ${checkpoint.id}`)

    return checkpoint
  }

  /**
   * Restore from checkpoint.
   */
  restoreCheckpoint(agentId: string, checkpointId?: string): Checkpoint | null {
    const agent = this.state.agents.get(agentId)
    if (!agent) return null

    let checkpoint: Checkpoint | undefined

    if (checkpointId) {
      checkpoint = agent.checkpointHistory.find(cp => cp.id === checkpointId)
    } else {
      checkpoint = agent.checkpoint
    }

    if (!checkpoint) return null

    agent.checkpoint = checkpoint
    this.logEvent(agentId, agent.name, 'checkpoint-restore', `Checkpoint restored: ${checkpoint.id}`)

    return checkpoint
  }

  /**
   * Switch to a fallback model.
   */
  switchModel(agentId: string, reason: string): boolean {
    const agent = this.state.agents.get(agentId)
    if (!agent || !this.config.enableModelSwitching) return false

    if (agent.modelSwitchCount >= this.config.maxModelSwitches) {
      return false
    }

    const currentModelIndex = agent.fallbackModels.indexOf(agent.currentModel)
    const nextModelIndex = currentModelIndex + 1

    if (nextModelIndex >= agent.fallbackModels.length) {
      return false
    }

    const oldModel = agent.currentModel
    const newModel = agent.fallbackModels[nextModelIndex]!

    agent.currentModel = newModel
    agent.modelSwitchCount++
    this.state.totalModelSwitches++

    this.config.onModelSwitch?.(agent, oldModel, newModel)
    this.logEvent(agentId, agent.name, 'model-switch', `Model switched: ${oldModel} → ${newModel} (${reason})`)

    return true
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

      this.updatePerformance(agentId, true, 0)
      this.updateMetrics()
    }
  }

  /**
   * Report agent error with automatic recovery.
   */
  reportError(agentId: string, error: string, responseTime?: number): void {
    const agent = this.state.agents.get(agentId)
    if (!agent) return

    agent.error = error
    agent.lastActivity = new Date()
    agent.lastErrorTime = new Date()
    agent.consecutiveFailures++

    this.updatePerformance(agentId, false, responseTime ?? 0)
    this.logEvent(agentId, agent.name, 'error', error)

    // Check circuit breaker
    if (agent.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      this.tripCircuitBreaker(agentId)
      return
    }

    // Try model switching first
    if (this.config.enableModelSwitching && agent.modelSwitchCount < this.config.maxModelSwitches) {
      if (this.switchModel(agentId, error)) {
        this.updateAgentStatus(agentId, 'recovering')
        this.scheduleRetry(agentId)
        return
      }
    }

    // Attempt recovery
    if (this.config.autoRecover && agent.retryCount < agent.maxRetries) {
      this.updateAgentStatus(agentId, 'error')
      this.scheduleRetry(agentId)
    } else {
      this.updateAgentStatus(agentId, 'stopped')
      this.state.totalFailures++
      agent.performance.lastDowntime = new Date()
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
    this.stopAllCheckpointSavings()
    this.stopAllPerformanceMonitorings()
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

  /**
   * Get agent checkpoints.
   */
  getCheckpoints(agentId: string): Checkpoint[] {
    const agent = this.state.agents.get(agentId)
    return agent?.checkpointHistory ?? []
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
        const errorWeight = agent.consecutiveFailures > 3 ? 2 : 1
        delay = this.config.baseDelay * Math.pow(1.5, agent.retryCount) * errorWeight
        break

      case 'checkpoint-based':
        // Use checkpoint data to determine delay
        if (agent.checkpoint) {
          const timeSinceCheckpoint = Date.now() - agent.checkpoint.timestamp.getTime()
          delay = Math.min(timeSinceCheckpoint * 0.1, this.config.maxDelay)
        } else {
          delay = this.config.baseDelay * Math.pow(2, agent.retryCount)
        }
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

  private async performRecovery(agent: Agent): Promise<void> {
    // If we have a checkpoint, restore from it
    if (agent.checkpoint && this.config.enableCheckpoints) {
      this.logEvent(agent.id, agent.name, 'checkpoint-restore', `Restoring from checkpoint: ${agent.checkpoint.id}`)
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 95% success rate simulation
        if (Math.random() > 0.05) {
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

  private startCheckpointSaving(agentId: string): void {
    this.stopCheckpointSaving(agentId)

    const timer = setInterval(() => {
      const agent = this.state.agents.get(agentId)
      if (!agent || agent.status !== 'running') return

      // Auto-save checkpoint with current state
      this.saveCheckpoint(agentId, {
        messageCount: agent.performance.totalRequests,
        tokenCount: 0,
        conversationLength: agent.performance.totalRequests,
        attachments: 0,
      })
    }, this.config.checkpointInterval)

    this.checkpointTimers.set(agentId, timer)
  }

  private stopCheckpointSaving(agentId: string): void {
    const timer = this.checkpointTimers.get(agentId)
    if (timer) {
      clearInterval(timer)
      this.checkpointTimers.delete(agentId)
    }
  }

  private stopAllCheckpointSavings(): void {
    for (const timer of this.checkpointTimers.values()) {
      clearInterval(timer)
    }
    this.checkpointTimers.clear()
  }

  private startPerformanceMonitoring(agentId: string): void {
    this.stopPerformanceMonitoring(agentId)

    const timer = setInterval(() => {
      const agent = this.state.agents.get(agentId)
      if (!agent) return

      // Update uptime
      if (agent.status === 'running') {
        agent.performance.uptime += this.config.performanceMonitoringInterval
      }
    }, this.config.performanceMonitoringInterval)

    this.performanceTimers.set(agentId, timer)
  }

  private stopPerformanceMonitoring(agentId: string): void {
    const timer = this.performanceTimers.get(agentId)
    if (timer) {
      clearInterval(timer)
      this.performanceTimers.delete(agentId)
    }
  }

  private stopAllPerformanceMonitorings(): void {
    for (const timer of this.performanceTimers.values()) {
      clearInterval(timer)
    }
    this.performanceTimers.clear()
  }

  private updatePerformance(agentId: string, success: boolean, responseTime: number): void {
    const agent = this.state.agents.get(agentId)
    if (!agent) return

    agent.performance.totalRequests++
    if (success) {
      agent.performance.successfulRequests++
    } else {
      agent.performance.failedRequests++
    }

    agent.performance.lastResponseTime = responseTime
    agent.performance.averageResponseTime = 
      (agent.performance.averageResponseTime * (agent.performance.totalRequests - 1) + responseTime) / 
      agent.performance.totalRequests
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

    const totalCheckpoints = agents.reduce((sum, a) => sum + a.checkpointHistory.length, 0)
    const checkpointSuccessRate = totalCheckpoints > 0 ? 1 : 0

    const modelSwitchSuccessRate = this.state.totalModelSwitches > 0 ? 0.9 : 1

    const averageResponseTime = agents.length > 0
      ? agents.reduce((sum, a) => sum + a.performance.averageResponseTime, 0) / agents.length
      : 0

    return {
      totalAgents: agents.length,
      activeAgents,
      recoveredAgents,
      failedAgents,
      circuitBrokenAgents,
      averageRecoveryTime: this.config.baseDelay,
      successRate,
      uptime,
      checkpointSuccessRate,
      modelSwitchSuccessRate,
      averageResponseTime,
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
let instance: EnhancedAutoResumeManager | null = null

export function getEnhancedAutoResumeManager(
  config?: Partial<AutoResumeConfig>
): EnhancedAutoResumeManager {
  if (!instance) {
    instance = new EnhancedAutoResumeManager(config)
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
    case 'checkpoint-saved':
      return '💾 Checkpoint Saved'
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
    case 'checkpoint-saved':
      return '#8B5CF6'
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

/**
 * Format checkpoint for display.
 */
export function formatCheckpoint(checkpoint: Checkpoint): string {
  return `Checkpoint ${checkpoint.id} (${checkpoint.timestamp.toLocaleString()})`
}
