/**
 * Batch Export Service for Idexal Agents.
 * Export multiple conversations at once with various formats.
 */

/** Conversation for export */
export interface BatchConversation {
  id: string
  title: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    attachments?: Array<{
      type: string
      name: string
    }>
  }>
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

/** Batch export format */
export type BatchExportFormat = 'json' | 'csv' | 'markdown' | 'html' | 'zip'

/** Batch export options */
export interface BatchExportOptions {
  /** Export format */
  format: BatchExportFormat
  /** Include metadata */
  includeMetadata: boolean
  /** Include timestamps */
  includeTimestamps: boolean
  /** Include attachments list */
  includeAttachments: boolean
  /** Custom filename prefix */
  filenamePrefix: string | undefined
  /** Language for labels */
  language: 'en' | 'ar' | 'zh'
  /** Archive password (for ZIP) */
  archivePassword: string | undefined
  /** Single file for all conversations */
  singleFile: boolean
}

/** Batch export result */
export interface BatchExportResult {
  /** Exported files */
  files: BatchExportFile[]
  /** Total conversations exported */
  totalConversations: number
  /** Total messages exported */
  totalMessages: number
  /** Total size in bytes */
  totalSize: number
  /** Export duration in ms */
  duration: number
}

/** Batch export file */
export interface BatchExportFile {
  /** Filename */
  filename: string
  /** Content */
  content: string
  /** MIME type */
  mimeType: string
  /** Size in bytes */
  size: number
  /** Conversation ID */
  conversationId: string
}

/** Batch export progress */
export interface BatchExportProgress {
  /** Total conversations */
  total: number
  /** Current conversation index */
  current: number
  /** Current conversation title */
  currentTitle: string
  /** Phase */
  phase: 'preparing' | 'exporting' | 'packaging' | 'complete'
  /** Progress percentage */
  percentage: number
}

/** Default batch export options */
export const DEFAULT_BATCH_OPTIONS: BatchExportOptions = {
  format: 'json',
  includeMetadata: true,
  includeTimestamps: true,
  includeAttachments: true,
  filenamePrefix: undefined,
  language: 'en',
  archivePassword: undefined,
  singleFile: false,
}

/**
 * Batch export multiple conversations.
 */
export async function batchExportConversations(
  conversations: BatchConversation[],
  options: BatchExportOptions = DEFAULT_BATCH_OPTIONS,
  onProgress?: (progress: BatchExportProgress) => void
): Promise<BatchExportResult> {
  const startTime = Date.now()
  const files: BatchExportFile[] = []
  let totalMessages = 0

  // Report preparing phase
  onProgress?.({
    total: conversations.length,
    current: 0,
    currentTitle: '',
    phase: 'preparing',
    percentage: 0,
  })

  if (options.singleFile) {
    // Export all conversations to a single file
    const content = await exportToSingleFile(conversations, options)
    const filename = generateFilename(options, 'all')
    
    files.push({
      filename,
      content,
      mimeType: getMimeType(options.format),
      size: new Blob([content]).size,
      conversationId: 'all',
    })

    totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0)
  } else {
    // Export each conversation separately
    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i]!
      
      // Report exporting phase
      onProgress?.({
        total: conversations.length,
        current: i + 1,
        currentTitle: conv.title,
        phase: 'exporting',
        percentage: ((i + 1) / conversations.length) * 100,
      })

      const content = await exportConversation(conv, options)
      const filename = generateConversationFilename(conv, options)
      
      files.push({
        filename,
        content,
        mimeType: getMimeType(options.format),
        size: new Blob([content]).size,
        conversationId: conv.id,
      })

      totalMessages += conv.messages.length

      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  // Report packaging phase
  onProgress?.({
    total: conversations.length,
    current: conversations.length,
    currentTitle: '',
    phase: 'packaging',
    percentage: 100,
  })

  // Calculate total size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  // Report complete
  onProgress?.({
    total: conversations.length,
    current: conversations.length,
    currentTitle: '',
    phase: 'complete',
    percentage: 100,
  })

  return {
    files,
    totalConversations: conversations.length,
    totalMessages,
    totalSize,
    duration: Date.now() - startTime,
  }
}

