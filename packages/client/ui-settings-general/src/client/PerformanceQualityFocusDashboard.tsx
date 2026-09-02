/**
 * Performance, Quality & Focus Dashboard for Idexal Agents.
 * Combines performance metrics, code quality scoring, and focus mode
 * into a single unified view with real-time data visualization.
 */
import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'performance' | 'quality' | 'focus'

interface PerformanceMetric {
  label: string
  value: number
  unit: string
  target: number
  trend: 'up' | 'down' | 'stable'
  icon: string
  color: string
}

interface QualityMetric {
  label: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  details: string[]
  icon: string
  color: string
}

interface FocusSession {
  id: string
  date: string
  startTime: string
  duration: number
  quality: number
  classification: string
  interruptions: number
  filesEdited: number
}

interface FocusStats {
  totalSessions: number
  totalMinutes: number
  avgQuality: number
  deepFocusMinutes: number
  currentStreak: number
  bestStreak: number
  todayMinutes: number
}

// ---------------------------------------------------------------------------
// Mock data generators
// ---------------------------------------------------------------------------

function getPerformanceMetrics(): PerformanceMetric[] {
  return [
    { label: 'Build Time', value: 12.3, unit: 's', target: 10, trend: 'down', icon: '🔨', color: '#3b82f6' },
    { label: 'Bundle Size', value: 405, unit: 'KB', target: 350, trend: 'down', icon: '📦', color: '#8b5cf6' },
    { label: 'LCP', value: 1.8, unit: 's', target: 2.5, trend: 'down', icon: '⚡', color: '#22c55e' },
    { label: 'TTI', value: 2.1, unit: 's', target: 3.0, trend: 'stable', icon: '🎯', color: '#f59e0b' },
    { label: 'Memory', value: 82, unit: 'MB', target: 100, trend: 'up', icon: '💾', color: '#ef4444' },
    { label: 'FPS', value: 58, unit: 'fps', target: 60, trend: 'stable', icon: '🖥️', color: '#06b6d4' },
    { label: 'API Latency', value: 145, unit: 'ms', target: 200, trend: 'down', icon: '🌐', color: '#10b981' },
    { label: 'Error Rate', value: 0.3, unit: '%', target: 1.0, trend: 'down', icon: '🐛', color: '#ec4899' },
  ]
}

function getQualityMetrics(): QualityMetric[] {
  return [
    {
      label: 'Type Safety',
      score: 96,
      grade: 'A',
      details: ['strict: true', 'no implicit any', '0 errors'],
      icon: '🔒',
      color: '#22c55e',
    },
    {
      label: 'Test Coverage',
      score: 82,
      grade: 'B',
      details: ['82% line coverage', '78% branch coverage', '91% function coverage'],
      icon: '🧪',
      color: '#3b82f6',
    },
    {
      label: 'Documentation',
      score: 88,
      grade: 'A',
      details: ['92% public API documented', '85% modules documented', '100% exports JSDoc'],
      icon: '📚',
      color: '#8b5cf6',
    },
    {
      label: 'Code Smells',
      score: 74,
      grade: 'C',
      details: ['12 long functions', '8 magic numbers', '3 empty catch blocks'],
      icon: '🔍',
      color: '#f59e0b',
    },
    {
      label: 'Complexity',
      score: 85,
      grade: 'B',
      details: ['Avg cyclomatic: 6.2', 'Max cognitive: 18', '0 god objects'],
      icon: '🧩',
      color: '#06b6d4',
    },
    {
      label: 'Duplication',
      score: 91,
      grade: 'A',
      details: ['3.2% duplicate ratio', '18 duplicate blocks', 'DRY principle maintained'],
      icon: '📋',
      color: '#10b981',
    },
    {
      label: 'Dependencies',
      score: 79,
      grade: 'B',
      details: ['0 known vulnerabilities', '3 outdated packages', '0 circular deps'],
      icon: '🔗',
      color: '#ec4899',
    },
    {
      label: 'Accessibility',
      score: 87,
      grade: 'A',
      details: ['WCAG 2.1 AA compliant', '95% ARIA labels', 'Keyboard navigable'],
      icon: '♿',
      color: '#a855f7',
    },
  ]
}

