/**
 * Gantt Chart UI for Idexal Agents.
 * Provides a visual timeline for task scheduling and dependencies.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  getTaskDependenciesEngine,
  formatGanttDate,
  getDateRange,
  generateDateTicks,
  calculateBarPosition,
  getDependencyArrowPath,
  getDefaultGanttConfig,
  type TaskSchedule,
  type TaskDependency,
  type GanttConfig,
  type CriticalPath,
} from './TaskDependencies'
import type { Task } from './TaskBoard'

type Language = 'en' | 'ar' | 'zh'

const T: Record<Language, Record<string, string>> = {
  en: {
    today: 'Today',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    viewDay: 'Day',
    viewWeek: 'Week',
    viewMonth: 'Month',
    showCriticalPath: 'Show Critical Path',
    showDependencies: 'Show Dependencies',
    noSchedule: 'No schedule data',
    createSchedule: 'Set task dates to see Gantt chart',
    task: 'Task',
    start: 'Start',
    end: 'End',
    duration: 'Duration',
    progress: 'Progress',
    days: 'days',
    dependencies: 'Dependencies',
    criticalPath: 'Critical Path',
  },
  ar: {
    today: '\u0627\u0644\u064A\u0648\u0645',
    zoomIn: '\u062A\u0643\u0628\u064A\u0631',
    zoomOut: '\u062A\u0635\u063A\u064A\u0631',
    viewDay: '\u064A\u0648\u0645',
    viewWeek: '\u0623\u0633\u0628\u0648\u0639',
    viewMonth: '\u0634\u0647\u0631',
    showCriticalPath: '\u0639\u0631\u0636 \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u062D\u0631\u062C',
    showDependencies: '\u0639\u0631\u0636 \u0627\u0644\u062A\u0627\u0628\u0639\u064A\u0627\u062A',
    noSchedule: '\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u062C\u0631\u0627\u0641\u064A\u0629',
    createSchedule: '\u062D\u062F\u062F \u062A\u0648\u0627\u0631\u064A\u062E \u0627\u0644\u0645\u0647\u0627\u0645 \u0644\u0631\u0624\u064A\u0629 \u0645\u0633\u062D\u062A \u0627\u0644\u063A\u0627\u0646\u062A',
    task: '\u0627\u0644\u0645\u0647\u0645\u0629',
    start: '\u0627\u0644\u0628\u062F\u0621',
    end: '\u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629',
    duration: '\u0627\u0644\u0645\u062F\u0629',
    progress: '\u0627\u0644\u062A\u0642\u062F\u0645',
    days: '\u0623\u064A\u0627\u0645',
    dependencies: '\u0627\u0644\u062A\u0627\u0628\u0639\u064A\u0627\u062A',
    criticalPath: '\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u062D\u0631\u062C',
  },
  zh: {
    today: '\u4ECA\u5929',
    zoomIn: '\u653E\u5927',
    zoomOut: '\u7F29\u5C0F',
    viewDay: '\u5929',
    viewWeek: '\u5468',
    viewMonth: '\u6708',
    showCriticalPath: '\u663E\u793A\u5173\u952E\u8DEF\u5F84',
    showDependencies: '\u663E\u793A\u4F9D\u8D56',
    noSchedule: '\u6682\u65E0\u65E5\u7A0B\u6570\u636E',
    createSchedule: '\u8BBE\u7F6E\u4EFB\u52A1\u65E5\u671F\u4EE5\u67E5\u770B\u7518\u7279\u56FE',
    task: '\u4EFB\u52A1',
    start: '\u5F00\u59CB',
    end: '\u7ED3\u675F',
    duration: '\u6301\u7EED\u65F6\u95F4',
    progress: '\u8FDB\u5EA6',
    days: '\u5929',
    dependencies: '\u4F9D\u8D56',
    criticalPath: '\u5173\u952E\u8DEF\u5F84',
  },
}

export interface GanttChartProps {
  tasks: Task[]
  language?: Language
  config?: Partial<GanttConfig>
  onTaskClick?: (taskId: string) => void
}

/**
 * Gantt Chart Component.
 */