/**
 * Export conversations to a single file.
 */
async function exportToSingleFile(
  conversations: BatchConversation[],
  options: BatchExportOptions
): Promise<string> {
  switch (options.format) {
    case 'json':
      return exportToSingleJSON(conversations, options)
    case 'csv':
      return exportToSingleCSV(conversations, options)
    case 'markdown':
      return exportToSingleMarkdown(conversations, options)
    case 'html':
      return exportToSingleHTML(conversations, options)
    default:
      return exportToSingleJSON(conversations, options)
  }
}

/**
 * Export single conversation.
 */
async function exportConversation(
  conversation: BatchConversation,
  options: BatchExportOptions
): Promise<string> {
  switch (options.format) {
    case 'json':
      return exportConversationJSON(conversation, options)
    case 'csv':
      return exportConversationCSV(conversation, options)
    case 'markdown':
      return exportConversationMarkdown(conversation, options)
    case 'html':
      return exportConversationHTML(conversation, options)
    default:
      return exportConversationJSON(conversation, options)
  }
}

/**
 * Export to single JSON file.
 */
function exportToSingleJSON(
  conversations: BatchConversation[],
  options: BatchExportOptions
): string {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
      platform: 'Idexal Agents',
      format: 'batch-json',
    },
    conversations: conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      tags: conv.tags,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        ...(options.includeTimestamps ? { timestamp: msg.timestamp.toISOString() } : {}),
        ...(options.includeAttachments && msg.attachments ? { attachments: msg.attachments } : {}),
      })),
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export to single CSV file.
 */