function getFocusSessions(): FocusSession[] {
  const sessions: FocusSession[] = []
  const now = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStr = d.toISOString().slice(0, 10)
    const count = Math.floor(Math.random() * 4) + 1
    for (let j = 0; j < count; j++) {
      const hour = 9 + Math.floor(Math.random() * 8)
      const dur = 25 + Math.floor(Math.random() * 65)
      const quality = 50 + Math.floor(Math.random() * 50)
      sessions.push({
        id: `fs-${i}-${j}`,
        date: dayStr,
        startTime: `${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        duration: dur,
        quality,
        classification: dur >= 60 && quality >= 80 ? 'deep-focus'
          : quality >= 65 ? 'productive'
          : quality >= 45 ? 'moderate'
          : 'distracted',
        interruptions: Math.floor(Math.random() * 6),
        filesEdited: 1 + Math.floor(Math.random() * 8),
      })
    }
  }
  return sessions
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PerformanceQualityFocusDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('performance')
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')

  const perfMetrics = useMemo(() => getPerformanceMetrics(), [])
  const qualityMetrics = useMemo(() => getQualityMetrics(), [])
  const focusSessions = useMemo(() => getFocusSessions(), [])

  const focusStats = useMemo<FocusStats>(() => {
    const thisWeek = focusSessions.filter(s => {
      const d = new Date(s.date)
      const now = new Date()
      return now.getTime() - d.getTime() < 7 * 86400000
    })
    return {
      totalSessions: thisWeek.length,
      totalMinutes: thisWeek.reduce((s, f) => s + f.duration, 0),
      avgQuality: thisWeek.length > 0 ? Math.round(thisWeek.reduce((s, f) => s + f.quality, 0) / thisWeek.length) : 0,
      deepFocusMinutes: thisWeek.filter(f => f.classification === 'deep-focus').reduce((s, f) => s + f.duration, 0),
      currentStreak: calculateStreak(focusSessions),
      bestStreak: calculateBestStreak(focusSessions),
      todayMinutes: focusSessions.filter(s => s.date === new Date().toISOString().slice(0, 10)).reduce((s, f) => s + f.duration, 0),
    }
  }, [focusSessions])

  const overallQualityScore = useMemo(() => {
    return Math.round(qualityMetrics.reduce((s, m) => s + m.score, 0) / qualityMetrics.length)
  }, [qualityMetrics])

  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'quality', label: 'Code Quality', icon: '🛡️' },
    { id: 'focus', label: 'Focus Mode', icon: '🎯' },
  ]

  return (
    <div style={{ padding: 4 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Performance, Quality & Focus</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>
          Unified view of performance metrics, code quality, and developer focus
        </p>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <OverviewCard icon="⚡" label="Performance" value={`${Math.round(perfMetrics.filter(m => m.value <= m.target).length / perfMetrics.length * 100)}%`} color="#3b82f6" subtitle="metrics on target" />
        <OverviewCard icon="🛡️" label="Quality Score" value={`${overallQualityScore}`} color="#22c55e" subtitle={`Grade ${scoreToGrade(overallQualityScore)}`} />
        <OverviewCard icon="🎯" label="Focus Today" value={`${focusStats.todayMinutes}m`} color="#f59e0b" subtitle={`${focusStats.currentStreak} day streak`} />
        <OverviewCard icon="🔥" label="Deep Focus" value={`${focusStats.deepFocusMinutes}m`} color="#ef4444" subtitle="this week" />
      </div>

      {/* Time Range Selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['today', 'week', 'month'] as const).map(range => (
          <button
            key={range}
            type="button"
            onClick={() => setTimeRange(range)}
            style={{
              padding: '4px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
              border: `1px solid ${timeRange === range ? '#3b82f6' : '#444'}`,
              background: timeRange === range ? '#3b82f620' : 'transparent',
              color: timeRange === range ? '#3b82f6' : 'inherit',
            }}
          >
            {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${activeTab === tab.id ? '#3b82f6' : '#333'}`,
              background: activeTab === tab.id ? '#3b82f620' : '#111',
              color: activeTab === tab.id ? '#3b82f6' : 'inherit',
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'performance' && (
        <PerformanceTab metrics={perfMetrics} />
      )}
      {activeTab === 'quality' && (
        <QualityTab metrics={qualityMetrics} overallScore={overallQualityScore} />
      )}
      {activeTab === 'focus' && (
        <FocusTab sessions={focusSessions} stats={focusStats} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overview Card
// ---------------------------------------------------------------------------

function OverviewCard({ icon, label, value, color, subtitle }: {
  icon: string; label: string; value: string; color: string; subtitle: string
}) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      border: `1px solid ${color}30`, background: `${color}10`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{subtitle}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Performance Tab
// ---------------------------------------------------------------------------

function PerformanceTab({ metrics }: { metrics: PerformanceMetric[] }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {metrics.map(m => {
          const ratio = m.unit === '%' || m.unit === 'fps'
            ? Math.min(1, m.value / m.target)
            : Math.min(1, m.target / m.value)
          const status = ratio >= 0.9 ? 'good' : ratio >= 0.7 ? 'warning' : 'critical'
          const statusColor = status === 'good' ? '#22c55e' : status === 'warning' ? '#f59e0b' : '#ef4444'

          return (
            <div key={m.label} style={{
              padding: '12px 14px', borderRadius: 10,
              border: '1px solid #333', background: '#111',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 10,
                  background: `${statusColor}20`, color: statusColor,
                }}>
                  {status === 'good' ? '✓ On Target' : status === 'warning' ? '⚠ Near Target' : '✕ Over Target'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: m.color }}>{m.value}</span>
                <span style={{ fontSize: 12, opacity: 0.5 }}>{m.unit}</span>
                <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 'auto' }}>
                  target: {m.target}{m.unit}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, ratio * 100)}%`,
                  background: statusColor,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, opacity: 0.5 }}>
                  {m.trend === 'up' ? '📈' : m.trend === 'down' ? '📉' : '➡️'} {m.trend}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quality Tab
// ---------------------------------------------------------------------------

function QualityTab({ metrics, overallScore }: { metrics: QualityMetric[]; overallScore: number }) {
  return (
    <div>
      {/* Overall Score Ring */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 0', marginBottom: 16,
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          border: `6px solid ${scoreColor(overallScore)}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `${scoreColor(overallScore)}10`,
        }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: scoreColor(overallScore) }}>{overallScore}</span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>Grade {scoreToGrade(overallScore)}</span>
        </div>
      </div>

      {/* Quality Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            padding: '12px 14px', borderRadius: 10,
            border: `1px solid ${m.color}30`, background: '#111',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 700, color: m.color,
                padding: '2px 8px', borderRadius: 6, background: `${m.color}20`,
              }}>
                {m.grade}
              </span>
            </div>
            {/* Score bar */}
            <div style={{ height: 6, borderRadius: 3, background: '#222', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${m.score}%`,
                background: m.color,
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>{m.score}/100</div>
            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {m.details.map((d, i) => (
                <span key={i} style={{ fontSize: 11, opacity: 0.6 }}>• {d}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Focus Tab
// ---------------------------------------------------------------------------

function FocusTab({ sessions, stats }: { sessions: FocusSession[]; stats: FocusStats }) {
  const todaySessions = sessions.filter(s => s.date === new Date().toISOString().slice(0, 10))

  return (
    <div>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <FocusStatCard icon="🎯" label="Today" value={`${stats.todayMinutes}m`} color="#3b82f6" />
        <FocusStatCard icon="🔥" label="Streak" value={`${stats.currentStreak}d`} color="#f59e0b" />
        <FocusStatCard icon="🧠" label="Deep Focus" value={`${stats.deepFocusMinutes}m`} color="#8b5cf6" />
        <FocusStatCard icon="📊" label="Avg Quality" value={`${stats.avgQuality}%`} color="#22c55e" />
      </div>

      {/* Focus Heatmap */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>Focus Heatmap (Last 14 Days)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 3 }}>
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (13 - i))
            const dateStr = d.toISOString().slice(0, 10)
            const daySessions = sessions.filter(s => s.date === dateStr)
            const totalMin = daySessions.reduce((s, f) => s + f.duration, 0)
            const intensity = Math.min(1, totalMin / 180)
            const color = totalMin === 0 ? '#1a1a2e'
              : intensity < 0.25 ? '#1e3a5f'
              : intensity < 0.5 ? '#2563eb'
              : intensity < 0.75 ? '#3b82f6'
              : '#60a5fa'
            return (
              <div
                key={i}
                title={`${dateStr}: ${totalMin} min, ${daySessions.length} sessions`}
                style={{
                  height: 28, borderRadius: 4,
                  background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, opacity: 0.8,
                  cursor: 'pointer',
                }}
              >
                {d.getDate()}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, opacity: 0.5 }}>
          <span>Less</span>
          <span style={{ display: 'flex', gap: 2 }}>
            {['#1a1a2e', '#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa'].map(c => (
              <span key={c} style={{ width: 12, height: 12, borderRadius: 2, background: c, display: 'inline-block' }} />
            ))}
          </span>
          <span>More</span>
        </div>
      </div>

      {/* Today's Sessions */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>Today's Sessions</h3>
        {todaySessions.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', opacity: 0.4, fontSize: 13 }}>No focus sessions today yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todaySessions.map(s => (
              <FocusSessionRow key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>

      {/* Classification Breakdown */}
      <div>
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>Session Classification (This Week)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['deep-focus', 'productive', 'moderate', 'distracted', 'fragmented'].map(cls => {
            const count = sessions.filter(s => s.classification === cls && isThisWeek(s.date)).length
            const total = sessions.filter(s => isThisWeek(s.date)).length
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const colors: Record<string, string> = {
              'deep-focus': '#8b5cf6', 'productive': '#22c55e', 'moderate': '#f59e0b',
              'distracted': '#ef4444', 'fragmented': '#6b7280',
            }
            const labels: Record<string, string> = {
              'deep-focus': '🧠 Deep Focus', 'productive': '✅ Productive', 'moderate': '⚡ Moderate',
              'distracted': '😵 Distracted', 'fragmented': '🔀 Fragmented',
            }
            return (
              <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, width: 120 }}>{labels[cls]}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#222', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${pct}%`, background: colors[cls],
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 11, opacity: 0.5, width: 40, textAlign: 'right' }}>{count} ({pct}%)</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FocusStatCard({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string
}) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      border: `1px solid ${color}30`, background: `${color}10`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>{label}</div>
    </div>
  )
}

