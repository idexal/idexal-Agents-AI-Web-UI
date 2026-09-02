/**
 * Code Migration Planner Engine for Idexal Agents.
 * Plan, track, and execute code migrations with risk assessment,
 * dependency analysis, and rollback strategies.
 */

/** Migration type */
export type MigrationType = 'version-upgrade' | 'framework-switch' | 'pattern-modernize' | 'api-migration' | 'refactor'

/** Migration status */
export type MigrationStatus = 'planned' | 'in-progress' | 'completed' | 'failed' | 'rolled-back'

/** Risk level */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/** Migration step */
export interface MigrationStep {
  id: string
  name: string
  description: string
  /** Estimated time in minutes */
  estimatedTime: number
  /** Risk level */
  risk: RiskLevel
  /** Dependencies (other step IDs) */
  dependencies: string[]
  /** Files affected */
  affectedFiles: string[]
  /** Commands to run */
  commands: string[]
  /** Rollback commands */
  rollbackCommands: string[]
  /** Verification steps */
  verification: string[]
  /** Status */
  status: MigrationStatus
  /** Actual time taken in minutes */
  actualTime?: number
  /** Notes */
  notes?: string
  /** Completed at */
  completedAt?: number
}

/** Migration plan */
export interface MigrationPlan {
  id: string
  name: string
  description: string
  type: MigrationType
  /** Source version/framework */
  from: { name: string; version: string }
  /** Target version/framework */
  to: { name: string; version: string }
  /** Migration steps */
  steps: MigrationStep[]
  /** Total estimated time in minutes */
  totalEstimatedTime: number
  /** Overall risk level */
  overallRisk: RiskLevel
  /** Prerequisites */
  prerequisites: string[]
  /** Rollback strategy */
  rollbackStrategy: string
  /** Status */
  status: MigrationStatus
  /** Created at */
  createdAt: number
  /** Completed at */
  completedAt?: number
}

/** Migration config */
export interface MigrationPlannerConfig {
  maxSteps: number
  autoVerify: boolean
  requireRollback: boolean
}

