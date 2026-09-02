/**
 * Feature Controls Section.
 *
 * Provides a unified settings page where users can enable/disable, configure,
 * and customise every AI engine and feature in the platform.  All state is
 * persisted to localStorage and exposed to the plugin ecosystem.
 */

import { useState, useCallback, useEffect } from 'react'
import css from './GeneralSection.module.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Language = 'en' | 'ar' | 'zh'

interface FeatureConfig {
  readonly id: string
  readonly category: string
  readonly nameEn: string
  readonly nameAr: string
  readonly nameZh: string
  readonly descEn: string
  readonly descAr: string
  readonly descZh: string
  readonly enabled: boolean
  readonly config?: Record<string, unknown>
}

interface FeatureCategory {
  readonly id: string
  readonly nameEn: string
  readonly nameAr: string
  readonly nameZh: string
  readonly icon: string
  readonly features: readonly string[]
}

// ---------------------------------------------------------------------------
// Default feature definitions
// ---------------------------------------------------------------------------

const CATEGORIES: readonly FeatureCategory[] = [
  { id: 'ai-core', nameEn: 'AI Core', nameAr: 'الذكاء الأساسي', nameZh: 'AI 核心', icon: '🧠', features: ['smart-completion', 'smart-completion-v2', 'code-quality', 'code-metrics'] },
  { id: 'security', nameEn: 'Security & Auditing', nameAr: 'الأمان والمراجعة', nameZh: '安全与审计', icon: '🛡️', features: ['security-auditor', 'security-scanner', 'vulnerability-scanner', 'security-scanner-advanced'] },
  { id: 'testing', nameEn: 'Testing & Coverage', nameAr: 'الاختبارات والتغطية', nameZh: '测试与覆盖', icon: '🧪', features: ['auto-test', 'testing-framework', 'coverage-optimizer'] },
  { id: 'code-analysis', nameEn: 'Code Analysis', nameAr: 'تحليل الكود', nameZh: '代码分析', icon: '📊', features: ['code-review', 'code-review-bot', 'code-smell', 'complexity-heatmap', 'dependency-graph', 'code-heatmap'] },
  { id: 'performance', nameEn: 'Performance', nameAr: 'الأداء', nameZh: '性能', icon: '⚡', features: ['performance-dashboard', 'performance-profiler', 'performance-prediction', 'regression-detector', 'smart-caching'] },
  { id: 'documentation', nameEn: 'Documentation', nameAr: 'التوثيق', nameZh: '文档', icon: '📚', features: ['auto-doc', 'doc-generator', 'doc-writer', 'api-doc'] },
  { id: 'migration', nameEn: 'Migration & Refactoring', nameAr: 'الترحيل وإعادة الهيكلة', nameZh: '迁移与重构', icon: '🔄', features: ['code-migration', 'migration-planner', 'intelligent-refactoring', 'refactoring-assistant'] },
  { id: 'search', nameEn: 'Search & Navigation', nameAr: 'البحث والتنقل', nameZh: '搜索与导航', icon: '🔍', features: ['advanced-search', 'context-aware-search', 'advanced-search-engine', 'realtime-search'] },
  { id: 'collaboration', nameEn: 'Collaboration', nameAr: 'التعاون', nameZh: '协作', icon: '👥', features: ['realtime-collaboration', 'collaboration-engine', 'review-chat'] },
  { id: 'productivity', nameEn: 'Productivity', nameAr: 'الإنتاجية', nameZh: '生产力', icon: '📈', features: ['productivity-tracker', 'focus-mode', 'workflow-automation', 'quick-actions'] },
  { id: 'offline', nameEn: 'Offline & Sync', nameAr: 'غير متصل والمزامنة', nameZh: '离线与同步', icon: '📡', features: ['offline-storage', 'sync-manager', 'offline-indicator'] },
  { id: 'ui-customization', nameEn: 'UI & Customization', nameAr: 'واجهة وتخصيص', nameZh: '界面与自定义', icon: '🎨', features: ['custom-theme', 'animated-transitions', 'micro-interactions', 'accessibility'] },
  { id: 'notifications', nameEn: 'Notifications', nameAr: 'الإشعارات', nameZh: '通知', icon: '🔔', features: ['smart-notifications', 'notification-manager'] },
  { id: 'database', nameEn: 'Database & Schema', nameAr: 'قاعدة البيانات', nameZh: '数据库', icon: '🗄️', features: ['schema-analyzer'] },
  { id: 'export', nameEn: 'Export & Import', nameAr: 'تصدير واستيراد', nameZh: '导出与导入', icon: '📤', features: ['conversation-export', 'batch-export', 'pdf-export', 'settings-export'] },
  { id: 'ai-generation', nameEn: 'AI Generation', nameAr: 'توليد الذكاء', nameZh: 'AI 生成', icon: '🤖', features: ['code-generation', 'code-translator', 'smart-debugger', 'error-recovery', 'error-analytics', 'pattern-library', 'snippet-manager'] },
  { id: 'plugins', nameEn: 'Plugin System', nameAr: 'نظام الإضافات', nameZh: '插件系统', icon: '🧩', features: ['plugin-system'] },
  { id: 'fallback', nameEn: 'Fallback & Recovery', nameAr: 'الاحتياطي والاستعادة', nameZh: '回退与恢复', icon: '🔄', features: ['auto-resume', 'fallback-system', 'enhanced-auto-resume', 'enhanced-fallback'] },
  { id: 'architecture', nameEn: 'Architecture', nameAr: 'الهندسة المعمارية', nameZh: '架构', icon: '🏗️', features: ['architecture-analyzer'] },
]

