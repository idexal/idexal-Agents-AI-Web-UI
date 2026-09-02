/**
 * Conversation Fork Service for Idexal Agents.
 * Create and manage editable copies of conversations.
 */

/** Original conversation interface */
export interface ForkableConversation {
  id: string
  title: string
  messages: ForkableMessage[]
  createdAt: Date
  updatedAt: Date
  metadata: Record<string, unknown> | undefined
  tags: string[] | undefined
  parentId: string | undefined
}

/** Forkable message */
export interface ForkableMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments: Array<{
    type: string
    name: string
    url: string | undefined
  }> | undefined
  metadata: Record<string, unknown> | undefined
}

/** Forked conversation */
export interface ForkedConversation extends ForkableConversation {
  /** Original conversation ID */
  originalId: string
  /** Fork point (message index) */
  forkPoint: number
  /** Fork timestamp */
  forkedAt: Date
  /** Fork description */
  forkDescription: string | undefined
  /** Whether this is the latest version */
  isLatest: boolean
  /** Version number */
  version: number
  /** Branch name */
  branch: string | undefined
}

/** Fork options */
export interface ForkOptions {
  /** Fork point message index (0-based, -1 for end) */
  forkPoint: number
  /** New title (optional) */
  newTitle: string | undefined
  /** Fork description */
  description: string | undefined
  /** Branch name */
  branch: string | undefined
  /** Include metadata */
  includeMetadata: boolean
  /** Include attachments */
  includeAttachments: boolean
  /** Create as draft */
  asDraft: boolean
}

/** Fork result */
export interface ForkResult {
  /** The forked conversation */
  conversation: ForkedConversation
  /** Number of messages copied */
  messagesCopied: number
  /** Whether fork was successful */
  success: boolean
  /** Error message if failed */
  error: string | undefined
}

/** Fork history entry */
export interface ForkHistoryEntry {
  id: string
  originalId: string
  forkedId: string
  forkPoint: number
  forkedAt: Date
  description?: string
  branch?: string
}

/** Default fork options */
export const DEFAULT_FORK_OPTIONS: ForkOptions = {
  forkPoint: -1,
  newTitle: undefined,
  description: undefined,
  branch: undefined,
  includeMetadata: true,
  includeAttachments: true,
  asDraft: false,
}

/** Labels for fork operations */
const FORK_LABELS: Record<string, Record<string, string>> = {
  en: {
    forkConversation: 'Fork Conversation',
    createCopy: 'Create Editable Copy',
    forkFrom: 'Fork from message',
    forkToEnd: 'Fork to end',
    newTitle: 'New Title',
    description: 'Description',
    branch: 'Branch Name',
    includeMetadata: 'Include metadata',
    includeAttachments: 'Include attachments',
    createDraft: 'Create as draft',
    fork: 'Fork',
    cancel: 'Cancel',
    forkSuccess: 'Conversation forked successfully',
    forkFailed: 'Failed to fork conversation',
    originalConversation: 'Original Conversation',
    forkedCopy: 'Forked Copy',
    version: 'Version {version}',
    branchName: 'Branch: {branch}',
    messagesCopied: '{count} messages copied',
  },
  ar: {
    forkConversation: 'تفريع المحادثة',
    createCopy: 'إنشاء نسخة قابلة للتعديل',
    forkFrom: 'تفريع من الرسالة',
    forkToEnd: 'تفريع حتى النهاية',
    newTitle: 'عنوان جديد',
    description: 'الوصف',
    branch: 'اسم الفرع',
    includeMetadata: 'تضمين البيانات الوصفية',
    includeAttachments: 'تضمين المرفقات',
    createDraft: 'إنشاء كمسودة',
    fork: 'تفريع',
    cancel: 'إلغاء',
    forkSuccess: 'تم تفريع المحادثة بنجاح',
    forkFailed: 'فشل تفريع المحادثة',
    originalConversation: 'المحادثة الأصلية',
    forkedCopy: 'النسخة المفرعة',
    version: 'الإصدار {version}',
    branchName: 'الفرع: {branch}',
    messagesCopied: 'تم نسخ {count} رسالة',
  },
  zh: {
    forkConversation: '分叉对话',
    createCopy: '创建可编辑副本',
    forkFrom: '从消息分叉',
    forkToEnd: '分叉到结尾',
    newTitle: '新标题',
    description: '描述',
    branch: '分支名称',
    includeMetadata: '包含元数据',
    includeAttachments: '包含附件',
    createDraft: '创建为草稿',
    fork: '分叉',
    cancel: '取消',
    forkSuccess: '对话分叉成功',
    forkFailed: '对话分叉失败',
    originalConversation: '原始对话',
    forkedCopy: '分叉副本',
    version: '版本 {version}',
    branchName: '分支: {branch}',
    messagesCopied: '已复制 {count} 条消息',
  },
}

/**
 * Fork a conversation.
 */