export function GanttChart({
  tasks,
  language = 'en',
  config: configOverrides,
  onTaskClick,
}: GanttChartProps) {
  const t = T[language] ?? T.en
  const isRTL = language === 'ar'

  const [engine] = useState(() => getTaskDependenciesEngine())
  const [config, setConfig] = useState<GanttConfig>({
    ...getDefaultGanttConfig(),
    ...configOverrides,
    language,
  })
  const [schedules, setSchedules] = useState<TaskSchedule[]>([])
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [_criticalPath, setCriticalPath] = useState<CriticalPath | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Initialize schedules from tasks
  useEffect(() => {
    const newSchedules: TaskSchedule[] = []

    for (const task of tasks) {
      const startDate = task.createdAt
      const endDate = task.dueDate ?? new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)

      const schedule = engine.setSchedule(
        task.id,
        startDate,
        endDate,
        task.progress ?? 0
      )
      newSchedules.push(schedule)
    }

    setSchedules(newSchedules)
    setDependencies(engine.getAllDependencies())

    if (config.showCriticalPath) {
      const cp = engine.calculateCriticalPath()
      setCriticalPath(cp)
    }
  }, [tasks, engine, config.showCriticalPath])

  // Calculate date range
  const dateRange = useMemo(() => {
    return getDateRange(schedules)
  }, [schedules])

  // Generate timeline ticks
  const ticks = useMemo(() => {
    if (!dateRange) return []
    const start = new Date(dateRange.start)
    start.setDate(start.getDate() - 1)
    const end = new Date(dateRange.end)
    end.setDate(end.getDate() + 7)
    return generateDateTicks(start, end, config.viewMode)
  }, [dateRange, config.viewMode])

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 0.25, 0.5))
  }, [])

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: GanttConfig['viewMode']) => {
    setConfig(c => ({ ...c, viewMode: mode }))
  }, [])

  // Handle task click
  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTask(taskId)
    onTaskClick?.(taskId)
  }, [onTaskClick])

  // Today line position
  const todayPosition = useMemo(() => {
    if (!dateRange || ticks.length === 0) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstTick = ticks[0]
    const lastTick = ticks[ticks.length - 1]
    if (!firstTick || !lastTick) return null
    if (today < firstTick || today > lastTick) return null

    const dayOffset = (today.getTime() - firstTick.getTime()) / (1000 * 60 * 60 * 24)
    return dayOffset * config.dayWidth * zoom
  }, [dateRange, ticks, config.dayWidth, zoom])

  if (schedules.length === 0) {
    return (
      <div className="gantt-empty" role="status" aria-label={t.noSchedule}>
        <div className="gantt-empty-icon" aria-hidden="true">{'\uD83D\uDCC5'}</div>
        <h3>{t.noSchedule}</h3>
        <p>{t.createSchedule}</p>
        <style>{`
          .gantt-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-secondary, #6b7280); }
          .gantt-empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
          .gantt-empty h3 { margin: 0 0 8px; font-size: 18px; color: var(--text-primary, #111827); }
          .gantt-empty p { margin: 0; font-size: 14px; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="gantt-chart" dir={isRTL ? 'rtl' : 'ltr'} role="figure" aria-label="Gantt Chart">
      {/* Toolbar */}
      <div className="gantt-toolbar" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }} role="toolbar" aria-label="Gantt chart controls">
        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={handleZoomOut} title={t.zoomOut} aria-label={t.zoomOut}>{'-'}</button>
          <span className="zoom-level" aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button className="toolbar-btn" onClick={handleZoomIn} title={t.zoomIn} aria-label={t.zoomIn}>{'+'}</button>
        </div>

        <div className="toolbar-group">
          <button
            className={`view-btn ${config.viewMode === 'day' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('day')}
          >
            {t.viewDay}
          </button>
          <button
            className={`view-btn ${config.viewMode === 'week' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('week')}
          >
            {t.viewWeek}
          </button>
          <button
            className={`view-btn ${config.viewMode === 'month' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('month')}
          >
            {t.viewMonth}
          </button>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-checkbox">
            <input
              type="checkbox"
              checked={config.showCriticalPath}
              onChange={(e) => setConfig(c => ({ ...c, showCriticalPath: e.target.checked }))}
              aria-label={t.showCriticalPath}
            />
            <span>{t.showCriticalPath}</span>
          </label>
          <label className="toolbar-checkbox">
            <input
              type="checkbox"
              checked={config.showDependencies}
              onChange={(e) => setConfig(c => ({ ...c, showDependencies: e.target.checked }))}
              aria-label={t.showDependencies}
            />
            <span>{t.showDependencies}</span>
          </label>
        </div>
      </div>

      {/* Chart Container */}
      <div className="gantt-container" ref={containerRef} role="grid" aria-label="Gantt chart timeline">
        {/* Task List */}
        <div className="gantt-task-list" role="rowgroup">
          <div className="task-list-header" style={{ height: config.headerHeight }} role="row">
            <span role="columnheader">{t.task}</span>
          </div>
          {schedules.map((schedule) => {
            const task = tasks.find(t => t.id === schedule.taskId)
            const isCritical = schedule.isCritical
            const isSelected = selectedTask === schedule.taskId
            const isHovered = hoveredTask === schedule.taskId

            return (
              <div
                key={schedule.taskId}
                className={`task-list-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isCritical ? 'critical' : ''}`}
                style={{ height: config.rowHeight }}
                onClick={() => handleTaskClick(schedule.taskId)}
                onMouseEnter={() => setHoveredTask(schedule.taskId)}
                onMouseLeave={() => setHoveredTask(null)}
              >
                <div className="task-info">
                  <span className="task-name">{task?.title ?? schedule.taskId}</span>
                  <span className="task-dates">
                    {formatGanttDate(schedule.startDate)} - {formatGanttDate(schedule.endDate)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Timeline */}
        <div className="gantt-timeline">
          {/* Header */}
          <div className="timeline-header" style={{ height: config.headerHeight }}>
            {ticks.map((tick, i) => (
              <div
                key={i}
                className={`tick ${tick.getDay() === 0 || tick.getDay() === 6 ? 'weekend' : ''}`}
                style={{ width: config.dayWidth * zoom }}
              >
                <span className="tick-date">{formatGanttDate(tick)}</span>
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="timeline-body" style={{ position: 'relative' }}>
            {/* SVG for dependencies */}
            {config.showDependencies && (
              <svg
                ref={svgRef}
                className="dependency-svg"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: schedules.length * config.rowHeight,
                  pointerEvents: 'none',
                }}
              >
                {dependencies.map((dep) => {
                  const fromIndex = schedules.findIndex(s => s.taskId === dep.fromTaskId)
                  const toIndex = schedules.findIndex(s => s.taskId === dep.toTaskId)
                  const fromSchedule = schedules[fromIndex]
                  const toSchedule = schedules[toIndex]

                  if (!fromSchedule || !toSchedule || fromIndex === -1 || toIndex === -1) return null

                  const firstTick = ticks[0]
                  if (!firstTick) return null

                  const path = getDependencyArrowPath(
                    fromSchedule,
                    toSchedule,
                    firstTick,
                    config.dayWidth * zoom,
                    config.rowHeight,
                    fromIndex,
                    toIndex
                  )

                  return (
                    <g key={dep.id}>
                      <path
                        d={path}
                        fill="none"
                        stroke={dep.type === 'finish-to-start' ? '#3b82f6' : '#9ca3af'}
                        strokeWidth={2}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  )
                })}

                {/* Arrow marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth={10}
                    markerHeight={7}
                    refX={9}
                    refY={3.5}
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                </defs>
              </svg>
            )}

            {/* Task bars */}
            {schedules.map((schedule, index) => {
              const task = tasks.find(t => t.id === schedule.taskId)
              const firstTickForBar = ticks[0]
              if (!firstTickForBar) return null
              const pos = calculateBarPosition(schedule, firstTickForBar, config.dayWidth * zoom)
              const isCritical = schedule.isCritical
              const isSelected = selectedTask === schedule.taskId
              const isHovered = hoveredTask === schedule.taskId

              const statusColors: Record<string, string> = {
                'pending': '#f59e0b',
                'in-progress': '#3b82f6',
                'completed': '#10b981',
                'failed': '#ef4444',
                'cancelled': '#6b7280',
              }

              return (
                <div
                  key={schedule.taskId}
                  className={`task-bar ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isCritical ? 'critical' : ''}`}
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: index * config.rowHeight + 8,
                    width: Math.max(pos.width, 20),
                    height: config.rowHeight - 16,
                  }}
                  onClick={() => handleTaskClick(schedule.taskId)}
                  onMouseEnter={() => setHoveredTask(schedule.taskId)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  {/* Progress fill */}
                  {config.showProgress && (
                    <div
                      className="progress-fill"
                      style={{
                        width: `${schedule.progress}%`,
                        background: statusColors[task?.status ?? 'pending'] ?? '#3b82f6',
                      }}
                    />
                  )}

                  {/* Bar label */}
                  <span className="bar-label">
                    {task?.title ?? schedule.taskId}
                  </span>

                  {/* Duration */}
                  <span className="bar-duration">
                    {schedule.duration} {t.days}
                  </span>
                </div>
              )
            })}

            {/* Today line */}
            {todayPosition !== null && (
              <div
                className="today-line"
                style={{
                  left: todayPosition,
                  height: schedules.length * config.rowHeight,
                }}
              >
                <span className="today-label">{t.today}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="gantt-legend" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#f59e0b' }} />
          <span>{t.task}: Pending</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3b82f6' }} />
          <span>{t.task}: In Progress</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#10b981' }} />
          <span>{t.task}: Completed</span>
        </div>
        {config.showCriticalPath && (
          <div className="legend-item">
            <span className="legend-color critical" />
            <span>{t.criticalPath}</span>
          </div>
        )}
      </div>

      <style>{`
        .gantt-chart { display: flex; flex-direction: column; height: 100%; background: var(--bg-primary, #ffffff); font-family: var(--font-family, system-ui, -apple-system, sans-serif); overflow: hidden; }
        .gantt-toolbar { display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-bottom: 1px solid var(--border-primary, #e5e7eb); flex-wrap: wrap; }
        .toolbar-group { display: flex; align-items: center; gap: 8px; }
        .toolbar-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary, #f3f4f6); border: 1px solid var(--border-primary, #e5e7eb); border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
        .toolbar-btn:hover { background: var(--bg-hover, #e5e7eb); }
        .zoom-level { font-size: 12px; color: var(--text-secondary, #6b7280); min-width: 40px; text-align: center; }
        .view-btn { padding: 6px 12px; background: none; border: 1px solid var(--border-primary, #e5e7eb); border-radius: 6px; font-size: 12px; cursor: pointer; }
        .view-btn:hover { background: var(--bg-hover, #f3f4f6); }
        .view-btn.active { background: var(--color-primary, #3b82f6); border-color: var(--color-primary, #3b82f6); color: white; }
        .toolbar-checkbox { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary, #6b7280); cursor: pointer; }
        .toolbar-checkbox input { cursor: pointer; }
        .gantt-container { flex: 1; display: flex; overflow: hidden; }
        .gantt-task-list { width: 250px; border-right: 1px solid var(--border-primary, #e5e7eb); overflow-y: auto; }
        .task-list-header { display: flex; align-items: center; padding: 0 16px; background: var(--bg-secondary, #f9fafb); border-bottom: 1px solid var(--border-primary, #e5e7eb); font-size: 12px; font-weight: 600; color: var(--text-secondary, #6b7280); text-transform: uppercase; }
        .task-list-row { display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid var(--border-light, #f3f4f6); cursor: pointer; transition: background 0.15s; }
        .task-list-row:hover { background: var(--bg-hover, #f9fafb); }
        .task-list-row.selected { background: var(--color-primary-light, #dbeafe); }
        .task-list-row.critical { border-left: 3px solid #ef4444; }
        .task-info { flex: 1; min-width: 0; }
        .task-name { display: block; font-size: 13px; font-weight: 500; color: var(--text-primary, #111827); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .task-dates { display: block; font-size: 11px; color: var(--text-secondary, #9ca3af); }
        .gantt-timeline { flex: 1; overflow-x: auto; overflow-y: auto; }
        .timeline-header { display: flex; background: var(--bg-secondary, #f9fafb); border-bottom: 1px solid var(--border-primary, #e5e7eb); position: sticky; top: 0; z-index: 10; }
        .tick { display: flex; align-items: center; justify-content: center; border-right: 1px solid var(--border-light, #f3f4f6); font-size: 11px; color: var(--text-secondary, #6b7280); }
        .tick.weekend { background: var(--bg-secondary, #f9fafb); }
        .tick-date { white-space: nowrap; }
        .timeline-body { position: relative; min-height: 200px; }
        .task-bar { position: absolute; display: flex; align-items: center; padding: 0 8px; background: var(--bg-secondary, #f3f4f6); border: 1px solid var(--border-primary, #e5e7eb); border-radius: 6px; cursor: pointer; overflow: hidden; transition: all 0.15s; }
        .task-bar:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 5; }
        .task-bar.selected { border-color: var(--color-primary, #3b82f6); box-shadow: 0 0 0 2px var(--color-primary-light, #dbeafe); }
        .task-bar.critical { border-color: #ef4444; border-width: 2px; }
        .progress-fill { position: absolute; top: 0; left: 0; height: 100%; opacity: 0.3; border-radius: 5px; }
        .bar-label { position: relative; font-size: 12px; font-weight: 500; color: var(--text-primary, #111827); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; z-index: 1; }
        .bar-duration { position: relative; font-size: 10px; color: var(--text-secondary, #6b7280); z-index: 1; }
        .today-line { position: absolute; top: 0; width: 2px; background: #ef4444; z-index: 4; }
        .today-label { position: absolute; top: -20px; left: -20px; font-size: 10px; color: #ef4444; font-weight: 600; white-space: nowrap; }
        .dependency-svg { z-index: 3; }
        .gantt-legend { display: flex; align-items: center; gap: 16px; padding: 8px 16px; border-top: 1px solid var(--border-primary, #e5e7eb); background: var(--bg-secondary, #f9fafb); }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary, #6b7280); }
        .legend-color { width: 12px; height: 12px; border-radius: 3px; }
        .legend-color.critical { background: #ef4444; border: 2px solid #ef4444; }
      `}</style>
    </div>
  )
}

export default GanttChart
