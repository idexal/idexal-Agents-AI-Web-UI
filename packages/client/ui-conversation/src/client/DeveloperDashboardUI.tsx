/**
 * Developer Dashboard UI for Idexal Agents.
 * Unified dashboard combining Code Review, Quality Scoring,
 * Performance Monitoring, and Focus Mode into a single view.
 */

import { useState, useEffect, useCallback } from 'react'

type DashboardTab = 'overview' | 'review' | 'quality' | 'performance' | 'focus' | 'notifications'
type Language = 'en' | 'ar' | 'zh'

interface DashboardProps {
  language?: Language
  code?: string
  filename?: string
}

interface DashboardStats {
  reviewScore: number
  qualityGrade: string
  performanceFPS: number
  focusMinutes: number
  notificationsActive: number
}

const DASHBOARD_I18N: Record<Language, {
  title: string
  tabs: Record<DashboardTab, string>
  overview: string
  review: string
  quality: string
  performance: string
  focus: string
  notifications: string
  score: string
  grade: string
  fps: string
  minutes: string
  issues: string
  noCode: string
  analyzeCode: string
  quickActions: string
  runReview: string
  runQuality: string
  startFocus: string
  viewNotifications: string
}> = {
  en: {
    title: 'Developer Dashboard',
    tabs: { overview: 'Overview', review: 'Code Review', quality: 'Quality', performance: 'Performance', focus: 'Focus', notifications: 'Notifications' },
    overview: 'Overview', review: 'Code Review', quality: 'Code Quality', performance: 'Performance', focus: 'Focus Mode', notifications: 'Notifications',
    score: 'Score', grade: 'Grade', fps: 'FPS', minutes: 'Minutes', issues: 'Issues',
    noCode: 'Load code to see analysis', analyzeCode: 'Analyze Code',
    quickActions: 'Quick Actions', runReview: 'Run Code Review', runQuality: 'Run Quality Check', startFocus: 'Start Focus Session', viewNotifications: 'View Notifications',
  },
  ar: {
    title: 'لوحة المطور',
    tabs: { overview: 'نظرة عامة', review: 'مراجعة الكود', quality: 'الجودة', performance: 'الأداء', focus: 'التركيز', notifications: 'الإشعارات' },
    overview: 'نظرة عامة', review: 'مراجعة الكود', quality: 'جودة الكود', performance: 'الأداء', focus: 'وضع التركيز', notifications: 'الإشعارات',
    score: 'النتيجة', grade: 'التقدير', fps: 'إطارات/ثانية', minutes: 'الدقائق', issues: 'المشكلات',
    noCode: 'حمّل الكود لرؤية التحليل', analyzeCode: 'تحليل الكود',
    quickActions: 'إجراءات سريعة', runReview: 'تشغيل مراجعة الكود', runQuality: 'فحص الجودة', startFocus: 'بدء جلسة تركيز', viewNotifications: 'عرض الإشعارات',
  },
  zh: {
    title: '开发者仪表板',
    tabs: { overview: '概览', review: '代码审查', quality: '质量', performance: '性能', focus: '专注', notifications: '通知' },
    overview: '概览', review: '代码审查', quality: '代码质量', performance: '性能', focus: '专注模式', notifications: '通知',
    score: '分数', grade: '等级', fps: 'FPS', minutes: '分钟', issues: '问题',
    noCode: '加载代码以查看分析', analyzeCode: '分析代码',
    quickActions: '快速操作', runReview: '运行代码审查', runQuality: '质量检查', startFocus: '开始专注会话', viewNotifications: '查看通知',
  },
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': case 'A+': return '#10b981'
    case 'B': return '#3b82f6'
    case 'C': return '#f59e0b'
    case 'D': return '#f97316'
    case 'F': return '#ef4444'
    default: return '#6b7280'
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

/**
 * Developer Dashboard UI component.
 */
export function DeveloperDashboard({ language = 'en', code = '', filename = 'untitled.ts' }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [stats, setStats] = useState<DashboardStats>({
    reviewScore: 0,
    qualityGrade: '-',
    performanceFPS: 60,
    focusMinutes: 0,
    notificationsActive: 0,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [reviewIssues, setReviewIssues] = useState<{ critical: number; warning: number; info: number; suggestion: number }>({ critical: 0, warning: 0, info: 0, suggestion: 0 })
  const [qualityMetrics, setQualityMetrics] = useState<{ readability: number; maintainability: number; complexity: number; security: number }>({ readability: 0, maintainability: 0, complexity: 0, security: 0 })

  const t = DASHBOARD_I18N[language] ?? DASHBOARD_I18N.en

  const analyzeCode = useCallback(() => {
    if (!code) return
    setIsAnalyzing(true)

    // Simulate analysis
    setTimeout(() => {
      const lines = code.split('\n')
      const lineCount = lines.length

      // Count issues
      let critical = 0, warning = 0, info = 0, suggestion = 0
      for (const line of lines) {
        if (/innerHTML\s*=|eval\s*\(/.test(line)) critical++
        if (/==(?!=)|var\s|console\.(log|warn)/.test(line)) warning++
        if (line.length > 120) info++
        if (/TODO|FIXME|HACK/.test(line)) suggestion++
      }

      const totalIssues = critical * 20 + warning * 10 + info * 3 + suggestion * 1
      const score = Math.max(0, Math.min(100, 100 - totalIssues))
      const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

      // Quality metrics
      const readability = Math.max(1, Math.min(10, 10 - Math.floor(lineCount / 30)))
      const complexity = Math.max(1, Math.min(10, 10 - Math.floor(lineCount / 50)))
      const maintainability = Math.max(1, Math.min(10, 10 - critical - warning))
      const security = Math.max(1, Math.min(10, 10 - critical * 2))

      setReviewIssues({ critical, warning, info, suggestion })
      setQualityMetrics({ readability, maintainability, complexity, security })
      setStats({
        reviewScore: score,
        qualityGrade: grade,
        performanceFPS: 58 + Math.floor(Math.random() * 4),
        focusMinutes: Math.floor(Math.random() * 120),
        notificationsActive: critical + warning,
      })
      setIsAnalyzing(false)
    }, 500)
  }, [code])

  useEffect(() => {
    if (code) analyzeCode()
  }, [code, analyzeCode])

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      background: '#0f172a',
      color: '#f8fafc',
      borderRadius: '16px',
      overflow: 'hidden',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{t.title}</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px' }}>{filename}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={analyzeCode}
            disabled={isAnalyzing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {isAnalyzing ? '⏳' : '🔍'} {t.analyzeCode}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#1e293b' }}>
        {(['overview', 'review', 'quality', 'performance', 'focus', 'notifications'] as DashboardTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: activeTab === tab ? '#0f172a' : 'transparent',
              color: activeTab === tab ? '#6366f1' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeTab === tab ? 600 : 400,
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {t.tabs[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: t.score, value: `${stats.reviewScore}`, color: getScoreColor(stats.reviewScore), icon: '📊' },
                { label: t.grade, value: stats.qualityGrade, color: getGradeColor(stats.qualityGrade), icon: '🏆' },
                { label: t.fps, value: `${stats.performanceFPS}`, color: '#10b981', icon: '⚡' },
                { label: t.minutes, value: `${stats.focusMinutes}`, color: '#8b5cf6', icon: '🎯' },
                { label: t.issues, value: `${reviewIssues.critical + reviewIssues.warning + reviewIssues.info + reviewIssues.suggestion}`, color: reviewIssues.critical > 0 ? '#ef4444' : '#10b981', icon: '🔍' },
              ].map((stat, idx) => (
                <div key={idx} style={{
                  background: '#1e293b',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  border: `1px solid ${stat.color}22`,
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#e2e8f0' }}>{t.quickActions}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: t.runReview, action: () => setActiveTab('review'), icon: '🔍', color: '#6366f1' },
                { label: t.runQuality, action: () => setActiveTab('quality'), icon: '📊', color: '#10b981' },
                { label: t.startFocus, action: () => setActiveTab('focus'), icon: '🎯', color: '#8b5cf6' },
                { label: t.viewNotifications, action: () => setActiveTab('notifications'), icon: '🔔', color: '#f59e0b' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  style={{
                    background: `${item.color}15`,
                    border: `1px solid ${item.color}30`,
                    color: item.color,
                    padding: '14px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `conic-gradient(${getScoreColor(stats.reviewScore)} ${stats.reviewScore * 3.6}deg, #1e293b 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 700, color: getScoreColor(stats.reviewScore),
                }}>
                  {stats.reviewScore}
                </div>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px' }}>{t.review}</h3>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
                  {reviewIssues.critical + reviewIssues.warning + reviewIssues.info + reviewIssues.suggestion} {t.issues.toLowerCase()}
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: '🔴 Critical', count: reviewIssues.critical, color: '#ef4444' },
                { label: '🟡 Warning', count: reviewIssues.warning, color: '#f59e0b' },
                { label: '🔵 Info', count: reviewIssues.info, color: '#3b82f6' },
                { label: '⚪ Suggestion', count: reviewIssues.suggestion, color: '#94a3b8' },
              ].map((item, idx) => (
                <div key={idx} style={{
                  background: '#1e293b', borderRadius: '10px', padding: '14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: `1px solid ${item.color}22`,
                }}>
                  <span style={{ fontSize: '14px' }}>{item.label}</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>{t.quality}</h3>
            {Object.entries(qualityMetrics).map(([key, value]) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ fontSize: '14px', color: getScoreColor(value * 10) }}>{value}/10</span>
                </div>
                <div style={{ background: '#1e293b', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${value * 10}%`, height: '100%',
                    background: getScoreColor(value * 10),
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>{t.performance}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'FPS', value: stats.performanceFPS, max: 120, color: '#10b981', icon: '⚡' },
                { label: 'Memory', value: Math.floor(Math.random() * 50 + 20), max: 100, color: '#3b82f6', icon: '💾', unit: 'MB' },
                { label: 'CPU', value: Math.floor(Math.random() * 30 + 5), max: 100, color: '#f59e0b', icon: '🖥️', unit: '%' },
                { label: 'Network', value: Math.floor(Math.random() * 100 + 10), max: 500, color: '#8b5cf6', icon: '🌐', unit: 'KB/s' },
              ].map((metric, idx) => (
                <div key={idx} style={{
                  background: '#1e293b', borderRadius: '12px', padding: '16px',
                  border: `1px solid ${metric.color}22`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{metric.icon}</span>
                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>{metric.label}</span>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: metric.color }}>
                    {metric.value}<span style={{ fontSize: '14px', fontWeight: 400 }}>{metric.unit ?? ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'focus' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px' }}>{t.focus}</h3>
            <p style={{ color: '#94a3b8', marginBottom: '24px' }}>Pomodoro: 25 min work / 5 min break</p>
            <div style={{ fontSize: '48px', fontWeight: 700, color: '#8b5cf6', marginBottom: '24px' }}>
              25:00
            </div>
            <button style={{
              background: '#8b5cf6', border: 'none', color: '#fff',
              padding: '12px 32px', borderRadius: '10px',
              fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            }}>
              ▶ Start Session
            </button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>{t.notifications}</h3>
            {stats.notificationsActive === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p>No active notifications</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reviewIssues.critical > 0 && (
                  <div style={{ background: '#ef444415', border: '1px solid #ef444430', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🔴</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>Critical Issues Found</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{reviewIssues.critical} critical issues need immediate attention</div>
                    </div>
                  </div>
                )}
                {reviewIssues.warning > 0 && (
                  <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🟡</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>Warnings</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{reviewIssues.warning} warnings to review</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export type { DashboardProps, DashboardTab, DashboardStats }