const BUILTIN_MIGRATIONS: Record<string, Partial<MigrationPlan>> = {
  'react-17-to-18': {
    name: 'React 17 to 18 Migration',
    description: 'Migrate from React 17 to React 18 with new features',
    type: 'version-upgrade',
    from: { name: 'react', version: '17' },
    to: { name: 'react', version: '18' },
    prerequisites: ['Create a feature branch', 'Ensure all tests pass', 'Review React 18 changelog'],
    rollbackStrategy: 'git revert and npm install react@17',
    steps: [
      { id: 'step-1', name: 'Update dependencies', description: 'Update React and React DOM to v18', estimatedTime: 5, risk: 'low', dependencies: [], affectedFiles: ['package.json'], commands: ['npm install react@18 react-dom@18'], rollbackCommands: ['npm install react@17 react-dom@17'], verification: ['Check package.json versions'], status: 'planned' },
      { id: 'step-2', name: 'Update TypeScript types', description: 'Update @types/react to v18', estimatedTime: 5, risk: 'low', dependencies: ['step-1'], affectedFiles: ['package.json'], commands: ['npm install @types/react@18 @types/react-dom@18'], rollbackCommands: ['npm install @types/react@17 @types/react-dom@17'], verification: ['TypeScript compiles'], status: 'planned' },
      { id: 'step-3', name: 'Update createRoot', description: 'Replace ReactDOM.render with createRoot', estimatedTime: 15, risk: 'medium', dependencies: ['step-2'], affectedFiles: ['src/index.tsx', 'src/main.tsx'], commands: [], rollbackCommands: [], verification: ['App renders correctly'], status: 'planned' },
      { id: 'step-4', name: 'Update StrictMode', description: 'Update StrictMode usage for React 18', estimatedTime: 10, risk: 'low', dependencies: ['step-3'], affectedFiles: ['src/index.tsx'], commands: [], rollbackCommands: [], verification: ['No double-render issues'], status: 'planned' },
      { id: 'step-5', name: 'Test and verify', description: 'Run full test suite and verify', estimatedTime: 30, risk: 'low', dependencies: ['step-4'], affectedFiles: [], commands: ['npm test', 'npm run build'], rollbackCommands: [], verification: ['All tests pass', 'Build succeeds'], status: 'planned' },
    ],
  },
  'typescript-strict': {
    name: 'TypeScript Strict Mode Migration',
    description: 'Enable strict TypeScript checks incrementally',
    type: 'pattern-modernize',
    from: { name: 'typescript', version: 'non-strict' },
    to: { name: 'typescript', version: 'strict' },
    prerequisites: ['Review current TypeScript config'],
    rollbackStrategy: 'Revert tsconfig.json changes',
    steps: [
      { id: 'step-1', name: 'Enable noImplicitAny', description: 'Add noImplicitAny to tsconfig', estimatedTime: 30, risk: 'medium', dependencies: [], affectedFiles: ['tsconfig.json'], commands: [], rollbackCommands: [], verification: ['TypeScript compiles with noImplicitAny'], status: 'planned' },
      { id: 'step-2', name: 'Enable strictNullChecks', description: 'Add strictNullChecks to tsconfig', estimatedTime: 60, risk: 'high', dependencies: ['step-1'], affectedFiles: ['tsconfig.json', 'src/**/*.ts'], commands: [], rollbackCommands: [], verification: ['TypeScript compiles with strictNullChecks'], status: 'planned' },
      { id: 'step-3', name: 'Enable strictFunctionTypes', description: 'Add strictFunctionTypes to tsconfig', estimatedTime: 20, risk: 'medium', dependencies: ['step-2'], affectedFiles: ['tsconfig.json'], commands: [], rollbackCommands: [], verification: ['TypeScript compiles'], status: 'planned' },
      { id: 'step-4', name: 'Enable full strict mode', description: 'Enable strict: true in tsconfig', estimatedTime: 10, risk: 'low', dependencies: ['step-3'], affectedFiles: ['tsconfig.json'], commands: [], rollbackCommands: [], verification: ['Full strict mode compiles'], status: 'planned' },
    ],
  },
  'node-18-to-20': {
    name: 'Node.js 18 to 20 Migration',
    description: 'Upgrade Node.js runtime from 18 to 20',
    type: 'version-upgrade',
    from: { name: 'node', version: '18' },
    to: { name: 'node', version: '20' },
    prerequisites: ['Install Node.js 20', 'Update CI/CD pipelines'],
    rollbackStrategy: 'Switch back to Node.js 18 in CI/CD',
    steps: [
      { id: 'step-1', name: 'Update engines field', description: 'Update package.json engines', estimatedTime: 5, risk: 'low', dependencies: [], affectedFiles: ['package.json'], commands: [], rollbackCommands: [], verification: ['package.json updated'], status: 'planned' },
      { id: 'step-2', name: 'Update CI/CD', description: 'Update CI/CD to use Node 20', estimatedTime: 15, risk: 'medium', dependencies: ['step-1'], affectedFiles: ['.github/workflows/*.yml'], commands: [], rollbackCommands: [], verification: ['CI/CD uses Node 20'], status: 'planned' },
      { id: 'step-3', name: 'Test compatibility', description: 'Run full test suite', estimatedTime: 30, risk: 'low', dependencies: ['step-2'], affectedFiles: [], commands: ['npm test', 'npm run build'], rollbackCommands: [], verification: ['All tests pass'], status: 'planned' },
    ],
  },
}

/**
 * Code Migration Planner Engine.
 */
export class MigrationPlannerEngine {
  private plans: Map<string, MigrationPlan> = new Map()
  private config: MigrationPlannerConfig
  private listeners: Set<(event: MigrationPlannerEvent) => void> = new Set()

  constructor(_config: Partial<MigrationPlannerConfig> = {}) {
    this.config = {
      maxSteps: _config.maxSteps ?? 50,
      autoVerify: _config.autoVerify ?? true,
      requireRollback: _config.requireRollback ?? true,
    }
  }