export function forkConversation(
  original: ForkableConversation,
  options: ForkOptions = DEFAULT_FORK_OPTIONS
): ForkResult {
  try {
    const forkPoint = options.forkPoint === -1 
      ? original.messages.length 
      : Math.min(options.forkPoint, original.messages.length)

    // Copy messages up to fork point
    const copiedMessages: ForkableMessage[] = original.messages.slice(0, forkPoint).map(msg => ({
      id: generateId(),
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      attachments: options.includeAttachments && msg.attachments 
        ? [...msg.attachments] 
        : undefined,
      metadata: msg.metadata ? { ...msg.metadata } : undefined,
    }))

    // Create forked conversation
    const forked: ForkedConversation = {
      id: generateId(),
      title: options.newTitle ?? `${original.title} (Fork)`,
      messages: copiedMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
      originalId: original.id,
      forkPoint,
      forkedAt: new Date(),
      forkDescription: options.description,
      isLatest: true,
      version: 1,
      branch: options.branch,
      metadata: options.includeMetadata ? { ...original.metadata } : undefined,
      tags: original.tags ? [...original.tags] : undefined,
      parentId: original.id,
    }

    return {
      conversation: forked,
      messagesCopied: copiedMessages.length,
      success: true,
      error: undefined,
    }
  } catch (error) {
    return {
      conversation: null as unknown as ForkedConversation,
      messagesCopied: 0,
      success: false,
      error: String(error),
    }
  }
}

/**
 * Create a new version of a forked conversation.
 */
export function createForkVersion(
  forked: ForkedConversation,
  updates: Partial<Pick<ForkedConversation, 'title' | 'messages' | 'tags' | 'metadata'>>
): ForkedConversation {
  return {
    ...forked,
    ...updates,
    updatedAt: new Date(),
    version: forked.version + 1,
    isLatest: true,
    messages: updates.messages ?? forked.messages,
  }
}

/**
 * Compare two conversations.
 */
export function compareConversations(
  original: ForkableConversation,
  forked: ForkedConversation
): {
  messagesAdded: number
  messagesRemoved: number
  messagesModified: number
  identical: boolean
} {
  const originalMessages = original.messages.slice(0, forked.forkPoint)
  const forkedMessages = forked.messages

  let messagesAdded = 0
  let messagesRemoved = 0
  let messagesModified = 0

  // Compare messages
  const maxLen = Math.max(originalMessages.length, forkedMessages.length)
  
  for (let i = 0; i < maxLen; i++) {
    const orig = originalMessages[i]
    const fork = forkedMessages[i]

    if (!orig && fork) {
      messagesAdded++
    } else if (orig && !fork) {
      messagesRemoved++
    } else if (orig && fork && orig.content !== fork.content) {
      messagesModified++
    }
  }

  return {
    messagesAdded,
    messagesRemoved,
    messagesModified,
    identical: messagesAdded === 0 && messagesRemoved === 0 && messagesModified === 0,
  }
}

/**
 * Get fork point suggestions.
 */
export function getForkPointSuggestions(
  conversation: ForkableConversation
): Array<{ index: number; preview: string; role: string }> {
  const suggestions: Array<{ index: number; preview: string; role: string }> = []
  
  // Add suggestions at key points
  const messageCount = conversation.messages.length
  
  // Suggest at conversation turns (every user message)
  conversation.messages.forEach((msg, index) => {
    if (msg.role === 'user' || index === messageCount - 1) {
      suggestions.push({
        index,
        preview: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        role: msg.role,
      })
    }
  })

  return suggestions
}

/**
 * Merge fork back to original (conceptual).
 */
export function prepareMerge(
  original: ForkableConversation,
  forked: ForkedConversation
): {
  changes: Array<{
    type: 'add' | 'remove' | 'modify'
    index: number
    content?: string
  }>
  conflicts: Array<{
    index: number
    original: string
    forked: string
  }>
} {
  const changes: Array<{ type: 'add' | 'remove' | 'modify'; index: number; content?: string }> = []
  const conflicts: Array<{ index: number; original: string; forked: string }> = []

  // Messages after fork point in forked that don't exist in original
  const forkedAfterFork = forked.messages.slice(forked.forkPoint)
  const originalAfterFork = original.messages.slice(forked.forkPoint)

  // Check for modifications
  const maxLen = Math.max(forkedAfterFork.length, originalAfterFork.length)
  
  for (let i = 0; i < maxLen; i++) {
    const forkMsg = forkedAfterFork[i]
    const origMsg = originalAfterFork[i]

    if (!origMsg && forkMsg) {
      changes.push({
        type: 'add',
        index: forked.forkPoint + i,
        content: forkMsg.content,
      })
    } else if (origMsg && !forkMsg) {
      changes.push({
        type: 'remove',
        index: forked.forkPoint + i,
      })
    } else if (origMsg && forkMsg && origMsg.content !== forkMsg.content) {
      // Check if original has also changed
      if (original.messages.length > forked.forkPoint + i) {
        conflicts.push({
          index: forked.forkPoint + i,
          original: origMsg.content,
          forked: forkMsg.content,
        })
      } else {
        changes.push({
          type: 'modify',
          index: forked.forkPoint + i,
          content: forkMsg.content,
        })
      }
    }
  }

  return { changes, conflicts }
}

/**
 * Generate unique ID.
 */
function generateId(): string {
  return `fork-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get labels for fork operations.
 */
export function getForkLabels(language: 'en' | 'ar' | 'zh'): Record<string, string> {
  return FORK_LABELS[language] ?? FORK_LABELS.en!
}

/**
 * Format fork result for display.
 */
export function formatForkResult(
  result: ForkResult,
  language: 'en' | 'ar' | 'zh'
): string {
  const labels = getForkLabels(language)
  
  if (!result.success) {
    return `${labels['forkFailed'] ?? 'Failed'}: ${result.error}`
  }

  return `${labels['forkSuccess'] ?? 'Success'} (${(labels['messagesCopied'] ?? '{count} messages copied').replace('{count}', String(result.messagesCopied))})`
}
