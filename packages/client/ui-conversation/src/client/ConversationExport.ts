/**
 * Conversation export service for Idexal Agents.
 * Supports exporting conversations to PDF, Markdown, and JSON formats.
 */

export interface ExportOptions {
  /** Export format: 'pdf', 'markdown', or 'json' */
  format: 'pdf' | 'markdown' | 'json'
  /** Whether to include file attachments */
  includeAttachments: boolean
  /** Whether to include metadata (timestamps, model info, etc.) */
  includeMetadata: boolean
  /** Custom filename (without extension) */
  filename?: string
  /** Date range filter */
  dateRange?: { from: Date; to: Date }
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  metadata?: Record<string, unknown>
}

export interface Attachment {
  id: string
  filename: string
  type: string
  size: number
  url?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, unknown>
}

/**
 * Export a conversation to the specified format.
 * @param conversation - The conversation to export
 * @param options - Export configuration options
 * @returns The exported content as a string (for Markdown/JSON) or Blob (for PDF)
 */
export async function exportConversation(
  conversation: Conversation,
  options: ExportOptions
): Promise<string | Blob> {
  const { format } = options

  switch (format) {
    case 'json':
      return exportToJson(conversation, options)
    case 'markdown':
      return exportToMarkdown(conversation, options)
    case 'pdf':
      return exportToPdf(conversation, options)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Export conversation to JSON format.
 */
function exportToJson(conversation: Conversation, options: ExportOptions): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: filterMessages(conversation.messages, options).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        ...(options.includeAttachments && msg.attachments ? { attachments: msg.attachments } : {}),
        ...(options.includeMetadata && msg.metadata ? { metadata: msg.metadata } : {}),
      })),
      ...(options.includeMetadata && conversation.metadata ? { metadata: conversation.metadata } : {}),
    },
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Export conversation to Markdown format.
 */
function exportToMarkdown(conversation: Conversation, options: ExportOptions): string {
  const lines: string[] = []
  const filteredMessages = filterMessages(conversation.messages, options)

  // Header
  lines.push(`# ${conversation.title}`)
  lines.push('')

  if (options.includeMetadata) {
    lines.push(`**Created:** ${conversation.createdAt.toLocaleDateString()}`)
    lines.push(`**Last Updated:** ${conversation.updatedAt.toLocaleDateString()}`)
    lines.push(`**Messages:** ${filteredMessages.length}`)
    lines.push('')
  }

  lines.push('---')
  lines.push('')

  // Messages
  for (const msg of filteredMessages) {
    const roleLabel = msg.role === 'user' ? '👤 User' : msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'
    lines.push(`### ${roleLabel}`)
    lines.push('')

    if (options.includeMetadata) {
      lines.push(`*${msg.timestamp.toLocaleString()}*`)
      lines.push('')
    }

    lines.push(msg.content)
    lines.push('')

    if (options.includeAttachments && msg.attachments && msg.attachments.length > 0) {
      lines.push('**Attachments:**')
      for (const att of msg.attachments) {
        lines.push(`- ${att.filename} (${formatFileSize(att.size)})`)
      }
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Export conversation to PDF format (returns HTML that can be converted to PDF).
 */
async function exportToPdf(conversation: Conversation, options: ExportOptions): Promise<Blob> {
  const filteredMessages = filterMessages(conversation.messages, options)

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(conversation.title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0A1628; border-bottom: 2px solid #0066FF; padding-bottom: 10px; }
    .message { margin: 20px 0; padding: 15px; border-radius: 8px; background: #f5f5f5; }
    .message.user { background: #e3f2fd; }
    .message.assistant { background: #f3e5f5; }
    .message.system { background: #fff3e0; }
    .role { font-weight: bold; margin-bottom: 5px; }
    .timestamp { color: #666; font-size: 0.85em; }
    .content { white-space: pre-wrap; }
    .attachment { color: #666; font-size: 0.9em; margin-top: 10px; }
    .metadata { color: #888; font-size: 0.85em; margin-top: 5px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(conversation.title)}</h1>
  ${options.includeMetadata ? `
  <div class="metadata">
    <p>Created: ${conversation.createdAt.toLocaleDateString()}</p>
    <p>Last Updated: ${conversation.updatedAt.toLocaleDateString()}</p>
    <p>Messages: ${filteredMessages.length}</p>
  </div>
  ` : ''}
  ${filteredMessages.map(msg => `
  <div class="message ${msg.role}">
    <div class="role">${msg.role === 'user' ? '👤 User' : msg.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'}</div>
    ${options.includeMetadata ? `<div class="timestamp">${msg.timestamp.toLocaleString()}</div>` : ''}
    <div class="content">${escapeHtml(msg.content)}</div>
    ${options.includeAttachments && msg.attachments && msg.attachments.length > 0 ? `
    <div class="attachment">
      Attachments: ${msg.attachments.map(a => `${a.filename} (${formatFileSize(a.size)})`).join(', ')}
    </div>
    ` : ''}
  </div>
  `).join('')}
</body>
</html>
  `

  // Return HTML as Blob for PDF conversion
  return new Blob([html], { type: 'text/html' })
}

/**
 * Filter messages based on date range options.
 */
function filterMessages(messages: Message[], options: ExportOptions): Message[] {
  if (!options.dateRange) return messages

  const { from, to } = options.dateRange
  return messages.filter(msg => {
    const date = msg.timestamp
    return date >= from && date <= to
  })
}

/**
 * Download a file with the specified content and filename.
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Get the MIME type for an export format.
 */
export function getMimeType(format: 'pdf' | 'markdown' | 'json'): string {
  switch (format) {
    case 'json':
      return 'application/json'
    case 'markdown':
      return 'text/markdown'
    case 'pdf':
      return 'text/html' // HTML that can be converted to PDF
    default:
      return 'text/plain'
  }
}

/**
 * Get the file extension for an export format.
 */
export function getFileExtension(format: 'pdf' | 'markdown' | 'json'): string {
  switch (format) {
    case 'json':
      return '.json'
    case 'markdown':
      return '.md'
    case 'pdf':
      return '.html'
    default:
      return '.txt'
  }
}

/**
 * Format file size for display.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
