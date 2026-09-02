/**
 * Task Board Export UI for Idexal Agents.
 * Interface for exporting task board data.
 */

import React, { useState } from 'react'
import type { Task } from './TaskBoard.ts'
import {
  exportTaskBoard,
  downloadTaskBoardExport,
  printAsPDF,
  type ExportFormat,
  type TaskBoardExportOptions,
} from './TaskBoardExport.ts'

/** Labels for the export UI */
const EXPORT_UI_LABELS = {
  en: {
    title: 'Export Task Board',
    format: 'Format',
    htmlFormat: 'HTML Document',
    csvFormat: 'CSV Spreadsheet',
    jsonFormat: 'JSON Data',
    pdfFormat: 'PDF (via HTML)',
    options: 'Options',
    includeCompleted: 'Include completed tasks',
    includeCancelled: 'Include cancelled tasks',
    includeStatistics: 'Include statistics',
    includeSubtasks: 'Include subtasks',
    dateRange: 'Date Range',
    from: 'From',
    to: 'To',
    export: 'Export',
    print: 'Print as PDF',
    cancel: 'Cancel',
    tasksSelected: 'tasks will be exported',
    preview: 'Preview',
  },
  ar: {
    title: 'تصدير لوحة المهام',
    format: 'الصيغة',
    htmlFormat: 'مستند HTML',
    csvFormat: 'جدول CSV',
    jsonFormat: 'بيانات JSON',
    pdfFormat: 'PDF ( عبر HTML)',
    options: 'الخيارات',
    includeCompleted: 'تضمين المهام المكتملة',
    includeCancelled: 'تضمين المهام الملغاة',
    includeStatistics: 'تضمين الإحصائيات',
    includeSubtasks: 'تضمين المهام الفرعية',
    dateRange: 'نطاق التاريخ',
    from: 'من',
    to: 'إلى',
    export: 'تصدير',
    print: 'طباعة كـ PDF',
    cancel: 'إلغاء',
    tasksSelected: 'ستتم تصديرها',
    preview: 'معاينة',
  },
  zh: {
    title: '导出任务板',
    format: '格式',
    htmlFormat: 'HTML 文档',
    csvFormat: 'CSV 电子表格',
    jsonFormat: 'JSON 数据',
    pdfFormat: 'PDF (通过 HTML)',
    options: '选项',
    includeCompleted: '包含已完成任务',
    includeCancelled: '包含已取消任务',
    includeStatistics: '包含统计信息',
    includeSubtasks: '包含子任务',
    dateRange: '日期范围',
    from: '从',
    to: '到',
    export: '导出',
    print: '打印为 PDF',
    cancel: '取消',
    tasksSelected: '个任务将被导出',
    preview: '预览',
  },
}

export interface TaskBoardExportUIProps {
  /** Tasks to export */
  tasks: Task[]
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Callback when export is complete */
  onExport?: (format: ExportFormat) => void
  /** Callback when cancelled */
  onCancel?: () => void
}

/**
 * Task Board Export UI Component.
 */
export function TaskBoardExportUI({
  tasks,
  language = 'en',
  onExport,
  onCancel,
}: TaskBoardExportUIProps) {
  const labels = EXPORT_UI_LABELS[language] ?? EXPORT_UI_LABELS.en

  const [format, setFormat] = useState<ExportFormat>('html')
  const [includeCompleted, setIncludeCompleted] = useState(true)
  const [includeCancelled, setIncludeCancelled] = useState(false)
  const [includeStatistics, setIncludeStatistics] = useState(true)
  const [includeSubtasks, setIncludeSubtasks] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleExport = () => {
    const options: TaskBoardExportOptions = {
      format,
      includeCompleted,
      includeCancelled,
      includeStatistics,
      includeSubtasks,
      language,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      statusFilter: undefined,
      priorityFilter: undefined,
      filename: undefined,
    }

    const result = exportTaskBoard(tasks, options)

    if (format === 'pdf') {
      printAsPDF(result)
    } else {
      downloadTaskBoardExport(result)
    }

    onExport?.(format)
  }

  const containerStyle: React.CSSProperties = {
    background: 'var(--color-background, #ffffff)',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '480px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    direction: language === 'ar' ? 'rtl' : 'ltr',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '20px',
    color: 'var(--color-text, #1f2937)',
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: 'var(--color-text, #374151)',
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border, #d1d5db)',
    fontSize: '14px',
    background: 'var(--color-background, #fff)',
    color: 'var(--color-text, #1f2937)',
  }

  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    color: 'var(--color-text, #374151)',
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border, #d1d5db)',
    fontSize: '14px',
  }

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  }

  const buttonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>{labels.title}</h2>

      {/* Format selection */}
      <div style={sectionStyle}>
        <label style={labelStyle}>{labels.format}</label>
        <select
          style={selectStyle}
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
        >
          <option value="html">{labels.htmlFormat}</option>
          <option value="csv">{labels.csvFormat}</option>
          <option value="json">{labels.jsonFormat}</option>
          <option value="pdf">{labels.pdfFormat}</option>
        </select>
      </div>

      {/* Options */}
      <div style={sectionStyle}>
        <label style={labelStyle}>{labels.options}</label>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeCompleted}
            onChange={(e) => setIncludeCompleted(e.target.checked)}
          />
          <span>{labels.includeCompleted}</span>
        </div>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeCancelled}
            onChange={(e) => setIncludeCancelled(e.target.checked)}
          />
          <span>{labels.includeCancelled}</span>
        </div>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeStatistics}
            onChange={(e) => setIncludeStatistics(e.target.checked)}
          />
          <span>{labels.includeStatistics}</span>
        </div>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeSubtasks}
            onChange={(e) => setIncludeSubtasks(e.target.checked)}
          />
          <span>{labels.includeSubtasks}</span>
        </div>
      </div>

      {/* Date range */}
      <div style={sectionStyle}>
        <label style={labelStyle}>{labels.dateRange}</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="date"
            style={inputStyle}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder={labels.from}
          />
          <input
            type="date"
            style={inputStyle}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder={labels.to}
          />
        </div>
      </div>

      {/* Task count */}
      <div style={{
        fontSize: '13px',
        color: 'var(--color-text-secondary, #6b7280)',
        marginBottom: '16px',
      }}>
        {tasks.length} {labels.tasksSelected}
      </div>

      {/* Action buttons */}
      <div style={buttonRowStyle}>
        {onCancel && (
          <button
            style={{
              ...buttonStyle,
              background: 'var(--color-background-secondary, #f3f4f6)',
              color: 'var(--color-text, #374151)',
            }}
            onClick={onCancel}
          >
            {labels.cancel}
          </button>
        )}
        {format === 'pdf' && (
          <button
            style={{
              ...buttonStyle,
              background: 'var(--color-background-secondary, #f3f4f6)',
              color: 'var(--color-text, #374151)',
            }}
            onClick={handleExport}
          >
            {labels.print}
          </button>
        )}
        <button
          style={{
            ...buttonStyle,
            background: 'var(--color-primary, #2563eb)',
            color: '#ffffff',
          }}
          onClick={handleExport}
        >
          {labels.export}
        </button>
      </div>
    </div>
  )
}
