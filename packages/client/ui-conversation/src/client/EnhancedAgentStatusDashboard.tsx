/**
 * Enhanced Agent Status Dashboard for Idexal Agents.
 * Comprehensive monitoring with checkpoint recovery, cost tracking, and real-time metrics.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getEnhancedAutoResumeManager,
  formatAgentStatus as formatEnhancedAgentStatus,
  getStatusColor as getEnhancedStatusColor,
  formatCircuitState as formatEnhancedCircuitState,
  formatCheckpoint,
  type Agent as EnhancedAgent,
  type AutoResumeMetrics as EnhancedAutoResumeMetrics,
} from './AutoResumeEnhanced.ts'
import {
  getEnhancedFallbackManager,
  formatProviderStatus as formatEnhancedProviderStatus,
  getProviderStatusColor as getEnhancedProviderStatusColor,
  formatCost,
  formatTokens,
  type Provider as EnhancedProvider,
  type CostReport,
  type FallbackMetrics as EnhancedFallbackMetrics,
} from './FallbackSystemEnhanced.ts'

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
  checkpoints: string
  modelSwitches: string
  costReport: string
  totalCost: string
  projectedMonthly: string
  requestQueue: string
  circuitBreaker: string
  performance: string
  successRate: string
  averageResponseTime: string
  uptime: string
  events: string
  restoreCheckpoint: string
  saveCheckpoint: string
  switchModel: string
}

const translations: Record<Language, Translations> = {
  en: {
    title: '🤖 Enhanced Agent Status Dashboard',
    autoResume: 'Auto-Resume System',
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
    checkpoints: 'Checkpoints',
    modelSwitches: 'Model Switches',
    costReport: 'Cost Report',
    totalCost: 'Total Cost',
    projectedMonthly: 'Projected Monthly',
    requestQueue: 'Request Queue',
    circuitBreaker: 'Circuit Breaker',
    performance: 'Performance',
    successRate: 'Success Rate',
    averageResponseTime: 'Avg Response Time',
    uptime: 'Uptime',
    events: 'Events',
    restoreCheckpoint: 'Restore',
    saveCheckpoint: 'Save Checkpoint',
    switchModel: 'Switch Model',
  },
  ar: {
    title: '🤖 لوحة حالة الوكلاء المحسّنة',
    autoResume: 'نظام الاستئناف التلقائي',
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
    checkpoints: 'نقاط الحفظ',
    modelSwitches: 'تبديل النماذج',
    costReport: 'تقرير التكلفة',
    totalCost: 'التكلفة الإجمالية',
    projectedMonthly: 'المتوقع شهرياً',
    requestQueue: 'قائمة الطلبات',
    circuitBreaker: 'قاطع الدائرة',
    performance: 'الأداء',
    successRate: 'معدل النجاح',
    averageResponseTime: 'متوسط وقت الاستجابة',
    uptime: 'وقت التشغيل',
    events: 'الأحداث',
    restoreCheckpoint: 'استعادة',
    saveCheckpoint: 'حفظ نقطة',
    switchModel: 'تبديل النموذج',
  },
  zh: {
    title: '🤖 增强代理状态仪表板',
    autoResume: '自动恢复系统',
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
    checkpoints: '检查点',
    modelSwitches: '模型切换',
    costReport: '成本报告',
    totalCost: '总成本',
    projectedMonthly: '预计月度',
    requestQueue: '请求队列',
    circuitBreaker: '断路器',
    performance: '性能',
    successRate: '成功率',
    averageResponseTime: '平均响应时间',
    uptime: '运行时间',
    events: '事件',
    restoreCheckpoint: '恢复',
    saveCheckpoint: '保存检查点',
    switchModel: '切换模型',
  },
}

export function EnhancedAgentStatusDashboard({ language = 'en' }: { language?: Language }) {
  const [agents, setAgents] = useState<EnhancedAgent[]>([])
  const [providers, setProviders] = useState<EnhancedProvider[]>([])
  const [autoResumeEnabled, setAutoResumeEnabled] = useState(true)
  const [fallbackEnabled, setFallbackEnabled] = useState(true)
  const [autoResumeMetrics, setAutoResumeMetrics] = useState<EnhancedAutoResumeMetrics | null>(null)
  const [fallbackMetrics, setFallbackMetrics] = useState<EnhancedFallbackMetrics | null>(null)
  const [costReport, setCostReport] = useState<CostReport | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<EnhancedAgent | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<EnhancedProvider | null>(null)

  const t = translations[language]
  const isRTL = language === 'ar'

  const autoResumeManager = getEnhancedAutoResumeManager()
  const fallbackManager = getEnhancedFallbackManager()

  useEffect(() => {
    const unsubAutoResume = autoResumeManager.subscribe(() => {
      setAgents(autoResumeManager.getAllAgents())
      setAutoResumeMetrics(autoResumeManager.getMetrics())
    })

    const unsubFallback = fallbackManager.subscribe(() => {
      setProviders(Array.from(fallbackManager.getState().providers.values()))
      setFallbackMetrics(fallbackManager.getMetrics())
      setCostReport(fallbackManager.getCostReport())
    })

    setAgents(autoResumeManager.getAllAgents())
    setProviders(Array.from(fallbackManager.getState().providers.values()))
    setAutoResumeMetrics(autoResumeManager.getMetrics())
    setFallbackMetrics(fallbackManager.getMetrics())
    setCostReport(fallbackManager.getCostReport())

    return () => {
      unsubAutoResume()
      unsubFallback()
    }
  }, [])

  const autoResumeState = autoResumeManager.getState()
  const fallbackState = fallbackManager.getState()
  const providerSummary = fallbackManager.getStatusSummary()

  const formatUptime = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m ${seconds % 60}s`
  }, [])

  return (
    <div className="enhanced-dashboard" dir={isRTL ? 'rtl' : 'ltr'}>
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
          <div className="stat-card">
            <span className="stat-label">{t.checkpoints}</span>
            <span className="stat-value">{autoResumeState.totalCheckpoints}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">{t.modelSwitches}</span>
            <span className="stat-value">{autoResumeState.totalModelSwitches}</span>
          </div>
        </div>

        {autoResumeMetrics && (
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">{t.successRate}</span>
              <span className="metric-value">{(autoResumeMetrics.successRate * 100).toFixed(1)}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.averageResponseTime}</span>
              <span className="metric-value">{autoResumeMetrics.averageResponseTime.toFixed(0)}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.uptime}</span>
              <span className="metric-value">{formatUptime(autoResumeMetrics.uptime)}</span>
            </div>
          </div>
        )}

        {agents.length > 0 && (
          <div className="agents-list">
            <h4>{t.agents}</h4>
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
              >
                <div className="agent-info">
                  <span className="agent-name">{agent.name}</span>
                  <span
                    className="agent-status"
                    style={{ color: getEnhancedStatusColor(agent.status) }}
                  >
                    {formatEnhancedAgentStatus(agent.status)}
                  </span>
                </div>
                <div className="agent-meta">
                  <span>Retries: {agent.retryCount}/{agent.maxRetries}</span>
                  <span>Model: {agent.currentModel}</span>
                  <span>Circuit: {formatEnhancedCircuitState(agent.circuitState)}</span>
                </div>
                {agent.error && (
                  <div className="agent-error">Error: {agent.error}</div>
                )}
                {selectedAgent?.id === agent.id && (
                  <div className="agent-details">
                    <div className="detail-section">
                      <h5>{t.performance}</h5>
                      <div className="detail-grid">
                        <span>Requests: {agent.performance.totalRequests}</span>
                        <span>Success: {agent.performance.successfulRequests}</span>
                        <span>Failed: {agent.performance.failedRequests}</span>
                        <span>Avg Time: {agent.performance.averageResponseTime.toFixed(0)}ms</span>
                      </div>
                    </div>
                    {agent.checkpoint && (
                      <div className="detail-section">
                        <h5>{t.checkpoints}</h5>
                        <div className="checkpoint-info">
                          <span>{formatCheckpoint(agent.checkpoint)}</span>
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              autoResumeManager.restoreCheckpoint(agent.id)
                            }}
                          >
                            {t.restoreCheckpoint}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="detail-section">
                      <h5>{t.switchModel}</h5>
                      <div className="model-switches">
                        {agent.fallbackModels.map(model => (
                          <span
                            key={model}
                            className={`model-tag ${model === agent.currentModel ? 'active' : ''}`}
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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

        {costReport && (
          <div className="cost-section">
            <h4>💰 {t.costReport}</h4>
            <div className="cost-grid">
              <div className="cost-item">
                <span className="cost-label">{t.totalCost}</span>
                <span className="cost-value">{formatCost(costReport.totalCost)}</span>
              </div>
              <div className="cost-item">
                <span className="cost-label">{t.projectedMonthly}</span>
                <span className="cost-value">{formatCost(costReport.projectedMonthlyCost)}</span>
              </div>
            </div>
          </div>
        )}

        {fallbackState.lastFallback && (
          <div className="last-fallback">
            <span>{t.lastFallback}:</span>
            <span>{fallbackState.lastFallback.toLocaleString()}</span>
          </div>
        )}

        {fallbackMetrics && (
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">{t.requestQueue}</span>
              <span className="metric-value">{fallbackMetrics.requestQueueSize}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.averageResponseTime}</span>
              <span className="metric-value">{fallbackMetrics.averageResponseTime.toFixed(0)}ms</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.totalCost}</span>
              <span className="metric-value">{formatCost(fallbackMetrics.totalCost)}</span>
            </div>
          </div>
        )}

        {providers.length > 0 && (
          <div className="providers-list">
            <h4>{t.providers}</h4>
            {providers.map(provider => (
              <div
                key={provider.id}
                className={`provider-card ${selectedProvider?.id === provider.id ? 'selected' : ''}`}
                onClick={() => setSelectedProvider(selectedProvider?.id === provider.id ? null : provider)}
              >
                <div className="provider-info">
                  <span className="provider-name">{provider.name}</span>
                  <span
                    className="provider-status"
                    style={{ color: getEnhancedProviderStatusColor(provider.status) }}
                  >
                    {formatEnhancedProviderStatus(provider.status)}
                  </span>
                </div>
                <div className="provider-meta">
                  <span>Response: {provider.responseTime}ms</span>
                  <span>Error Rate: {(provider.errorRate * 100).toFixed(1)}%</span>
                  <span>Priority: {provider.priority}</span>
                  <span>Cost: {formatCost(provider.costPer1kTokens)}/1k</span>
                </div>
                {selectedProvider?.id === provider.id && (
                  <div className="provider-details">
                    <div className="detail-section">
                      <h5>{t.circuitBreaker}</h5>
                      <div className="detail-grid">
                        <span>State: {provider.circuitState}</span>
                        <span>Failures: {provider.consecutiveFailures}</span>
                        <span>Active: {provider.activeRequests}/{provider.maxConcurrency}</span>
                      </div>
                    </div>
                    <div className="detail-section">
                      <h5>Models</h5>
                      <div className="model-list">
                        {provider.models.map(model => (
                          <div key={model.id} className="model-item">
                            <span className="model-name">{model.name}</span>
                            <span className="model-stats">
                              {formatTokens(model.usage.totalTokens)} • {formatCost(model.usage.totalCost)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .enhanced-dashboard {
          padding: 24px;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
          max-width: 1200px;
          margin: 0 auto;
        }

        .enhanced-dashboard.rtl {
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

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
        }

        .metric-item {
          text-align: center;
        }

        .metric-label {
          display: block;
          font-size: 12px;
          color: var(--text-secondary, #666);
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 16px;
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
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .agent-card:hover, .provider-card:hover {
          border-color: var(--border-color, #e5e7eb);
        }

        .agent-card.selected, .provider-card.selected {
          border-color: #3b82f6;
          background: #f0f9ff;
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
          flex-wrap: wrap;
        }

        .agent-error {
          color: #EF4444;
          font-size: 12px;
          margin-top: 8px;
        }

        .agent-details, .provider-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .detail-section {
          margin-bottom: 12px;
        }

        .detail-section h5 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: var(--text-secondary, #666);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          font-size: 12px;
        }

        .checkpoint-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .action-btn {
          padding: 4px 8px;
          font-size: 11px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .action-btn:hover {
          background: #2563eb;
        }

        .model-switches {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .model-tag {
          padding: 4px 8px;
          font-size: 11px;
          background: var(--bg-secondary, #f3f4f6);
          border-radius: 4px;
          color: var(--text-secondary, #666);
        }

        .model-tag.active {
          background: #3b82f6;
          color: white;
        }

        .cost-section {
          margin-bottom: 16px;
          padding: 12px;
          background: var(--bg-primary, #ffffff);
          border-radius: 8px;
        }

        .cost-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--text-secondary, #666);
        }

        .cost-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .cost-item {
          text-align: center;
        }

        .cost-label {
          display: block;
          font-size: 12px;
          color: var(--text-secondary, #666);
          margin-bottom: 4px;
        }

        .cost-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
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

        .model-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .model-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .model-name {
          font-weight: 500;
        }

        .model-stats {
          color: var(--text-secondary, #666);
        }
      `}</style>
    </div>
  )
}

export default EnhancedAgentStatusDashboard
