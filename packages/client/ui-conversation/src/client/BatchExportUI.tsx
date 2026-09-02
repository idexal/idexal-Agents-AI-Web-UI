/**
 * Batch Export UI for Idexal Agents.
 * Interface for exporting multiple conversations at once.
 */

import React, { useState, useCallback } from 'react'
import type { BatchConversation, BatchExportOptions, BatchExportFormat, BatchExportProgress, BatchExportResult } from './BatchExport.ts'
import { batchExportConversations, downloadBatchExport, DEFAULT_BATCH_OPTIONS } from './BatchExport.ts'

/** Labels for the batch export UI */
const BATCH_UI_LABELS = {
  en: {
    title: 'Batch Export',
    selectConversations: 'Select conversations to export',
    exportAll: 'Export All',
    exportSelected: 'Export Selected',
    selected: '{count} selected',
    format: 'Format',
    options: 'Options',
    includeMetadata: 'Include metadata',
    includeTimestamps: 'Include timestamps',
    includeAttachments: 'Include attachments',
    singleFile: 'Single file (combine all)',
    separateFiles: 'Separate files',
    exporting: 'Exporting...',
    complete: 'Export Complete',
    download: 'Download',
    downloadAll: 'Download All',
    cancel: 'Cancel',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    conversations: 'conversations',
    messages: 'messages',
    totalSize: 'Total size',
  },
  ar: {
    title: 'تصدير متعدد',
    selectConversations: 'اختر المحادثات للتصدير',
    exportAll: 'تصدير الكل',
    exportSelected: 'تصدير المحدد',
    selected: '{count} محدد',
    format: 'الصيغة',
    options: 'الخيارات',
    includeMetadata: 'تضمين البيانات الوصفية',
    includeTimestamps: 'تضمين الأوقات',
    includeAttachments: 'تضمين المرفقات',
    singleFile: 'ملف واحد (دمج الكل)',
    separateFiles: 'ملفات منفصلة',
    exporting: 'جاري التصدير...',
    complete: 'اكتمل التصدير',
    download: 'تنزيل',
    downloadAll: 'تنزيل الكل',
    cancel: 'إلغاء',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء التحديد',
    conversations: 'محادثات',
    messages: 'رسائل',
    totalSize: 'الحجم الإجمالي',
  },
  zh: {
    title: '批量导出',
    selectConversations: '选择要导出的对话',
    exportAll: '导出全部',
    exportSelected: '导出选中',
    selected: '已选择 {count}',
    format: '格式',
    options: '选项',
    includeMetadata: '包含元数据',
    includeTimestamps: '包含时间戳',
    includeAttachments: '包含附件',
    singleFile: '单个文件（合并所有）',
    separateFiles: '单独文件',
    exporting: '导出中...',
    complete: '导出完成',
    download: '下载',
    downloadAll: '全部下载',
    cancel: '取消',
    selectAll: '全选',
    deselectAll: '取消全选',
    conversations: '对话',
    messages: '消息',
    totalSize: '总大小',
  },
}

export interface BatchExportUIProps {
  /** Available conversations */
  conversations: BatchConversation[]
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Callback when export is complete */
  onExport?: (result: BatchExportResult) => void
  /** Callback when cancelled */
  onCancel?: () => void
}

/**
 * Batch Export UI Component.
 */
