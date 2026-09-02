/**
 * Advanced Search UI component for Idexal Agents.
 * Provides powerful search interface with text, date, and participant filters.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  searchConversations,
  highlightMatches,
  generateSearchSuggestions,
  type SearchQuery,
  type SearchResult,
  type SearchStats,
} from './AdvancedSearch'

interface ConversationData {
  id: string
  title: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    attachments?: Array<{ type: string }>
    tags?: string[]
  }>
  createdAt: Date
  updatedAt: Date
}

interface AdvancedSearchUIProps {
  /** List of conversations to search through */
  conversations: ConversationData[]
  /** Callback when a search result is selected */
  onResultSelect?: (result: SearchResult) => void
  /** Callback to navigate to a specific conversation */
  onNavigate?: (conversationId: string, messageId?: string) => void
  /** Maximum number of results to display */
  maxResults?: number
  /** Show as modal */
  isModal?: boolean
  /** Close callback for modal */
  onClose?: () => void
}

export function AdvancedSearchUI({
  conversations,
  onResultSelect,
  onNavigate,
  maxResults = 50,
  isModal = false,
  onClose,
}: AdvancedSearchUIProps) {
  const [searchText, setSearchText] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [role, setRole] = useState<'all' | 'user' | 'assistant' | 'system'>('all')
  const [messageType, setMessageType] = useState<'all' | 'text' | 'code' | 'attachment'>('all')
  const [conversationTitle, setConversationTitle] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [stats, setStats] = useState<SearchStats | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate suggestions as user types
  useEffect(() => {
    if (searchText.length >= 2) {
      const newSuggestions = generateSearchSuggestions(conversations, searchText, 5)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchText, conversations])

  // Perform search
  const performSearch = useCallback(() => {
    setIsSearching(true)
    setShowSuggestions(false)

    const query: SearchQuery = {}
    if (searchText) query.text = searchText
    if (dateFrom || dateTo) {
      query.dateRange = {
        from: dateFrom ? new Date(dateFrom) : new Date(0),
        to: dateTo ? new Date(dateTo + 'T23:59:59') : new Date(),
      }
    }
    if (role !== 'all') query.role = role
    if (messageType !== 'all') query.messageType = messageType
    if (conversationTitle) query.conversationTitle = conversationTitle

    // Small delay to show searching state
    setTimeout(() => {
      const { results: searchResults, stats: searchStats } = searchConversations(
        conversations,
        query,
        maxResults
      )
      setResults(searchResults)
      setStats(searchStats)
      setIsSearching(false)
    }, 100)
  }, [searchText, dateFrom, dateTo, role, messageType, conversationTitle, conversations, maxResults])

  // Handle search on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Select a suggestion
  const selectSuggestion = (suggestion: string) => {
    setSearchText(suggestion)
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result)
    onResultSelect?.(result)
    onNavigate?.(result.conversation.id, result.message.id)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchText('')
    setDateFrom('')
    setDateTo('')
    setRole('all')
    setMessageType('all')
    setConversationTitle('')
    setResults([])
    setStats(null)
  }

  // Check if any filter is active
  const hasActiveFilters =
    searchText || dateFrom || dateTo || role !== 'all' || messageType !== 'all' || conversationTitle

  const content = (
    <div className="advanced-search">
      {/* Search Header */}
      <div className="search-header">
        <h3>🔍 Advanced Search</h3>
        {isModal && onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Main Search Input */}
      <div className="search-input-container">
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder="Search in conversations..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {searchText && (
          <button className="clear-input-btn" onClick={() => setSearchText('')}>
            ✕
          </button>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div ref={suggestionsRef} className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="suggestion-icon">💡</span>
                <span className="suggestion-text">{suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <div className="filter-group">
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="all">All Roles</option>
            <option value="user">👤 User</option>
            <option value="assistant">🤖 Assistant</option>
            <option value="system">⚙️ System</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value as typeof messageType)}
          >
            <option value="all">All Types</option>
            <option value="text">📝 Text</option>
            <option value="code">💻 Code</option>
            <option value="attachment">📎 Attachment</option>
          </select>
        </div>

        <button
          className={`toggle-advanced-btn ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▲ Less' : '▼ More'}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Date From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Date To:</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="filter-group">
            <label>Conversation Title:</label>
            <input
              type="text"
              placeholder="Filter by conversation title..."
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Search Actions */}
      <div className="search-actions">
        <button className="search-btn primary" onClick={performSearch} disabled={isSearching}>
          {isSearching ? (
            <>
              <span className="spinner"></span> Searching...
            </>
          ) : (
            <>🔍 Search</>
          )}
        </button>

        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* Search Stats */}
      {stats && (
        <div className="search-stats">
          <span className="stat">
            Found <strong>{stats.totalMatches}</strong> results
          </span>
          <span className="stat">
            in <strong>{stats.conversationsWithMatches}</strong> conversations
          </span>
          <span className="stat">
            ({stats.duration.toFixed(0)}ms)
          </span>
        </div>
      )}

      {/* Search Results */}
      <div className="search-results">
        {results.length > 0 ? (
          results.map((result, index) => (
            <div
              key={`${result.conversation.id}-${result.message.id}-${index}`}
              className={`search-result ${selectedResult === result ? 'selected' : ''}`}
              onClick={() => handleResultClick(result)}
            >
              <div className="result-header">
                <span className={`result-role ${result.message.role}`}>
                  {result.message.role === 'user'
                    ? '👤'
                    : result.message.role === 'assistant'
                      ? '🤖'
                      : '⚙️'}
                </span>
                <span className="result-conversation">{result.conversation.title}</span>
                <span className="result-date">
                  {result.message.timestamp.toLocaleDateString()}
                </span>
              </div>

              <div
                className="result-snippet"
                dangerouslySetInnerHTML={{
                  __html: highlightMatches(result.snippet, searchText),
                }}
              />

              <div className="result-meta">
                <span className="score-badge" title="Relevance score">
                  Score: {result.score.toFixed(1)}
                </span>
              </div>
            </div>
          ))
        ) : (
          stats &&
          !isSearching && (
            <div className="no-results">
              <p>No results found</p>
              <p className="no-results-hint">Try adjusting your search filters</p>
            </div>
          )
        )}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="search-modal-overlay" onClick={onClose}>
        <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    )
  }

  return content
}

export default AdvancedSearchUI
