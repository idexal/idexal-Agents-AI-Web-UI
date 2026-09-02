/**
 * PDF Export UI for Idexal Agents.
 * Interface for exporting conversations to PDF.
 */

import React, { useState } from 'react'
import type { PDFConversation, PDFExportOptions } from './ConversationPDFExport.ts'
import {
  exportConversationToPDF,
  downloadPDFExport,
  printPDFExport,
  DEFAULT_PDF_OPTIONS,
} from './ConversationPDFExport.ts'

/** Labels for the export UI */
const PDF_UI_LABELS = {
  en: {
    title: 'Export to PDF',
    includeTimestamps: 'Include timestamps',
    includeMetadata: 'Include metadata',
    includeAttachments: 'Include attachments',
    includeTableOfContents: 'Include table of contents',
    includePageNumbers: 'Include page numbers',
    includeHeader: 'Include header',
    includeFooter: 'Include footer',
    pageSize: 'Page size',
    orientation: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Landscape',
    export: 'Export PDF',
    print: 'Print',
    cancel: 'Cancel',
    downloading: 'Generating PDF...',
    options: 'Options',
    layout: 'Layout',
  },
  ar: {
    title: 'تصدير إلى PDF',
    includeTimestamps: 'تضمين الوقت',
    includeMetadata: 'تضمين البيانات الوصفية',
    includeAttachments: 'تضمين المرفقات',
    includeTableOfContents: 'تضمين جدول المحتويات',
    includePageNumbers: 'تضمين أرقام الصفحات',
    includeHeader: 'تضمين الترويسة',
    includeFooter: 'تضمين التذييل',
    pageSize: 'حجم الصفحة',
    orientation: 'الاتجاه',
    portrait: 'عمودي',
    landscape: 'أفقي',
    export: 'تصدير PDF',
    print: 'طباعة',
    cancel: 'إلغاء',
    downloading: 'جاري إنشاء PDF...',
    options: 'الخيارات',
    layout: 'التخطيط',
  },
  zh: {
    title: '导出为 PDF',
    includeTimestamps: '包含时间戳',
    includeMetadata: '包含元数据',
    includeAttachments: '包含附件',
    includeTableOfContents: '包含目录',
    includePageNumbers: '包含页码',
    includeHeader: '包含页眉',
    includeFooter: '包含页脚',
    pageSize: '页面大小',
    orientation: '方向',
    portrait: '纵向',
    landscape: '横向',
    export: '导出 PDF',
    print: '打印',
    cancel: '取消',
    downloading: '正在生成 PDF...',
    options: '选项',
    layout: '布局',
  },
}

export interface PDFExportUIProps {
  /** Conversation to export */
  conversation: PDFConversation
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Callback when export is complete */
  onExport?: () => void
  /** Callback when cancelled */
  onCancel?: () => void
}

/**
 * PDF Export UI Component.
 */
export function PDFExportUI({
  conversation,
  language = 'en',
  onExport,
  onCancel,
}: PDFExportUIProps) {
  const labels = PDF_UI_LABELS[language] ?? PDF_UI_LABELS.en

  const [includeTimestamps, setIncludeTimestamps] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(false)
  const [includePageNumbers, setIncludePageNumbers] = useState(true)
  const [includeHeader, setIncludeHeader] = useState(true)
  const [includeFooter, setIncludeFooter] = useState(true)
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isGenerating, setIsGenerating] = useState(false)

  const options: PDFExportOptions = {
    ...DEFAULT_PDF_OPTIONS,
    includeTimestamps,
    includeMetadata,
    includeAttachments,
    includeTableOfContents,
    includePageNumbers,
    includeHeader,
    includeFooter,
    pageSize,
    orientation,
    language,
  }

  const handleExport = async () => {
    setIsGenerating(true)
    try {
      const result = exportConversationToPDF(conversation, options)
      downloadPDFExport(result)
      onExport?.()
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      const result = exportConversationToPDF(conversation, options)
      printPDFExport(result)
      onExport?.()
    } finally {
      setIsGenerating(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    background: 'var(--color-bg-primary, #ffffff)',
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
    opacity: isGenerating ? 0.7 : 1,
  }

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>{labels.title}</h2>

      {/* Options Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.options}</div>
        
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
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
          />
          <span>{labels.includeMetadata}</span>
        </div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeAttachments}
            onChange={(e) => setIncludeAttachments(e.target.checked)}
          />
          <span>{labels.includeAttachments}</span>
        </div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeTableOfContents}
            onChange={(e) => setIncludeTableOfContents(e.target.checked)}
          />
          <span>{labels.includeTableOfContents}</span>
        </div>
      </div>

      {/* Layout Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.layout}</div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {labels.pageSize}
          </label>
          <select
            style={selectStyle}
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {labels.orientation}
          </label>
          <select
            style={selectStyle}
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
          >
            <option value="portrait">{labels.portrait}</option>
            <option value="landscape">{labels.landscape}</option>
          </select>
        </div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includePageNumbers}
            onChange={(e) => setIncludePageNumbers(e.target.checked)}
          />
          <span>{labels.includePageNumbers}</span>
        </div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeHeader}
            onChange={(e) => setIncludeHeader(e.target.checked)}
          />
          <span>{labels.includeHeader}</span>
        </div>
        
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeFooter}
            onChange={(e) => setIncludeFooter(e.target.checked)}
          />
          <span>{labels.includeFooter}</span>
        </div>
      </div>

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
            disabled={isGenerating}
          >
            {labels.cancel}
          </button>
        )}
        <button
          style={{
            ...buttonStyle,
            background: 'var(--color-bg-secondary, #f3f4f6)',
            color: 'var(--color-text-primary, #374151)',
          }}
          onClick={handlePrint}
          disabled={isGenerating}
        >
          {isGenerating ? labels.downloading : labels.print}
        </button>
        <button
          style={{
            ...buttonStyle,
            background: 'var(--color-primary, #2563eb)',
            color: '#ffffff',
          }}
          onClick={handleExport}
          disabled={isGenerating}
        >
          {isGenerating ? labels.downloading : labels.export}
        </button>
      </div>
    </div>
  )
}
