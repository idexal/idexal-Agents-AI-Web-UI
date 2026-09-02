/**
 * Code Review UI for Idexal Agents.
 * Visual code review display with scoring, issue cards, and filtering.
 */

import { useState, useCallback } from 'react'

type Language = 'en' | 'ar' | 'zh'
type FilterSeverity = 'all' | 'critical' | 'warning' | 'info' | 'suggestion'

interface CodeReviewUIProps {
  language?: Language
  code?: string
  filename?: string
}

interface ReviewIssue {
  id: string
  category: string
  severity: 'critical' | 'warning' | 'info' | 'suggestion'
  title: string
  description: string
  line: number
  snippet: string
  suggestion: string
  confidence: number
}

interface ReviewResult {
  score: number
  grade: string
  issues: ReviewIssue[]
  linesAnalyzed: number
}

const REVIEW_I18N: Record<Language, {
  title: string
  scanCode: string
  score: string
  grade: string
  issues: string
  lines: string
  filter: string
  all: string
  critical: string
  warning: string
  info: string
  suggestion: string
  noIssues: string
  confidence: string
  fix: string
  line: string
  category: string
}> = {
  en: {
    title: 'Code Review', scanCode: 'Scan Code', score: 'Score', grade: 'Grade',
    issues: 'Issues', lines: 'Lines', filter: 'Filter', all: 'All', critical: 'Critical',
    warning: 'Warning', info: 'Info', suggestion: 'Suggestion', noIssues: 'No issues found!',
    confidence: 'Confidence', fix: 'Fix', line: 'Line', category: 'Category',
  },
  ar: {
    title: 'مراجعة الكود', scanCode: 'فحص الكود', score: 'النتيجة', grade: 'التقدير',
    issues: 'المشكلات', lines: 'الأسطر', filter: 'تصفية', all: 'الكل', critical: 'حرج',
    warning: 'تحذير', info: 'معلومات', suggestion: 'اقتراح', noIssues: 'لم يتم العثور على مشكلات!',
    confidence: 'الثقة', fix: 'إصلاح', line: 'سطر', category: 'الفئة',
  },
  zh: {
    title: '代码审查', scanCode: '扫描代码', score: '分数', grade: '等级',
    issues: '问题', lines: '行数', filter: '筛选', all: '全部', critical: '严重',
    warning: '警告', info: '信息', suggestion: '建议', noIssues: '未发现任何问题！',
    confidence: '置信度', fix: '修复', line: '行', category: '类别',
  },
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  suggestion: '#94a3b8',
}

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🔴',
  warning: '🟡',
  info: '🔵',
  suggestion: '⚪',
}

const CATEGORY_ICONS: Record<string, string> = {
  correctness: '✅',
  performance: '⚡',
  security: '🔒',
  maintainability: '🔧',
  readability: '📖',
  'best-practice': '⭐',
  accessibility: '♿',
  testing: '🧪',
}

function getGradeColor(grade: string): string {
  if (grade === 'A' || grade === 'A+') return '#10b981'
  if (grade === 'B') return '#3b82f6'
  if (grade === 'C') return '#f59e0b'
  if (grade === 'D') return '#f97316'
  return '#ef4444'
}

