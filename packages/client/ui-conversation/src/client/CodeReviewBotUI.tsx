/**
 * Code Review Bot UI for Idexal Agents.
 * Interactive code review with auto-fix, scoring, and detailed feedback.
 */

import { useState, useCallback } from 'react'

type Language = 'en' | 'ar' | 'zh'

interface CodeReviewBotUIProps {
  language?: Language
  code?: string
  filename?: string
}

interface ReviewIssue {
  id: string
  rule: string
  category: string
  severity: 'error' | 'warning' | 'info' | 'hint'
  message: string
  line: number
  column: number
  context: string
  fix?: string
  autoFixable: boolean
  confidence: number
}

interface ReviewResult {
  score: number
  grade: string
  issues: ReviewIssue[]
  stats: { errors: number; warnings: number; info: number; hints: number; autoFixable: number }
  summary: string
}

const REVIEW_I18N: Record<Language, Record<string, string>> = {
  en: {
    title: 'Code Review Bot', scanCode: 'Scan Code', autoFix: 'Auto-Fix All',
    score: 'Score', issues: 'Issues', noIssues: 'No issues found!',
    severity: 'Severity', line: 'Line', fix: 'Fix', confidence: 'Confidence',
    applied: 'Applied', fixAll: 'Fix All Auto-Fixable', export: 'Export Report',
  },
  ar: {
    title: 'روبوت مراجعة الكود', scanCode: 'فحص الكود', autoFix: 'إصلاح تلقائي',
    score: 'النتيجة', issues: 'المشكلات', noIssues: 'لم يتم العثور على مشكلات!',
    severity: 'الشدة', line: 'سطر', fix: 'إصلاح', confidence: 'الثقة',
    applied: 'تم التطبيق', fixAll: 'إصلاح جميع القابلة', export: 'تصدير التقرير',
  },
  zh: {
    title: '代码审查机器人', scanCode: '扫描代码', autoFix: '自动修复',
    score: '分数', issues: '问题', noIssues: '未发现任何问题！',
    severity: '严重性', line: '行', fix: '修复', confidence: '置信度',
    applied: '已应用', fixAll: '修复所有可自动修复', export: '导出报告',
  },
}

const SEVERITY_CONFIG: Record<string, { color: string; icon: string }> = {
  error: { color: '#ef4444', icon: '🔴' },
  warning: { color: '#f59e0b', icon: '🟡' },
  info: { color: '#3b82f6', icon: '🔵' },
  hint: { color: '#94a3b8', icon: '💡' },
}

const CATEGORY_ICONS: Record<string, string> = {
  correctness: '✅', performance: '⚡', security: '🔒', maintainability: '🔧',
  readability: '📖', style: '🎨', documentation: '📝', testing: '🧪',
}

function getGradeColor(grade: string): string {
  if (grade === 'A') return '#10b981'
  if (grade === 'B') return '#3b82f6'
  if (grade === 'C') return '#f59e0b'
  if (grade === 'D') return '#f97316'
  return '#ef4444'
}

