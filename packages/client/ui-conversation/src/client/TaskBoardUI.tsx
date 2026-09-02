/**
 * Task Board UI component for Idexal Agents.
 * Provides a visual interface for managing and tracking tasks.
 * Now with enhanced drag-and-drop for reordering and status changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  TaskBoard,
  getTaskBoard,
  formatTaskStatus,
  formatTaskPriority,
  getPriorityOrder,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from './TaskBoard'
import { DragDropEngine, getDragDropEngine } from './DragDropEngine'

type Language = 'en' | 'ar' | 'zh'

interface Translations {
  title: string
  newTask: string
  total: string
  pending: string
  inProgress: string
  completed: string
  failed: string
  cancelled: string
  overdue: string
  allTasks: string
  sortByPriority: string
  sortByDueDate: string
  sortByCreated: string
  noTasks: string
  createFirstTask: string
  createNewTask: string
  titlePlaceholder: string
  descriptionPlaceholder: string
  priority: string
  dueDate: string
  tags: string
  tagsPlaceholder: string
  cancel: string
  createTask: string
  taskDetails: string
  status: string
  progress: string
  created: string
  updated: string
  saveChanges: string
  low: string
  medium: string
  high: string
  urgent: string
  dragHint: string
  dropHere: string
}

const translations: Record<Language, Translations> = {
  en: {
    title: 'Task Board',
    newTask: '+ New Task',
    total: 'Total',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    overdue: 'Overdue',
    allTasks: 'All Tasks',
    sortByPriority: 'Sort by Priority',
    sortByDueDate: 'Sort by Due Date',
    sortByCreated: 'Sort by Created',
    noTasks: 'No tasks found',
    createFirstTask: 'Create your first task',
    createNewTask: 'Create New Task',
    titlePlaceholder: 'Enter task title',
    descriptionPlaceholder: 'Enter task description',
    priority: 'Priority',
    dueDate: 'Due Date',
    tags: 'Tags (comma-separated)',
    tagsPlaceholder: 'e.g., bug, feature, urgent',
    cancel: 'Cancel',
    createTask: 'Create Task',
    taskDetails: 'Task Details',
    status: 'Status',
    progress: 'Progress',
    created: 'Created',
    updated: 'Updated',
    saveChanges: 'Save Changes',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
    dragHint: 'Drag to reorder or change status',
    dropHere: 'Drop here',
  },
  ar: {
    title: '\uD83D\uDCCB \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0647\u0627\u0645',
    newTask: '+ \u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629',
    total: '\u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A',
    pending: '\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631',
    inProgress: '\u0642\u064A\u062F \u0627\u0644\u062A\u0646\u0641\u064A\u0630',
    completed: '\u0645\u0643\u062A\u0645\u0644',
    failed: '\u0641\u0634\u0644',
    cancelled: '\u0645\u0644\u063A\u064A',
    overdue: '\u0645\u062A\u0623\u062E\u0631',
    allTasks: '\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0647\u0627\u0645',
    sortByPriority: '\u062A\u0631\u062A\u064A\u0628 \u062D\u0633\u0628 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629',
    sortByDueDate: '\u062A\u0631\u062A\u064A\u0628 \u062D\u0633\u0628 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642',
    sortByCreated: '\u062A\u0631\u062A\u064A\u0628 \u062D\u0633\u0628 \u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u0634\u0627\u0621',
    noTasks: '\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0647\u0627\u0645',
    createFirstTask: '\u0625\u0646\u0634\u0627\u0621 \u0645\u0647\u0645\u062A\u0643 \u0627\u0644\u0623\u0648\u0644\u0649',
    createNewTask: '\u0625\u0646\u0634\u0627\u0621 \u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629',
    titlePlaceholder: '\u0623\u062F\u062E\u0644 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0647\u0645\u0629',
    descriptionPlaceholder: '\u0623\u062F\u062E\u0644 \u0648\u0635\u0641 \u0627\u0644\u0645\u0647\u0645\u0629',
    priority: '\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629',
    dueDate: '\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642',
    tags: '\u0627\u0644\u0648\u0633\u0648\u0645 (\u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0627\u0635\u0644\u0627\u062A)',
    tagsPlaceholder: '\u0645\u062B\u0627\u0644: \u062E\u0637\u0623, \u0645\u064A\u0632\u0629, \u0639\u0627\u062C\u0644',
    cancel: '\u0625\u0644\u063A\u0627\u0621',
    createTask: '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0647\u0645\u0629',
    taskDetails: '\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0645\u0647\u0645\u0629',
    status: '\u0627\u0644\u062D\u0627\u0644\u0629',
    progress: '\u0627\u0644\u062A\u0642\u062F\u0645',
    created: '\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u0634\u0627\u0621',
    updated: '\u0623\u062E\u0631 \u062A\u062D\u062F\u064A\u062B',
    saveChanges: '\u062D\u0641\u0638 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A',
    low: '\u0645\u0646\u062E\u0641\u0636\u0629',
    medium: '\u0645\u062A\u0648\u0633\u0637\u0629',
    high: '\u0639\u0627\u0644\u064A\u0629',
    urgent: '\u0639\u0627\u062C\u0644\u0629',
    dragHint: '\u0627\u0633\u062D\u0628 \u0644\u0644\u0625\u0639\u0627\u062F\u0629 \u0623\u0648 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629',
    dropHere: '\u0623\u0633\u0642\u0637 \u0647\u0646\u0627',
  },
  zh: {
    title: '\uD83D\uDCCB \u4EFB\u52A1\u677F',
    newTask: '+ \u65B0\u4EFB\u52A1',
    total: '\u603B\u8BA1',
    pending: '\u5F85\u5904\u7406',
    inProgress: '\u8FDB\u884C\u4E2D',
    completed: '\u5DF2\u5B8C\u6210',
    failed: '\u5931\u8D25',
    cancelled: '\u5DF2\u53D6\u6D88',
    overdue: '\u5DF2\u903E\u671F',
    allTasks: '\u6240\u6709\u4EFB\u52A1',
    sortByPriority: '\u6309\u4F18\u5148\u7EA7\u6392\u5E8F',
    sortByDueDate: '\u6309\u622A\u6B62\u65E5\u671F\u6392\u5E8F',
    sortByCreated: '\u6309\u521B\u5EFA\u65F6\u95F4\u6392\u5E8F',
    noTasks: '\u6682\u65E0\u4EFB\u52A1',
    createFirstTask: '\u521B\u5EFA\u60A8\u7684\u7B2C\u4E00\u4E2A\u4EFB\u52A1',
    createNewTask: '\u521B\u5EFA\u65B0\u4EFB\u52A1',
    titlePlaceholder: '\u8F93\u5165\u4EFB\u52A1\u6807\u9898',
    descriptionPlaceholder: '\u8F93\u5165\u4EFB\u52A1\u63CF\u8FF0',
    priority: '\u4F18\u5148\u7EA7',
    dueDate: '\u622A\u6B62\u65E5\u671F',
    tags: '\u6807\u7B7E\uFF08\u9017\u53F7\u5206\u9694\uFF09',
    tagsPlaceholder: '\u4F8B\u5982\uFF1Abug, feature, urgent',
    cancel: '\u53D6\u6D88',
    createTask: '\u521B\u5EFA\u4EFB\u52A1',
    taskDetails: '\u4EFB\u52A1\u8BE6\u60C5',
    status: '\u72B6\u6001',
    progress: '\u8FDB\u5EA6',
    created: '\u521B\u5EFA\u65F6\u95F4',
    updated: '\u66F4\u65B0\u65F6\u95F4',
    saveChanges: '\u4FDD\u5B58\u66F4\u6539',
    low: '\u4F4E',
    medium: '\u4E2D',
    high: '\u9AD8',
    urgent: '\u7D27\u6025',
    dragHint: '\u62D9\u52A8\u4EE5\u91CD\u65B0\u6392\u5E8F\u6216\u66F4\u6539\u72B6\u6001',
    dropHere: '\u653E\u7F6E\u5728\u8FD9\u91CC',
  },
}

export interface TaskBoardProps {
  onTaskSelect?: (task: Task) => void
  onTaskCreate?: (task: Task) => void
  onTaskUpdate?: (task: Task) => void
  onTaskDelete?: (taskId: string) => void
  onTaskReorder?: (taskId: string, newIndex: number) => void
  maxTasks?: number
  compact?: boolean
  language?: Language
}

export function TaskBoardUI({
  onTaskSelect,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskReorder,
  maxTasks = 50,
  compact = false,
  language = 'en',
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskBoard['getStats'] extends () => infer R ? R : never>()
  const [filter, setFilter] = useState<'all' | TaskStatus>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('priority')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dragState, setDragState] = useState<DragDropEngine['getState'] extends () => infer R ? R : never>()
  const [dropTarget, setDropTarget] = useState<{ column: string; index: number } | null>(null)

  const t = translations[language]
  const isRTL = language === 'ar'
  const board = getTaskBoard()
  const engine = useRef(getDragDropEngine())

  useEffect(() => {
    const unsub = engine.current.onStateChange((state) => {
      setDragState(state)
    })
    return () => {
      unsub()
      engine.current.endDrag()
    }
  }, [])

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const updatedTask = board.updateTask(taskId, updates)
    if (updatedTask) {
      onTaskUpdate?.(updatedTask)
      refreshTasks()
    }
  }, [board, onTaskUpdate])

  useEffect(() => {
    const unsub = engine.current.onDragEvent((event) => {
      if (event.type === 'drop' && event.targetColumn && event.taskId) {
        const task = tasks.find(t => t.id === event.taskId)
        if (task && task.status !== event.targetColumn) {
          handleUpdateTask(event.taskId, { status: event.targetColumn as TaskStatus })
        }
        if (event.sourceColumn === event.targetColumn && event.dropIndex !== undefined) {
          onTaskReorder?.(event.taskId, event.dropIndex)
        }
      }
    })
    return unsub
  }, [tasks, handleUpdateTask, onTaskReorder])

  const refreshTasks = useCallback(() => {
    let filteredTasks = board.getAllTasks()
    if (filter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filter)
    }
    filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'priority': return getPriorityOrder(a.priority) - getPriorityOrder(b.priority)
        case 'dueDate':
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.getTime() - b.dueDate.getTime()
        case 'createdAt': return b.createdAt.getTime() - a.createdAt.getTime()
        default: return 0
      }
    })
    setTasks(filteredTasks.slice(0, maxTasks))
    setStats(board.getStats())
  }, [board, filter, sortBy, maxTasks])

  useEffect(() => {
    refreshTasks()
    const unsubscribe = board.subscribe(refreshTasks)
    return unsubscribe
  }, [board, refreshTasks])

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask = board.addTask(taskData)
    onTaskCreate?.(newTask)
    setShowCreateModal(false)
    refreshTasks()
  }

  const handleDeleteTask = (taskId: string) => {
    board.deleteTask(taskId)
    onTaskDelete?.(taskId)
    refreshTasks()
  }

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
    onTaskSelect?.(task)
  }

  const handleDragStart = (taskId: string, columnId: string) => (e: React.DragEvent) => {
    engine.current.startDrag(taskId, columnId, e)
  }

  const handleDragOver = (columnId: string) => (e: React.DragEvent) => {
    engine.current.dragOver(columnId, e.clientY, e)
    setDropTarget({ column: columnId, index: engine.current.getState().dropIndex })
  }

  const handleDragLeave = (columnId: string) => () => {
    engine.current.dragLeave(columnId)
    setDropTarget(null)
  }

  const handleDrop = (columnId: string) => (e: React.DragEvent) => {
    engine.current.drop(columnId, e)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    engine.current.endDrag()
    setDropTarget(null)
  }

  const handleTouchStart = (taskId: string, columnId: string) => (e: React.TouchEvent) => {
    engine.current.touchStart(taskId, columnId, e)
  }

  const handleTouchMove = () => (e: React.TouchEvent) => {
    engine.current.touchMove(e)
  }

  const handleTouchEnd = () => () => {
    engine.current.touchEnd()
  }

  const isDragging = dragState?.isDragging ?? false
  const draggedTaskId = dragState?.draggedTaskId ?? null

  const statusColumns: TaskStatus[] = ['pending', 'in-progress', 'completed']
  const statusIcons: Record<string, string> = { 'pending': '\u23F3', 'in-progress': '\uD83D\uDD04', 'completed': '\u2705' }

  return (
    <div className={`task-board ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'} role="region" aria-label="Task Board">
      {isDragging && <div className="drag-hint">{t.dragHint}</div>}

      <div className="task-board-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <h2 id="task-board-title">{t.title}</h2>
        <div className="task-board-actions">
          <button className="task-board-btn create-btn" onClick={() => setShowCreateModal(true)} aria-label={t.createNewTask}>
            {t.newTask}
          </button>
        </div>
      </div>

      {stats && (
        <div className="task-board-stats" style={{ justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
          <div className="stat-item"><span className="stat-label">{t.total}</span><span className="stat-value">{stats.total}</span></div>
          <div className="stat-item pending"><span className="stat-label">{t.pending}</span><span className="stat-value">{stats.pending}</span></div>
          <div className="stat-item in-progress"><span className="stat-label">{t.inProgress}</span><span className="stat-value">{stats.inProgress}</span></div>
          <div className="stat-item completed"><span className="stat-label">{t.completed}</span><span className="stat-value">{stats.completed}</span></div>
          {stats.overdue > 0 && <div className="stat-item overdue"><span className="stat-label">{t.overdue}</span><span className="stat-value">{stats.overdue}</span></div>}
        </div>
      )}

      <div className="task-board-filters" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | TaskStatus)} className="filter-select" style={{ textAlign: isRTL ? 'right' : 'left' }} aria-label="Filter tasks by status">
          <option value="all">{t.allTasks}</option>
          <option value="pending">{t.pending}</option>
          <option value="in-progress">{t.inProgress}</option>
          <option value="completed">{t.completed}</option>
          <option value="failed">{t.failed}</option>
          <option value="cancelled">{t.cancelled}</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'priority' | 'dueDate' | 'createdAt')} className="sort-select" style={{ textAlign: isRTL ? 'right' : 'left' }} aria-label="Sort tasks">
          <option value="priority">{t.sortByPriority}</option>
          <option value="dueDate">{t.sortByDueDate}</option>
          <option value="createdAt">{t.sortByCreated}</option>
        </select>
      </div>

      <div className="status-columns" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
        {statusColumns.map((status) => {
          const columnTasks = tasks.filter(task => task.status === status)
          const isTarget = dragState?.targetColumn === status

          return (
            <div
              key={status}
              className={`status-column ${status} ${isTarget ? 'drop-target' : ''}`}
              data-column-id={status}
              role="listbox"
              aria-label={`${t[status as keyof Translations]} tasks — ${columnTasks.length} items`}
              onDragOver={handleDragOver(status)}
              onDragLeave={handleDragLeave(status)}
              onDrop={handleDrop(status)}
              onDragEnd={handleDragEnd}
            >
              <div className="status-column-header" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <span className="status-column-title">{statusIcons[status]} {t[status as keyof Translations]}</span>
                <span className="status-column-count">{columnTasks.length}</span>
              </div>
              <div className="status-column-tasks" data-tasks-container>
                {columnTasks.map((task, index) => {
                  const isDragged = draggedTaskId === task.id
                  const isDropHere = dropTarget?.column === status && dropTarget?.index === index
                  return (
                    <div key={task.id} className="task-list-item" style={{ position: 'relative' }}>
                      {isDropHere && <div className="drop-indicator" />}
                      <TaskCard task={task} compact={compact} language={language} isDragged={isDragged}
                        onSelect={() => handleSelectTask(task)}
                        onStatusChange={(newStatus) => handleUpdateTask(task.id, { status: newStatus })}
                        onDelete={() => handleDeleteTask(task.id)}
                        onDragStart={handleDragStart(task.id, status)}
                        onTouchStart={handleTouchStart(task.id, status)}
                        onTouchMove={handleTouchMove()}
                        onTouchEnd={handleTouchEnd()}
                      />
                    </div>
                  )
                })}
                {dropTarget?.column === status && dropTarget?.index === -1 && <div className="drop-indicator" />}
                {columnTasks.length === 0 && isTarget && <div className="empty-drop-zone">{t.dropHere}</div>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="task-list-empty">
            <p>{t.noTasks}</p>
            <button className="task-board-btn create-btn" onClick={() => setShowCreateModal(true)}>{t.createFirstTask}</button>
          </div>
        ) : tasks.map((task, index) => {
          const isDragged = draggedTaskId === task.id
          const isDropHere = dropTarget?.column === task.status && dropTarget?.index === index
          return (
            <div key={task.id} className="task-list-item" style={{ position: 'relative' }}>
              {isDropHere && <div className="drop-indicator" />}
              <TaskCard task={task} compact={compact} language={language} isDragged={isDragged}
                onSelect={() => handleSelectTask(task)}
                onStatusChange={(status) => handleUpdateTask(task.id, { status })}
                onDelete={() => handleDeleteTask(task.id)}
                onDragStart={handleDragStart(task.id, task.status)}
                onTouchStart={handleTouchStart(task.id, task.status)}
                onTouchMove={handleTouchMove()}
                onTouchEnd={handleTouchEnd()}
              />
            </div>
          )
        })}
      </div>

      {showCreateModal && <CreateTaskModal language={language} onSubmit={handleCreateTask} onClose={() => setShowCreateModal(false)} />}
      {selectedTask && <TaskDetailModal task={selectedTask} language={language} onUpdate={(updates) => handleUpdateTask(selectedTask.id, updates)} onClose={() => setSelectedTask(null)} />}

      <style>{`
        .task-board { padding: 20px; font-family: var(--font-family, system-ui, -apple-system, sans-serif); }
        .task-board.rtl { direction: rtl; text-align: right; }
        .task-board-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .task-board-header h2 { margin: 0; font-size: 1.5rem; color: var(--text-primary, #1a1a1a); }
        .task-board-btn { padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .create-btn { background: var(--color-primary, #2563eb); color: white; border: none; }
        .create-btn:hover { background: var(--color-primary-hover, #1d4ed8); }
        .task-board-stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat-item { display: flex; flex-direction: column; align-items: center; padding: 12px 16px; background: var(--bg-secondary, #f8f9fa); border-radius: 8px; min-width: 80px; }
        .stat-label { font-size: 12px; color: var(--text-secondary, #666); margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 600; color: var(--text-primary, #1a1a1a); }
        .stat-item.pending .stat-value { color: #f59e0b; }
        .stat-item.in-progress .stat-value { color: #3b82f6; }
        .stat-item.completed .stat-value { color: #10b981; }
        .stat-item.overdue .stat-value { color: #ef4444; }
        .task-board-filters { display: flex; gap: 12px; margin-bottom: 20px; }
        .filter-select, .sort-select { padding: 8px 12px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; font-size: 14px; background: var(--bg-primary, #ffffff); color: var(--text-primary, #1a1a1a); }
        .status-columns { display: flex; gap: 16px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; }
        .status-column { flex: 1; min-width: 280px; background: var(--bg-secondary, #f8f9fa); border-radius: 12px; padding: 16px; transition: all 0.2s; }
        .status-column.drop-target { background: var(--color-primary-light, #dbeafe); border: 2px dashed var(--color-primary, #3b82f6); }
        .status-column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color, #e0e0e0); }
        .status-column-title { font-size: 14px; font-weight: 600; color: var(--text-primary, #1a1a1a); }
        .status-column-count { font-size: 12px; font-weight: 600; color: var(--text-secondary, #666); background: var(--bg-primary, #ffffff); padding: 2px 8px; border-radius: 10px; }
        .status-column-tasks { display: flex; flex-direction: column; gap: 12px; min-height: 100px; }
        .drop-indicator { height: 3px; background: var(--color-primary, #3b82f6); border-radius: 2px; margin: 4px 0; animation: dropPulse 1s infinite; }
        @keyframes dropPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .empty-drop-zone { padding: 32px; text-align: center; border: 2px dashed var(--border-color, #e0e0e0); border-radius: 8px; color: var(--text-secondary, #666); font-size: 14px; }
        .drag-hint { padding: 8px 16px; background: var(--color-primary-light, #dbeafe); color: var(--color-primary, #3b82f6); border-radius: 8px; font-size: 13px; text-align: center; margin-bottom: 16px; }
        .task-card { transition: all 0.2s ease; cursor: grab; position: relative; background: var(--bg-primary, #ffffff); border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        .task-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        .task-card:active { cursor: grabbing; }
        .task-card.dragging { opacity: 0.5; transform: rotate(2deg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); }
        .drag-handle { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: grab; color: var(--text-secondary, #666); border-radius: 4px; }
        .drag-handle:hover { background: var(--bg-hover, #f3f4f6); color: var(--text-primary, #111827); }
        .task-list { display: flex; flex-direction: column; gap: 12px; }
        .task-list-empty { text-align: center; padding: 40px 20px; color: var(--text-secondary, #666); }
        .task-list-empty p { margin: 0 0 16px 0; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: var(--bg-primary, #ffffff); border-radius: 12px; padding: 24px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-content h3 { margin: 0 0 20px 0; font-size: 1.25rem; color: var(--text-primary, #1a1a1a); }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: 500; color: var(--text-primary, #1a1a1a); }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        .form-row { display: flex; gap: 16px; }
        .form-row .form-group { flex: 1; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        .cancel-btn { padding: 10px 16px; background: none; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; cursor: pointer; color: var(--text-secondary, #666); }
        .submit-btn { padding: 10px 16px; background: var(--color-primary, #2563eb); color: white; border: none; border-radius: 6px; cursor: pointer; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        body.is-dragging { user-select: none; }
        body.is-dragging .task-card { cursor: grabbing; }
        body.is-dragging .task-card:not(.dragging) { opacity: 0.7; }
        @media (pointer: coarse) { .task-card { padding: 20px; } .drag-handle { display: none; } }
      `}</style>
    </div>
  )
}

interface TaskCardProps {
  task: Task; compact: boolean; language: Language; isDragged?: boolean
  onSelect: () => void; onStatusChange: (status: TaskStatus) => void; onDelete: () => void
  onDragStart?: (e: React.DragEvent) => void; onTouchStart?: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void; onTouchEnd?: (e: React.TouchEvent) => void
}
function TaskCard({ task, compact, language, isDragged = false, onSelect, onStatusChange, onDelete, onDragStart, onTouchStart, onTouchMove, onTouchEnd }: TaskCardProps) {
  const t = translations[language]
  const isRTL = language === 'ar'
  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'completed'
  return (
    <div className={`task-card ${task.status} ${isOverdue ? 'overdue' : ''} ${isDragged ? 'dragging' : ''}`}
      role="option"
      aria-label={`${task.title}, ${formatTaskPriority(task.priority)}, ${formatTaskStatus(task.status)}${isOverdue ? ', overdue' : ''}`}
      aria-grabbed={isDragged}
      onClick={onSelect} draggable onDragStart={onDragStart}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} data-task-card
    >
      <div className="drag-handle" title={t.dragHint} role="img" aria-label={t.dragHint}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="2" r="1.5" /><circle cx="9" cy="2" r="1.5" />
          <circle cx="3" cy="6" r="1.5" /><circle cx="9" cy="6" r="1.5" />
          <circle cx="3" cy="10" r="1.5" /><circle cx="9" cy="10" r="1.5" />
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <span>{formatTaskPriority(task.priority)}</span>
        <span>{formatTaskStatus(task.status)}</span>
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>{task.title}</h3>
      {!compact && task.description && <p style={{ margin: '0 0 8px', fontSize: 13, color: '#666' }}>{task.description}</p>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#666' }}>
        {task.dueDate && <span>{'\uD83D\uDCC5'} {task.dueDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>}
        {task.progress !== undefined && <span>{'\uD83D\uDCCA'} {task.progress}%</span>}
        {task.tags && task.tags.length > 0 && <span>{task.tags.slice(0, 3).join(', ')}{task.tags.length > 3 && ` +${task.tags.length - 3}`}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <select value={task.status} onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); onStatusChange(e.target.value as TaskStatus) }}
          style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #e0e0e0', textAlign: isRTL ? 'right' : 'left', cursor: 'pointer' }}
          aria-label={`${t.status} for ${task.title}`}
        >
          <option value="pending">{'\u23F3'} {t.pending}</option>
          <option value="in-progress">{'\uD83D\uDD04'} {t.inProgress}</option>
          <option value="completed">{'\u2705'} {t.completed}</option>
          <option value="failed">{'\u274C'} {t.failed}</option>
          <option value="cancelled">{'\uD83D\uDEAB'} {t.cancelled}</option>
        </select>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', background: 'white' }}
          aria-label={`Delete ${task.title}`}
        >{'\uD83D\uDDD1\uFE0F'}</button>
      </div>
    </div>
  )
}

interface CreateTaskModalProps { language: Language; onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void; onClose: () => void }
function CreateTaskModal({ language, onSubmit, onClose }: CreateTaskModalProps) {
  const t = translations[language]
  const isRTL = language === 'ar'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim() || '', status: 'pending', priority, dueDate: dueDate ? new Date(dueDate) : new Date(), tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [] })
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.createNewTask}>
      <div className="modal-content" dir={isRTL ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
        <h3 id="create-task-title">{t.createNewTask}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label htmlFor="task-title-input">{t.titlePlaceholder} *</label><input id="task-title-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.titlePlaceholder} autoFocus style={{ textAlign: isRTL ? 'right' : 'left' }} aria-required="true" /></div>
          <div className="form-group"><label htmlFor="task-desc-input">{t.descriptionPlaceholder}</label><textarea id="task-desc-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.descriptionPlaceholder} rows={3} style={{ textAlign: isRTL ? 'right' : 'left' }} /></div>
          <div className="form-row">
            <div className="form-group"><label>{t.priority}</label><select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} style={{ textAlign: isRTL ? 'right' : 'left' }}><option value="low">{t.low}</option><option value="medium">{t.medium}</option><option value="high">{t.high}</option><option value="urgent">{t.urgent}</option></select></div>
            <div className="form-group"><label>{t.dueDate}</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          </div>
          <div className="form-group"><label>{t.tags}</label><input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t.tagsPlaceholder} style={{ textAlign: isRTL ? 'right' : 'left' }} /></div>
          <div className="modal-actions" style={{ justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
            <button type="button" className="cancel-btn" onClick={onClose}>{t.cancel}</button>
            <button type="submit" className="submit-btn" disabled={!title.trim()}>{t.createTask}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface TaskDetailModalProps { task: Task; language: Language; onUpdate: (updates: Partial<Task>) => void; onClose: () => void }
function TaskDetailModal({ task, language, onUpdate, onClose }: TaskDetailModalProps) {
  const t = translations[language]
  const isRTL = language === 'ar'
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '')
  const [progress, setProgress] = useState(task.progress || 0)
  const handleSave = () => { onUpdate({ title: title.trim(), description: description.trim() || '', priority, status, dueDate: dueDate ? new Date(dueDate) : new Date(), progress }); onClose() }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.taskDetails}>
      <div className="modal-content" dir={isRTL ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
        <h3 id="task-detail-title">{t.taskDetails}</h3>
        <div className="form-group"><label htmlFor="detail-title-input">{t.titlePlaceholder}</label><input id="detail-title-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ textAlign: isRTL ? 'right' : 'left' }} /></div>
        <div className="form-group"><label htmlFor="detail-desc-input">{t.descriptionPlaceholder}</label><textarea id="detail-desc-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} style={{ textAlign: isRTL ? 'right' : 'left' }} /></div>
        <div className="form-row">
          <div className="form-group"><label>{t.status}</label><select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} style={{ textAlign: isRTL ? 'right' : 'left' }}><option value="pending">{'\u23F3'} {t.pending}</option><option value="in-progress">{'\uD83D\uDD04'} {t.inProgress}</option><option value="completed">{'\u2705'} {t.completed}</option><option value="failed">{'\u274C'} {t.failed}</option><option value="cancelled">{'\uD83D\uDEAB'} {t.cancelled}</option></select></div>
          <div className="form-group"><label>{t.priority}</label><select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} style={{ textAlign: isRTL ? 'right' : 'left' }}><option value="low">{t.low}</option><option value="medium">{t.medium}</option><option value="high">{t.high}</option><option value="urgent">{t.urgent}</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>{t.dueDate}</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          <div className="form-group"><label>{t.progress} ({progress}%)</label><input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(parseInt(e.target.value))} /></div>
        </div>
        <div>
          <p><strong>{t.created}:</strong> {new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US').format(task.createdAt)}</p>
          <p><strong>{t.updated}:</strong> {new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US').format(task.updatedAt)}</p>
          {task.completedAt && <p><strong>{t.completed}:</strong> {new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US').format(task.completedAt)}</p>}
        </div>
        <div className="modal-actions" style={{ justifyContent: isRTL ? 'flex-start' : 'flex-end' }}>
          <button className="cancel-btn" onClick={onClose}>{t.cancel}</button>
          <button className="submit-btn" onClick={handleSave}>{t.saveChanges}</button>
        </div>
      </div>
    </div>
  )
}

export default TaskBoardUI
