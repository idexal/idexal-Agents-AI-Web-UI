/**
 * AI-Powered Code Explanation Engine for Idexal Agents.
 * Multi-level code explanation with diagrams, complexity analysis,
 * and multilingual support.
 */

/** Explanation level */
export type ExplanationLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/** Code entity type */
export type CodeEntityType =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'variable'
  | 'module'
  | 'expression'
  | 'block'

/** Explanation language */
export type ExplanationLanguage = 'en' | 'ar' | 'zh'

/** Code explanation */
export interface CodeExplanation {
  id: string
  code: string
  entityType: CodeEntityType
  level: ExplanationLevel
  language: ExplanationLanguage
  summary: string
  detailed: string
  params?: ParamExplanation[]
  returns?: string
  examples: CodeExample[]
  complexity: ComplexityNotes
  relatedConcepts: string[]
  warnings: string[]
  diagram?: string
  timestamp: number
}

/** Parameter explanation */
export interface ParamExplanation {
  name: string
  type: string
  description: string
  defaultValue?: string
  required: boolean
}

/** Code example */
export interface CodeExample {
  title: string
  code: string
  explanation: string
}

/** Complexity notes */
export interface ComplexityNotes {
  timeComplexity: string
  spaceComplexity: string
  readabilityScore: number
  maintainability: string
}

/** Explanation request */
export interface ExplanationRequest {
  code: string
  entityType?: CodeEntityType
  level?: ExplanationLevel
  language?: ExplanationLanguage
  includeExamples?: boolean
  includeDiagram?: boolean
}

/** Explanation config */
export interface AICodeExplanationConfig {
  defaultLevel: ExplanationLevel
  defaultLanguage: ExplanationLanguage
  maxCodeLength: number
  includeDiagrams: boolean
  cacheResults: boolean
}

/** Explanation event */
export interface ExplanationEvent {
  type: 'explanation-generated' | 'explanation-cached'
  explanation?: CodeExplanation
}

function getSummaries(lang: ExplanationLanguage): Record<CodeEntityType, string> {
  if (lang === 'ar') {
    return {
      function: 'هذا الكود يحدد دالة.',
      class: 'هذا الكود يحدد فئة مع طرق وخصائص.',
      interface: 'هذا الكود يحدد واجهة TypeScript تحدد عقد نوع.',
      type: 'هذا الكود يحدد اسم مستعار لنوع TypeScript.',
      variable: 'هذا الكود يعلن عن قيمة ثابتة ويصدّرها.',
      module: 'هذا الكود يستورد أو يصدّر وحدات.',
      expression: 'هذا الكود يقيّم تعبيراً.',
      block: 'هذا الكود يحتوي على مجموعة من العبارات.',
    }
  }
  if (lang === 'zh') {
    return {
      function: '此代码定义了一个函数。',
      class: '此代码定义了一个包含方法和属性的类。',
      interface: '此代码定义了一个TypeScript接口。',
      type: '此代码定义了一个TypeScript类型别名。',
      variable: '此代码声明并导出一个常量值。',
      module: '此代码导入或导出模块。',
      expression: '此代码求值一个表达式。',
      block: '此代码包含一个语句块。',
    }
  }
  return {
    function: 'This code defines a function that performs a specific task.',
    class: 'This code defines a class with methods and properties.',
    interface: 'This code defines a TypeScript interface specifying a type contract.',
    type: 'This code defines a TypeScript type alias.',
    variable: 'This code declares and exports a constant value.',
    module: 'This code imports or exports modules.',
    expression: 'This code evaluates an expression.',
    block: 'This code contains a block of statements.',
  }
}

function getDetailedTemplate(lang: ExplanationLevel, entity: CodeEntityType, name: string): string {
  if (lang === 'beginner') {
    return `This is a ${entity} called "${name}". ${entity === 'function' ? 'Functions are reusable blocks of code.' : 'It defines a type or structure used in the codebase.'}`
  }
  if (lang === 'intermediate') {
    return `The ${entity} "${name}" ${entity === 'function' ? 'takes parameters and returns a value. It encapsulates a specific operation.' : 'encapsulates related data and behavior.'}`
  }
  if (lang === 'advanced') {
    return `The ${entity} "${name}" implements a specific pattern. Consider its time/space complexity, side effects, and error handling when using it.`
  }
  return `Deep analysis of "${name}": design patterns used, safety guarantees, extensibility points, backwards compatibility, and performance implications.`
}