function analyzeCode(code: string): ReviewResult {
  const lines = code.split('\n')
  const issues: ReviewIssue[] = []

  const patterns: Array<{ pattern: RegExp; category: string; severity: ReviewIssue['severity']; title: string; description: string; suggestion: string }> = [
    { pattern: /==(?!=)/g, category: 'correctness', severity: 'warning', title: 'Loose equality', description: 'Use === instead of ==', suggestion: 'Replace == with ===' },
    { pattern: /var\s/g, category: 'correctness', severity: 'warning', title: 'var declaration', description: 'Use const/let instead of var', suggestion: 'Replace var with const/let' },
    { pattern: /innerHTML\s*=/g, category: 'security', severity: 'critical', title: 'innerHTML XSS risk', description: 'innerHTML can lead to XSS attacks', suggestion: 'Use textContent or sanitize' },
    { pattern: /eval\s*\(/g, category: 'security', severity: 'critical', title: 'eval() usage', description: 'eval() is a major security risk', suggestion: 'Remove eval()' },
    { pattern: /console\.(log|warn|error)/g, category: 'best-practice', severity: 'warning', title: 'Console statement', description: 'Remove console statements in production', suggestion: 'Use a logging library' },
    { pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g, category: 'correctness', severity: 'warning', title: 'Empty catch block', description: 'Empty catch silently swallows errors', suggestion: 'Handle or log the error' },
    { pattern: /TODO|FIXME|HACK/g, category: 'maintainability', severity: 'info', title: 'Unresolved comment', description: 'Has an open TODO/FIXME', suggestion: 'Resolve or create tracking issue' },
    { pattern: /debugger\b/g, category: 'best-practice', severity: 'warning', title: 'Debugger statement', description: 'Remove debugger statements', suggestion: 'Remove debugger' },
    { pattern: /password\s*[:=]\s*['"]/gi, category: 'security', severity: 'critical', title: 'Hardcoded password', description: 'Hardcoded credentials are dangerous', suggestion: 'Use environment variables' },
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    for (const { pattern, category, severity, title, description, suggestion } of patterns) {
      const matches = Array.from(line.matchAll(pattern))
      for (const _match of matches) {
        issues.push({
          id: `issue-${i}-${issues.length}`,
          category,
          severity,
          title,
          description,
          line: i + 1,
          snippet: line.trim(),
          suggestion,
          confidence: 0.8 + Math.random() * 0.2,
        })
      }
    }
    if (line.length > 120) {
      issues.push({
        id: `long-${i}`, category: 'readability', severity: 'info',
        title: 'Long line', description: `Line is ${line.length} characters`,
        line: i + 1, snippet: line.trim().slice(0, 60) + '...',
        suggestion: 'Break at logical points', confidence: 0.6,
      })
    }
  }

  const penalty = issues.reduce((sum, i) => {
    if (i.severity === 'critical') return sum + 20
    if (i.severity === 'warning') return sum + 10
    if (i.severity === 'info') return sum + 3
    return sum + 1
  }, 0)

  const score = Math.max(0, Math.min(100, 100 - penalty))
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

  return { score, grade, issues, linesAnalyzed: lines.length }
}

/**
 * Code Review UI component.
 */
export function CodeReviewUI({ language = 'en', code = '', filename = 'untitled.ts' }: CodeReviewUIProps) {
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [filter, setFilter] = useState<FilterSeverity>('all')
  const [isScanning, setIsScanning] = useState(false)

  const t = REVIEW_I18N[language] ?? REVIEW_I18N.en

  const scanCode = useCallback(() => {
    if (!code) return
    setIsScanning(true)
    setTimeout(() => {
      setResult(analyzeCode(code))
      setIsScanning(false)
    }, 300)
  }, [code])

  const filteredIssues = result?.issues.filter(i => filter === 'all' || i.severity === filter) ?? []
  const issueCounts = result?.issues.reduce((acc, i) => { acc[i.severity]++; return acc }, { critical: 0, warning: 0, info: 0, suggestion: 0 }) ?? { critical: 0, warning: 0, info: 0, suggestion: 0 }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0f172a', color: '#f8fafc', borderRadius: '16px', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>{t.title}</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '13px' }}>{filename}</p>
        </div>
        <button onClick={scanCode} disabled={isScanning} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
          padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
        }}>
          {isScanning ? '⏳' : '🔍'} {t.scanCode}
        </button>
      </div>

      {result && (
        <div style={{ padding: '24px' }}>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: `conic-gradient(${getGradeColor(result.grade)} ${result.score * 3.6}deg, #1e293b 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '76px', height: '76px', borderRadius: '50%', background: '#0f172a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: getGradeColor(result.grade) }}>{result.grade}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{result.score}/100</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {(['critical', 'warning', 'info', 'suggestion'] as const).map(sev => (
                  <div key={sev} onClick={() => setFilter(filter === sev ? 'all' : sev)} style={{
                    background: filter === sev ? `${SEVERITY_COLORS[sev]}22` : '#1e293b',
                    border: `1px solid ${filter === sev ? SEVERITY_COLORS[sev] : '#334155'}`,
                    borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: '18px' }}>{SEVERITY_ICONS[sev]}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: SEVERITY_COLORS[sev] }}>{issueCounts[sev]}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t[sev]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issues */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p>{t.noIssues}</p>
              </div>
            ) : (
              filteredIssues.map(issue => (
                <div key={issue.id} style={{
                  background: '#1e293b', borderRadius: '10px', padding: '14px 16px',
                  borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity]}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{SEVERITY_ICONS[issue.severity]}</span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{issue.title}</span>
                      <span style={{ background: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#94a3b8' }}>
                        {CATEGORY_ICONS[issue.category] ?? '📋'} {issue.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{t.line} {issue.line}</span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#94a3b8' }}>{issue.description}</p>
                  <code style={{ display: 'block', background: '#0f172a', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#e2e8f0', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.snippet}
                  </code>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>💡 {issue.suggestion}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{t.confidence}: {Math.round(issue.confidence * 100)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export type { CodeReviewUIProps, ReviewIssue, ReviewResult }