const DEFAULT_FEATURES: readonly FeatureConfig[] = CATEGORIES.flatMap(cat =>
  cat.features.map(id => ({
    id,
    category: cat.id,
    nameEn: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    nameAr: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    nameZh: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    descEn: `Configure the ${id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} feature.`,
    descAr: `تكوين ميزة ${id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}.`,
    descZh: `配置 ${id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} 功能。`,
    enabled: true,
  }))
)

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const T: Record<Language, Record<string, string>> = {
  en: {
    title: 'Feature Controls',
    subtitle: 'Enable, disable, and configure all AI engines and platform features',
    search: 'Search features...',
    enableAll: 'Enable All',
    disableAll: 'Disable All',
    resetDefaults: 'Reset to Defaults',
    enabled: 'Enabled',
    disabled: 'Disabled',
    save: 'Save Changes',
    saved: 'Saved!',
    configTitle: 'Configuration',
    categoryAll: 'All Categories',
  },
  ar: {
    title: 'تحكم الميزات',
    subtitle: 'تفعيل وتعطيل وتكوين جميع محركات الذكاء الاصطناعي ومنصات الميزات',
    search: 'بحث في الميزات...',
    enableAll: 'تفعيل الكل',
    disableAll: 'تعطيل الكل',
    resetDefaults: 'إعادة التعيين',
    enabled: 'مفعّل',
    disabled: 'معطّل',
    save: 'حفظ التغييرات',
    saved: 'تم الحفظ!',
    configTitle: 'التكوين',
    categoryAll: 'جميع الفئات',
  },
  zh: {
    title: '功能控制',
    subtitle: '启用、禁用和配置所有 AI 引擎和平台功能',
    search: '搜索功能...',
    enableAll: '全部启用',
    disableAll: '全部禁用',
    resetDefaults: '恢复默认',
    enabled: '已启用',
    disabled: '已禁用',
    save: '保存更改',
    saved: '已保存！',
    configTitle: '配置',
    categoryAll: '所有类别',
  },
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function loadFeatures(): FeatureConfig[] {
  try {
    const stored = localStorage.getItem('idexal-feature-controls')
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, boolean>
      return DEFAULT_FEATURES.map(f => ({ ...f, enabled: parsed[f.id] ?? f.enabled }))
    }
  } catch { /* ignore */ }
  return [...DEFAULT_FEATURES]
}