/**
 * AI-Powered Code Explanation Engine.
 */
export class AICodeExplanationEngine {
  private config: AICodeExplanationConfig
  private cache: Map<string, CodeExplanation> = new Map()
  private listeners: Set<(event: ExplanationEvent) => void> = new Set()

  constructor(config: Partial<AICodeExplanationConfig> = {}) {
    this.config = {
      defaultLevel: config.defaultLevel ?? 'intermediate',
      defaultLanguage: config.defaultLanguage ?? 'en',
      maxCodeLength: config.maxCodeLength ?? 10000,
      includeDiagrams: config.includeDiagrams ?? true,
      cacheResults: config.cacheResults ?? true,
    }
  }

  explain(request: ExplanationRequest): CodeExplanation {
    const code = request.code.trim()
    const level = request.level ?? this.config.defaultLevel
    const language = request.language ?? this.config.defaultLanguage

    const cacheKey = `${code.slice(0, 200)}:${level}:${language}`
    if (this.config.cacheResults) {
      const cached = this.cache.get(cacheKey)
      if (cached) return cached
    }

    const entityType = request.entityType ?? this.detectEntityType(code)
    const summaries = getSummaries(language)
    const nameMatch = code.match(/(?:function|class|interface|type|const)\s+(\w+)/)
    const name = nameMatch?.[1] ?? 'code'

    const params = this.extractParams(code, entityType)
    const returns = this.extractReturns(code, entityType)
    const diagram = request.includeDiagram !== false ? this.generateDiagram(name, entityType) : undefined

    const explanation: CodeExplanation = {
      id: `expl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      entityType,
      level,
      language,
      summary: summaries[entityType] ?? summaries.expression,
      detailed: getDetailedTemplate(level, entityType, name),
      examples: request.includeExamples !== false ? this.generateExamples(name, language) : [],
      complexity: this.analyzeComplexity(code),
      relatedConcepts: this.findRelatedConcepts(code, entityType),
      warnings: this.findWarnings(code),
      timestamp: Date.now(),
    }
    if (params !== undefined) explanation.params = params
    if (returns !== undefined) explanation.returns = returns
    if (diagram !== undefined) explanation.diagram = diagram

    if (this.config.cacheResults) {
      this.cache.set(cacheKey, explanation)
    }

    this.notifyListeners({ type: 'explanation-generated', explanation })
    return explanation
  }

  private detectEntityType(code: string): CodeEntityType {
    if (/^\s*export\s+(async\s+)?function\b/.test(code)) return 'function'
    if (/^\s*export\s+class\b/.test(code)) return 'class'
    if (/^\s*export\s+interface\b/.test(code)) return 'interface'
    if (/^\s*export\s+type\b/.test(code)) return 'type'
    if (/^\s*export\s+const\b/.test(code)) return 'variable'
    if (code.includes('=>') || code.includes('function')) return 'function'
    if (code.includes('class')) return 'class'
    if (code.includes('interface')) return 'interface'
    if (code.includes('import') || code.includes('export')) return 'module'
    return 'expression'
  }

  private extractParams(code: string, entityType: CodeEntityType): ParamExplanation[] | undefined {
    if (entityType !== 'function') return undefined
    const paramMatch = code.match(/\(([^)]*)\)/)
    if (!paramMatch?.[1]) return undefined

    return paramMatch[1].split(',').map(p => {
      const parts = p.trim().split(/[\s:]/)
      const pName = parts[0]?.replace(/[=?].*$/, '') ?? ''
      const pType = parts.find(s => s.includes(':'))?.replace(':', '').trim() ?? 'unknown'
      const hasDefault = p.includes('=')
      const defaultValue = hasDefault ? p.split('=')[1]?.trim() : undefined
      const result: ParamExplanation = {
        name: pName,
        type: pType,
        description: `The ${pName} parameter`,
        required: !hasDefault,
      }
      if (defaultValue !== undefined) result.defaultValue = defaultValue
      return result
    }).filter(p => p.name)
  }

  private extractReturns(code: string, entityType: CodeEntityType): string | undefined {
    if (entityType !== 'function') return undefined
    const returnMatch = code.match(/:\s*(\w+(?:<[^>]+>)?(?:\[\])?)/)
    return returnMatch ? `Returns ${returnMatch[1]}` : 'Returns void'
  }

  private generateExamples(name: string, language: ExplanationLanguage): CodeExample[] {
    if (language === 'ar') {
      return [{ title: 'مثال بسيط', code: `// مثال على استخدام ${name}`, explanation: `هذا مثال أساسي على كيفية استخدام ${name}` }]
    }
    if (language === 'zh') {
      return [{ title: '基本示例', code: `// 使用 ${name} 的示例`, explanation: `这是一个展示如何使用 ${name} 的基本示例` }]
    }
    return [
      { title: 'Basic Usage', code: `// Basic usage of ${name}\n${name}()`, explanation: `Simple invocation of ${name}` },
      { title: 'With Parameters', code: `// Calling ${name} with parameters\n${name}(arg1, arg2)`, explanation: `Passing arguments to ${name}` },
    ]
  }

