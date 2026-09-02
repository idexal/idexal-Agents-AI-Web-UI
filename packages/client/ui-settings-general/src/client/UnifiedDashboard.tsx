/**
 * Unified Dashboard for Idexal Agents.
 * Combines all AI engines into a single interactive view with
 * category tabs, engine status cards, and aggregate metrics.
 */
import { useCallback, useMemo, useState } from 'react'

/** Engine status */
type EngineStatus = 'active' | 'idle' | 'error' | 'disabled'

/** Engine category */
type EngineCategory =
  | 'ai-core'
  | 'security'
  | 'testing'
  | 'analysis'
  | 'performance'
  | 'documentation'
  | 'migration'
  | 'search'
  | 'collaboration'
  | 'productivity'
  | 'offline'
  | 'ui'
  | 'notifications'
  | 'database'
  | 'export'
  | 'ai-generation'
  | 'plugin'
  | 'fallback'
  | 'architecture'

/** Engine metadata */
interface Engine {
  id: string
  name: string
  category: EngineCategory
  icon: string
  description: string
  status: EngineStatus
  version: string
  metrics?: { requests: number; successRate: number; avgLatency: number }
}

/** Dashboard metrics */
interface DashboardMetrics {
  totalEngines: number
  activeEngines: number
  totalRequests: number
  avgSuccessRate: number
  avgLatency: number
  uptime: string
}

const CATEGORY_INFO: Record<EngineCategory, { label: string; icon: string }> = {
  'ai-core': { label: 'AI Core', icon: '🧠' },
  'security': { label: 'Security', icon: '🛡️' },
  'testing': { label: 'Testing', icon: '🧪' },
  'analysis': { label: 'Code Analysis', icon: '📊' },
  'performance': { label: 'Performance', icon: '⚡' },
  'documentation': { label: 'Documentation', icon: '📚' },
  'migration': { label: 'Migration', icon: '🔄' },
  'search': { label: 'Search', icon: '🔍' },
  'collaboration': { label: 'Collaboration', icon: '👥' },
  'productivity': { label: 'Productivity', icon: '📈' },
  'offline': { label: 'Offline & Sync', icon: '📡' },
  'ui': { label: 'UI & Customization', icon: '🎨' },
  'notifications': { label: 'Notifications', icon: '🔔' },
  'database': { label: 'Database', icon: '🗄️' },
  'export': { label: 'Export & Import', icon: '📤' },
  'ai-generation': { label: 'AI Generation', icon: '🤖' },
  'plugin': { label: 'Plugin System', icon: '🧩' },
  'fallback': { label: 'Fallback & Recovery', icon: '🔄' },
  'architecture': { label: 'Architecture', icon: '🏗️' },
}

