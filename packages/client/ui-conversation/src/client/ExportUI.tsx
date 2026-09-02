/**
 * Export UI component for Idexal Agents.
 * Provides interface for exporting conversations to PDF, Markdown, and JSON.
 */

import { useState, useCallback } from 'react'
import {
  exportConversation,
  downloadFile,
  getMimeType,
  getFileExtension,
  type ExportOptions,
  type Conversation,
} from './ConversationExport'

interface ExportUIProps {
  /** The conversation to export */
  conversation: Conversation
  /** Callback when export is complete */
  onExportComplete?: (format: string) => void
  /** Close callback for modal */
  onClose?: () => void
  /** Show as modal */
  isModal?: boolean
}

export function ExportUI({
  conversation,
  onExportComplete,
  onClose,
  isModal = true,
}: ExportUIProps) {
  const [format, setFormat] = useState<'pdf' | 'markdown' | 'json'>('markdown')
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [customFilename, setCustomFilename] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)

  // Generate default filename
  const getDefaultFilename = useCallback(() => {
    const title = conversation.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
    const date = new Date().toISOString().split('T')[0]
    return `${title}_${date}`
  }, [conversation.title])

  // Handle export
  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportComplete(false)

    try {
      const options: ExportOptions = {
        format,
        includeAttachments,
        includeMetadata,
        filename: customFilename || getDefaultFilename(),
      }

      const result = await exportConversation(conversation, options)
      const filename = `${options.filename}${getFileExtension(format)}`
      const mimeType = getMimeType(format)

      downloadFile(result, filename, mimeType)

      setExportComplete(true)
      onExportComplete?.(format)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }, [conversation, format, includeAttachments, includeMetadata, customFilename, getDefaultFilename, onExportComplete])

  // Preview content
  const handlePreview = useCallback(async () => {
    try {
      const options: ExportOptions = {
        format: 'markdown',
        includeAttachments: false,
        includeMetadata: true,
      }

      const result = await exportConversation(conversation, options)
      setPreviewContent(result as string)
    } catch (error) {
      console.error('Preview failed:', error)
    }
  }, [conversation])

  // Get format description
  const getFormatDescription = (fmt: string) => {
    switch (fmt) {
      case 'pdf':
        return 'Printable document (HTML format)'
      case 'markdown':
        return 'Markdown text file (.md)'
      case 'json':
        return 'Structured data format (.json)'
      default:
        return ''
    }
  }

  // Get format icon
  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case 'pdf':
        return '📄'
      case 'markdown':
        return '📝'
      case 'json':
        return '📊'
      default:
        return '📁'
    }
  }

  const content = (
    <div className="export-ui">
      {/* Header */}
      <div className="export-header">
        <h3>📤 Export Conversation</h3>
        {isModal && onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      {/* Conversation Info */}
      <div className="conversation-info">
        <div className="info-row">
          <span className="label">Title:</span>
          <span className="value">{conversation.title}</span>
        </div>
        <div className="info-row">
          <span className="label">Messages:</span>
          <span className="value">{conversation.messages.length}</span>
        </div>
        <div className="info-row">
          <span className="label">Created:</span>
          <span className="value">{conversation.createdAt.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Format Selection */}
      <div className="format-selection">
        <label className="section-label">Export Format</label>
        <div className="format-options">
          {(['markdown', 'json', 'pdf'] as const).map((fmt) => (
            <div
              key={fmt}
              className={`format-option ${format === fmt ? 'selected' : ''}`}
              onClick={() => setFormat(fmt)}
            >
              <span className="format-icon">{getFormatIcon(fmt)}</span>
              <span className="format-name">{fmt.toUpperCase()}</span>
              <span className="format-desc">{getFormatDescription(fmt)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="export-options">
        <label className="section-label">Options</label>

        <div className="option-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
            />
            <span>Include metadata (timestamps, message count)</span>
          </label>
        </div>

        <div className="option-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeAttachments}
              onChange={(e) => setIncludeAttachments(e.target.checked)}
            />
            <span>Include file attachments</span>
          </label>
        </div>

        <div className="option-row">
          <label className="input-label">Custom filename (optional):</label>
          <input
            type="text"
            placeholder={getDefaultFilename()}
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            className="filename-input"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="preview-section">
        <button
          className="preview-btn"
          onClick={handlePreview}
        >
          👁️ Preview Export
        </button>

        {previewContent && (
          <div className="preview-content">
            <div className="preview-header">
              <span>Preview (Markdown)</span>
              <button onClick={() => setPreviewContent(null)}>✕</button>
            </div>
            <pre className="preview-text">{previewContent.substring(0, 1000)}{previewContent.length > 1000 ? '...' : ''}</pre>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="export-actions">
        {isModal && onClose && (
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        )}

        <button
          className="export-btn primary"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <span className="spinner"></span>
              Exporting...
            </>
          ) : exportComplete ? (
            <>✓ Export Complete!</>
          ) : (
            <>📤 Export {format.toUpperCase()}</>
          )}
        </button>
      </div>

      <style>{`
        .export-ui {
          padding: 24px;
          background: var(--bg-primary, #ffffff);
          border-radius: 12px;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
          max-width: 480px;
        }

        .export-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .export-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-primary, #1a1a1a);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--text-secondary, #666);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: var(--hover-bg, #f5f5f5);
        }

        .conversation-info {
          padding: 12px 16px;
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }

        .info-row .label {
          color: var(--text-secondary, #666);
          font-size: 0.875rem;
        }

        .info-row .value {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .section-label {
          display: block;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 12px;
        }

        .format-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .format-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 2px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .format-option:hover {
          border-color: var(--primary-color, #2563eb);
          background: var(--hover-bg, #f8f9fa);
        }

        .format-option.selected {
          border-color: var(--primary-color, #2563eb);
          background: var(--selected-bg, #eff6ff);
        }

        .format-icon {
          font-size: 1.5rem;
        }

        .format-name {
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          min-width: 60px;
        }

        .format-desc {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
        }

        .export-options {
          margin-bottom: 20px;
        }

        .option-row {
          margin-bottom: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
        }

        .input-label {
          display: block;
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
          margin-bottom: 6px;
        }

        .filename-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .filename-input:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
        }

        .preview-section {
          margin-bottom: 20px;
        }

        .preview-btn {
          padding: 8px 16px;
          background: var(--bg-secondary, #f5f5f5);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .preview-btn:hover {
          background: var(--hover-bg, #e5e5e5);
        }

        .preview-content {
          margin-top: 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          overflow: hidden;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-secondary, #f8f9fa);
          font-size: 0.8125rem;
          color: var(--text-secondary, #666);
        }

        .preview-header button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #666);
        }

        .preview-text {
          padding: 12px;
          margin: 0;
          font-size: 0.8125rem;
          max-height: 200px;
          overflow-y: auto;
          background: var(--bg-primary, #ffffff);
        }

        .export-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .cancel-btn {
          padding: 10px 20px;
          background: none;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          cursor: pointer;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: var(--primary-color, #2563eb);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .export-btn:hover:not(:disabled) {
          background: var(--primary-hover, #1d4ed8);
        }

        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-color-scheme: dark) {
          .export-ui {
            --bg-primary: #1a1a1a;
            --bg-secondary: #252525;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --border-color: #333333;
            --hover-bg: #2a2a2a;
            --selected-bg: #1e3a5f;
          }
        }
      `}</style>
    </div>
  )

  if (isModal) {
    return (
      <div className="export-modal-overlay" onClick={onClose}>
        <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
        <style>{`
          .export-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .export-modal-content {
            background: var(--bg-primary, #ffffff);
            border-radius: 12px;
            max-height: 90vh;
            overflow-y: auto;
          }
        `}</style>
      </div>
    )
  }

  return content
}

export default ExportUI
