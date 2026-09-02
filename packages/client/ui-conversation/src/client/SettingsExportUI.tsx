/**
 * Settings Export/Import UI for Idexal Agents.
 * Provides a tabbed interface for exporting and importing all user settings.
 */

import { useState, useCallback, useRef } from 'react'
import {
  exportSettings,
  importSettings,
  downloadSettings,
  readFileAsText,
  getSettingsSummary,
  SETTINGS_EXPORT_TRANSLATIONS,
  type SettingsExportResult,
  type SettingsImportResult,
  type SettingsExportLanguage,
} from './SettingsExport.ts'

type Language = SettingsExportLanguage

export interface SettingsExportUIProps {
  language?: Language
  onExport?: (result: SettingsExportResult) => void
  onImport?: (result: SettingsImportResult) => void
  className?: string
}

export function SettingsExportUI({
  language = 'en',
  onExport,
  onImport,
  className = '',
}: SettingsExportUIProps) {
  const t = SETTINGS_EXPORT_TRANSLATIONS[language]
  const isRTL = language === 'ar'

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [importResult, setImportResult] = useState<SettingsImportResult | null>(null)
  const [importPreview, setImportPreview] = useState<string | null>(null)
  const [importFileName, setImportFileName] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const summary = getSettingsSummary()

  const handleExport = useCallback(() => {
    try {
      const result = exportSettings()
      if (result.totalSettings === 0) {
        setErrorMsg(t.noSettings)
        setSuccessMsg('')
        return
      }
      downloadSettings(result)
      setSuccessMsg(t.success)
      setErrorMsg('')
      onExport?.(result)
    } catch {
      setErrorMsg(t.error)
      setSuccessMsg('')
    }
  }, [t, onExport])

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setIsImporting(true)
      setErrorMsg('')
      setSuccessMsg('')
      setImportFileName(file.name)

      try {
        const content = await readFileAsText(file)
        setImportPreview(content)

        // Validate JSON
        const parsed = JSON.parse(content)
        if (!parsed.meta || !parsed.settings) {
          setErrorMsg(t.error)
          setImportPreview(null)
        }
      } catch {
        setErrorMsg(t.error)
        setImportPreview(null)
      } finally {
        setIsImporting(false)
      }
    },
    [t]
  )

  const handleImport = useCallback(() => {
    if (!importPreview) return

    if (!window.confirm(t.confirmImport)) return

    try {
      const result = importSettings(importPreview)
      setImportResult(result)
      onImport?.(result)

      if (result.success) {
        setSuccessMsg(t.imported.replace('{count}', String(result.imported)))
        setErrorMsg('')
        if (result.warnings.length > 0) {
          setErrorMsg(result.warnings.join('; '))
        }
      } else {
        setErrorMsg(t.error)
        setSuccessMsg('')
      }
    } catch {
      setErrorMsg(t.error)
      setSuccessMsg('')
    }
  }, [importPreview, t, onImport])

  const handleClearAll = useCallback(() => {
    if (!window.confirm(t.confirmClear)) return
    const cleared = importSettings(JSON.stringify({
      meta: { version: 1, timestamp: '', app: '', totalSettings: 0, categories: [] },
      settings: {
        theme: {}, accessibility: {}, keyboardShortcuts: {},
        locale: {}, conversation: {}, onboarding: {},
        workspace: {}, trajectory: {}, custom: {},
      },
    }))
    setSuccessMsg(`Cleared ${cleared.imported} settings`)
    setErrorMsg('')
  }, [t])

  const formatPreviewJson = (json: string): string => {
    try {
      const parsed = JSON.parse(json)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return json
    }
  }

  return (
    <div className={`settings-export-panel ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="export-title">{t.title}</h2>

      {/* Tabs */}
      <div className="export-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'export'}
          className={`export-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          {t.exportTab}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'import'}
          className={`export-tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          {t.importTab}
        </button>
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="export-content" role="tabpanel">
          <p className="export-desc">{t.exportDesc}</p>

          {/* Summary */}
          <div className="export-summary">
            <div className="summary-total">
              {t.totalSettings.replace('{count}', String(summary.total))}
            </div>
            <div className="summary-categories">
              {Object.entries(summary.byCategory).map(([category, count]) => (
                <div key={category} className="category-item">
                  <span className="category-name">
                    {t.categories[category as keyof typeof t.categories] ?? category}
                  </span>
                  <span className="category-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="export-btn primary"
            onClick={handleExport}
            disabled={summary.total === 0}
          >
            {t.exportButton}
          </button>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="export-content" role="tabpanel">
          <p className="export-desc">{t.importDesc}</p>

          <div className="import-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="file-input"
              aria-label={t.chooseFile}
            />
            <button
              className="import-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 {t.chooseFile}
            </button>

            {importFileName && (
              <span className="file-name">{importFileName}</span>
            )}
          </div>

          {/* Import Preview */}
          {importPreview && (
            <div className="import-preview">
              <h4>{t.preview}</h4>
              <pre className="preview-json">
                {formatPreviewJson(importPreview).slice(0, 2000)}
                {importPreview.length > 2000 && '\n... (truncated)'}
              </pre>
              <button
                className="export-btn primary"
                onClick={handleImport}
                disabled={isImporting}
              >
                {t.importButton}
              </button>
            </div>
          )}

          {/* Import Result */}
          {importResult && importResult.success && (
            <div className="import-result success">
              <div className="result-stat">
                ✅ {t.imported.replace('{count}', String(importResult.imported))}
              </div>
              {importResult.skipped > 0 && (
                <div className="result-stat">
                  ⏭️ {t.skipped.replace('{count}', String(importResult.skipped))}
                </div>
              )}
              {importResult.warnings.length > 0 && (
                <div className="result-warnings">
                  <strong>{t.warnings}:</strong>
                  <ul>
                    {importResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {successMsg && (
        <div className="export-message success" role="status">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="export-message error" role="alert">
          ❌ {errorMsg}
        </div>
      )}

      {/* Danger Zone */}
      <div className="danger-zone">
        <button
          className="export-btn danger"
          onClick={handleClearAll}
        >
          {t.clearAll}
        </button>
      </div>

      <style>{`
        .settings-export-panel {
          max-width: 640px;
          margin: 0 auto;
          padding: 24px;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
          color: var(--text-primary, #1a1a1a);
        }

        .export-title {
          margin: 0 0 24px;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .export-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .export-tab {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          transition: all 0.15s;
        }

        .export-tab:hover {
          color: var(--text-primary, #1a1a1a);
        }

        .export-tab.active {
          color: var(--accent-color, #3b82f6);
          border-bottom-color: var(--accent-color, #3b82f6);
        }

        .export-content {
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 12px;
          padding: 20px;
        }

        .export-desc {
          margin: 0 0 16px;
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
        }

        .export-summary {
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .summary-total {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .summary-categories {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 8px;
        }

        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: var(--bg-secondary, #f3f4f6);
          border-radius: 6px;
          font-size: 0.8125rem;
        }

        .category-name {
          color: var(--text-primary, #1a1a1a);
        }

        .category-count {
          font-weight: 600;
          color: var(--accent-color, #3b82f6);
        }

        .import-area {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .file-input {
          display: none;
        }

        .import-btn {
          padding: 8px 16px;
          background: var(--bg-primary, #ffffff);
          border: 1px dashed var(--border-color, #d1d5db);
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .import-btn:hover {
          border-color: var(--accent-color, #3b82f6);
          background: var(--accent-light, #eff6ff);
        }

        .file-name {
          font-size: 0.8125rem;
          color: var(--text-secondary, #666);
        }

        .import-preview {
          margin-top: 16px;
        }

        .import-preview h4 {
          margin: 0 0 8px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .preview-json {
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          padding: 12px;
          font-family: 'SF Mono', Monaco, Consolas, monospace;
          font-size: 0.75rem;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 12px;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .import-result {
          margin-top: 16px;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .import-result.success {
          background: var(--success-bg, #ecfdf5);
          border: 1px solid var(--success-border, #a7f3d0);
          color: var(--success-color, #065f46);
        }

        .result-stat {
          margin-bottom: 4px;
        }

        .result-warnings {
          margin-top: 8px;
          font-size: 0.8125rem;
        }

        .result-warnings ul {
          margin: 4px 0 0 16px;
        }

        .export-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }

        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .export-btn.primary {
          background: var(--accent-color, #3b82f6);
          color: white;
        }

        .export-btn.primary:hover:not(:disabled) {
          background: var(--accent-hover, #2563eb);
        }

        .export-btn.danger {
          background: transparent;
          border-color: var(--danger-color, #ef4444);
          color: var(--danger-color, #ef4444);
        }

        .export-btn.danger:hover {
          background: var(--danger-bg, #fef2f2);
        }

        .export-message {
          margin-top: 16px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .export-message.success {
          background: var(--success-bg, #ecfdf5);
          color: var(--success-color, #065f46);
        }

        .export-message.error {
          background: var(--danger-bg, #fef2f2);
          color: var(--danger-color, #991b1b);
        }

        .danger-zone {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }
      `}</style>
    </div>
  )
}

export default SettingsExportUI
