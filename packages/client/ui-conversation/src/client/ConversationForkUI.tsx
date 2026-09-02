/**
 * Conversation Fork UI for Idexal Agents.
 * Interface for forking conversations.
 */

import React, { useState, useMemo } from 'react'
import type { ForkableConversation, ForkOptions, ForkResult } from './ConversationFork.ts'
import { forkConversation, getForkPointSuggestions, formatForkResult } from './ConversationFork.ts'

/** Labels */
const FORK_UI_LABELS = {
  en: {
    title: 'Fork Conversation',
    selectForkPoint: 'Select Fork Point',
    forkToEnd: 'Fork to End',
    customForkPoint: 'Custom Fork Point',
    messageIndex: 'Message Index',
    options: 'Options',
    newTitle: 'New Title',
    description: 'Description (optional)',
    branch: 'Branch Name (optional)',
    includeMetadata: 'Include metadata',
    includeAttachments: 'Include attachments',
    createDraft: 'Create as draft',
    preview: 'Preview',
    messagesWillBeCopied: '{count} messages will be copied',
    fork: 'Fork Conversation',
    cancel: 'Cancel',
    success: 'Conversation forked successfully!',
    failed: 'Failed to fork conversation',
    message: 'Message',
    user: 'You',
    assistant: 'Assistant',
    system: 'System',
  },
  ar: {
    title: 'تفريع المحادثة',
    selectForkPoint: 'اختر نقطة التفريع',
    forkToEnd: 'تفريع حتى النهاية',
    customForkPoint: 'نقطة تفريع مخصصة',
    messageIndex: 'فهرس الرسالة',
    options: 'الخيارات',
    newTitle: 'عنوان جديد',
    description: 'الوصف (اختياري)',
    branch: 'اسم الفرع (اختياري)',
    includeMetadata: 'تضمين البيانات الوصفية',
    includeAttachments: 'تضمين المرفقات',
    createDraft: 'إنشاء كمسودة',
    preview: 'معاينة',
    messagesWillBeCopied: 'سيتم نسخ {count} رسالة',
    fork: 'تفريع المحادثة',
    cancel: 'إلغاء',
    success: 'تم تفريع المحادثة بنجاح!',
    failed: 'فشل تفريع المحادثة',
    message: 'رسالة',
    user: 'أنت',
    assistant: 'المساعد',
    system: 'النظام',
  },
  zh: {
    title: '分叉对话',
    selectForkPoint: '选择分叉点',
    forkToEnd: '分叉到结尾',
    customForkPoint: '自定义分叉点',
    messageIndex: '消息索引',
    options: '选项',
    newTitle: '新标题',
    description: '描述（可选）',
    branch: '分支名称（可选）',
    includeMetadata: '包含元数据',
    includeAttachments: '包含附件',
    createDraft: '创建为草稿',
    preview: '预览',
    messagesWillBeCopied: '将复制 {count} 条消息',
    fork: '分叉对话',
    cancel: '取消',
    success: '对话分叉成功！',
    failed: '对话分叉失败',
    message: '消息',
    user: '你',
    assistant: '助手',
    system: '系统',
  },
}

export interface ConversationForkUIProps {
  /** Conversation to fork */
  conversation: ForkableConversation
  /** Language */
  language?: 'en' | 'ar' | 'zh'
  /** Callback when fork is complete */
  onFork?: (result: ForkResult) => void
  /** Callback when cancelled */
  onCancel?: () => void
}

/**
 * Conversation Fork UI Component.
 */
