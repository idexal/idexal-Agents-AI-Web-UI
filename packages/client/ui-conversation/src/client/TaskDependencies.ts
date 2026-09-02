/**
 * Task Dependencies Engine for Idexal Agents.
 * Manages task relationships, dependencies, and scheduling for Gantt chart view.
 */



/** Dependency types */
export type DependencyType =
  | 'finish-to-start'   // Task B starts after Task A finishes (default)
  | 'start-to-start'    // Task B starts when Task A starts
  | 'finish-to-finish'  // Task B finishes when Task A finishes
  | 'start-to-finish'   // Task B finishes when Task A starts

/** Task dependency */
export interface TaskDependency {
  id: string
  fromTaskId: string
  toTaskId: string
  type: DependencyType
  lag: number // days (positive = delay, negative = lead)
  createdAt: Date
}

/** Task schedule information */
export interface TaskSchedule {
  taskId: string
  startDate: Date
  endDate: Date
  duration: number // days
  progress: number // 0-100
  isCritical: boolean // part of critical path
  milestones: TaskMilestone[]
}

/** Task milestone */
export interface TaskMilestone {
  id: string
  taskId: string
  name: string
  date: Date
  isCompleted: boolean
}

/** Critical path result */
export interface CriticalPath {
  tasks: string[]
  duration: number
  startDate: Date
  endDate: Date
}

/** Gantt chart configuration */
export interface GanttConfig {
  /** View mode */
  viewMode: 'day' | 'week' | 'month' | 'quarter'
  /** Show dependencies */
  showDependencies: boolean
  /** Show critical path */
  showCriticalPath: boolean
  /** Show progress */
  showProgress: boolean
  /** Row height */
  rowHeight: number
  /** Header height */
  headerHeight: number
  /** Day width (pixels) */
  dayWidth: number
  /** Column snap */
  snapToGrid: boolean
  /** Enable drag to reschedule */
  enableDrag: boolean
  /** Date format */
  dateFormat: string
  /** Language */
  language: 'en' | 'ar' | 'zh'
}

/** Gantt chart state */
export interface GanttState {
  config: GanttConfig
  tasks: TaskSchedule[]
  dependencies: TaskDependency[]
  criticalPath: CriticalPath | null
  zoom: number
  scrollLeft: number
  selectedTask: string | null
  hoveredTask: string | null
  dragState: GanttDragState | null
}

/** Gantt drag state */
export interface GanttDragState {
  taskId: string
  type: 'move' | 'resize-start' | 'resize-end'
  startX: number
  originalStart: Date
  originalEnd: Date
  currentStart: Date
  currentEnd: Date
}

/** Gantt event types */
export type GanttEventType =
  | 'task-click'
  | 'task-drag-start'
  | 'task-drag-end'
  | 'task-resize'
  | 'dependency-add'
  | 'dependency-remove'
  | 'view-mode-change'
  | 'zoom-change'

/** Gantt event */
export interface GanttEvent {
  type: GanttEventType
  taskId?: string
  data: Record<string, unknown>
  timestamp: Date
}

/** Task dependencies configuration */
export interface TaskDependenciesConfig {
  /** Enable dependencies */
  enabled: boolean
  /** Allow circular dependencies */
  allowCircular: boolean
  /** Auto-calculate critical path */
  autoCriticalPath: boolean
  /** Default dependency type */
  defaultType: DependencyType
  /** Max dependencies per task */
  maxDependencies: number
  /** Callback on event */
  onEvent: ((event: GanttEvent) => void) | undefined
}

/**
 * Task Dependencies Engine.
 */
export class TaskDependenciesEngine {
  private config: TaskDependenciesConfig
  private dependencies: Map<string, TaskDependency> = new Map()
  private schedules: Map<string, TaskSchedule> = new Map()
  private eventListeners = new Set<(event: GanttEvent) => void>()

