/**
 * Task Board Export for Idexal Agents.
 * Export task board data to PDF, HTML, CSV, and JSON formats.
 */

import type { Task, TaskStatus, TaskPriority } from './TaskBoard.ts'

export type ExportFormat = 'pdf' | 'html' | 'csv' | 'json'

export interface TaskBoardExportOptions {
  /** Export format */
  format: ExportFormat
  /** Include completed tasks */
  includeCompleted: boolean
  /** Include cancelled tasks */
  includeCancelled: boolean
  /** Filter by status */
  statusFilter: TaskStatus[] | undefined
  /** Filter by priority */
  priorityFilter: TaskPriority[] | undefined
  /** Date range start */
  dateFrom: Date | undefined
  /** Date range end */
  dateTo: Date | undefined
  /** Include statistics */
  includeStatistics: boolean
  /** Include subtasks */
  includeSubtasks: boolean
  /** Custom filename */
  filename: string | undefined
  /** Language for export */
  language: 'en' | 'ar' | 'zh'
}

export interface TaskBoardExportResult {
  /** The exported data as a string */
  data: string
  /** MIME type */
  mimeType: string
  /** File extension */
  extension: string
  /** Suggested filename */
  filename: string
}

/** Default export options */
export const DEFAULT_EXPORT_OPTIONS: TaskBoardExportOptions = {
  format: 'pdf',
  includeCompleted: true,
  includeCancelled: false,
  includeStatistics: true,
  includeSubtasks: true,
  language: 'en',
  statusFilter: undefined,
  priorityFilter: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  filename: undefined,
}

/** Export labels in multiple languages */
const EXPORT_LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Task Board Report',
    generated: 'Generated',
    summary: 'Summary',
    totalTasks: 'Total Tasks',
    pendingTasks: 'Pending',
    inProgressTasks: 'In Progress',
    completedTasks: 'Completed',
    failedTasks: 'Failed',
    cancelledTasks: 'Cancelled',
    highPriority: 'High Priority',
    urgentPriority: 'Urgent',
    tasksByStatus: 'Tasks by Status',
    tasksByPriority: 'Tasks by Priority',
    taskDetails: 'Task Details',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    dueDate: 'Due Date',
    tags: 'Tags',
    subtasks: 'Subtasks',
    created: 'Created',
    updated: 'Updated',
    overdue: 'Overdue',
    id: 'ID',
  },
  ar: {
    title: 'تقرير لوحة المهام',
    generated: 'تم الإنشاء',
    summary: 'الملخص',
    totalTasks: 'إجمالي المهام',
    pendingTasks: 'قيد الانتظار',
    inProgressTasks: 'قيد التنفيذ',
    completedTasks: 'مكتملة',
    failedTasks: 'فاشلة',
    cancelledTasks: 'ملغاة',
    highPriority: 'أولوية عالية',
    urgentPriority: 'عاجلة',
    tasksByStatus: 'المهام حسب الحالة',
    tasksByPriority: 'المهام حسب الأولوية',
    taskDetails: 'تفاصيل المهمة',
    description: 'الوصف',
    status: 'الحالة',
    priority: 'الأولوية',
    dueDate: 'تاريخ الاستحقاق',
    tags: 'الوسوم',
    subtasks: 'المهام الفرعية',
    created: 'تم الإنشاء',
    updated: 'تم التحديث',
    overdue: 'متأخرة',
    id: 'المعرف',
  },
  zh: {
    title: '任务板报告',
    generated: '生成时间',
    summary: '摘要',
    totalTasks: '任务总数',
    pendingTasks: '待处理',
    inProgressTasks: '进行中',
    completedTasks: '已完成',
    failedTasks: '失败',
    cancelledTasks: '已取消',
    highPriority: '高优先级',
    urgentPriority: '紧急',
    tasksByStatus: '按状态分类',
    tasksByPriority: '按优先级分类',
    taskDetails: '任务详情',
    description: '描述',
    status: '状态',
    priority: '优先级',
    dueDate: '截止日期',
    tags: '标签',
    subtasks: '子任务',
    created: '创建时间',
    updated: '更新时间',
    overdue: '已过期',
    id: 'ID',
  },
}

/**
 * Filter tasks based on export options.
 */