function exportToSingleCSV(
  conversations: BatchConversation[],
  options: BatchExportOptions
): string {
  const headers = ['Conversation ID', 'Conversation Title', 'Message ID', 'Role', 'Content']
  if (options.includeTimestamps) headers.push('Timestamp')
  if (options.includeAttachments) headers.push('Attachments')

  const rows: string[][] = []

  for (const conv of conversations) {
    for (const msg of conv.messages) {
      const row: string[] = [
        conv.id,
        conv.title,
        msg.id,
        msg.role,
        msg.content,
      ]
      if (options.includeTimestamps) row.push(msg.timestamp.toISOString())
      if (options.includeAttachments) row.push(JSON.stringify(msg.attachments ?? []))
      rows.push(row)
    }
  }

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Export to single Markdown file.
 */
function exportToSingleMarkdown(
  conversations: BatchConversation[],
  options: BatchExportOptions
): string {
  let markdown = '# Batch Export\n\n'
  markdown += `*Exported on ${new Date().toLocaleString()}*\n\n`
  markdown += `**Total Conversations:** ${conversations.length}\n\n`
  markdown += '---\n\n'

  for (const conv of conversations) {
    markdown += `## ${conv.title}\n\n`
    
    if (options.includeMetadata) {
      markdown += `- **Created:** ${conv.createdAt.toLocaleString()}\n`
      markdown += `- **Updated:** ${conv.updatedAt.toLocaleString()}\n`
      if (conv.tags && conv.tags.length > 0) {
        markdown += `- **Tags:** ${conv.tags.join(', ')}\n`
      }
      markdown += '\n'
    }

    for (const msg of conv.messages) {
      const roleLabel = msg.role === 'user' ? '👤 You' : 
                        msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'
      
      markdown += `### ${roleLabel}`
      if (options.includeTimestamps) {
        markdown += ` - ${msg.timestamp.toLocaleString()}`
      }
      markdown += '\n\n'
      markdown += `${msg.content}\n\n`
    }

    markdown += '---\n\n'
  }

  return markdown
}

/**
 * Export to single HTML file.
 */
function exportToSingleHTML(
  conversations: BatchConversation[],
  options: BatchExportOptions
): string {
  let html = `<!DOCTYPE html>
<html lang="${options.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Export - Idexal Agents</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 40px; background: #fff; }
    .header { margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 28px; color: #111827; margin-bottom: 8px; }
    .header p { color: #6b7280; font-size: 14px; }
    .conversation { margin-bottom: 40px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
    .conv-header { background: #f9fafb; padding: 16px; border-bottom: 1px solid #e5e7eb; }
    .conv-title { font-size: 18px; font-weight: 600; color: #111827; }
    .conv-meta { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .conv-messages { padding: 16px; }
    .message { margin-bottom: 16px; padding: 12px; border-radius: 8px; }
    .message-user { background: #eff6ff; border-left: 3px solid #3b82f6; }
    .message-assistant { background: #ecfdf5; border-left: 3px solid #10b981; }
    .message-system { background: #fffbeb; border-left: 3px solid #f59e0b; }
    .message-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .message-role { font-weight: 600; }
    .message-time { color: #6b7280; }
    .message-content { font-size: 14px; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Batch Export</h1>
    <p>Exported on ${new Date().toLocaleString()} | ${conversations.length} conversations</p>
  </div>`

  for (const conv of conversations) {
    html += `
  <div class="conversation">
    <div class="conv-header">
      <div class="conv-title">${escapeHtml(conv.title)}</div>
      <div class="conv-meta">
        Created: ${conv.createdAt.toLocaleString()} | Messages: ${conv.messages.length}
      </div>
    </div>
    <div class="conv-messages">`

    for (const msg of conv.messages) {
      const roleClass = `message-${msg.role}`
      const roleLabel = msg.role === 'user' ? '👤 You' : 
                        msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'

      html += `
      <div class="message ${roleClass}">
        <div class="message-header">
          <span class="message-role">${roleLabel}</span>
          ${options.includeTimestamps ? `<span class="message-time">${msg.timestamp.toLocaleString()}</span>` : ''}
        </div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
      </div>`
    }

    html += `
    </div>
  </div>`
  }

  html += `
  <div class="footer">
    Generated by Idexal Agents
  </div>
</body>
</html>`

  return html
}

/**
 * Export single conversation to JSON.
 */
function exportConversationJSON(
  conversation: BatchConversation,
  options: BatchExportOptions
): string {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      platform: 'Idexal Agents',
    },
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      tags: conversation.tags,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        ...(options.includeTimestamps ? { timestamp: msg.timestamp.toISOString() } : {}),
        ...(options.includeAttachments && msg.attachments ? { attachments: msg.attachments } : {}),
      })),
    },
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export single conversation to CSV.
 */
