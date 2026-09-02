/**
 * AI-Powered Smart Suggestions for Idexal Agents Chat Input.
 * Provides intelligent, context-aware suggestions based on conversation history,
 * user patterns, and current input context.
 */

/** Suggestion type categories */
export type SuggestionType =
  | 'completion'
  | 'follow-up'
  | 'related'
  | 'action'
  | 'template'
  | 'correction'
  | 'enhancement'
  | 'quick-reply'

/** Suggestion priority levels */
export type SuggestionPriority = 'high' | 'medium' | 'low'

/** Individual suggestion */
export interface SmartSuggestion {
  id: string
  text: string
  type: SuggestionType
  priority: SuggestionPriority
  confidence: number
  description: string | undefined
  icon: string | undefined
  metadata: SuggestionMetadata | undefined
}

/** Suggestion metadata */
export interface SuggestionMetadata {
  source: 'conversation-history' | 'user-patterns' | 'context-analysis' | 'templates' | 'ai-generated'
  relatedMessages: string[]
  topics: string[]
  generatedAt: Date
  expiresAt: Date | undefined
}

/** Conversation message for context */
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata: Record<string, unknown> | undefined
}

/** User pattern data */
export interface UserPattern {
  frequentPhrases: Map<string, number>
  followUpPatterns: string[]
  preferredTopics: string[]
  averageMessageLength: number
  commonActions: string[]
}

/** Smart suggestions configuration */
export interface SmartSuggestionsConfig {
  enabled: boolean
  maxSuggestions: number
  minConfidence: number
  analyzeHistory: boolean
  historyDepth: number
  learnPatterns: boolean
  enableAISuggestions: boolean
  debounceDelay: number
  suggestionExpiry: number
  onSuggestionSelect: ((suggestion: SmartSuggestion) => void) | undefined
  onSuggestionsGenerated: ((suggestions: SmartSuggestion[]) => void) | undefined
}

/** Smart suggestions state */
export interface SmartSuggestionsState {
  suggestions: SmartSuggestion[]
  isLoading: boolean
  currentInput: string
  context: ConversationContext
  userPatterns: UserPattern
  selectedSuggestion: SmartSuggestion | undefined
}

/** Conversation context for suggestions */
export interface ConversationContext {
  recentMessages: ConversationMessage[]
  currentTopic: string | undefined
  summary: string | undefined
  entities: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
}

/**
 * AI-Powered Smart Suggestions Engine.
 */
