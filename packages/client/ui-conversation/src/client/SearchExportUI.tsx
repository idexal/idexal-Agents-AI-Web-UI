/**
 * Search Results Export UI for Idexal Agents.
 * Interface for exporting search results.
 */

import React, { useState, useMemo } from 'react'
import type { SearchResult, SearchStats } from './AdvancedSearch.ts'
import {
  exportSearchResults,
  downloadSearchExport,
  copySearchExportToClipboard,
  type SearchExportFormat,
  type SearchExportOptions,
} from './SearchResultsExport.ts'

/** Labels for the export UI */
const EXPORT_UI_LABELS = {
  en: {
    title: 'Export Search Results',
    format: 'Format',
    jsonFormat: 'JSON Data',
    csvFormat: 'CSV Spreadsheet',
    markdownFormat: 'Markdown Document',
    htmlFormat: 'HTML Document',
    options: 'Options',
    includeQuery: 'Include search query',
    includeStats: 'Include statistics',
    includeSnippets: 'Include snippets',
    includeFullContent: 'Include full content',
    maxContentLength: 'Max content length',
    export: 'Export',
    copyToClipboard: 'Copy to Clipboard',
    cancel: 'Cancel',
    resultsSelected: 'results will be exported',
    copied: 'Copied!',
    copyFailed: 'Copy failed',
    preview: 'Preview',
    characters: 'characters',
  },
  ar: {
    title: 'تصدير نتائج البحث',
    format: 'الصيغة',
    jsonFormat: 'بيانات JSON',
    csvFormat: 'جدول CSV',
    markdownFormat: 'مستند Markdown',
    htmlFormat: 'مستند HTML',
    options: 'الخيارات',
    includeQuery: 'تضمين استعلام البحث',
    includeStats: 'تضمين الإحصائيات',
    includeSnippets: 'تضمين المقتطفات',
    includeFullContent: 'تضمين المحتوى الكامل',
    maxContentLength: 'الحد الأقصى للمحتوى',
    export: 'تصدير',
    copyToClipboard: 'نسخ إلى الحافظة',
    cancel: 'إلغاء',
    resultsSelected: 'ستتم تصديرها',
    copied: 'تم النسخ!',
    copyFailed: 'فشل النسخ',
    preview: 'معاينة',
    characters: 'حرف',
  },
  zh: {
    title: '导出搜索结果',
    format: '格式',
    jsonFormat: 'JSON 数据',
    csvFormat: 'CSV 电子表格',
    markdownFormat: 'Markdown 文档',
    htmlFormat: 'HTML 文档',
    options: '选项',
    includeQuery: '包含搜索查询',
    includeStats: '包含统计信息',
    includeSnippets: '包含摘要',
    includeFullContent: '包含完整内容',
    maxContentLength: '最大内容长度',
    export: '导出',
    copyToClipboard: '复制到剪贴板',
    cancel: '取消',
    resultsSelected: '个结果将被导出',
    copied: '已复制！',
    copyFailed: '复制失败',
    preview: '预览',
    characters: '字符',
  },
}

export interface SearchExportUIProps {
  /** Search results to export */
  results: SearchResult[]
  /** Search statistics */
  stats?: SearchStats
  /** Search query */
  query?: string
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Callback when export is complete */
  onExport?: (format: SearchExportFormat) => void
  /** Callback when cancelled */
  onCancel?: () => void
}

/**
 * Search Export UI Component.
 */
export function SearchExportUI({
  results,
  stats,
  query,
  language = 'en',
  onExport,
  onCancel,
}: SearchExportUIProps) {
  const labels = EXPORT_UI_LABELS[language] ?? EXPORT_UI_LABELS.en

  const [format, setFormat] = useState<SearchExportFormat>('json')
  const [includeQuery, setIncludeQuery] = useState(true)
  const [includeStats, setIncludeStats] = useState(true)
  const [includeSnippets, setIncludeSnippets] = useState(true)
  const [includeFullContent, setIncludeFullContent] = useState(false)
  const [maxContentLength, setMaxContentLength] = useState(1000)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  )

  const options: SearchExportOptions = useMemo(
    () => ({
      format,
      includeQuery,
      includeStats,
      includeSnippets,
      includeFullContent,
      maxContentLength,
      language,
      query: query ?? undefined,
      filename: undefined,
    }),
    [
      format,
      includeQuery,
      includeStats,
      includeSnippets,
      includeFullContent,
      maxContentLength,
      language,
      query,
    ]
  )

  const handleExport = () => {
    const result = exportSearchResults(results, options, stats)
    downloadSearchExport(result)
    onExport?.(format)
  }

  const handleCopyToClipboard = async () => {
    const result = exportSearchResults(results, options, stats)
    const success = await copySearchExportToClipboard(result)

    setCopyStatus(success ? 'copied' : 'failed')
    setTimeout(() => setCopyStatus('idle'), 2000)
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
  }

  const copyButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    flex: 'none',
    padding: '12px 16px',
    background:
      copyStatus === 'copied'
        ? '#10b981'
        : copyStatus === 'failed'
          ? '#ef4444'
          : 'var(--color-background-secondary, #f3f4f6)',
    color: copyStatus === 'copied' || copyStatus === 'failed' ? '#fff' : 'var(--color-text, #374151)',
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
          onChange={(e) => setFormat(e.target.value as SearchExportFormat)}
        >
          <option value="json">{labels.jsonFormat}</option>
          <option value="csv">{labels.csvFormat}</option>
          <option value="markdown">{labels.markdownFormat}</option>
          <option value="html">{labels.htmlFormat}</option>
        </select>
      </div>

      {/* Options */}
      <div style={sectionStyle}>
        <label style={labelStyle}>{labels.options}</label>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeQuery}
            onChange={(e) => setIncludeQuery(e.target.checked)}
          />
          <span>{labels.includeQuery}</span>
        </div>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeStats}
            onChange={(e) => setIncludeStats(e.target.checked)}
          />
          <span>{labels.includeStats}</span>
        </div>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeSnippets}
            onChange={(e) => setIncludeSnippets(e.target.checked)}
          />
          <span>{labels.includeSnippets}</span>
        </div>
        <div style={checkboxRowStyle}>
          <input
            type="checkbox"
            checked={includeFullContent}
            onChange={(e) => setIncludeFullContent(e.target.checked)}
          />
          <span>{labels.includeFullContent}</span>
        </div>
        {includeFullContent && (
          <div style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary, #6b7280)' }}>
              {labels.maxContentLength}:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={maxContentLength}
                onChange={(e) => setMaxContentLength(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary, #6b7280)', minWidth: '80px' }}>
                {maxContentLength} {labels.characters}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Result count */}
      <div
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary, #6b7280)',
          marginBottom: '16px',
        }}
      >
        {results.length} {labels.resultsSelected}
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
        <button style={copyButtonStyle} onClick={handleCopyToClipboard}>
          {copyStatus === 'copied'
            ? labels.copied
            : copyStatus === 'failed'
              ? labels.copyFailed
              : labels.copyToClipboard}
        </button>
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