function reviewCode(code: string, _filename: string): ReviewResult {
  const lines = code.split('\n')
  const issues: ReviewIssue[] = []

  const rules = [
    { id: 'eqeqeq', category: 'correctness', severity: 'warning' as const, pattern: /==(?!=)/g, message: 'Use strict equality (===)', fix: 'Replace == with ===', autoFixable: true, confidence: 0.95 },
    { id: 'no-var', category: 'correctness', severity: 'warning' as const, pattern: /\bvar\s/g, message: 'Use const/let instead of var', fix: 'Replace var with const/let', autoFixable: true, confidence: 0.9 },
    { id: 'no-eval', category: 'security', severity: 'error' as const, pattern: /\beval\s*\(/g, message: 'eval() is a security risk', fix: 'Remove eval()', autoFixable: false, confidence: 0.99 },
    { id: 'no-innerhtml', category: 'security', severity: 'error' as const, pattern: /\.innerHTML\s*=/g, message: 'innerHTML can lead to XSS', fix: 'Use textContent', autoFixable: false, confidence: 0.95 },
    { id: 'no-console', category: 'style', severity: 'info' as const, pattern: /console\.(log|warn|error)\(/g, message: 'Remove console statements', fix: 'Use logging library', autoFixable: true, confidence: 0.8 },
    { id: 'no-debugger', category: 'style', severity: 'warning' as const, pattern: /\bdebugger\b/g, message: 'Remove debugger statement', fix: 'Remove debugger', autoFixable: true, confidence: 0.99 },
    { id: 'max-line', category: 'readability', severity: 'info' as const, pattern: /.{121,}/g, message: 'Line too long (>120 chars)', fix: 'Break line', autoFixable: false, confidence: 0.7 },
    { id: 'no-todo', category: 'maintainability', severity: 'hint' as const, pattern: /(TODO|FIXME|HACK)/g, message: 'Unresolved TODO comment', fix: 'Complete task', autoFixable: false, confidence: 1.0 },
    { id: 'no-only', category: 'testing', severity: 'error' as const, pattern: /\b(it|test|describe)\.only\b/g, message: 'Focused test (.only) committed', fix: 'Remove .only', autoFixable: true, confidence: 0.99 },
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    for (const rule of rules) {
      const matches = Array.from(line.matchAll(rule.pattern))
      for (const match of matches) {
        issues.push({
          id: `issue-${i}-${issues.length}`,
          rule: rule.id, category: rule.category, severity: rule.severity,
          message: rule.message, line: i + 1, column: (match.index ?? 0) + 1,
          context: line.trim(), fix: rule.fix, autoFixable: rule.autoFixable, confidence: rule.confidence,
        })
      }
    }
  }

  const stats = {
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
    hints: issues.filter(i => i.severity === 'hint').length,
    autoFixable: issues.filter(i => i.autoFixable).length,
  }

  const deductions = stats.errors * 15 + stats.warnings * 8 + stats.info * 2 + stats.hints * 1
  const score = Math.max(0, Math.min(100, 100 - deductions))
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

  return { score, grade, issues, stats, summary: `${issues.length} issues found (${stats.autoFixable} auto-fixable)` }
}

/**
 * Code Review Bot UI component.
 */
export function CodeReviewBotUI({ language = 'en', code = '', filename = 'untitled.ts' }: CodeReviewBotUIProps) {
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set())

  const t = REVIEW_I18N[language] ?? REVIEW_I18N.en

  const scan = useCallback(() => {
    if (!code) return
    setIsScanning(true)
    setTimeout(() => {
      setResult(reviewCode(code, filename))
      setIsScanning(false)
    }, 300)
  }, [code, filename])

  const autoFixAll = useCallback(() => {
    if (!result) return
    const fixable = result.issues.filter(i => i.autoFixable)
    setFixedIssues(new Set(fixable.map(i => i.id)))
  }, [result])

  const filteredIssues = result?.issues.filter(i => filter === 'all' || i.severity === filter) ?? []

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0f172a', color: '#f8fafc', borderRadius: '16px', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>🤖 {t.title}</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '13px' }}>{filename}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {result && result.stats.autoFixable > 0 && (
            <button onClick={autoFixAll} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              ✨ {t.autoFix} ({result.stats.autoFixable})
            </button>
          )}
          <button onClick={scan} disabled={isScanning} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            {isScanning ? '⏳' : '🔍'} {t.scanCode}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ padding: '24px' }}>
          {/* Score & Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              background: `conic-gradient(${getGradeColor(result.grade)} ${result.score * 3.6}deg, #1e293b 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: getGradeColor(result.grade) }}>{result.grade}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{result.score}/100</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {(['error', 'warning', 'info', 'hint'] as const).map(sev => (
                <button key={sev} onClick={() => setFilter(filter === sev ? 'all' : sev)} style={{
                  background: filter === sev ? `${SEVERITY_CONFIG[sev]?.color ?? '#94a3b8'}22` : '#1e293b',
                  border: `1px solid ${filter === sev ? SEVERITY_CONFIG[sev]?.color ?? '#94a3b8' : '#334155'}`,
                  borderRadius: '10px', padding: '10px', textAlign: 'center', cursor: 'pointer',
                }}>
                  <div style={{ fontSize: '16px' }}>{SEVERITY_CONFIG[sev]?.icon ?? '📋'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: SEVERITY_CONFIG[sev]?.color ?? '#94a3b8' }}>
                    {sev === 'error' ? result.stats.errors : sev === 'warning' ? result.stats.warnings : sev === 'info' ? result.stats.info : result.stats.hints}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>{sev}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p>{t.noIssues}</p>
              </div>
            ) : (
              filteredIssues.map(issue => (
                <div key={issue.id} style={{
                  background: fixedIssues.has(issue.id) ? '#10b98115' : '#1e293b',
                  borderRadius: '10px', padding: '12px 14px',
                  borderLeft: `3px solid ${fixedIssues.has(issue.id) ? '#10b981' : SEVERITY_CONFIG[issue.severity]?.color ?? '#94a3b8'}`,
                  opacity: fixedIssues.has(issue.id) ? 0.6 : 1,
                  transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{SEVERITY_CONFIG[issue.severity]?.icon ?? '📋'}</span>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>{issue.message}</span>
                      <span style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#94a3b8' }}>
                        {CATEGORY_ICONS[issue.category] ?? '📋'} {issue.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {fixedIssues.has(issue.id) && <span style={{ color: '#10b981', fontSize: '12px' }}>✅ {t.applied}</span>}
                      {issue.autoFixable && !fixedIssues.has(issue.id) && (
                        <button onClick={() => setFixedIssues(prev => new Set([...prev, issue.id]))} style={{ background: '#10b98122', border: '1px solid #10b98140', color: '#10b981', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                          ✨ {t.fix}
                        </button>
                      )}
                      <span style={{ fontSize: '11px', color: '#64748b' }}>L{issue.line}</span>
                    </div>
                  </div>
                  <code style={{ display: 'block', background: '#0f172a', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', color: '#e2e8f0', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {issue.context}
                  </code>
                  {issue.fix && <div style={{ fontSize: '11px', color: '#10b981' }}>💡 {issue.fix}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export type { CodeReviewBotUIProps, ReviewIssue, ReviewResult }