  private analyzeComplexity(code: string): ComplexityNotes {
    const lines = code.split('\n')
    let loops = 0, conditions = 0, nesting = 0, maxNesting = 0

    for (const line of lines) {
      if (/for|while|do/.test(line)) loops++
      if (/if|else|switch|case|\?/.test(line)) conditions++
      for (const ch of line) {
        if (ch === '{') { nesting++; maxNesting = Math.max(maxNesting, nesting) }
        if (ch === '}') nesting--
      }
    }

    const complexity = 1 + loops + conditions
    const timeComplexity = complexity <= 3 ? 'O(1)' : complexity <= 7 ? 'O(n)' : complexity <= 15 ? 'O(n log n)' : 'O(n²+)'

    return {
      timeComplexity,
      spaceComplexity: maxNesting <= 2 ? 'O(1)' : 'O(n)',
      readabilityScore: Math.max(1, 10 - maxNesting - Math.floor(lines.length / 20)),
      maintainability: lines.length < 30 ? 'Good' : lines.length < 100 ? 'Moderate' : 'Needs refactoring',
    }
  }

  private findRelatedConcepts(code: string, entityType: CodeEntityType): string[] {
    const concepts: string[] = []
    if (entityType === 'function') concepts.push('Higher-Order Functions', 'Closures', 'Recursion')
    if (entityType === 'class') concepts.push('Inheritance', 'Polymorphism', 'Encapsulation')
    if (entityType === 'interface') concepts.push('Type Contracts', 'Generics', 'Structural Typing')
    if (code.includes('async') || code.includes('await')) concepts.push('Promises', 'Async/Await', 'Concurrency')
    if (code.includes('=>')) concepts.push('Arrow Functions', 'Lexical Scope')
    if (code.includes('Promise')) concepts.push('Error Handling', 'Promise Chaining')
    return concepts
  }

  private findWarnings(code: string): string[] {
    const warnings: string[] = []
    if (code.includes('any')) warnings.push('Usage of "any" type reduces type safety')
    if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(code)) warnings.push('Empty catch block silently swallows errors')
    if (code.includes('eval(')) warnings.push('eval() is a security risk')
    return warnings
  }

  private generateDiagram(name: string, entityType: CodeEntityType): string | undefined {
    if (entityType === 'function') {
      return `graph LR\n  A[Input]-->B[${name}]-->C[Output]`
    }
    if (entityType === 'class') {
      return `classDiagram\n  class ${name} {\n    +method()\n    -property\n  }`
    }
    return undefined
  }

  subscribe(listener: (event: ExplanationEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: ExplanationEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }

  clearCache(): void { this.cache.clear() }
}

/** Singleton */
let instance: AICodeExplanationEngine | null = null

export function getAICodeExplanationEngine(config?: Partial<AICodeExplanationConfig>): AICodeExplanationEngine {
  if (!instance) instance = new AICodeExplanationEngine(config)
  return instance
}

export function resetAICodeExplanationEngine(): void { instance = null }