export function filterTasks(
  tasks: Task[],
  options: TaskBoardExportOptions
): Task[] {
  return tasks.filter((task) => {
    // Filter by completion status
    if (task.status === 'completed' && !options.includeCompleted) return false
    if (task.status === 'cancelled' && !options.includeCancelled) return false

    // Filter by status
    if (options.statusFilter && !options.statusFilter.includes(task.status)) {
      return false
    }

    // Filter by priority
    if (options.priorityFilter && !options.priorityFilter.includes(task.priority)) {
      return false
    }

    // Filter by date range
    if (options.dateFrom && task.createdAt < options.dateFrom) return false
    if (options.dateTo && task.createdAt > options.dateTo) return false

    return true
  })
}

/**
 * Calculate statistics for tasks.
 */
export function calculateStats(tasks: Task[]) {
  const total = tasks.length
  const byStatus: Record<TaskStatus, number> = {
    pending: 0,
    'in-progress': 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  }
  const byPriority: Record<TaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  }

  for (const task of tasks) {
    byStatus[task.status]++
    byPriority[task.priority]++
  }

  return { total, byStatus, byPriority }
}

/**
 * Generate HTML export for task board.
 */
export function generateHTML(
  tasks: Task[],
  options: TaskBoardExportOptions
): TaskBoardExportResult {
  const labels = EXPORT_LABELS[options.language] ?? EXPORT_LABELS.en!
  const stats = calculateStats(tasks)
  const now = new Date().toLocaleString()

  const statusColors: Record<TaskStatus, string> = {
    pending: '#F59E0B',
    'in-progress': '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    cancelled: '#6B7280',
  }

  const priorityColors: Record<TaskPriority, string> = {
    low: '#9CA3AF',
    medium: '#3B82F6',
    high: '#F59E0B',
    urgent: '#EF4444',
  }

  const statusLabels: Record<TaskStatus, string> = {
    pending: labels.pendingTasks ?? 'Pending',
    'in-progress': labels.inProgressTasks ?? 'In Progress',
    completed: labels.completedTasks ?? 'Completed',
    failed: labels.failedTasks ?? 'Failed',
    cancelled: labels.cancelledTasks ?? 'Cancelled',
  }

  const priorityLabels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: labels.highPriority ?? 'High',
    urgent: labels.urgentPriority ?? 'Urgent',
  }

  let html = `<!DOCTYPE html>
<html lang="${options.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header h1 {
      font-size: 28px;
      color: #111827;
      margin-bottom: 8px;
    }
    .header p {
      color: #6b7280;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 24px 0 16px;
    }
    .task-list {
      margin-bottom: 32px;
    }
    .task-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .task-title {
      font-weight: 600;
      color: #111827;
    }
    .task-id {
      font-size: 12px;
      color: #9ca3af;
    }
    .task-meta {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      font-size: 13px;
      color: #6b7280;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      color: #fff;
    }
    .task-description {
      font-size: 14px;
      color: #4b5563;
      margin-top: 8px;
    }
    .subtask-list {
      margin-top: 12px;
      padding-left: 20px;
      font-size: 13px;
    }
    .subtask-item {
      color: #6b7280;
      margin-bottom: 4px;
    }
    .subtask-item.completed {
      text-decoration: line-through;
      color: #10b981;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 20px; }
      .task-item { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${labels.title}</h1>
    <p>${labels.generated}: ${now}</p>
  </div>

  ${options.includeStatistics ? `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.total}</div>
      <div class="stat-label">${labels.totalTasks}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #F59E0B">${stats.byStatus.pending}</div>
      <div class="stat-label">${labels.pendingTasks}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #3B82F6">${stats.byStatus['in-progress']}</div>
      <div class="stat-label">${labels.inProgressTasks}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #10B981">${stats.byStatus.completed}</div>
      <div class="stat-label">${labels.completedTasks}</div>
    </div>
  </div>
  ` : ''}

  <h2 class="section-title">${labels.taskDetails}</h2>
  <div class="task-list">
    ${tasks.map((task) => `
    <div class="task-item">
      <div class="task-header">
        <div>
          <span class="task-title">${escapeHtml(task.title)}</span>
          <span class="task-id">#${escapeHtml(task.id.slice(0, 8))}</span>
        </div>
        <div>
          <span class="badge" style="background: ${statusColors[task.status]}">${statusLabels[task.status]}</span>
          <span class="badge" style="background: ${priorityColors[task.priority]}">${priorityLabels[task.priority]}</span>
        </div>
      </div>
      ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-meta">
        ${task.dueDate ? `<span>📅 ${labels.dueDate}: ${task.dueDate.toLocaleDateString()}</span>` : ''}
        <span>🕐 ${labels.created}: ${task.createdAt.toLocaleDateString()}</span>
        ${(task.tags?.length ?? 0) > 0 ? `<span>🏷️ ${labels.tags}: ${(task.tags ?? []).map((t) => escapeHtml(t ?? '')).join(', ')}</span>` : ''}
      </div>
      ${options.includeSubtasks && (task.subtasks?.length ?? 0) > 0 ? `
      <div class="subtask-list">
        ${(task.subtasks ?? []).map((st) => `
        <div class="subtask-item ${st.completed ? 'completed' : ''}">
          ${st.completed ? '✓' : '○'} ${escapeHtml(st.title)}
        </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    `).join('')}
  </div>

  <div class="footer">
    Idexal Agents - ${labels.title}
  </div>
</body>
</html>`

  return {
    data: html,
    mimeType: 'text/html',
    extension: 'html',
    filename: options.filename ?? `task-board-report.${options.language}.html`,
  }
}