export class SmartSuggestionsEngine {
  private config: SmartSuggestionsConfig
  private state: SmartSuggestionsState
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<(state: SmartSuggestionsState) => void> = new Set()
  private patternLearningTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: Partial<SmartSuggestionsConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxSuggestions: config.maxSuggestions ?? 6,
      minConfidence: config.minConfidence ?? 0.3,
      analyzeHistory: config.analyzeHistory ?? true,
      historyDepth: config.historyDepth ?? 10,
      learnPatterns: config.learnPatterns ?? true,
      enableAISuggestions: config.enableAISuggestions ?? true,
      debounceDelay: config.debounceDelay ?? 300,
      suggestionExpiry: config.suggestionExpiry ?? 30000,
      onSuggestionSelect: config.onSuggestionSelect,
      onSuggestionsGenerated: config.onSuggestionsGenerated,
    }

    this.state = {
      suggestions: [],
      isLoading: false,
      currentInput: '',
      context: {
        recentMessages: [],
        currentTopic: undefined,
        summary: undefined,
        entities: [],
        sentiment: 'neutral',
      },
      userPatterns: {
        frequentPhrases: new Map(),
        followUpPatterns: [],
        preferredTopics: [],
        averageMessageLength: 0,
        commonActions: [],
      },
      selectedSuggestion: undefined,
    }

    if (this.config.learnPatterns) {
      this.startPatternLearning()
    }
  }

  updateInput(text: string): void {
    this.state.currentInput = text
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => {
      this.generateSuggestions()
    }, this.config.debounceDelay)
  }

  updateContext(messages: ConversationMessage[]): void {
    this.state.context.recentMessages = messages.slice(-this.config.historyDepth)
    this.analyzeContext()
    if (this.config.learnPatterns) {
      this.learnFromMessages(messages)
    }
  }

  getSuggestions(): SmartSuggestion[] {
    const now = new Date()
    return this.state.suggestions.filter(s => {
      if (s.metadata?.expiresAt && s.metadata.expiresAt < now) {
        return false
      }
      return s.confidence >= this.config.minConfidence
    })
  }

  selectSuggestion(suggestionId: string): SmartSuggestion | undefined {
    const suggestion = this.state.suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      this.state.selectedSuggestion = suggestion
      this.config.onSuggestionSelect?.(suggestion)
      this.notifyListeners()
    }
    return suggestion
  }

  clearSuggestions(): void {
    this.state.suggestions = []
    this.notifyListeners()
  }

  getState(): Readonly<SmartSuggestionsState> {
    return this.state
  }

  subscribe(listener: (state: SmartSuggestionsState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    if (this.patternLearningTimer) {
      clearInterval(this.patternLearningTimer)
    }
    this.listeners.clear()
  }

  private generateSuggestions(): void {
    if (!this.config.enabled || !this.state.currentInput.trim()) {
      this.state.suggestions = []
      this.notifyListeners()
      return
    }

    this.state.isLoading = true
    this.notifyListeners()

    const suggestions: SmartSuggestion[] = []
    suggestions.push(...this.generateCompletions())
    suggestions.push(...this.generateFollowUps())
    suggestions.push(...this.generateTemplates())
    suggestions.push(...this.generateActions())
    suggestions.push(...this.generateCorrections())

    suggestions.sort((a, b) => {
      const priorityOrder: Record<SuggestionPriority, number> = { high: 0, medium: 1, low: 2 }
      const aP = priorityOrder[a.priority]
      const bP = priorityOrder[b.priority]
      if (aP !== bP) return aP - bP
      return b.confidence - a.confidence
    })

    this.state.suggestions = suggestions.slice(0, this.config.maxSuggestions)
    this.state.isLoading = false

    this.config.onSuggestionsGenerated?.(this.state.suggestions)
    this.notifyListeners()
  }

  private generateCompletions(): SmartSuggestion[] {
    const input = this.state.currentInput.toLowerCase()
    const suggestions: SmartSuggestion[] = []

    const completionPatterns = [
      { pattern: /^how (do|can|to)/i, completions: ['I implement', 'I create', 'I add', 'I fix'] },
      { pattern: /^what (is|are|does)/i, completions: ['the best way to', 'the difference between', 'the purpose of'] },
      { pattern: /^can you/i, completions: ['help me with', 'explain', 'show me how to'] },
      { pattern: /^please/i, completions: ['help me', 'explain', 'create', 'fix'] },
      { pattern: /^i (want|need|would like)/i, completions: ['to create', 'to add', 'to implement'] },
    ]

    for (const { pattern, completions } of completionPatterns) {
      if (pattern.test(input)) {
        completions.forEach((completion, index) => {
          suggestions.push({
            id: `completion-${index}`,
            text: `${this.state.currentInput} ${completion}`,
            type: 'completion',
            priority: 'high',
            confidence: 0.8 - (index * 0.1),
            description: 'Complete your thought',
            icon: 'completion',
            metadata: {
              source: 'context-analysis',
              relatedMessages: [],
              topics: [],
              generatedAt: new Date(),
              expiresAt: new Date(Date.now() + this.config.suggestionExpiry),
            },
          })
        })
        break
      }
    }

    return suggestions
  }

  private generateFollowUps(): SmartSuggestion[] {
    const messages = this.state.context.recentMessages
    if (messages.length === 0) return []

    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistantMessage) return []

    const suggestions: SmartSuggestion[] = []
    const content = lastAssistantMessage.content.toLowerCase()

    const followUpPatterns = [
      { trigger: /code|function|implement/i, followUps: ['Can you explain how this works?', 'What are the edge cases?', 'How can I optimize this?'] },
      { trigger: /error|bug|fix/i, followUps: ['What caused this error?', 'How can I prevent this in the future?', 'Are there related issues?'] },
      { trigger: /explain|describe/i, followUps: ['Can you give an example?', 'What are the alternatives?', 'How does this compare to...?'] },
      { trigger: /create|build|add/i, followUps: ['Can you show the full implementation?', 'What tests should I add?', 'How should I handle errors?'] },
    ]

    for (const { trigger, followUps } of followUpPatterns) {
      if (trigger.test(content)) {
        followUps.forEach((followUp, index) => {
          suggestions.push({
            id: `followup-${index}`,
            text: followUp,
            type: 'follow-up',
            priority: 'medium',
            confidence: 0.7 - (index * 0.1),
            description: 'Follow-up question',
            icon: 'follow-up',
            metadata: {
              source: 'conversation-history',
              relatedMessages: [lastAssistantMessage.id],
              topics: this.extractTopics(content),
              generatedAt: new Date(),
              expiresAt: new Date(Date.now() + this.config.suggestionExpiry),
            },
          })
        })
        break
      }
    }

    return suggestions
  }

  private generateTemplates(): SmartSuggestion[] {
    const input = this.state.currentInput.toLowerCase()
    const suggestions: SmartSuggestion[] = []

    const templates = [
      { keywords: ['debug', 'fix', 'error'], template: 'Help me debug this error: ', icon: 'template' },
      { keywords: ['explain', 'what', 'how'], template: 'Explain how ', icon: 'template' },
      { keywords: ['create', 'build', 'add'], template: 'Create a new ', icon: 'template' },
      { keywords: ['optimize', 'improve', 'performance'], template: 'Optimize this code for better performance: ', icon: 'template' },
      { keywords: ['test', 'unit', 'integration'], template: 'Write tests for ', icon: 'template' },
      { keywords: ['review', 'code review'], template: 'Review this code and suggest improvements: ', icon: 'template' },
      { keywords: ['refactor', 'clean'], template: 'Refactor this code to be more maintainable: ', icon: 'template' },
      { keywords: ['document', 'readme', 'docs'], template: 'Add documentation for ', icon: 'template' },
      { keywords: ['security', 'vulnerability', 'secure'], template: 'Check for security vulnerabilities in: ', icon: 'template' },
      { keywords: ['translate', 'translation', 'language'], template: 'Translate this to English: ', icon: 'template' },
    ]

    templates.forEach(({ keywords, template, icon }, index) => {
      if (keywords.some(keyword => input.includes(keyword))) {
        suggestions.push({
          id: `template-${index}`,
          text: template,
          type: 'template',
          priority: 'medium',
          confidence: 0.6,
          description: 'Use a prompt template',
          icon,
          metadata: {
            source: 'templates',
            relatedMessages: [],
            topics: keywords,
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.suggestionExpiry),
          },
        })
      }
    })

    return suggestions
  }

  private generateActions(): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    const messages = this.state.context.recentMessages

    if (messages.length > 5) {
      suggestions.push({
        id: 'action-export',
        text: 'Export this conversation',
        type: 'action',
        priority: 'low',
        confidence: 0.5,
        description: 'Save conversation for later',
        icon: 'action',
        metadata: {
          source: 'context-analysis',
          relatedMessages: [],
          topics: ['export', 'save'],
          generatedAt: new Date(),
          expiresAt: undefined,
        },
      })
    }

    if (this.state.currentInput.length > 100) {
      suggestions.push({
        id: 'action-summarize',
        text: 'Summarize my message',
        type: 'action',
        priority: 'low',
        confidence: 0.4,
        description: 'Create a concise summary',
        icon: 'action',
        metadata: {
          source: 'context-analysis',
          relatedMessages: [],
          topics: ['summarize'],
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + this.config.suggestionExpiry),
        },
      })
    }

    return suggestions
  }

  private generateCorrections(): SmartSuggestion[] {
    const input = this.state.currentInput
    const suggestions: SmartSuggestion[] = []

    const corrections: Record<string, string> = {
      'teh': 'the',
      'recieve': 'receive',
      'occured': 'occurred',
      'seperate': 'separate',
      'definately': 'definitely',
      'accomodate': 'accommodate',
      'acheive': 'achieve',
      'adress': 'address',
      'begining': 'beginning',
      'beleive': 'believe',
    }

    const words = input.split(' ')
    const correctedWords = words.map(word => {
      const lower = word.toLowerCase()
      return corrections[lower] || word
    })

    const correctedText = correctedWords.join(' ')
    if (correctedText !== input) {
      suggestions.push({
        id: 'correction-spelling',
        text: correctedText,
        type: 'correction',
        priority: 'high',
        confidence: 0.9,
        description: 'Fix spelling',
        icon: 'correction',
        metadata: {
          source: 'context-analysis',
          relatedMessages: [],
          topics: [],
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + this.config.suggestionExpiry),
        },
      })
    }

    return suggestions
  }

  private analyzeContext(): void {
    const messages = this.state.context.recentMessages
    if (messages.length === 0) return

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      this.state.context.currentTopic = this.extractMainTopic(lastUserMessage.content)
    }

    this.state.context.entities = this.extractEntities(
      messages.map(m => m.content).join(' ')
    )

    this.state.context.sentiment = this.analyzeSentiment(
      messages.slice(-3).map(m => m.content).join(' ')
    )

    if (messages.length > 3) {
      this.state.context.summary = this.generateSummary(messages)
    }
  }

  private learnFromMessages(messages: ConversationMessage[]): void {
    const userMessages = messages.filter(m => m.role === 'user')

    for (const msg of userMessages) {
      const phrases = this.extractPhrases(msg.content)
      for (const phrase of phrases) {
        const count = this.state.userPatterns.frequentPhrases.get(phrase) || 0
        this.state.userPatterns.frequentPhrases.set(phrase, count + 1)
      }
    }

    const followUps = userMessages
      .filter(m => m.content.endsWith('?'))
      .map(m => m.content)

    this.state.userPatterns.followUpPatterns = [...new Set(followUps)].slice(0, 10)

    const allContent = userMessages.map(m => m.content).join(' ')
    this.state.userPatterns.preferredTopics = this.extractTopics(allContent)

    const totalLength = userMessages.reduce((sum, m) => sum + m.content.length, 0)
    this.state.userPatterns.averageMessageLength = userMessages.length > 0
      ? totalLength / userMessages.length
      : 0
  }

  private startPatternLearning(): void {
    this.patternLearningTimer = setInterval(() => {
      if (this.state.context.recentMessages.length > 0) {
        this.learnFromMessages(this.state.context.recentMessages)
      }
    }, 5 * 60 * 1000)
  }

  private extractTopics(text: string): string[] {
    const topics: string[] = []
    const topicKeywords = [
      'javascript', 'typescript', 'react', 'node', 'python', 'api', 'database',
      'css', 'html', 'testing', 'deployment', 'security', 'performance', 'ui', 'ux',
    ]

    const lowerText = text.toLowerCase()
    for (const topic of topicKeywords) {
      if (lowerText.includes(topic)) {
        topics.push(topic)
      }
    }

    return topics
  }

  private extractMainTopic(text: string): string {
    const words = text.split(' ').slice(0, 5)
    return words.join(' ')
  }

  private extractEntities(text: string): string[] {
    const entities: string[] = []
    const patterns = [
      /\b[A-Z][a-z]+\b/g,
      /\b\d+\b/g,
      /`[^`]+`/g,
    ]

    for (const pattern of patterns) {
      const matches = text.match(pattern) || []
      entities.push(...matches)
    }

    return [...new Set(entities)].slice(0, 10)
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'awesome', 'thanks', 'helpful', 'perfect', 'excellent']
    const negativeWords = ['bad', 'error', 'bug', 'wrong', 'broken', 'fail', 'issue', 'problem']

    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private generateSummary(messages: ConversationMessage[]): string {
    const recentMessages = messages.slice(-5)
    const topics = new Set<string>()

    for (const msg of recentMessages) {
      const msgTopics = this.extractTopics(msg.content)
      msgTopics.forEach(t => topics.add(t))
    }

    return `Discussion about ${[...topics].join(', ') || 'various topics'}`
  }

  private extractPhrases(text: string): string[] {
    const phrases: string[] = []
    const words = text.split(' ')

    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`)
      if (i < words.length - 2) {
        phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
      }
    }

    return phrases.filter(p => p.length > 5)
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch (error) {
        console.error('SmartSuggestions listener error:', error)
      }
    }
  }
}

/**
 * Singleton instance.
 */
let instance: SmartSuggestionsEngine | null = null

export function getSmartSuggestionsEngine(
  config?: Partial<SmartSuggestionsConfig>
): SmartSuggestionsEngine {
  if (!instance) {
    instance = new SmartSuggestionsEngine(config)
  }
  return instance
}

/**
 * Format suggestion for display.
 */
export function formatSuggestion(suggestion: SmartSuggestion): string {
  return `[${suggestion.type}] ${suggestion.text}`
}

/**
 * Get suggestion type color.
 */
export function getSuggestionTypeColor(type: SuggestionType): string {
  switch (type) {
    case 'completion': return '#3b82f6'
    case 'follow-up': return '#8b5cf6'
    case 'related': return '#06b6d4'
    case 'action': return '#10b981'
    case 'template': return '#f59e0b'
    case 'correction': return '#ef4444'
    case 'enhancement': return '#ec4899'
    case 'quick-reply': return '#6366f1'
    default: return '#6b7280'
  }
}