function exportConversationCSV(
  conversation: BatchConversation,
  options: BatchExportOptions
): string {
  const headers = ['Message ID', 'Role', 'Content']
  if (options.includeTimestamps) headers.push('Timestamp')
  if (options.includeAttachments) headers.push('Attachments')

  const rows: string[][] = []

  for (const msg of conversation.messages) {
    const row: string[] = [msg.id, msg.role, msg.content]
    if (options.includeTimestamps) row.push(msg.timestamp.toISOString())
    if (options.includeAttachments) row.push(JSON.stringify(msg.attachments ?? []))
    rows.push(row)
  }

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Export single conversation to Markdown.
 */
function exportConversationMarkdown(
  conversation: BatchConversation,
  options: BatchExportOptions
): string {
  let markdown = `# ${conversation.title}\n\n`

  if (options.includeMetadata) {
    markdown += `*Created: ${conversation.createdAt.toLocaleString()}*\n`
    markdown += `*Updated: ${conversation.updatedAt.toLocaleString()}*\n\n`
    if (conversation.tags && conversation.tags.length > 0) {
      markdown += `**Tags:** ${conversation.tags.join(', ')}\n\n`
    }
  }

  markdown += '---\n\n'

  for (const msg of conversation.messages) {
    const roleLabel = msg.role === 'user' ? '👤 You' : 
                      msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'
    
    markdown += `### ${roleLabel}`
    if (options.includeTimestamps) {
      markdown += ` - ${msg.timestamp.toLocaleString()}`
    }
    markdown += '\n\n'
    markdown += `${msg.content}\n\n`
  }

  return markdown
}

/**
 * Export single conversation to HTML.
 */
function exportConversationHTML(
  conversation: BatchConversation,
  options: BatchExportOptions
): string {
  let html = `<!DOCTYPE html>
<html lang="${options.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(conversation.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; padding: 40px; background: #fff; }
    .header { margin-bottom: 32px; }
    .title { font-size: 24px; color: #111827; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #6b7280; }
    .messages { display: flex; flex-direction: column; gap: 16px; }
    .message { padding: 16px; border-radius: 8px; }
    .message-user { background: #eff6ff; border-left: 3px solid #3b82f6; }
    .message-assistant { background: #ecfdf5; border-left: 3px solid #10b981; }
    .message-system { background: #fffbeb; border-left: 3px solid #f59e0b; }
    .message-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .message-role { font-weight: 600; }
    .message-time { color: #6b7280; }
    .message-content { font-size: 14px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${escapeHtml(conversation.title)}</h1>
    <div class="meta">
      Created: ${conversation.createdAt.toLocaleString()} | Messages: ${conversation.messages.length}
    </div>
  </div>
  <div class="messages">`

  for (const msg of conversation.messages) {
    const roleClass = `message-${msg.role}`
    const roleLabel = msg.role === 'user' ? '👤 You' : 
                      msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'

    html += `
    <div class="message ${roleClass}">
      <div class="message-header">
        <span class="message-role">${roleLabel}</span>
        ${options.includeTimestamps ? `<span class="message-time">${msg.timestamp.toLocaleString()}</span>` : ''}
      </div>
      <div class="message-content">${escapeHtml(msg.content)}</div>
    </div>`
  }

  html += `
  </div>
</body>
</html>`

  return html
}

/**
 * Generate filename for batch export.
 */
function generateFilename(options: BatchExportOptions, suffix: string): string {
  const prefix = options.filenamePrefix ?? 'batch-export'
  const timestamp = new Date().toISOString().slice(0, 10)
  const ext = getFileExtension(options.format)
  return `${prefix}-${suffix}-${timestamp}.${ext}`
}

/**
 * Generate filename for single conversation.
 */
function generateConversationFilename(
  conversation: BatchConversation,
  options: BatchExportOptions
): string {
  const prefix = options.filenamePrefix ?? 'conversation'
  const title = conversation.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  const ext = getFileExtension(options.format)
  return `${prefix}-${title}.${ext}`
}

/**
 * Get file extension for format.
 */
function getFileExtension(format: BatchExportFormat): string {
  switch (format) {
    case 'json': return 'json'
    case 'csv': return 'csv'
    case 'markdown': return 'md'
    case 'html': return 'html'
    case 'zip': return 'zip'
    default: return 'txt'
  }
}

/**
 * Get MIME type for format.
 */
function getMimeType(format: BatchExportFormat): string {
  switch (format) {
    case 'json': return 'application/json'
    case 'csv': return 'text/csv'
    case 'markdown': return 'text/markdown'
    case 'html': return 'text/html'
    case 'zip': return 'application/zip'
    default: return 'text/plain'
  }
}

/**
 * Escape CSV field.
 */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Escape HTML.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Download batch export files.
 */
export function downloadBatchExport(result: BatchExportResult): void {
  if (result.files.length === 1) {
    // Single file - download directly
    const file = result.files[0]!
    downloadFile(file.content, file.filename, file.mimeType)
  } else {
    // Multiple files - download each
    for (const file of result.files) {
      downloadFile(file.content, file.filename, file.mimeType)
    }
  }
}

/**
 * Download a single file.
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