const ALL_ENGINES: Engine[] = [
  { id: 'smart-completion', name: 'Smart Completion', category: 'ai-core', icon: '🧠', description: 'AI-powered code completion', status: 'idle', version: '2.0', metrics: { requests: 0, successRate: 98, avgLatency: 45 } },
  { id: 'smart-completion-v2', name: 'Smart Completion V2', category: 'ai-core', icon: '🧠', description: 'Enhanced completion with context', status: 'idle', version: '2.1', metrics: { requests: 0, successRate: 99, avgLatency: 38 } },
  { id: 'code-quality', name: 'Code Quality', category: 'ai-core', icon: '🧠', description: 'Real-time code quality scoring', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 95, avgLatency: 120 } },
  { id: 'code-metrics', name: 'Code Metrics', category: 'ai-core', icon: '🧠', description: 'Comprehensive code metrics dashboard', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 80 } },
  { id: 'security-auditor', name: 'Security Auditor', category: 'security', icon: '🛡️', description: 'OWASP Top 10 security audit', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 97, avgLatency: 200 } },
  { id: 'security-scanner', name: 'Security Scanner', category: 'security', icon: '🛡️', description: 'Vulnerability scanning engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 96, avgLatency: 150 } },
  { id: 'vulnerability-scanner', name: 'Vulnerability Scanner', category: 'security', icon: '🛡️', description: 'CVE database dependency scanner', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 94, avgLatency: 300 } },
  { id: 'security-scanner-advanced', name: 'Security Scanner Advanced', category: 'security', icon: '🛡️', description: 'Advanced threat detection', status: 'idle', version: '1.1', metrics: { requests: 0, successRate: 93, avgLatency: 250 } },
  { id: 'auto-test', name: 'Auto Test', category: 'testing', icon: '🧪', description: 'Automated test generation', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 88, avgLatency: 500 } },
  { id: 'testing-framework', name: 'Testing Framework', category: 'testing', icon: '🧪', description: 'Smart test framework integration', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 92, avgLatency: 180 } },
  { id: 'coverage-optimizer', name: 'Coverage Optimizer', category: 'testing', icon: '🧪', description: 'Test coverage optimization', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 90, avgLatency: 220 } },
  { id: 'code-review', name: 'Code Review', category: 'analysis', icon: '📊', description: 'AI-powered code review', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 96, avgLatency: 350 } },
  { id: 'code-review-bot', name: 'Code Review Bot', category: 'analysis', icon: '📊', description: 'Automated code review bot', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 94, avgLatency: 400 } },
  { id: 'code-smell', name: 'Code Smell Detector', category: 'analysis', icon: '📊', description: 'Code smell detection engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 97, avgLatency: 90 } },
  { id: 'complexity-heatmap', name: 'Complexity Heatmap', category: 'analysis', icon: '📊', description: 'Line-by-line complexity visualization', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 60 } },
  { id: 'dependency-graph', name: 'Dependency Graph', category: 'analysis', icon: '📊', description: 'Module dependency visualization', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 100 } },
  { id: 'code-heatmap', name: 'Code Heatmap', category: 'analysis', icon: '📊', description: 'Code activity heatmap', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 50 } },
  { id: 'performance-dashboard', name: 'Performance Dashboard', category: 'performance', icon: '⚡', description: 'Performance metrics dashboard', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 70 } },
  { id: 'performance-profiler', name: 'Performance Profiler', category: 'performance', icon: '⚡', description: 'Code performance profiling', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 95, avgLatency: 400 } },
  { id: 'performance-prediction', name: 'Performance Prediction', category: 'performance', icon: '⚡', description: 'Predict performance impact', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 85, avgLatency: 300 } },
  { id: 'regression-detector', name: 'Regression Detector', category: 'performance', icon: '⚡', description: 'Performance regression detection', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 92, avgLatency: 180 } },
  { id: 'smart-caching', name: 'Smart Caching', category: 'performance', icon: '⚡', description: 'Intelligent caching engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 99, avgLatency: 10 } },
  { id: 'auto-doc', name: 'Auto Documentation', category: 'documentation', icon: '📚', description: 'Automatic documentation generation', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 90, avgLatency: 600 } },
  { id: 'doc-generator', name: 'Doc Generator', category: 'documentation', icon: '📚', description: 'API documentation generator', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 92, avgLatency: 500 } },
  { id: 'doc-writer', name: 'Doc Writer', category: 'documentation', icon: '📚', description: 'Smart documentation writer', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 88, avgLatency: 700 } },
  { id: 'api-doc', name: 'API Documentation', category: 'documentation', icon: '📚', description: 'API documentation tool', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 94, avgLatency: 400 } },
  { id: 'code-migration', name: 'Code Migration', category: 'migration', icon: '🔄', description: 'Code migration engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 85, avgLatency: 800 } },
  { id: 'migration-planner', name: 'Migration Planner', category: 'migration', icon: '🔄', description: 'Migration planning tool', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 90, avgLatency: 300 } },
  { id: 'intelligent-refactoring', name: 'Intelligent Refactoring', category: 'migration', icon: '🔄', description: 'Smart refactoring engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 92, avgLatency: 250 } },
  { id: 'refactoring-assistant', name: 'Refactoring Assistant', category: 'migration', icon: '🔄', description: 'Interactive refactoring guide', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 95, avgLatency: 200 } },
  { id: 'advanced-search', name: 'Advanced Search', category: 'search', icon: '🔍', description: 'Multi-criteria code search', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 98, avgLatency: 150 } },
  { id: 'context-aware-search', name: 'Context-Aware Search', category: 'search', icon: '🔍', description: 'Contextual search engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 96, avgLatency: 200 } },
  { id: 'advanced-search-engine', name: 'Advanced Search Engine', category: 'search', icon: '🔍', description: 'Full-text search engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 97, avgLatency: 120 } },
  { id: 'realtime-search', name: 'Realtime Search', category: 'search', icon: '🔍', description: 'Live search indexing', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 99, avgLatency: 30 } },
  { id: 'realtime-collaboration', name: 'Realtime Collaboration', category: 'collaboration', icon: '👥', description: 'Real-time collaboration engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 94, avgLatency: 80 } },
  { id: 'collaboration-engine', name: 'Collaboration Engine', category: 'collaboration', icon: '👥', description: 'Team collaboration tools', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 93, avgLatency: 100 } },
  { id: 'review-chat', name: 'Review Chat', category: 'collaboration', icon: '👥', description: 'Code review chat', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 96, avgLatency: 60 } },
  { id: 'productivity-tracker', name: 'Productivity Tracker', category: 'productivity', icon: '📈', description: 'Developer productivity analytics', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 50 } },
  { id: 'focus-mode', name: 'Focus Mode', category: 'productivity', icon: '📈', description: 'Distraction-free coding', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 5 } },
  { id: 'workflow-automation', name: 'Workflow Automation', category: 'productivity', icon: '📈', description: 'Automated workflows', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 92, avgLatency: 200 } },
  { id: 'quick-actions', name: 'Quick Actions', category: 'productivity', icon: '📈', description: 'Quick action shortcuts', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 10 } },
  { id: 'offline-storage', name: 'Offline Storage', category: 'offline', icon: '📡', description: 'Offline data persistence', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 99, avgLatency: 20 } },
  { id: 'sync-manager', name: 'Sync Manager', category: 'offline', icon: '📡', description: 'Data synchronization engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 95, avgLatency: 150 } },
  { id: 'realtime-sync', name: 'Real-time Sync', category: 'offline', icon: '📡', description: 'WebSocket cross-device sync with OT', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 99, avgLatency: 20 } },
  { id: 'offline-indicator', name: 'Offline Indicator', category: 'offline', icon: '📡', description: 'Connection status display', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 5 } },
  { id: 'custom-theme', name: 'Custom Theme', category: 'ui', icon: '🎨', description: 'Custom theme builder', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 10 } },
  { id: 'animated-transitions', name: 'Animated Transitions', category: 'ui', icon: '🎨', description: 'Smooth UI transitions', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 16 } },
  { id: 'micro-interactions', name: 'Micro Interactions', category: 'ui', icon: '🎨', description: 'Interactive UI feedback', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 8 } },
  { id: 'accessibility', name: 'Accessibility', category: 'ui', icon: '🎨', description: 'WCAG accessibility features', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 15 } },
  { id: 'smart-notifications', name: 'Smart Notifications', category: 'notifications', icon: '🔔', description: 'Intelligent notification system', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 98, avgLatency: 30 } },
  { id: 'notification-manager', name: 'Notification Manager', category: 'notifications', icon: '🔔', description: 'Notification queue manager', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 99, avgLatency: 20 } },
  { id: 'schema-analyzer', name: 'Schema Analyzer', category: 'database', icon: '🗄️', description: 'Database schema analysis', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 95, avgLatency: 200 } },
  { id: 'conversation-export', name: 'Conversation Export', category: 'export', icon: '📤', description: 'Export conversations', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 100 } },
  { id: 'batch-export', name: 'Batch Export', category: 'export', icon: '📤', description: 'Bulk export tool', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 98, avgLatency: 500 } },
  { id: 'pdf-export', name: 'PDF Export', category: 'export', icon: '📤', description: 'PDF generation engine', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 96, avgLatency: 800 } },
  { id: 'settings-export', name: 'Settings Export', category: 'export', icon: '📤', description: 'Export/import settings', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 50 } },
  { id: 'code-generation', name: 'Code Generation', category: 'ai-generation', icon: '🤖', description: 'AI code generation', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 90, avgLatency: 600 } },
  { id: 'code-translator', name: 'Code Translator', category: 'ai-generation', icon: '🤖', description: 'Multi-language translation', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 88, avgLatency: 500 } },
  { id: 'smart-debugger', name: 'Smart Debugger', category: 'ai-generation', icon: '🤖', description: 'Intelligent debugging', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 92, avgLatency: 300 } },
  { id: 'error-recovery', name: 'Error Recovery', category: 'ai-generation', icon: '🤖', description: 'Automatic error recovery', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 85, avgLatency: 400 } },
  { id: 'error-analytics', name: 'Error Analytics', category: 'ai-generation', icon: '🤖', description: 'Error pattern analysis', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 95, avgLatency: 150 } },
  { id: 'pattern-library', name: 'Pattern Library', category: 'ai-generation', icon: '🤖', description: 'Code pattern detection', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 97, avgLatency: 100 } },
  { id: 'snippet-manager', name: 'Snippet Manager', category: 'ai-generation', icon: '🤖', description: 'Code snippet storage', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 20 } },
  { id: 'plugin-system', name: 'Plugin System', category: 'plugin', icon: '🧩', description: 'Plugin management', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 100, avgLatency: 15 } },
  { id: 'auto-resume', name: 'Auto Resume', category: 'fallback', icon: '🔄', description: 'Session auto-resume', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 98, avgLatency: 100 } },
  { id: 'fallback-system', name: 'Fallback System', category: 'fallback', icon: '🔄', description: 'Model/provider fallback', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 96, avgLatency: 200 } },
  { id: 'enhanced-auto-resume', name: 'Enhanced Auto Resume', category: 'fallback', icon: '🔄', description: 'Smart session recovery', status: 'idle', version: '1.1', metrics: { requests: 0, successRate: 99, avgLatency: 80 } },
  { id: 'enhanced-fallback', name: 'Enhanced Fallback', category: 'fallback', icon: '🔄', description: 'Advanced provider fallback', status: 'idle', version: '1.1', metrics: { requests: 0, successRate: 97, avgLatency: 150 } },
  { id: 'architecture-analyzer', name: 'Architecture Analyzer', category: 'architecture', icon: '🏗️', description: 'Code architecture analysis', status: 'idle', version: '1.0', metrics: { requests: 0, successRate: 93, avgLatency: 350 } },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UnifiedDashboard() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [engines, setEngines] = useState<Engine[]>(ALL_ENGINES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEngine, setSelectedEngine] = useState<Engine | null>(null)

  const categories = useMemo(() => {
    const cats = new Map<string, number>()
    for (const e of engines) {
      cats.set(e.category, (cats.get(e.category) ?? 0) + 1)
    }
    return [...cats.entries()].sort((a, b) => b[1] - a[1])
  }, [engines])

  const filteredEngines = useMemo(() => {
    let list = engines
    if (activeCategory !== 'all') {
      list = list.filter(e => e.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      )
    }
    return list
  }, [engines, activeCategory, searchQuery])

  const metrics = useMemo<DashboardMetrics>(() => {
    const active = engines.filter(e => e.status === 'active')
    const withMetrics = engines.filter(e => e.metrics)
    const totalReqs = withMetrics.reduce((s, e) => s + (e.metrics?.requests ?? 0), 0)
    const avgSuccess = withMetrics.length > 0
      ? withMetrics.reduce((s, e) => s + (e.metrics?.successRate ?? 0), 0) / withMetrics.length
      : 0
    const avgLatency = withMetrics.length > 0
      ? withMetrics.reduce((s, e) => s + (e.metrics?.avgLatency ?? 0), 0) / withMetrics.length
      : 0

    return {
      totalEngines: engines.length,
      activeEngines: active.length,
      totalRequests: totalReqs,
      avgSuccessRate: Math.round(avgSuccess * 10) / 10,
      avgLatency: Math.round(avgLatency),
      uptime: '99.9%',
    }
  }, [engines])

  const toggleEngine = useCallback((id: string) => {
    setEngines(prev => prev.map(e =>
      e.id === id
        ? { ...e, status: e.status === 'active' ? 'idle' : 'active' }
        : e
    ))
  }, [])

  const enableAll = useCallback(() => {
    setEngines(prev => prev.map(e => ({ ...e, status: 'active' as EngineStatus })))
  }, [])

  const disableAll = useCallback(() => {
    setEngines(prev => prev.map(e => ({ ...e, status: 'idle' as EngineStatus })))
  }, [])

  return (
    <div style={{ padding: 4 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Unified Dashboard</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>
          All AI engines in one view — monitor, configure, and control every capability
        </p>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <MetricCard label="Total Engines" value={metrics.totalEngines} icon="🔧" />
        <MetricCard label="Active" value={metrics.activeEngines} icon="✅" color="#22c55e" />
        <MetricCard label="Avg Success" value={`${metrics.avgSuccessRate}%`} icon="📈" color="#3b82f6" />
        <MetricCard label="Avg Latency" value={`${metrics.avgLatency}ms`} icon="⚡" color="#f59e0b" />
      </div>

      {/* Search + Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search engines..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 6,
            border: '1px solid var(--border, #333)', background: 'var(--bg-secondary, #1a1a2e)',
            color: 'inherit', fontSize: 13,
          }}
        />
        <button
          type="button"
          onClick={enableAll}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #22c55e', background: '#22c55e20', color: '#22c55e', fontSize: 12, cursor: 'pointer' }}
        >
          Enable All
        </button>
        <button
          type="button"
          onClick={disableAll}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ef4444', background: '#ef444420', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}
        >
          Disable All
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${activeCategory === 'all' ? '#3b82f6' : '#444'}`,
            background: activeCategory === 'all' ? '#3b82f620' : 'transparent',
            color: activeCategory === 'all' ? '#3b82f6' : 'inherit',
          }}
        >
          All ({engines.length})
        </button>
        {categories.map(([cat, count]) => {
          const info = CATEGORY_INFO[cat as EngineCategory]
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${activeCategory === cat ? '#3b82f6' : '#444'}`,
                background: activeCategory === cat ? '#3b82f620' : 'transparent',
                color: activeCategory === cat ? '#3b82f6' : 'inherit',
              }}
            >
              {info?.icon} {info?.label ?? cat} ({count})
            </button>
          )
        })}
      </div>

      {/* Engine List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
        {filteredEngines.map(engine => (
          <div
            key={engine.id}
            onClick={() => setSelectedEngine(selectedEngine?.id === engine.id ? null : engine)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              borderRadius: 8, border: '1px solid #333', background: '#111',
              cursor: 'pointer', transition: 'border-color 0.15s',
              borderColor: selectedEngine?.id === engine.id ? '#3b82f6' : '#333',
            }}
          >
            <span style={{ fontSize: 20 }}>{engine.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{engine.name}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{engine.description}</div>
            </div>
            <span style={{ fontSize: 11, opacity: 0.5, whiteSpace: 'nowrap' }}>
              {CATEGORY_INFO[engine.category]?.icon} {CATEGORY_INFO[engine.category]?.label}
            </span>
            <span style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 10,
              background: engine.status === 'active' ? '#22c55e30' : '#333',
              color: engine.status === 'active' ? '#22c55e' : '#888',
            }}>
              {engine.status === 'active' ? '● Active' : '○ Idle'}
            </span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleEngine(engine.id) }}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: engine.status === 'active' ? '#22c55e' : '#555',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: engine.status === 'active' ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
              }} />
            </button>
          </div>
        ))}
      </div>

      {/* Selected Engine Details */}
      {selectedEngine && (
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 10,
          border: '1px solid #3b82f6', background: '#0a1628',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{selectedEngine.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedEngine.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{selectedEngine.description}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.5 }}>v{selectedEngine.version}</span>
          </div>
          {selectedEngine.metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#3b82f6' }}>{selectedEngine.metrics.requests}</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>Requests</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#22c55e' }}>{selectedEngine.metrics.successRate}%</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>Success Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#f59e0b' }}>{selectedEngine.metrics.avgLatency}ms</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>Avg Latency</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, fontSize: 11, opacity: 0.5, textAlign: 'center' }}>
        {filteredEngines.length} engines • {engines.filter(e => e.status === 'active').length} active • Changes apply immediately
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metric card sub-component
// ---------------------------------------------------------------------------

function MetricCard({ label, value, icon, color }: {
  label: string
  value: string | number
  icon: string
  color?: string
}) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      border: `1px solid ${color ?? '#333'}30`, background: `${color ?? '#333'}10`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color ?? 'inherit' }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>{label}</div>
    </div>
  )
}