  constructor(config: Partial<TaskDependenciesConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      allowCircular: config.allowCircular ?? false,
      autoCriticalPath: config.autoCriticalPath ?? true,
      defaultType: config.defaultType ?? 'finish-to-start',
      maxDependencies: config.maxDependencies ?? 10,
      onEvent: config.onEvent,
    }
  }

  // === Dependency Management ===

  /** Add a dependency between tasks */
  addDependency(fromTaskId: string, toTaskId: string, type?: DependencyType, lag: number = 0): TaskDependency | null {
    if (!this.config.enabled) return null
    if (fromTaskId === toTaskId) return null

    // Check max dependencies
    const toTaskDeps = this.getDependenciesTo(toTaskId)
    if (toTaskDeps.length >= this.config.maxDependencies) return null

    // Check for circular dependency
    if (!this.config.allowCircular && this.wouldCreateCycle(fromTaskId, toTaskId)) {
      return null
    }

    const dependency: TaskDependency = {
      id: `dep-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      fromTaskId,
      toTaskId,
      type: type ?? this.config.defaultType,
      lag,
      createdAt: new Date(),
    }

    this.dependencies.set(dependency.id, dependency)
    this.emitEvent({ type: 'dependency-add', taskId: toTaskId, data: { dependency }, timestamp: new Date() })

    return dependency
  }

  /** Remove a dependency */
  removeDependency(dependencyId: string): boolean {
    const dependency = this.dependencies.get(dependencyId)
    if (!dependency) return false

    this.dependencies.delete(dependencyId)
    this.emitEvent({ type: 'dependency-remove', taskId: dependency.toTaskId, data: { dependencyId }, timestamp: new Date() })

    return true
  }

  /** Get dependencies for a task (what depends on it) */
  getDependenciesFrom(taskId: string): TaskDependency[] {
    return Array.from(this.dependencies.values()).filter(d => d.fromTaskId === taskId)
  }

  /** Get dependencies to a task (what it depends on) */
  getDependenciesTo(taskId: string): TaskDependency[] {
    return Array.from(this.dependencies.values()).filter(d => d.toTaskId === taskId)
  }

  /** Get all dependencies */
  getAllDependencies(): TaskDependency[] {
    return Array.from(this.dependencies.values())
  }

  /** Check if task can start (all dependencies satisfied) */
  canTaskStart(taskId: string, completedTaskIds: Set<string>): boolean {
    const deps = this.getDependenciesTo(taskId)
    if (deps.length === 0) return true

    return deps.every(dep => {
      switch (dep.type) {
        case 'finish-to-start':
          return completedTaskIds.has(dep.fromTaskId)
        case 'start-to-start':
          return this.schedules.has(dep.fromTaskId)
        case 'finish-to-finish':
          return true // Can always start, but finish depends on other
        case 'start-to-finish':
          return true // Can always start, but finish depends on other
        default:
          return true
      }
    })
  }

  // === Schedule Management ===

  /** Set task schedule */
  setSchedule(taskId: string, startDate: Date, endDate: Date, progress: number = 0): TaskSchedule {
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const schedule: TaskSchedule = {
      taskId,
      startDate,
      endDate,
      duration,
      progress,
      isCritical: false,
      milestones: [],
    }

    this.schedules.set(taskId, schedule)

    if (this.config.autoCriticalPath) {
      this.calculateCriticalPath()
    }

    return schedule
  }

  /** Get task schedule */
  getSchedule(taskId: string): TaskSchedule | undefined {
    return this.schedules.get(taskId)
  }

  /** Get all schedules */
  getAllSchedules(): TaskSchedule[] {
    return Array.from(this.schedules.values())
  }

  /** Update task progress */
  updateProgress(taskId: string, progress: number): void {
    const schedule = this.schedules.get(taskId)
    if (schedule) {
      schedule.progress = Math.max(0, Math.min(100, progress))
    }
  }

  // === Milestones ===

  /** Add a milestone */
  addMilestone(taskId: string, name: string, date: Date): TaskMilestone | null {
    const schedule = this.schedules.get(taskId)
    if (!schedule) return null

    const milestone: TaskMilestone = {
      id: `mile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId,
      name,
      date,
      isCompleted: false,
    }

    schedule.milestones.push(milestone)
    return milestone
  }

  /** Complete a milestone */
  completeMilestone(milestoneId: string): boolean {
    for (const schedule of this.schedules.values()) {
      const milestone = schedule.milestones.find(m => m.id === milestoneId)
      if (milestone) {
        milestone.isCompleted = true
        return true
      }
    }
    return false
  }

  // === Critical Path ===

  /** Calculate critical path */
  calculateCriticalPath(): CriticalPath | null {
    if (this.schedules.size === 0) return null

    // Simple critical path calculation
    const tasks = Array.from(this.schedules.values())
    if (tasks.length === 0) return null

    // Find tasks with no successors (end tasks)
    const tasksWithSuccessors = new Set<string>()
    for (const dep of this.dependencies.values()) {
      tasksWithSuccessors.add(dep.fromTaskId)
    }

    const endTasks = tasks.filter(t => !tasksWithSuccessors.has(t.taskId))
    if (endTasks.length === 0) return null

    // Find longest path (simplified)
    let longestPath: string[] = []
    let maxDuration = 0

    for (const endTask of endTasks) {
      const path = this.findLongestPath(endTask.taskId)
      const duration = this.calculatePathDuration(path)
      if (duration > maxDuration) {
        maxDuration = duration
        longestPath = path
      }
    }

    // Mark critical tasks
    for (const task of tasks) {
      task.isCritical = longestPath.includes(task.taskId)
    }

    const startDate = new Date(Math.min(...longestPath.map(id => this.schedules.get(id)?.startDate.getTime() ?? Infinity)))
    const endDate = new Date(Math.max(...longestPath.map(id => this.schedules.get(id)?.endDate.getTime() ?? -Infinity)))

    return {
      tasks: longestPath,
      duration: maxDuration,
      startDate,
      endDate,
    }
  }

  /** Find longest path to a task */
  private findLongestPath(taskId: string): string[] {
    const visited = new Set<string>()
    const path: string[] = []

    const dfs = (currentId: string) => {
      if (visited.has(currentId)) return
      visited.add(currentId)
      path.push(currentId)

      const deps = this.getDependenciesTo(currentId)
      for (const dep of deps) {
        dfs(dep.fromTaskId)
      }
    }

    dfs(taskId)
    return path.reverse()
  }

  /** Calculate path duration */
  private calculatePathDuration(path: string[]): number {
    let totalDuration = 0
    for (const taskId of path) {
      const schedule = this.schedules.get(taskId)
      if (schedule) {
        totalDuration += schedule.duration
      }
    }
    return totalDuration
  }

  // === Circular Dependency Detection ===

  /** Check if adding a dependency would create a cycle */
  wouldCreateCycle(fromTaskId: string, toTaskId: string): boolean {
    const visited = new Set<string>()
    const stack = [toTaskId]

    while (stack.length > 0) {
      const current = stack.pop()!
      if (current === fromTaskId) return true
      if (visited.has(current)) continue
      visited.add(current)

      const deps = this.getDependenciesFrom(current)
      for (const dep of deps) {
        stack.push(dep.toTaskId)
      }
    }

    return false
  }

  // === Event Listeners ===

  /** Subscribe to events */
  onEvent(listener: (event: GanttEvent) => void): () => void {
    this.eventListeners.add(listener)
    return () => { this.eventListeners.delete(listener) }
  }

  /** Destroy the engine */
  destroy(): void {
    this.dependencies.clear()
    this.schedules.clear()
    this.eventListeners.clear()
  }

  private emitEvent(event: GanttEvent): void {
    this.config.onEvent?.(event)
    for (const listener of this.eventListeners) {
      try { listener(event) } catch (error) { console.error('Gantt event error:', error) }
    }
  }
}