function saveFeatures(features: readonly FeatureConfig[]): void {
  const map: Record<string, boolean> = {}
  for (const f of features) map[f.id] = f.enabled
  localStorage.setItem('idexal-feature-controls', JSON.stringify(map))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface FeatureControlsSectionProps {
  locale?: Language
}

export function FeatureControlsSection({ locale = 'en' }: FeatureControlsSectionProps) {
  const [language, setLanguage] = useState<Language>(locale)
  const [features, setFeatures] = useState<FeatureConfig[]>(() => loadFeatures())
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const t = T[language]
  const isRTL = language === 'ar'

  // Auto-save
  useEffect(() => {
    saveFeatures(features)
  }, [features])

  const toggleFeature = useCallback((id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const enableAll = useCallback(() => {
    setFeatures(prev => prev.map(f => ({ ...f, enabled: true })))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const disableAll = useCallback(() => {
    setFeatures(prev => prev.map(f => ({ ...f, enabled: false })))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const resetDefaults = useCallback(() => {
    setFeatures([...DEFAULT_FEATURES])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const toggleExpanded = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const getName = (f: FeatureConfig) => language === 'ar' ? f.nameAr : language === 'zh' ? f.nameZh : f.nameEn
  const getDesc = (f: FeatureConfig) => language === 'ar' ? f.descAr : language === 'zh' ? f.descZh : f.descEn
  const getCatName = (cat: FeatureCategory) => language === 'ar' ? cat.nameAr : language === 'zh' ? cat.nameZh : cat.nameEn

  const filteredFeatures = features.filter(f => {
    const matchesSearch = !search || getName(f).toLowerCase().includes(search.toLowerCase()) || f.id.includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const enabledCount = features.filter(f => f.enabled).length
  const totalCount = features.length

  return (
    <div className={css.section} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setLanguage('en')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', background: language === 'en' ? '#3b82f6' : '#1e293b', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>English</button>
        <button onClick={() => setLanguage('ar')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', background: language === 'ar' ? '#3b82f6' : '#1e293b', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>العربية</button>
        <button onClick={() => setLanguage('zh')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155', background: language === 'zh' ? '#3b82f6' : '#1e293b', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>中文</button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>{t.title}</h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>{t.subtitle}</p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', padding: '12px 16px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{enabledCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.enabled}</div>
        </div>
        <div style={{ width: '1px', background: '#334155' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#64748b' }}>{totalCount - enabledCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.disabled}</div>
        </div>
        <div style={{ width: '1px', background: '#334155' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{totalCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total</div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={t.search}
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '12px', outline: 'none' }}
      />

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={enableAll} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #22c55e40', background: '#22c55e15', color: '#22c55e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{t.enableAll}</button>
        <button onClick={disableAll} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #ef444440', background: '#ef444415', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{t.disableAll}</button>
        <button onClick={resetDefaults} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #f59e0b40', background: '#f59e0b15', color: '#f59e0b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>{t.resetDefaults}</button>
        {saved && <span style={{ padding: '6px 14px', borderRadius: '6px', background: '#22c55e20', color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>✓ {t.saved}</span>}
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #334155', background: activeCategory === 'all' ? '#3b82f6' : 'transparent', color: activeCategory === 'all' ? '#fff' : '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
        >
          {t.categoryAll}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #334155', background: activeCategory === cat.id ? '#3b82f6' : 'transparent', color: activeCategory === cat.id ? '#fff' : '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            {cat.icon} {getCatName(cat)}
          </button>
        ))}
      </div>

      {/* Feature List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredFeatures.map(feature => {
          const cat = CATEGORIES.find(c => c.id === feature.category)
          const isExpanded = expanded.has(feature.id)
          return (
            <div key={feature.id} style={{ background: '#1e293b', borderRadius: '10px', border: `1px solid ${feature.enabled ? '#22c55e30' : '#334155'}`, overflow: 'hidden', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '12px' }}>
                <span style={{ fontSize: '1rem' }}>{cat?.icon ?? '⚙️'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9' }}>{getName(feature)}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getDesc(feature)}</div>
                </div>
                <button
                  onClick={() => toggleFeature(feature.id)}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: feature.enabled ? '#22c55e' : '#475569', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                  aria-label={feature.enabled ? t.disabled : t.enabled}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', left: feature.enabled ? '23px' : '3px', transition: 'left 0.2s' }} />
                </button>
                <button
                  onClick={() => toggleExpanded(feature.id)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', padding: '4px' }}
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>
              {isExpanded && (
                <div style={{ padding: '10px 14px', borderTop: '1px solid #334155', background: '#0f172a' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>{t.configTitle}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID</div>
                      <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontFamily: 'monospace' }}>{feature.id}</div>
                    </div>
                    <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Category</div>
                      <div style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{cat?.icon} {cat ? getCatName(cat) : feature.category}</div>
                    </div>
                    <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Status</div>
                      <div style={{ fontSize: '0.8rem', color: feature.enabled ? '#22c55e' : '#ef4444' }}>{feature.enabled ? '● ' + t.enabled : '● ' + t.disabled}</div>
                    </div>
                    <div style={{ padding: '8px', background: '#1e293b', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Impact</div>
                      <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>{feature.enabled ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '24px', padding: '16px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {enabledCount}/{totalCount} {t.enabled} • {totalCount - enabledCount} {t.disabled}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '4px' }}>
          Changes are saved automatically
        </div>
      </div>
    </div>
  )
}

export default FeatureControlsSection
