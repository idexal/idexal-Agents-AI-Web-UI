/**
 * Agent Status Dashboard for Idexal Agents.
 * Displays auto-resume and fallback system status.
 */

import { useState, useEffect } from 'react'
import { getAutoResumeManager, formatAgentStatus, getStatusColor, type Agent } from './AutoResume'
import { getFallbackManager, formatProviderStatus, getProviderStatusColor, type Provider } from './FallbackSystem'

type Language = 'en' | 'ar' | 'zh'

interface Translations {
  title: string
  autoResume: string
  fallback: string
  agents: string
  providers: string
  status: string
  retries: string
  recoveries: string
  failures: string
  lastFallback: string
  healthCheck: string
  enable: string
  disable: string
  running: string
  paused: string
  stopped: string
  error: string
  recovering: string
  healthy: string
  degraded: string
  down: string
  unknown: string
}

const translations: Record<Language, Translations> = {
  en: {
    title: '🤖 Agent Status Dashboard',
    autoResume: 'Auto-Resume',
    fallback: 'Fallback System',
    agents: 'Agents',
    providers: 'Providers',
    status: 'Status',
    retries: 'Retries',
    recoveries: 'Recoveries',
    failures: 'Failures',
    lastFallback: 'Last Fallback',
    healthCheck: 'Health Check',
    enable: 'Enable',
    disable: 'Disable',
    running: 'Running',
    paused: 'Paused',
    stopped: 'Stopped',
    error: 'Error',
    recovering: 'Recovering',
    healthy: 'Healthy',
    degraded: 'Degraded',
    down: 'Down',
    unknown: 'Unknown',
  },
  ar: {
    title: '🤖 لوحة حالة الوكلاء',
    autoResume: 'الاستئناف التلقائي',
    fallback: 'نظام البديل',
    agents: 'الوكلاء',
    providers: 'المزودين',
    status: 'الحالة',
    retries: 'المحاولات',
    recoveries: 'التعافي',
    failures: 'الإخفاقات',
    lastFallback: 'آخر بديل',
    healthCheck: 'فحص الحالة',
    enable: 'تفعيل',
    disable: 'تعطيل',
    running: 'يعمل',
    paused: 'متوقف مؤقتاً',
    stopped: 'متوقف',
    error: 'خطأ',
    recovering: 'يتعافى',
    healthy: 'سليم',
    degraded: 'متضرر',
    down: 'معطّل',
    unknown: 'غير معروف',
  },
  zh: {
    title: '🤖 代理状态仪表板',
    autoResume: '自动恢复',
    fallback: '回退系统',
    agents: '代理',
    providers: '提供商',
    status: '状态',
    retries: '重试',
    recoveries: '恢复',
    failures: '失败',
    lastFallback: '上次回退',
    healthCheck: '健康检查',
    enable: '启用',
    disable: '禁用',
    running: '运行中',
    paused: '已暂停',
    stopped: '已停止',
    error: '错误',
    recovering: '恢复中',
    healthy: '健康',
    degraded: '降级',
    down: '宕机',
    unknown: '未知',
  },
}