function FocusSessionRow({ session }: { session: FocusSession }) {
  const classColors: Record<string, string> = {
    'deep-focus': '#8b5cf6', 'productive': '#22c55e', 'moderate': '#f59e0b',
    'distracted': '#ef4444', 'fragmented': '#6b7280',
  }
  const classLabels: Record<string, string> = {
    'deep-focus': '🧠 Deep Focus', 'productive': '✅ Productive', 'moderate': '⚡ Moderate',
    'distracted': '😵 Distracted', 'fragmented': '🔀 Fragmented',
  }
  const color = classColors[session.classification] ?? '#666'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
      borderRadius: 8, border: '1px solid #333', background: '#111',
    }}>
      <span style={{ fontSize: 13, opacity: 0.5, width: 50 }}>{session.startTime}</span>
      <span style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 10,
        background: `${color}20`, color,
      }}>
        {classLabels[session.classification]}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{session.duration}m</span>
      <span style={{ fontSize: 12, opacity: 0.5 }}>{session.filesEdited} files</span>
      <span style={{ fontSize: 12, opacity: 0.5 }}>{session.interruptions} interrupts</span>
      <span style={{ marginLeft: 'auto', fontSize: 12, color }}>
        {session.quality}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 80) return '#3b82f6'
  if (score >= 70) return '#f59e0b'
  if (score >= 60) return '#f97316'
  return '#ef4444'
}

function calculateStreak(sessions: FocusSession[]): number {
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse()
  let streak = 0
  for (const date of dates) {
    const expected = new Date()
    expected.setDate(expected.getDate() - streak)
    if (date === expected.toISOString().slice(0, 10)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function calculateBestStreak(sessions: FocusSession[]): number {
  const dates = [...new Set(sessions.map(s => s.date))].sort()
  let best = 0
  let current = 0
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      current = 1
    } else {
      const prev = new Date(dates[i - 1]!)
      const curr = new Date(dates[i]!)
      const diffDays = (curr.getTime() - prev.getTime()) / 86400000
      if (diffDays === 1) {
        current++
      } else {
        current = 1
      }
    }
    best = Math.max(best, current)
  }
  return best
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return now.getTime() - d.getTime() < 7 * 86400000
}
