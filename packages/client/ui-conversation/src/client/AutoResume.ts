/**
 * Auto-Resume system for Idexal Agents.
 * Automatically resumes agents when they stop working.
 */

export type AgentStatus = 'running' | 'paused' | 'stopped' | 'error' | 'recovering'

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  lastActivity: Date
  retryCount: number
  maxRetries: number
  error: string | undefined
  sessionId: string | undefined
}

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
  /** Callback when agent resumes */
  onResume: ((agent: Agent) => void) | undefined
  /** Callback when agent fails permanently */
  onPermanentFailure: ((agent: Agent) => void) | undefined
  /** Callback when status changes */
  onStatusChange: ((agent: Agent, oldStatus: AgentStatus, newStatus: AgentStatus) => void) | undefined
}

export interface AutoResumeState {
  /** Map of agent IDs to their current state */
  agents: Map<string, Agent>
  /** Whether auto-resume is enabled */
  enabled: boolean
  /** Global retry count */
  totalRetries: number
  /** Total successful recoveries */
  totalRecoveries: number
  /** Total permanent failures */
  totalFailures: number
}

export class AutoResumeManager {
  private config: AutoResumeConfig
  private state: AutoResumeState
  private healthCheckTimers: Map<string, ReturnType<typeof setInterval>> = new Map()
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private listeners: Set<(state: AutoResumeState) => void> = new Set()

  constructor(config: Partial<AutoResumeConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 5,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      exponentialBackoff: config.exponentialBackoff ?? true,
      jitter: config.jitter ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 10000,
      autoRecover: config.autoRecover ?? true,
      onResume: config.onResume,
      onPermanentFailure: config.onPermanentFailure,
      onStatusChange: config.onStatusChange,
    }

    this.state = {
      agents: new Map(),
      enabled: true,
      totalRetries: 0,
      totalRecoveries: 0,
      totalFailures: 0,
    }
  }

  /**
   * Register an agent for auto-resume monitoring.
   */
  registerAgent(agentId: string, name: string, sessionId?: string): void {
    const agent: Agent = {
      id: agentId,
      name,
      status: 'running',
      lastActivity: new Date(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      error: undefined,
      sessionId: sessionId ?? undefined,
    }

    this.state.agents.set(agentId, agent)
    this.startHealthCheck(agentId)
    this.notifyListeners()
  }

  /**
   * Unregister an agent.
   */
  unregisterAgent(agentId: string): void {
    this.stopHealthCheck(agentId)
    this.cancelRetry(agentId)
    this.state.agents.delete(agentId)
    this.notifyListeners()
  }

  /**
   * Report agent activity (resets health check).
   */
  reportActivity(agentId: string): void {
    const agent = this.state.agents.get(agentId)
    if (agent) {
      agent.lastActivity = new Date()
      if (agent.status === 'recovering') {
        this.updateAgentStatus(agentId, 'running')
        agent.retryCount = 0
        this.state.totalRecoveries++
      }
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

    if (this.config.autoRecover && agent.retryCount < agent.maxRetries) {
      this.updateAgentStatus(agentId, 'error')
      this.scheduleRetry(agentId)
    } else {
      this.updateAgentStatus(agentId, 'stopped')
      this.state.totalFailures++
      this.config.onPermanentFailure?.(agent)
    }
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
   * Get state snapshot.
   */
  getState(): Readonly<AutoResumeState> {
    return this.state
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

    const delay = this.calculateDelay(agent.retryCount)
    agent.retryCount++
    this.state.totalRetries++

    this.updateAgentStatus(agentId, 'recovering')

    const timer = setTimeout(() => {
      this.attemptRecovery(agentId)
    }, delay)

    this.retryTimers.set(agentId, timer)
  }

  private calculateDelay(retryCount: number): number {
    let delay = this.config.baseDelay

    if (this.config.exponentialBackoff) {
      delay = Math.min(
        this.config.baseDelay * Math.pow(2, retryCount),
        this.config.maxDelay
      )
    }

    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.round(delay)
  }

  private async attemptRecovery(agentId: string): Promise<void> {
    const agent = this.state.agents.get(agentId)
    if (!agent || agent.status !== 'recovering') return

    try {
      // Attempt to recover the agent
      // This would typically involve:
      // 1. Reconnecting to the backend
      // 2. Re-establishing the session
      // 3. Resuming from the last checkpoint

      // For now, we'll just update the status
      this.updateAgentStatus(agentId, 'running')
      agent.retryCount = 0
      this.state.totalRecoveries++

      this.config.onResume?.(agent)
      this.notifyListeners()
    } catch (error) {
      this.reportError(agentId, String(error))
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
}

/**
 * Singleton instance of AutoResumeManager.
 */
let instance: AutoResumeManager | null = null

export function getAutoResumeManager(config?: Partial<AutoResumeConfig>): AutoResumeManager {
  if (!instance) {
    instance = new AutoResumeManager(config)
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
    default:
      return '❓ Unknown'
  }
}

/**
 * Get status color for display.
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
    default:
      return '#9CA3AF'
  }
}
