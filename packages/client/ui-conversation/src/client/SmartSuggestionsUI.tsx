/**
 * Smart Suggestions UI for Idexal Agents Chat Input.
 * Displays AI-powered suggestions with beautiful animations and multi-language support.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  SmartSuggestionsEngine,
  getSmartSuggestionsEngine,
  getSuggestionTypeColor,
  type SmartSuggestion,
  type SuggestionType,
} from './SmartSuggestions.ts'

/** Language type */
type Language = 'en' | 'ar' | 'zh'

/** Translations */
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    suggestions: 'Suggestions',
    noSuggestions: 'No suggestions available',
    loading: 'Generating suggestions...',
    select: 'Select',
    dismiss: 'Dismiss',
    showMore: 'Show more',
    showLess: 'Show less',
    completion: 'Complete your thought',
    followUp: 'Follow-up question',
    related: 'Related topic',
    action: 'Quick action',
    template: 'Prompt template',
    correction: 'Spelling correction',
    enhancement: 'Enhance input',
    quickReply: 'Quick reply',
    highPriority: 'High priority',
    mediumPriority: 'Medium priority',
    lowPriority: 'Low priority',
    confidence: 'Confidence',
    smartSuggestions: 'Smart Suggestions',
    poweredBy: 'Powered by AI',
    enableSuggestions: 'Enable suggestions',
    disableSuggestions: 'Disable suggestions',
  },
  ar: {
    suggestions: '\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a',
    noSuggestions: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a',
    loading: '\u062c\u0627\u0631\u064a \u062a\u0648\u0644\u064a\u062f \u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a...',
    select: '\u0627\u062e\u062a\u064a\u0627\u0631',
    dismiss: '\u062a\u062c\u0627\u0647\u0644',
    showMore: '\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064a\u062f',
    showLess: '\u0639\u0631\u0636 \u0627\u0644\u0642\u0644',
    completion: '\u0623\u0643\u0645\u0644 \u0641\u0643\u0631\u062a\u0643',
    followUp: '\u0633\u0624\u0627\u0644 \u0645\u062a\u0627\u0628\u0639\u0629',
    related: '\u0645\u0648\u0636\u0648\u0639 \u0645\u062a\u0639\u0644\u0642',
    action: '\u0625\u062c\u0631\u0627\u0621 \u0633\u0631\u064a\u0639',
    template: '\u0642\u0627\u0644\u0628 \u0627\u0633\u062a\u0639\u0644\u0627\u0645',
    correction: '\u062a\u0635\u062d\u064a\u062d \u0625\u0645\u0644\u0627\u0626\u064a',
    enhancement: '\u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0645\u062f\u062e\u0644\u0627\u062a',
    quickReply: '\u0631\u062f \u0633\u0631\u064a\u0639',
    highPriority: '\u0623\u0648\u0644\u0648\u064a\u0629 \u0639\u0627\u0644\u064a\u0629',
    mediumPriority: '\u0623\u0648\u0644\u0648\u064a\u0629 \u0645\u062a\u0648\u0633\u0637\u0629',
    lowPriority: '\u0623\u0648\u0644\u0648\u064a\u0629 \u0645\u0646\u062e\u0641\u0636\u0629',
    confidence: '\u0627\u0644\u062b\u0642\u0629',
    smartSuggestions: '\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a \u0630\u0643\u064a\u0629',
    poweredBy: '\u0645\u062f\u0639\u0648\u0645 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
    enableSuggestions: '\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a',
    disableSuggestions: '\u062a\u0639\u0637\u064a\u0644 \u0627\u0644\u0627\u0642\u062a\u0631\u0627\u062d\u0627\u062a',
  },
  zh: {
    suggestions: '\u5efa\u8bae',
    noSuggestions: '\u6682\u65e0\u5efa\u8bae',
    loading: '\u6b63\u5728\u751f\u6210\u5efa\u8bae...',
    select: '\u9009\u62e9',
    dismiss: '\u5ffd\u7565',
    showMore: '\u663e\u793a\u66f4\u591a',
    showLess: '\u663e\u793a\u66f4\u5c11',
    completion: '\u5b8c\u6210\u4f60\u7684\u60f3\u6cd5',
    followUp: '\u540e\u7eed\u95ee\u9898',
    related: '\u76f8\u5173\u8bdd\u9898',
    action: '\u5feb\u901f\u64cd\u4f5c',
    template: '\u63d0\u793a\u6a21\u677f',
    correction: '\u62fc\u5199\u7ea0\u6b63',
    enhancement: '\u589e\u5f3a\u8f93\u5165',
    quickReply: '\u5feb\u901f\u56de\u590d',
    highPriority: '\u9ad8\u4f18\u5148\u7ea7',
    mediumPriority: '\u4e2d\u4f18\u5148\u7ea7',
    lowPriority: '\u4f4e\u4f18\u5148\u7ea7',
    confidence: '\u7f6e\u4fe1\u5ea6',
    smartSuggestions: '\u667a\u80fd\u5efa\u8bae',
    poweredBy: 'AI \u9a71\u52a8',
    enableSuggestions: '\u542f\u7528\u5efa\u8bae',
    disableSuggestions: '\u7981\u7528\u5efa\u8bae',
  },
}