export function BatchExportUI({
  conversations,
  language = 'en',
  onExport,
  onCancel,
}: BatchExportUIProps) {
  const labels = BATCH_UI_LABELS[language] ?? BATCH_UI_LABELS.en
  const isRTL = language === 'ar'

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [format, setFormat] = useState<BatchExportFormat>('json')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [singleFile, setSingleFile] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<BatchExportProgress | null>(null)
  const [result, setResult] = useState<BatchExportResult | null>(null)

  const selectedConversations = conversations.filter(c => selectedIds.has(c.id))
  const allSelected = selectedIds.size === conversations.length

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(conversations.map(c => c.id)))
    }
  }, [allSelected, conversations])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleExport = async () => {
    const toExport = selectedIds.size > 0 ? selectedConversations : conversations
    if (toExport.length === 0) return

    setIsExporting(true)
    setResult(null)

    const options: BatchExportOptions = {
      ...DEFAULT_BATCH_OPTIONS,
      format,
      includeMetadata,
      includeTimestamps,
      includeAttachments,
      singleFile,
      language,
    }

    try {
      const exportResult = await batchExportConversations(toExport, options, setProgress)
      setResult(exportResult)
      onExport?.(exportResult)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (result) {
      downloadBatchExport(result)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const containerStyle: React.CSSProperties = {
    background: 'var(--color-bg-primary, #ffffff)',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    direction: isRTL ? 'rtl' : 'ltr',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '20px',
    color: 'var(--color-text-primary, #1f2937)',
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    color: 'var(--color-text-secondary, #6b7280)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    color: 'var(--color-text-primary, #374151)',
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border, #d1d5db)',
    fontSize: '14px',
    background: 'var(--color-bg-primary, #fff)',
    color: 'var(--color-text-primary, #1f2937)',
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
    transition: 'all 0.2s',
    opacity: isExporting ? 0.7 : 1,
  }

  const conversationItemStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: isSelected ? 'var(--color-primary-light, #dbeafe)' : 'var(--color-bg-secondary, #f9fafb)',
    border: `1px solid ${isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>{labels.title}</h2>

      {/* Conversation Selection */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={sectionTitleStyle}>{labels.selectConversations}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: '4px',
                background: 'var(--color-bg-primary, #fff)',
                cursor: 'pointer',
              }}
            >
              {allSelected ? labels.deselectAll : labels.selectAll}
            </button>
          </div>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {conversations.map(conv => (
            <div
              key={conv.id}
              style={conversationItemStyle(selectedIds.has(conv.id))}
              onClick={() => handleToggleSelect(conv.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(conv.id)}
                onChange={() => handleToggleSelect(conv.id)}
                style={{ width: '16px', height: '16px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>
                  {conv.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
                  {conv.messages.length} {labels.messages}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-secondary, #6b7280)' }}>
          {selectedIds.size > 0 
            ? labels.selected.replace('{count}', String(selectedIds.size))
            : `${conversations.length} ${labels.conversations}`
          }
        </div>
      </div>

      {/* Format Selection */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.format}</div>
        <select
          style={selectStyle}
          value={format}
          onChange={(e) => setFormat(e.target.value as BatchExportFormat)}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </div>

      {/* Options */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.options}</div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
          />
          <span>{labels.includeMetadata}</span>
        </div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeTimestamps}
            onChange={(e) => setIncludeTimestamps(e.target.checked)}
          />
          <span>{labels.includeTimestamps}</span>
        </div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeAttachments}
            onChange={(e) => setIncludeAttachments(e.target.checked)}
          />
          <span>{labels.includeAttachments}</span>
        </div>

        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-bg-secondary, #f9fafb)', borderRadius: '8px' }}>
          <div style={checkboxRowStyle}>
            <input
              type="radio"
              name="fileMode"
              checked={!singleFile}
              onChange={() => setSingleFile(false)}
            />
            <div>
              <div style={{ fontWeight: 500 }}>{labels.separateFiles}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
                Export each conversation as a separate file
              </div>
            </div>
          </div>
          <div style={checkboxRowStyle}>
            <input
              type="radio"
              name="fileMode"
              checked={singleFile}
              onChange={() => setSingleFile(true)}
            />
            <div>
              <div style={{ fontWeight: 500 }}>{labels.singleFile}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
                Combine all conversations into one file
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isExporting && progress && (
        <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-bg-secondary, #f9fafb)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-primary, #111827)' }}>{labels.exporting}</span>
            <span style={{ color: 'var(--color-text-secondary, #6b7280)' }}>{Math.round(progress.percentage)}%</span>
          </div>
          <div style={{ height: '4px', background: 'var(--color-border, #e5e7eb)', borderRadius: '2px' }}>
            <div
              style={{
                height: '100%',
                width: `${progress.percentage}%`,
                background: 'var(--color-primary, #3b82f6)',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {progress.currentTitle && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
              {progress.currentTitle}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--color-success-light, #d1fae5)', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, color: 'var(--color-success, #10b981)', marginBottom: '8px' }}>
            {labels.complete}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary, #374151)' }}>
            {result.totalConversations} {labels.conversations} | {result.totalMessages} {labels.messages} | {formatSize(result.totalSize)}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={buttonRowStyle}>
        {onCancel && (
          <button
            style={{
              ...buttonStyle,
              background: 'var(--color-bg-secondary, #f3f4f6)',
              color: 'var(--color-text-primary, #374151)',
            }}
            onClick={onCancel}
            disabled={isExporting}
          >
            {labels.cancel}
          </button>
        )}
        {result ? (
          <button
            style={{
              ...buttonStyle,
              background: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
            }}
            onClick={handleDownload}
          >
            {labels.downloadAll}
          </button>
        ) : (
          <button
            style={{
              ...buttonStyle,
              background: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
            }}
            onClick={handleExport}
            disabled={isExporting || conversations.length === 0}
          >
            {selectedIds.size > 0 ? labels.exportSelected : labels.exportAll}
          </button>
        )}
      </div>
    </div>
  )
}
