/**
 * AI Workflow Automation engine.
 *
 * Orchestrates multi-step automated workflows: CI/CD pipelines, code formatting
 * runs, test suites, deployment checks, and custom task chains.  Each workflow
 * is a directed graph of steps; the engine tracks execution, retries, and
 * rollback state.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepType = 'action' | 'condition' | 'parallel' | 'loop' | 'delay'

export type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'retrying'

export type TriggerType = 'manual' | 'schedule' | 'file-change' | 'git-push' | 'webhook' | 'event'

export interface WorkflowStep {
  readonly id: string
  readonly name: string
  readonly type: StepType
  readonly command: string
  readonly timeoutMs: number
  readonly retries: number
  readonly retryDelayMs: number
  readonly dependencies: readonly string[]
  readonly condition?: string
  status: StepStatus
  startedAt?: number
  completedAt?: number
  output?: string
  error?: string
  retryCount: number
}

export interface WorkflowTrigger {
  readonly type: TriggerType
  readonly pattern?: string
  readonly schedule?: string
  readonly enabled: boolean
}

export interface WorkflowConfig {
  readonly maxConcurrentSteps: number
  readonly defaultTimeoutMs: number
  readonly defaultRetries: number
  readonly enableRollback: boolean
  readonly enableNotifications: boolean
}

export interface Workflow {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly steps: WorkflowStep[]
  readonly trigger: WorkflowTrigger
  readonly createdAt: number
  readonly updatedAt: number
  status: 'idle' | 'running' | 'completed' | 'failed'
  executionCount: number
  lastRunAt?: number
}

export interface WorkflowEvent {
  readonly type: 'step-started' | 'step-completed' | 'step-failed' | 'workflow-completed' | 'workflow-failed'
  readonly workflowId: string
  readonly stepId?: string
  readonly timestamp: number
  readonly message?: string
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class WorkflowAutomationEngine {
  private readonly workflows = new Map<string, Workflow>()
  private readonly executionHistory: WorkflowEvent[] = []
  private readonly config: WorkflowConfig

  constructor(config?: Partial<WorkflowConfig>) {
    this.config = {
      maxConcurrentSteps: config?.maxConcurrentSteps ?? 4,
      defaultTimeoutMs: config?.defaultTimeoutMs ?? 30_000,
      defaultRetries: config?.defaultRetries ?? 2,
      enableRollback: config?.enableRollback ?? true,
      enableNotifications: config?.enableNotifications ?? true,
    }
  }

  createWorkflow(name: string, description: string, steps: Omit<WorkflowStep, 'status' | 'retryCount'>[], trigger: WorkflowTrigger): Workflow {
    const id = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const workflow: Workflow = {
    id,
    name,
    description,
    steps: steps.map(s => ({ ...s, status: 'pending' as StepStatus, retryCount: 0 })) as WorkflowStep[],
    trigger,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'idle',
    executionCount: 0,
  }
    this.workflows.set(id, workflow)
    return workflow
  }

  getWorkflow(id: string): Workflow | undefined { return this.workflows.get(id) }

  getAllWorkflows(): Workflow[] { return Array.from(this.workflows.values()) }

  deleteWorkflow(id: string): boolean { return this.workflows.delete(id) }

  /** Return ready steps whose dependencies are all satisfied. */
  getReadySteps(workflowId: string): WorkflowStep[] {
    const wf = this.workflows.get(workflowId)
    if (!wf) return []
    const completedIds = new Set(
      wf.steps.filter(s => s.status === 'success' || s.status === 'skipped').map(s => s.id),
    )
    return wf.steps.filter(s => s.status === 'pending' && s.dependencies.every(d => completedIds.has(d)))
  }

  startStep(workflowId: string, stepId: string): boolean {
    const wf = this.workflows.get(workflowId)
    if (!wf) return false
    const step = wf.steps.find(s => s.id === stepId)
    if (!step || step.status !== 'pending') return false

    const runningCount = wf.steps.filter(s => s.status === 'running').length
    if (runningCount >= this.config.maxConcurrentSteps) return false

    // update in-place (mutable for performance)
    const idx = wf.steps.indexOf(step)
    wf.steps[idx] = { ...step, status: 'running', startedAt: Date.now() }

    this.recordEvent({ type: 'step-started', workflowId, stepId, timestamp: Date.now() })
    return true
  }

  completeStep(workflowId: string, stepId: string, output?: string): boolean {
    return this.transitionStep(workflowId, stepId, 'success', output)
  }

  failStep(workflowId: string, stepId: string, error: string): boolean {
    const wf = this.workflows.get(workflowId)
    if (!wf) return false
    const step = wf.steps.find(s => s.id === stepId)
    if (!step || step.status !== 'running') return false

    if (step.retryCount < step.retries) {
      const idx = wf.steps.indexOf(step)
      wf.steps[idx] = { ...step, status: 'retrying', retryCount: step.retryCount + 1, error }
      this.recordEvent({ type: 'step-failed', workflowId, stepId, timestamp: Date.now(), message: `Retry ${step.retryCount + 1}/${step.retries}: ${error}` })
      // Re-enqueue for next cycle
      setTimeout(() => {
        const s = wf.steps.find(x => x.id === stepId)
        if (s && s.status === 'retrying') {
          const i = wf.steps.indexOf(s)
          wf.steps[i] = { ...s, status: 'pending' }
        }
      }, step.retryDelayMs)
      return true
    }

    this.transitionStep(workflowId, stepId, 'failed', error)
    this.recordEvent({ type: 'step-failed', workflowId, stepId, timestamp: Date.now(), message: error })
    void 0 // ensure statement-level usage
    this.checkWorkflowCompletion(workflowId)
    return true
  }

  skipStep(workflowId: string, stepId: string): boolean {
    return this.transitionStep(workflowId, stepId, 'skipped')
  }

  getWorkflowStatus(workflowId: string): { total: number; completed: number; failed: number; running: number; pending: number } | undefined {
    const wf = this.workflows.get(workflowId)
    if (!wf) return undefined
    return {
      total: wf.steps.length,
      completed: wf.steps.filter(s => s.status === 'success').length,
      failed: wf.steps.filter(s => s.status === 'failed').length,
      running: wf.steps.filter(s => s.status === 'running' || s.status === 'retrying').length,
      pending: wf.steps.filter(s => s.status === 'pending').length,
    }
  }

  getHistory(workflowId?: string): WorkflowEvent[] {
    if (!workflowId) return [...this.executionHistory]
    return this.executionHistory.filter(e => e.workflowId === workflowId)
  }

  /** Generate a suggested workflow from a template. */
  generateCIWorkflow(name: string, framework: string): Workflow {
    const templates: Record<string, Omit<WorkflowStep, 'status' | 'retryCount'>[]> = {
      node: [
        { id: 'install', name: 'Install dependencies', type: 'action', command: 'npm ci', timeoutMs: 60_000, retries: 1, retryDelayMs: 5_000, dependencies: [] },
        { id: 'lint', name: 'Lint code', type: 'action', command: 'npm run lint', timeoutMs: 30_000, retries: 0, retryDelayMs: 0, dependencies: ['install'] },
        { id: 'typecheck', name: 'Type check', type: 'action', command: 'npm run typecheck', timeoutMs: 60_000, retries: 0, retryDelayMs: 0, dependencies: ['install'] },
        { id: 'test', name: 'Run tests', type: 'action', command: 'npm test', timeoutMs: 120_000, retries: 1, retryDelayMs: 10_000, dependencies: ['install'] },
        { id: 'build', name: 'Build project', type: 'action', command: 'npm run build', timeoutMs: 120_000, retries: 1, retryDelayMs: 5_000, dependencies: ['lint', 'typecheck', 'test'] },
      ],
      python: [
        { id: 'install', name: 'Install dependencies', type: 'action', command: 'pip install -r requirements.txt', timeoutMs: 60_000, retries: 1, retryDelayMs: 5_000, dependencies: [] },
        { id: 'lint', name: 'Lint code', type: 'action', command: 'ruff check .', timeoutMs: 30_000, retries: 0, retryDelayMs: 0, dependencies: ['install'] },
        { id: 'test', name: 'Run tests', type: 'action', command: 'pytest', timeoutMs: 120_000, retries: 1, retryDelayMs: 10_000, dependencies: ['install'] },
        { id: 'build', name: 'Build package', type: 'action', command: 'python -m build', timeoutMs: 60_000, retries: 1, retryDelayMs: 5_000, dependencies: ['lint', 'test'] },
      ],
      generic: [
        { id: 'prepare', name: 'Prepare', type: 'action', command: 'make prepare', timeoutMs: 60_000, retries: 0, retryDelayMs: 0, dependencies: [] },
        { id: 'check', name: 'Quality checks', type: 'action', command: 'make check', timeoutMs: 120_000, retries: 1, retryDelayMs: 5_000, dependencies: ['prepare'] },
        { id: 'build', name: 'Build', type: 'action', command: 'make build', timeoutMs: 120_000, retries: 1, retryDelayMs: 5_000, dependencies: ['check'] },
      ],
    }

    const steps = templates[framework] ?? templates.generic
    return this.createWorkflow(name, `CI/CD pipeline for ${framework}`, steps as Omit<WorkflowStep, 'status' | 'retryCount'>[], { type: 'git-push', enabled: true })
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private transitionStep(workflowId: string, stepId: string, status: StepStatus, output?: string): boolean {
    const wf = this.workflows.get(workflowId)
    if (!wf) return false
    const step = wf.steps.find(s => s.id === stepId)
    if (!step) return false
    const idx = wf.steps.indexOf(step)
    wf.steps[idx] = { ...step, status, completedAt: Date.now(), output: output ?? step.output ?? '' }
    this.checkWorkflowCompletion(workflowId)
    return true
  }

  private checkWorkflowCompletion(workflowId: string): void {
    const wf = this.workflows.get(workflowId)
    if (!wf || wf.status !== 'running') return
    const allDone = wf.steps.every(s => s.status === 'success' || s.status === 'failed' || s.status === 'skipped')
    if (!allDone) return
    const anyFailed = wf.steps.some(s => s.status === 'failed')
    wf.status = anyFailed ? 'failed' : 'completed'
    this.recordEvent({
      type: anyFailed ? 'workflow-failed' : 'workflow-completed',
      workflowId,
      timestamp: Date.now(),
    })
  }

  private recordEvent(event: WorkflowEvent): void {
    this.executionHistory.push(event)
    if (this.executionHistory.length > 500) {
      this.executionHistory.splice(0, this.executionHistory.length - 500)
    }
  }
}

let _instance: WorkflowAutomationEngine | undefined
export function getWorkflowAutomationEngine(config?: Partial<WorkflowConfig>): WorkflowAutomationEngine {
  _instance ??= new WorkflowAutomationEngine(config)
  return _instance
}
export function resetWorkflowAutomationEngine(): void { _instance = undefined }
