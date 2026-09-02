/**
 * Task board service for Idexal Agents.
 * Provides task tracking and management capabilities.
 */

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  completedAt?: Date
  assignedTo?: string
  tags?: string[]
  progress?: number // 0-100
  dependencies?: string[] // Task IDs this task depends on
  subtasks?: Subtask[]
  metadata?: Record<string, unknown>
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  completedAt?: Date
}

export interface TaskStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  failed: number
  cancelled: number
  overdue: number
  byPriority: Record<TaskPriority, number>
}

/**
 * TaskBoard class for managing tasks.
 */
export class TaskBoard {
  private tasks: Map<string, Task> = new Map()
  private listeners: Set<() => void> = new Set()

  /**
   * Add a task to the board.
   */
  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.tasks.set(newTask.id, newTask)
    this.notifyListeners()
    return newTask
  }

  /**
   * Update a task.
   */
  updateTask(id: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(id)
    if (!task) return null

    const updatedTask: Task = {
      ...task,
      ...updates,
      id: task.id, // Prevent ID change
      createdAt: task.createdAt, // Prevent creation date change
      updatedAt: new Date(),
    }

    // Set completedAt when status changes to completed
    if (updates.status === 'completed' && task.status !== 'completed') {
      updatedTask.completedAt = new Date()
      updatedTask.progress = 100
    }

    this.tasks.set(id, updatedTask)
    this.notifyListeners()
    return updatedTask
  }

  /**
   * Delete a task.
   */
  deleteTask(id: string): boolean {
    const deleted = this.tasks.delete(id)
    if (deleted) this.notifyListeners()
    return deleted
  }

  /**
   * Get a task by ID.
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id)
  }

  /**
   * Get all tasks.
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Get tasks by status.
   */
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getAllTasks().filter(task => task.status === status)
  }

  /**
   * Get tasks by priority.
   */
  getTasksByPriority(priority: TaskPriority): Task[] {
    return this.getAllTasks().filter(task => task.priority === priority)
  }

  /**
   * Get overdue tasks.
   */
  getOverdueTasks(): Task[] {
    const now = new Date()
    return this.getAllTasks().filter(
      task => task.dueDate && task.dueDate < now && task.status !== 'completed'
    )
  }

  /**
   * Get task statistics.
   */
  getStats(): TaskStats {
    const tasks = this.getAllTasks()
    const now = new Date()

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      overdue: tasks.filter(
        t => t.dueDate && t.dueDate < now && t.status !== 'completed'
      ).length,
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length,
      },
    }
  }

  /**
   * Subscribe to task changes.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Export tasks to JSON.
   */
  exportToJson(): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tasks: this.getAllTasks(),
      },
      null,
      2
    )
  }

  /**
   * Import tasks from JSON.
   */
  importFromJson(json: string): void {
    const data = JSON.parse(json)
    if (data.tasks && Array.isArray(data.tasks)) {
      for (const task of data.tasks) {
        this.tasks.set(task.id, {
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        })
      }
      this.notifyListeners()
    }
  }

  /**
   * Clear all tasks.
   */
  clearAll(): void {
    this.tasks.clear()
    this.notifyListeners()
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener()
      } catch (error) {
        console.error('TaskBoard listener error:', error)
      }
    }
  }
}

/**
 * Create a singleton instance of TaskBoard.
 */
let instance: TaskBoard | null = null

export function getTaskBoard(): TaskBoard {
  if (!instance) {
    instance = new TaskBoard()
  }
  return instance
}

/**
 * Format task status for display.
 */
export function formatTaskStatus(status: TaskStatus): string {
  switch (status) {
    case 'pending':
      return '⏳ Pending'
    case 'in-progress':
      return '🔄 In Progress'
    case 'completed':
      return '✅ Completed'
    case 'failed':
      return '❌ Failed'
    case 'cancelled':
      return '🚫 Cancelled'
    default:
      return status
  }
}

/**
 * Format task priority for display.
 */
export function formatTaskPriority(priority: TaskPriority): string {
  switch (priority) {
    case 'low':
      return '🟢 Low'
    case 'medium':
      return '🟡 Medium'
    case 'high':
      return '🟠 High'
    case 'urgent':
      return '🔴 Urgent'
    default:
      return priority
  }
}

/**
 * Get priority sort order (lower is higher priority).
 */
export function getPriorityOrder(priority: TaskPriority): number {
  switch (priority) {
    case 'urgent':
      return 0
    case 'high':
      return 1
    case 'medium':
      return 2
    case 'low':
      return 3
    default:
      return 4
  }
}