/**
 * Generate CSV export for task board.
 */
export function generateCSV(
  tasks: Task[],
  options: TaskBoardExportOptions
): TaskBoardExportResult {
  const labels = EXPORT_LABELS[options.language] ?? EXPORT_LABELS.en!

  const headers = [
    labels.id ?? 'ID',
    labels.taskDetails ?? 'Task',
    labels.description ?? 'Description',
    labels.status ?? 'Status',
    labels.priority ?? 'Priority',
    labels.dueDate ?? 'Due Date',
    labels.created ?? 'Created',
    labels.tags ?? 'Tags',
    labels.subtasks ?? 'Subtasks',
  ]

  const rows = tasks.map((task) => [
    task.id,
    task.title,
    task.description ?? '',
    task.status,
    task.priority,
    task.dueDate?.toISOString() ?? '',
    task.createdAt.toISOString(),
    (task.tags ?? []).join('; '),
    `${(task.subtasks ?? []).filter((s) => s.completed).length}/${(task.subtasks ?? []).length}`,
  ])

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  return {
    data: csvContent,
    mimeType: 'text/csv',
    extension: 'csv',
    filename: options.filename ?? `task-board.${options.language}.csv`,
  }
}

/**
 * Generate JSON export for task board.
 */
export function generateJSON(
  tasks: Task[],
  options: TaskBoardExportOptions
): TaskBoardExportResult {
  const stats = calculateStats(tasks)

  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      language: options.language,
      version: '1.0.0',
      platform: 'Idexal Agents',
    },
    statistics: options.includeStatistics ? stats : undefined,
    tasks: tasks.map((task) => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      dueDate: task.dueDate?.toISOString(),
    })),
  }

  return {
    data: JSON.stringify(exportData, null, 2),
    mimeType: 'application/json',
    extension: 'json',
    filename: options.filename ?? `task-board.${options.language}.json`,
  }
}

/**
 * Export task board data.
 */
export function exportTaskBoard(
  tasks: Task[],
  options: TaskBoardExportOptions = DEFAULT_EXPORT_OPTIONS
): TaskBoardExportResult {
  const filteredTasks = filterTasks(tasks, options)

  switch (options.format) {
    case 'html':
      return generateHTML(filteredTasks, options)
    case 'csv':
      return generateCSV(filteredTasks, options)
    case 'json':
      return generateJSON(filteredTasks, options)
    case 'pdf':
      // PDF is generated from HTML
      return generateHTML(filteredTasks, { ...options, format: 'html' })
    default:
      return generateJSON(filteredTasks, options)
  }
}

/**
 * Download exported file.
 */
export function downloadTaskBoardExport(result: TaskBoardExportResult): void {
  const blob = new Blob([result.data], { type: result.mimeType })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = result.filename
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Print exported HTML as PDF.
 */
export function printAsPDF(result: TaskBoardExportResult): void {
  if (result.mimeType !== 'text/html') {
    console.warn('Print as PDF only works with HTML exports')
    return
  }

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(result.data)
    printWindow.document.close()
    printWindow.print()
  }
}

/** Helper: Escape HTML special characters */
function escapeHtml(text: string): string {
  const div = window.document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/** Helper: Escape CSV field */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}