export function ConversationForkUI({
  conversation,
  language = 'en',
  onFork,
  onCancel,
}: ConversationForkUIProps) {
  const labels = FORK_UI_LABELS[language] ?? FORK_UI_LABELS.en
  const isRTL = language === 'ar'

  const [forkPoint, setForkPoint] = useState<number>(-1)
  const [newTitle, setNewTitle] = useState(`${conversation.title} (Fork)`)
  const [description, setDescription] = useState('')
  const [branch, setBranch] = useState('')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [createDraft, setCreateDraft] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const [result, setResult] = useState<ForkResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const suggestions = useMemo(
    () => getForkPointSuggestions(conversation),
    [conversation]
  )

  const effectiveForkPoint = forkPoint === -1 ? conversation.messages.length : forkPoint
  const messagesToCopy = effectiveForkPoint

  const options: ForkOptions = {
    forkPoint,
    newTitle,
    description: description || undefined,
    branch: branch || undefined,
    includeMetadata,
    includeAttachments,
    asDraft: createDraft,
  }

  const handleFork = async () => {
    setIsForking(true)
    try {
      const forkResult = forkConversation(conversation, options)
      setResult(forkResult)
      onFork?.(forkResult)
    } finally {
      setIsForking(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    background: 'var(--color-bg-primary, #ffffff)',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border, #d1d5db)',
    fontSize: '14px',
    background: 'var(--color-bg-primary, #fff)',
    color: 'var(--color-text-primary, #1f2937)',
  }

  const checkboxRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    color: 'var(--color-text-primary, #374151)',
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
    opacity: isForking ? 0.7 : 1,
  }

  const suggestionStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '12px',
    border: `1px solid ${isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-border, #e5e7eb)'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    background: isSelected ? 'var(--color-primary-light, #dbeafe)' : 'var(--color-bg-secondary, #f9fafb)',
    marginBottom: '8px',
    transition: 'all 0.2s',
  })

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>{labels.title}</h2>

      {/* Fork Point Selection */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.selectForkPoint}</div>
        
        {/* Fork to end option */}
        <div
          style={suggestionStyle(forkPoint === -1)}
          onClick={() => setForkPoint(-1)}
        >
          <div style={{ fontWeight: 500, color: 'var(--color-text-primary, #111827)' }}>
            {labels.forkToEnd}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {conversation.messages.length} {labels.message.toLowerCase()}s
          </div>
        </div>

        {/* Message suggestions */}
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {suggestions.slice(0, 10).map((suggestion) => (
            <div
              key={suggestion.index}
              style={suggestionStyle(forkPoint === suggestion.index)}
              onClick={() => setForkPoint(suggestion.index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  fontSize: '12px', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  background: suggestion.role === 'user' ? '#dbeafe' : 
                              suggestion.role === 'assistant' ? '#d1fae5' : '#fef3c7',
                  color: suggestion.role === 'user' ? '#1e40af' :
                         suggestion.role === 'assistant' ? '#065f46' : '#92400e',
                }}>
                  {labels[suggestion.role as keyof typeof labels] ?? suggestion.role}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #9ca3af)' }}>
                  #{suggestion.index + 1}
                </span>
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--color-text-primary, #374151)', 
                marginTop: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {suggestion.preview}
              </div>
            </div>
          ))}
        </div>

        {/* Custom fork point */}
        <div style={{ marginTop: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {labels.customForkPoint}
          </label>
          <input
            type="number"
            min={0}
            max={conversation.messages.length}
            value={forkPoint === -1 ? conversation.messages.length : forkPoint}
            onChange={(e) => {
              const val = Number(e.target.value)
              setForkPoint(val >= conversation.messages.length ? -1 : val)
            }}
            style={{ ...inputStyle, width: '120px' }}
          />
        </div>
      </div>

      {/* Options */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>{labels.options}</div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {labels.newTitle}
          </label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {labels.description}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {labels.branch}
          </label>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            style={inputStyle}
          />
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
            checked={createDraft}
            onChange={(e) => setCreateDraft(e.target.checked)}
          />
          <span>{labels.createDraft}</span>
        </div>
      </div>

      {/* Preview */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary, #6b7280)' }}>
            {labels.messagesWillBeCopied.replace('{count}', String(messagesToCopy))}
          </span>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid var(--color-border, #d1d5db)',
              borderRadius: '4px',
              background: 'var(--color-bg-primary, #fff)',
              cursor: 'pointer',
            }}
          >
            {labels.preview}
          </button>
        </div>

        {showPreview && (
          <div style={{ 
            maxHeight: '150px', 
            overflow: 'auto', 
            padding: '12px', 
            background: 'var(--color-bg-secondary, #f9fafb)', 
            borderRadius: '8px',
            fontSize: '12px',
          }}>
            {conversation.messages.slice(0, effectiveForkPoint).map((msg, i) => (
              <div key={i} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
                <span style={{ fontWeight: 500 }}>
                  {msg.role === 'user' ? labels.user : msg.role === 'assistant' ? labels.assistant : labels.system}:
                </span>{' '}
                <span style={{ color: 'var(--color-text-secondary, #6b7280)' }}>
                  {msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div style={{ 
          padding: '16px', 
          borderRadius: '8px',
          marginBottom: '20px',
          background: result.success ? 'var(--color-success-light, #d1fae5)' : 'var(--color-error-light, #fee2e2)',
          color: result.success ? 'var(--color-success, #10b981)' : 'var(--color-error, #ef4444)',
        }}>
          {formatForkResult(result, language)}
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
            disabled={isForking}
          >
            {labels.cancel}
          </button>
        )}
        <button
          style={{
            ...buttonStyle,
            background: 'var(--color-primary, #2563eb)',
            color: '#ffffff',
          }}
          onClick={handleFork}
          disabled={isForking || !!result?.success}
        >
          {isForking ? '...' : labels.fork}
        </button>
      </div>
    </div>
  )
}