  /**
   * Create a migration plan from template.
   */
  createFromTemplate(templateId: string): MigrationPlan | null {
    const template = BUILTIN_MIGRATIONS[templateId]
    if (!template) return null

    const plan: MigrationPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: template.name ?? 'Migration',
      description: template.description ?? '',
      type: template.type ?? 'version-upgrade',
      from: template.from ?? { name: '', version: '' },
      to: template.to ?? { name: '', version: '' },
      steps: (template.steps ?? []).map(s => ({ ...s, id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` })),
      totalEstimatedTime: (template.steps ?? []).reduce((s, step) => s + (step.estimatedTime ?? 0), 0),
      overallRisk: this.calculateOverallRisk(template.steps ?? []),
      prerequisites: template.prerequisites ?? [],
      rollbackStrategy: template.rollbackStrategy ?? '',
      status: 'planned',
      createdAt: Date.now(),
    }

    this.plans.set(plan.id, plan)
    this.notifyListeners({ type: 'plan-created', plan })
    return plan
  }

  /**
   * Create a custom migration plan.
   */
  createPlan(data: {
    name: string
    description: string
    type: MigrationType
    from: { name: string; version: string }
    to: { name: string; version: string }
    steps: Omit<MigrationStep, 'id' | 'status'>[]
    prerequisites?: string[]
    rollbackStrategy?: string
  }): MigrationPlan {
    // Limit steps to maxSteps
    const limitedSteps = data.steps.slice(0, this.config.maxSteps)
    const steps: MigrationStep[] = limitedSteps.map(s => ({
      ...s,
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'planned' as const,
    }))

    const plan: MigrationPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: data.name,
      description: data.description,
      type: data.type,
      from: data.from,
      to: data.to,
      steps,
      totalEstimatedTime: steps.reduce((s, step) => s + step.estimatedTime, 0),
      overallRisk: this.calculateOverallRisk(steps),
      prerequisites: data.prerequisites ?? [],
      rollbackStrategy: data.rollbackStrategy ?? '',
      status: 'planned',
      createdAt: Date.now(),
    }

    this.plans.set(plan.id, plan)
    this.notifyListeners({ type: 'plan-created', plan })
    return plan
  }

  /**
   * Start a migration step.
   */
  startStep(planId: string, stepId: string): boolean {
    const plan = this.plans.get(planId)
    if (!plan) return false

    const step = plan.steps.find(s => s.id === stepId)
    if (!step || step.status !== 'planned') return false

    // Check dependencies
    for (const depId of step.dependencies) {
      const dep = plan.steps.find(s => s.id === depId)
      if (dep?.status !== 'completed') return false
    }

    step.status = 'in-progress'
    plan.status = 'in-progress'
    this.notifyListeners({ type: 'step-started', plan, step })
    return true
  }

  /**
   * Complete a migration step.
   */
  completeStep(planId: string, stepId: string, actualTime: number, notes?: string): boolean {
    const plan = this.plans.get(planId)
    if (!plan) return false

    const step = plan.steps.find(s => s.id === stepId)
    if (!step || step.status !== 'in-progress') return false

    step.status = 'completed'
    step.actualTime = actualTime
    step.completedAt = Date.now()
    if (notes) step.notes = notes

    // Check if all steps are completed
    if (plan.steps.every(s => s.status === 'completed')) {
      plan.status = 'completed'
      plan.completedAt = Date.now()
    }

    this.notifyListeners({ type: 'step-completed', plan, step })
    return true
  }

  /**
   * Rollback a migration step.
   */
  rollbackStep(planId: string, stepId: string): boolean {
    const plan = this.plans.get(planId)
    if (!plan) return false

    const step = plan.steps.find(s => s.id === stepId)
    if (!step) return false

    step.status = 'rolled-back'
    step.notes = 'Rolled back'
    plan.status = 'rolled-back'

    this.notifyListeners({ type: 'step-rolled-back', plan, step })
    return true
  }

  /**
   * Get all plans.
   */
  getPlans(): MigrationPlan[] {
    return Array.from(this.plans.values())
  }

  /**
   * Get a specific plan.
   */
  getPlan(id: string): MigrationPlan | undefined {
    return this.plans.get(id)
  }

  /**
   * Get available templates.
   */
  getTemplates(): Array<{ id: string; name: string; description: string }> {
    return Object.entries(BUILTIN_MIGRATIONS).map(([id, template]) => ({
      id,
      name: template.name ?? '',
      description: template.description ?? '',
    }))
  }

  private calculateOverallRisk(steps: MigrationStep[]): RiskLevel {
    const riskOrder: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 }
    const maxRisk = steps.reduce((max, step) => Math.max(max, riskOrder[step.risk] ?? 0), 0)
    return (['low', 'medium', 'high', 'critical'] as const)[maxRisk] ?? 'low'
  }

  subscribe(listener: (event: MigrationPlannerEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: MigrationPlannerEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Migration planner event */
export interface MigrationPlannerEvent {
  type: 'plan-created' | 'step-started' | 'step-completed' | 'step-rolled-back'
  plan?: MigrationPlan
  step?: MigrationStep
}

/** Singleton */
let instance: MigrationPlannerEngine | null = null

export function getMigrationPlannerEngine(config?: Partial<MigrationPlannerConfig>): MigrationPlannerEngine {
  if (!instance) instance = new MigrationPlannerEngine(config)
  return instance
}

export function resetMigrationPlannerEngine(): void { instance = null }