// === Gantt Chart Utility Functions ===

/** Format date for display */
export function formatGanttDate(date: Date, format: string = 'short'): string {
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (format === 'medium') {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString()
}

/** Get date range for a set of tasks */
export function getDateRange(tasks: TaskSchedule[]): { start: Date; end: Date } | null {
  if (tasks.length === 0) return null

  let minStart = Infinity
  let maxEnd = -Infinity

  for (const task of tasks) {
    const start = task.startDate.getTime()
    const end = task.endDate.getTime()
    if (start < minStart) minStart = start
    if (end > maxEnd) maxEnd = end
  }

  return {
    start: new Date(minStart),
    end: new Date(maxEnd),
  }
}

/** Generate date ticks for timeline */
export function generateDateTicks(start: Date, end: Date, viewMode: 'day' | 'week' | 'month' | 'quarter'): Date[] {
  const ticks: Date[] = []
  const current = new Date(start)

  while (current <= end) {
    ticks.push(new Date(current))

    switch (viewMode) {
      case 'day':
        current.setDate(current.getDate() + 1)
        break
      case 'week':
        current.setDate(current.getDate() + 7)
        break
      case 'month':
        current.setMonth(current.getMonth() + 1)
        break
      case 'quarter':
        current.setMonth(current.getMonth() + 3)
        break
    }
  }

  return ticks
}

/** Calculate task bar position */
export function calculateBarPosition(
  task: TaskSchedule,
  viewStart: Date,
  dayWidth: number,
): { x: number; width: number } {
  const startOffset = (task.startDate.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24)
  const duration = task.duration

  return {
    x: startOffset * dayWidth,
    width: duration * dayWidth,
  }
}

/** Get dependency arrow path */
export function getDependencyArrowPath(
  fromTask: TaskSchedule,
  toTask: TaskSchedule,
  viewStart: Date,
  dayWidth: number,
  rowHeight: number,
  fromIndex: number,
  toIndex: number,
): string {
  const fromPos = calculateBarPosition(fromTask, viewStart, dayWidth)
  const toPos = calculateBarPosition(toTask, viewStart, dayWidth)

  const fromX = fromPos.x + fromPos.width
  const fromY = fromIndex * rowHeight + rowHeight / 2
  const toX = toPos.x
  const toY = toIndex * rowHeight + rowHeight / 2

  const midX = (fromX + toX) / 2

  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
}

/** Get default Gantt config */
export function getDefaultGanttConfig(): GanttConfig {
  return {
    viewMode: 'week',
    showDependencies: true,
    showCriticalPath: true,
    showProgress: true,
    rowHeight: 40,
    headerHeight: 50,
    dayWidth: 20,
    snapToGrid: true,
    enableDrag: true,
    dateFormat: 'short',
    language: 'en',
  }
}

/** Singleton instance */
let engineInstance: TaskDependenciesEngine | null = null

/** Get or create singleton */
export function getTaskDependenciesEngine(config?: Partial<TaskDependenciesConfig>): TaskDependenciesEngine {
  if (!engineInstance) {
    engineInstance = new TaskDependenciesEngine(config)
  }
  return engineInstance
}

export default TaskDependenciesEngine