/** Smart Suggestions UI Props */
export interface SmartSuggestionsUIProps {
  inputText: string
  onSuggestionSelect: (text: string) => void
  language?: Language
  maxSuggestions?: number
  showTypeFilter?: boolean
  showSettings?: boolean
  compact?: boolean
  position?: 'top' | 'bottom'
  className?: string
}

/**
 * Smart Suggestions UI Component.
 */
export function SmartSuggestionsUI({
  inputText,
  onSuggestionSelect,
  language = 'en',
  maxSuggestions = 6,
  showTypeFilter = true,
  showSettings = true,
  compact = false,
  position = 'top',
  className = '',
}: SmartSuggestionsUIProps) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en
  const isRTL = language === 'ar'

  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [activeFilter, setActiveFilter] = useState<SuggestionType | 'all'>('all')
  const [showAll, setShowAll] = useState(false)

  const engineRef = useRef<SmartSuggestionsEngine | null>(null)

  useEffect(() => {
    engineRef.current = getSmartSuggestionsEngine({
      maxSuggestions,
      onSuggestionsGenerated: (newSuggestions) => {
        setSuggestions(newSuggestions)
        setIsLoading(false)
      },
    })

    return () => {
      engineRef.current?.destroy()
    }
  }, [maxSuggestions])

  useEffect(() => {
    if (enabled && engineRef.current) {
      setIsLoading(true)
      engineRef.current.updateInput(inputText)
    }
  }, [inputText, enabled])

  const handleSelect = useCallback((suggestion: SmartSuggestion) => {
    onSuggestionSelect(suggestion.text)
    engineRef.current?.selectSuggestion(suggestion.id)
  }, [onSuggestionSelect])

  const handleDismiss = useCallback(() => {
    engineRef.current?.clearSuggestions()
    setSuggestions([])
  }, [])

  const filteredSuggestions = activeFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.type === activeFilter)

  const displayedSuggestions = showAll
    ? filteredSuggestions
    : filteredSuggestions.slice(0, 3)

  const suggestionTypes: { type: SuggestionType; label: string }[] = [
    { type: 'completion', label: 'C' },
    { type: 'follow-up', label: 'F' },
    { type: 'template', label: 'T' },
    { type: 'correction', label: 'X' },
    { type: 'action', label: 'A' },
  ]

  if (!enabled || (displayedSuggestions.length === 0 && !isLoading)) {
    return null
  }

  return (
    <div
      className={`smart-suggestions ${position} ${compact ? 'compact' : ''} ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="suggestions-header">
        <div className="header-left">
          <span className="header-title">{t.smartSuggestions}</span>
          <span className="header-badge">AI</span>
        </div>
        {showSettings && (
          <button
            className="settings-btn"
            onClick={() => setEnabled(!enabled)}
            title={enabled ? t.disableSuggestions : t.enableSuggestions}
          >
            {enabled ? '||' : '>'}
          </button>
        )}
      </div>

      {/* Type Filter */}
      {showTypeFilter && suggestions.length > 0 && (
        <div className="type-filter">
          <button
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          {suggestionTypes.map(({ type, label }) => (
            <button
              key={type}
              className={`filter-btn ${activeFilter === type ? 'active' : ''}`}
              onClick={() => setActiveFilter(type)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>{t.loading}</span>
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && displayedSuggestions.length > 0 && (
        <div className="suggestions-list">
          {displayedSuggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              language={language}
              onSelect={handleSelect}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayedSuggestions.length === 0 && inputText.length > 0 && (
        <div className="empty-state">
          <span>{t.noSuggestions}</span>
        </div>
      )}

      {/* Show More/Less */}
      {filteredSuggestions.length > 3 && (
        <button
          className="show-more-btn"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? t.showLess : t.showMore}
          <span className="count">
            ({showAll ? filteredSuggestions.length : filteredSuggestions.length - 3})
          </span>
        </button>
      )}

      {/* Footer */}
      <div className="suggestions-footer">
        <span className="powered-by">{t.poweredBy}</span>
        <button className="dismiss-btn" onClick={handleDismiss}>
          {t.dismiss}
        </button>
      </div>

      <style>{`
        .smart-suggestions {
          position: absolute;
          left: 0;
          right: 0;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 400px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
        }

        .smart-suggestions.top {
          bottom: 100%;
          margin-bottom: 8px;
        }

        .smart-suggestions.bottom {
          top: 100%;
          margin-top: 8px;
        }

        .smart-suggestions.compact {
          max-height: 250px;
        }

        .suggestions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-light, #f3f4f6);
          background: var(--bg-secondary, #f9fafb);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }

        .header-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .settings-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.2s;
          font-size: 14px;
        }

        .settings-btn:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        .type-filter {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-light, #f3f4f6);
          overflow-x: auto;
        }

        .filter-btn {
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 500;
          background: none;
          border: 1px solid var(--border-primary, #e5e7eb);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .filter-btn:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        .filter-btn.active {
          background: var(--color-primary, #3b82f6);
          border-color: var(--color-primary, #3b82f6);
          color: white;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          color: var(--text-secondary, #6b7280);
          font-size: 13px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-primary, #e5e7eb);
          border-top-color: var(--color-primary, #3b82f6);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .suggestions-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }

        .suggestion-item:hover {
          background: var(--bg-hover, #f3f4f6);
          border-color: var(--border-primary, #e5e7eb);
        }

        .suggestion-item.compact {
          padding: 8px 10px;
          gap: 10px;
        }

        .suggestion-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }

        .suggestion-item.compact .suggestion-icon {
          width: 28px;
          height: 28px;
          font-size: 11px;
        }

        .suggestion-content {
          flex: 1;
          min-width: 0;
        }

        .suggestion-text {
          font-size: 13px;
          color: var(--text-primary, #111827);
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .suggestion-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .suggestion-type {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
        }

        .suggestion-confidence {
          font-size: 10px;
          padding: 1px 6px;
          background: var(--bg-secondary, #f3f4f6);
          border-radius: 10px;
          color: var(--text-secondary, #6b7280);
        }

        .suggestion-priority {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 10px;
        }

        .suggestion-priority.high {
          background: #fef2f2;
          color: #dc2626;
        }

        .suggestion-priority.medium {
          background: #fef3c7;
          color: #d97706;
        }

        .suggestion-priority.low {
          background: #f0fdf4;
          color: #16a34a;
        }

        .suggestion-actions {
          flex-shrink: 0;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .suggestion-item:hover .suggestion-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 500;
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .action-btn:hover {
          background: var(--color-primary-hover, #2563eb);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px;
          color: var(--text-secondary, #6b7280);
          font-size: 13px;
        }

        .show-more-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px;
          background: none;
          border: none;
          border-top: 1px solid var(--border-light, #f3f4f6);
          font-size: 12px;
          color: var(--color-primary, #3b82f6);
          cursor: pointer;
          transition: background 0.15s;
        }

        .show-more-btn:hover {
          background: var(--bg-hover, #f3f4f6);
        }

        .show-more-btn .count {
          color: var(--text-secondary, #9ca3af);
        }

        .suggestions-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          border-top: 1px solid var(--border-light, #f3f4f6);
          background: var(--bg-secondary, #f9fafb);
        }

        .powered-by {
          font-size: 10px;
          color: var(--text-secondary, #9ca3af);
        }

        .dismiss-btn {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .dismiss-btn:hover {
          background: var(--bg-hover, #f3f4f6);
        }
      `}</style>
    </div>
  )
}

/** Suggestion Item Props */
interface SuggestionItemProps {
  suggestion: SmartSuggestion
  language: Language
  onSelect: (suggestion: SmartSuggestion) => void
  compact: boolean
}

/**
 * Individual Suggestion Item Component.
 */
function SuggestionItem({
  suggestion,
  language,
  onSelect,
  compact,
}: SuggestionItemProps) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en

  const typeLabels: Record<string, string> = {
    completion: t.completion ?? '',
    'follow-up': t.followUp ?? '',
    related: t.related ?? '',
    action: t.action ?? '',
    template: t.template ?? '',
    correction: t.correction ?? '',
    enhancement: t.enhancement ?? '',
    'quick-reply': t.quickReply ?? '',
  }

  const priorityLabels: Record<string, string> = {
    high: t.highPriority ?? '',
    medium: t.mediumPriority ?? '',
    low: t.lowPriority ?? '',
  }

  const typeShortLabels: Record<string, string> = {
    completion: 'C',
    'follow-up': 'F',
    related: 'R',
    action: 'A',
    template: 'T',
    correction: 'X',
    enhancement: 'E',
    'quick-reply': 'Q',
  }

  return (
    <div
      className={`suggestion-item ${compact ? 'compact' : ''}`}
      onClick={() => onSelect(suggestion)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(suggestion)
        }
      }}
    >
      <div
        className="suggestion-icon"
        style={{
          background: getSuggestionTypeColor(suggestion.type),
        }}
      >
        {typeShortLabels[suggestion.type] || '?'}
      </div>

      <div className="suggestion-content">
        <div className="suggestion-text">{suggestion.text}</div>
        <div className="suggestion-meta">
          <span className="suggestion-type">{typeLabels[suggestion.type] ?? 'Unknown'}</span>
          <span className="suggestion-confidence">
            {Math.round(suggestion.confidence * 100)}%
          </span>
          <span className={`suggestion-priority ${suggestion.priority}`}>
            {priorityLabels[suggestion.priority] ?? ''}
          </span>
        </div>
      </div>

      <div className="suggestion-actions">
        <button
          className="action-btn"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(suggestion)
          }}
        >
          {t.select}
        </button>
      </div>
    </div>
  )
}

export default SmartSuggestionsUI
