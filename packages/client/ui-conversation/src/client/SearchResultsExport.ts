/**
 * Search Results Export for Idexal Agents.
 * Export search results to CSV, JSON, and other formats.
 */

import type { SearchResult, SearchStats } from './AdvancedSearch.ts'

/** Export format type */
export type SearchExportFormat = 'csv' | 'json' | 'markdown' | 'html'

/** Export options */
export interface SearchExportOptions {
  /** Export format */
  format: SearchExportFormat
  /** Include search query in export */
  includeQuery: boolean
  /** Include statistics */
  includeStats: boolean
  /** Include snippets */
  includeSnippets: boolean
  /** Include full message content */
  includeFullContent: boolean
  /** Max content length to include */
  maxContentLength: number
  /** Custom filename */
  filename: string | undefined
  /** Language for labels */
  language: 'en' | 'ar' | 'zh'
  /** Search query that produced these results */
  query: string | undefined
}

/** Export result */
export interface SearchExportResult {
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
export const DEFAULT_SEARCH_EXPORT_OPTIONS: SearchExportOptions = {
  format: 'json',
  includeQuery: true,
  includeStats: true,
  includeSnippets: true,
  includeFullContent: false,
  maxContentLength: 1000,
  language: 'en',
  filename: undefined,
  query: undefined,
}

/** Labels for export in multiple languages */
const EXPORT_LABELS: Record<string, Record<string, string>> = {
  en: {
    title: 'Search Results Export',
    query: 'Search Query',
    totalResults: 'Total Results',
    exportedAt: 'Exported At',
    conversationTitle: 'Conversation',
    messageRole: 'Role',
    messageContent: 'Content',
    messageSnippet: 'Snippet',
    messageTimestamp: 'Timestamp',
    score: 'Relevance Score',
    conversationId: 'Conversation ID',
    messageId: 'Message ID',
    user: 'User',
    assistant: 'Assistant',
    system: 'System',
  },
  ar: {
    title: 'تصدير نتائج البحث',
    query: 'استعلام البحث',
    totalResults: 'إجمالي النتائج',
    exportedAt: 'تم التصدير',
    conversationTitle: 'المحادثة',
    messageRole: 'الدور',
    messageContent: 'المحتوى',
    messageSnippet: 'المقتطف',
    messageTimestamp: 'التاريخ',
    score: 'درجة الصلة',
    conversationId: 'معرف المحادثة',
    messageId: 'معرف الرسالة',
    user: 'المستخدم',
    assistant: 'المساعد',
    system: 'النظام',
  },
  zh: {
    title: '搜索结果导出',
    query: '搜索查询',
    totalResults: '总结果数',
    exportedAt: '导出时间',
    conversationTitle: '对话',
    messageRole: '角色',
    messageContent: '内容',
    messageSnippet: '摘要',
    messageTimestamp: '时间戳',
    score: '相关度分数',
    conversationId: '对话 ID',
    messageId: '消息 ID',
    user: '用户',
    assistant: '助手',
    system: '系统',
  },
}

/**
 * Generate JSON export for search results.
 */
export function generateSearchJSON(
  results: SearchResult[],
  options: SearchExportOptions,
  stats?: SearchStats
): SearchExportResult {
  const labels = EXPORT_LABELS[options.language] ?? EXPORT_LABELS.en!

  const exportData: Record<string, unknown> = {
    metadata: {
      title: labels.title,
      exportedAt: new Date().toISOString(),
      language: options.language,
      platform: 'Idexal Agents',
    },
  }

  if (options.includeQuery && options.query) {
    exportData.query = options.query
  }

  if (options.includeStats && stats) {
    exportData.statistics = {
      totalMatches: stats.totalMatches,
      conversationsWithMatches: stats.conversationsWithMatches,
      searchDuration: stats.duration,
    }
  }

  exportData.results = results.map((result, index) => {
    const item: Record<string, unknown> = {
      index: index + 1,
      conversation: {
        id: result.conversation.id,
        title: result.conversation.title,
      },
      message: {
        id: result.message.id,
        role: result.message.role,
        timestamp: result.message.timestamp.toISOString(),
      },
      score: result.score,
    }

    if (options.includeSnippets) {
      item.snippet = result.snippet
    }

    if (options.includeFullContent) {
      const content = result.message.content
      item.content =
        content.length > options.maxContentLength
          ? content.substring(0, options.maxContentLength) + '...'
          : content
    }

    return item
  })

  const data = JSON.stringify(exportData, null, 2)
  const filename =
    options.filename ?? `search-results.${options.language}.json`

  return {
    data,
    mimeType: 'application/json',
    extension: 'json',
    filename,
  }
}

/**
 * Generate CSV export for search results.
 */
export function generateSearchCSV(
  results: SearchResult[],
  options: SearchExportOptions
): SearchExportResult {
  const labels = EXPORT_LABELS[options.language] ?? EXPORT_LABELS.en!

  // Build headers
  const headers: string[] = [
    '#',
    labels.conversationId ?? 'Conversation ID',
    labels.conversationTitle ?? 'Conversation',
    labels.messageId ?? 'Message ID',
    labels.messageRole ?? 'Role',
    labels.messageTimestamp ?? 'Timestamp',
    labels.score ?? 'Score',
  ]

  if (options.includeSnippets) {
    headers.push(labels.messageSnippet ?? 'Snippet')
  }

  if (options.includeFullContent) {
    headers.push(labels.messageContent ?? 'Content')
  }

  // Build rows
  const rows = results.map((result, index) => {
    const row: string[] = [
      String(index + 1),
      result.conversation.id,
      result.conversation.title,
      result.message.id,
      getRoleLabel(result.message.role, labels),
      result.message.timestamp.toISOString(),
      result.score.toFixed(3),
    ]

    if (options.includeSnippets) {
      row.push(result.snippet)
    }

    if (options.includeFullContent) {
      const content = result.message.content
      row.push(
        content.length > options.maxContentLength
          ? content.substring(0, options.maxContentLength) + '...'
          : content
      )
    }

    return row
  })

  // Build CSV string
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  const filename =
    options.filename ?? `search-results.${options.language}.csv`

  return {
    data: csvContent,
    mimeType: 'text/csv',
    extension: 'csv',
    filename,
  }
}

/**
 * Generate Markdown export for search results.
 */
export function generateSearchMarkdown(
  results: SearchResult[],
  options: SearchExportOptions,
  stats?: SearchStats
): SearchExportResult {
  const labels = EXPORT_LABELS[options.language] ?? EXPORT_LABELS.en!
  const now = new Date().toLocaleString()

  let markdown = `# ${labels.title}\n\n`

  if (options.includeQuery && options.query) {
    markdown += `**${labels.query}:** ${options.query}\n\n`
  }

  if (options.includeStats && stats) {
    markdown += `## ${labels.totalResults}: ${stats.totalMatches}\n\n`
  }

  markdown += `*${labels.exportedAt}: ${now}*\n\n---\n\n`

  results.forEach((result, index) => {
    markdown += `### ${index + 1}. ${result.conversation.title}\n\n`
    markdown += `- **${labels.messageRole}:** ${getRoleLabel(result.message.role, labels)}\n`
    markdown += `- **${labels.messageTimestamp}:** ${result.message.timestamp.toLocaleString()}\n`
    markdown += `- **${labels.score}:** ${result.score.toFixed(3)}\n\n`

    if (options.includeSnippets) {
      markdown += `> ${result.snippet}\n\n`
    }

    if (options.includeFullContent) {
      const content = result.message.content
      const truncated =
        content.length > options.maxContentLength
          ? content.substring(0, options.maxContentLength) + '...'
          : content
      markdown += `\`\`\`\n${truncated}\n\`\`\`\n\n`
    }

    if (index < results.length - 1) {
      markdown += `---\n\n`
    }
  })

  const filename =
    options.filename ?? `search-results.${options.language}.md`

  return {
    data: markdown,
    mimeType: 'text/markdown',
    extension: 'md',
    filename,
  }
}

/**
 * Generate HTML export for search results.
 */
export function generateSearchHTML(
  results: SearchResult[],
  options: SearchExportOptions,
  stats?: SearchStats
): SearchExportResult {
  const labels = EXPORT_LABELS[options.language] ?? EXPORT_LABELS.en!
  const now = new Date().toLocaleString()

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
    .header { margin-bottom: 32px; }
    .header h1 { font-size: 24px; color: #111827; margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 14px; }
    .result {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .result-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .result-title { font-weight: 600; color: #111827; }
    .result-score {
      background: #dbeafe;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .result-meta { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
    .result-snippet {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
      color: #374151;
    }
    .result-content {
      margin-top: 12px;
      padding: 12px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 13px;
      white-space: pre-wrap;
      font-family: monospace;
    }
    .role-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
    .role-user { background: #dbeafe; color: #1e40af; }
    .role-assistant { background: #d1fae5; color: #065f46; }
    .role-system { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${labels.title}</h1>
    <div class="meta">
      ${options.includeQuery && options.query ? `<p><strong>${labels.query}:</strong> ${escapeHtml(options.query)}</p>` : ''}
      ${options.includeStats && stats ? `<p><strong>${labels.totalResults}:</strong> ${stats.totalMatches}</p>` : ''}
      <p><strong>${labels.exportedAt}:</strong> ${now}</p>
    </div>
  </div>`

  results.forEach((result, index) => {
    const roleClass = `role-${result.message.role}`
    const roleLabel = getRoleLabel(result.message.role, labels)

    html += `
  <div class="result">
    <div class="result-header">
      <span class="result-title">${index + 1}. ${escapeHtml(result.conversation.title)}</span>
      <span class="result-score">${result.score.toFixed(3)}</span>
    </div>
    <div class="result-meta">
      <span class="role-badge ${roleClass}">${roleLabel}</span>
      &middot; ${result.message.timestamp.toLocaleString()}
    </div>
    ${options.includeSnippets ? `<div class="result-snippet">${result.snippet}</div>` : ''}
    ${options.includeFullContent ? `<div class="result-content">${escapeHtml(result.message.content.substring(0, options.maxContentLength))}</div>` : ''}
  </div>`
  })

  html += `
</body>
</html>`

  const filename =
    options.filename ?? `search-results.${options.language}.html`

  return {
    data: html,
    mimeType: 'text/html',
    extension: 'html',
    filename,
  }
}

/**
 * Export search results.
 */
export function exportSearchResults(
  results: SearchResult[],
  options: SearchExportOptions = DEFAULT_SEARCH_EXPORT_OPTIONS,
  stats?: SearchStats
): SearchExportResult {
  switch (options.format) {
    case 'json':
      return generateSearchJSON(results, options, stats)
    case 'csv':
      return generateSearchCSV(results, options)
    case 'markdown':
      return generateSearchMarkdown(results, options, stats)
    case 'html':
      return generateSearchHTML(results, options, stats)
    default:
      return generateSearchJSON(results, options, stats)
  }
}

/**
 * Download exported file.
 */
export function downloadSearchExport(result: SearchExportResult): void {
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
 * Copy export to clipboard.
 */
export async function copySearchExportToClipboard(
  result: SearchExportResult
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(result.data)
    return true
  } catch {
    // Fallback for older browsers
    const textarea = window.document.createElement('textarea')
    textarea.value = result.data
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    window.document.body.appendChild(textarea)
    textarea.select()
    try {
      window.document.execCommand('copy')
      window.document.body.removeChild(textarea)
      return true
    } catch {
      window.document.body.removeChild(textarea)
      return false
    }
  }
}

/**
 * Get preview of export (first N results).
 */
export function getExportPreview(
  results: SearchResult[],
  options: SearchExportOptions,
  maxPreview: number = 5
): string {
  const previewResults = results.slice(0, maxPreview)
  const result = exportSearchResults(previewResults, { ...options })

  if (results.length > maxPreview) {
    const previewNote =
      options.language === 'ar'
        ? `\n\n... و ${results.length - maxPreview} نتيجة أخرى`
        : options.language === 'zh'
          ? `\n\n... 还有 ${results.length - maxPreview} 个结果`
          : `\n\n... and ${results.length - maxPreview} more results`
    return result.data + previewNote
  }

  return result.data
}

// Helper functions

function getRoleLabel(
  role: 'user' | 'assistant' | 'system',
  labels: Record<string, string>
): string {
  switch (role) {
    case 'user':
      return labels.user ?? 'User'
    case 'assistant':
      return labels.assistant ?? 'Assistant'
    case 'system':
      return labels.system ?? 'System'
    default:
      return role
  }
}

function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function escapeHtml(text: string): string {
  const div = window.document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