export function AgentStatusDashboard({ language = 'en' }: { language?: Language }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [autoResumeEnabled, setAutoResumeEnabled] = useState(true)
  const [fallbackEnabled, setFallbackEnabled] = useState(true)

  const t = translations[language]
  const isRTL = language === 'ar'

  const autoResumeManager = getAutoResumeManager()
  const fallbackManager = getFallbackManager()

  useEffect(() => {
    // Subscribe to auto-resume updates
    const unsubAutoResume = autoResumeManager.subscribe(() => {
      setAgents(autoResumeManager.getAllAgents())
    })

    // Subscribe to fallback updates
    const unsubFallback = fallbackManager.subscribe(() => {
      setProviders(Array.from(fallbackManager.getState().providers.values()))
    })

    // Initial load
    setAgents(autoResumeManager.getAllAgents())
    setProviders(Array.from(fallbackManager.getState().providers.values()))

    return () => {
      unsubAutoResume()
      unsubFallback()
    }
  }, [])

  const autoResumeState = autoResumeManager.getState()
  const fallbackState = fallbackManager.getState()
  const providerSummary = fallbackManager.getStatusSummary()

  return (
    <div className="agent-dashboard" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="dashboard-title">{t.title}</h2>

      {/* Auto-Resume Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>🔄 {t.autoResume}</h3>
          <button
            className={`toggle-btn ${autoResumeEnabled ? 'enabled' : 'disabled'}`}
            onClick={() => {
              if (autoResumeEnabled) {
                autoResumeManager.disable()
              } else {
                autoResumeManager.enable()
              }
              setAutoResumeEnabled(!autoResumeEnabled)
            }}
          >
            {autoResumeEnabled ? t.disable : t.enable}
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">{t.retries}</span>
            <span className="stat-value">{autoResumeState.totalRetries}</span>
          </div>
          <div className="stat-card success">
            <span className="stat-label">{t.recoveries}</span>
            <span className="stat-value">{autoResumeState.totalRecoveries}</span>
          </div>
          <div className="stat-card error">
            <span className="stat-label">{t.failures}</span>
            <span className="stat-value">{autoResumeState.totalFailures}</span>
          </div>
        </div>

        {agents.length > 0 && (
          <div className="agents-list">
            <h4>{t.agents}</h4>
            {agents.map(agent => (
              <div key={agent.id} className="agent-card">
                <div className="agent-info">
                  <span className="agent-name">{agent.name}</span>
                  <span
                    className="agent-status"
                    style={{ color: getStatusColor(agent.status) }}
                  >
                    {formatAgentStatus(agent.status)}
                  </span>
                </div>
                <div className="agent-meta">
                  <span>Retries: {agent.retryCount}/{agent.maxRetries}</span>
                  {agent.error && (
                    <span className="agent-error">Error: {agent.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fallback Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3>🔀 {t.fallback}</h3>
          <button
            className={`toggle-btn ${fallbackEnabled ? 'enabled' : 'disabled'}`}
            onClick={() => {
              if (fallbackEnabled) {
                fallbackManager.stopHealthChecks()
              } else {
                fallbackManager.startHealthChecks()
              }
              setFallbackEnabled(!fallbackEnabled)
            }}
          >
            {fallbackEnabled ? t.disable : t.enable}
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">{t.providers}</span>
            <span className="stat-value">{providerSummary.total}</span>
          </div>
          <div className="stat-card success">
            <span className="stat-label">{t.healthy}</span>
            <span className="stat-value">{providerSummary.healthy}</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-label">{t.degraded}</span>
            <span className="stat-value">{providerSummary.degraded}</span>
          </div>
          <div className="stat-card error">
            <span className="stat-label">{t.down}</span>
            <span className="stat-value">{providerSummary.down}</span>
          </div>
        </div>

        {fallbackState.lastFallback && (
          <div className="last-fallback">
            <span>{t.lastFallback}:</span>
            <span>{fallbackState.lastFallback.toLocaleString()}</span>
          </div>
        )}

        {providers.length > 0 && (
          <div className="providers-list">
            <h4>{t.providers}</h4>
            {providers.map(provider => (
              <div key={provider.id} className="provider-card">
                <div className="provider-info">
                  <span className="provider-name">{provider.name}</span>
                  <span
                    className="provider-status"
                    style={{ color: getProviderStatusColor(provider.status) }}
                  >
                    {formatProviderStatus(provider.status)}
                  </span>
                </div>
                <div className="provider-meta">
                  <span>Response: {provider.responseTime}ms</span>
                  <span>Error Rate: {(provider.errorRate * 100).toFixed(1)}%</span>
                  <span>Priority: {provider.priority}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .agent-dashboard {
          padding: 24px;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
        }

        .agent-dashboard.rtl {
          direction: rtl;
          text-align: right;
        }

        .dashboard-title {
          margin: 0 0 24px 0;
          font-size: 1.5rem;
          color: var(--text-primary, #1a1a1a);
        }

        .dashboard-section {
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.125rem;
          color: var(--text-primary, #1a1a1a);
        }

        .toggle-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid;
        }

        .toggle-btn.enabled {
          background: #10B981;
          color: white;
          border-color: #10B981;
        }

        .toggle-btn.disabled {
          background: #EF4444;
          color: white;
          border-color: #EF4444;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .stat-card.success { border-left: 3px solid #10B981; }
        .stat-card.warning { border-left: 3px solid #F59E0B; }
        .stat-card.error { border-left: 3px solid #EF4444; }

        .stat-label {
          display: block;
          font-size: 12px;
          color: var(--text-secondary, #666);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .agents-list, .providers-list {
          margin-top: 16px;
        }

        .agents-list h4, .providers-list h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--text-secondary, #666);
        }

        .agent-card, .provider-card {
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .agent-info, .provider-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .agent-name, .provider-name {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .agent-status, .provider-status {
          font-size: 13px;
        }

        .agent-meta, .provider-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-secondary, #666);
        }

        .agent-error {
          color: #EF4444;
        }

        .last-fallback {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-primary, #ffffff);
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-secondary, #666);
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  )
}

export default AgentStatusDashboard
