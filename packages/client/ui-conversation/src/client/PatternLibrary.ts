/**
 * Pattern Library Engine — Code pattern detection and recommendations.
 *
 * Detects design patterns, anti-patterns, and architectural patterns in code.
 * Provides recommendations for improvements and suggests appropriate patterns.
 *
 * @module PatternLibrary
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Pattern type classification. */
export type PatternType = 'design' | 'anti-pattern' | 'architectural' | 'concurrency' | 'data';

/** Pattern category. */
export type PatternCategory =
  | 'creational'
  | 'structural'
  | 'behavioral'
  | 'concurrency'
  | 'error-handling'
  | 'data-access'
  | 'ui'
  | 'testing'
  | 'security'
  | 'performance';

/** A detected pattern. */
export interface DetectedPattern {
  readonly id: string;
  readonly name: string;
  readonly type: PatternType;
  readonly category: PatternCategory;
  readonly confidence: number;
  readonly location: {
    readonly startLine: number;
    readonly endLine: number;
    readonly file: string;
  };
  readonly description: string;
  readonly evidence: readonly string[];
  readonly suggestion?: string;
  readonly relatedPatterns: readonly string[];
}

/** Pattern definition. */
export interface PatternDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: PatternType;
  readonly category: PatternCategory;
  readonly description: string;
  readonly benefits: readonly string[];
  readonly drawbacks: readonly string[];
  readonly whenToUse: readonly string[];
  readonly examples: readonly string[];
  readonly relatedPatterns: readonly string[];
}

/** Pattern detection rule. */
interface PatternRule {
  readonly patternId: string;
  readonly detector: (code: string, lines: readonly string[]) => DetectedPattern | null;
}

// ---------------------------------------------------------------------------
// Pattern Definitions
// ---------------------------------------------------------------------------

const PATTERN_DEFINITIONS: readonly PatternDefinition[] = [
  // Design Patterns
  {
    id: 'singleton',
    name: 'Singleton',
    type: 'design',
    category: 'creational',
    description: 'Ensures a class has only one instance and provides global access',
    benefits: ['Controlled access to sole instance', 'Reduced namespace pollution', 'Lazy initialization'],
    drawbacks: ['Hidden dependencies', 'Testing difficulties', 'Violates Single Responsibility'],
    whenToUse: ['Database connections', 'Configuration managers', 'Logging services'],
    examples: ['class Logger { private static instance: Logger; static getInstance() {} }'],
    relatedPatterns: ['factory', 'dependency-injection'],
  },
  {
    id: 'observer',
    name: 'Observer',
    type: 'design',
    category: 'behavioral',
    description: 'Defines a one-to-many dependency between objects',
    benefits: ['Loose coupling', 'Dynamic relationships', 'Event-driven architecture'],
    drawbacks: ['Memory leaks if not managed', 'Order of notification uncertain', 'Cascade updates'],
    whenToUse: ['Event systems', 'UI state management', 'Message brokers'],
    examples: ['subscribe/unpublish pattern', 'EventEmitter'],
    relatedPatterns: ['mediator', 'pub-sub'],
  },
  {
    id: 'factory',
    name: 'Factory',
    type: 'design',
    category: 'creational',
    description: 'Creates objects without specifying the exact class',
    benefits: ['Loose coupling', 'Single Responsibility', 'Open/Closed Principle'],
    drawbacks: ['Increased complexity', 'More classes to maintain'],
    whenToUse: ['Object creation varies', 'Framework design', 'Plugin systems'],
    examples: ['createParser(format)', 'DatabaseDriver.create(type)'],
    relatedPatterns: ['abstract-factory', 'builder', 'prototype'],
  },
  {
    id: 'strategy',
    name: 'Strategy',
    type: 'design',
    category: 'behavioral',
    description: 'Defines a family of algorithms and makes them interchangeable',
    benefits: ['Algorithm flexibility', 'Eliminates conditionals', 'Open/Closed Principle'],
    drawbacks: ['Clients must be aware of strategies', 'Increased number of classes'],
    whenToUse: ['Multiple sorting algorithms', 'Payment processing', 'Compression algorithms'],
    examples: ['interface SortStrategy { sort(data: T[]): T[] }'],
    relatedPatterns: ['state', 'command'],
  },
  {
    id: 'decorator',
    name: 'Decorator',
    type: 'design',
    category: 'structural',
    description: 'Dynamically adds responsibilities to objects',
    benefits: ['Flexible alternative to subclassing', 'Single Responsibility', 'Stackable behaviors'],
    drawbacks: ['Many small objects', 'Order of decorators matters'],
    whenToUse: ['Adding behavior to objects', 'Middleware stacks', 'Logging/authentication layers'],
    examples: ['withLogging(withRetry(fetch))'],
    relatedPatterns: ['proxy', 'adapter'],
  },
  // Anti-patterns
  {
    id: 'god-object',
    name: 'God Object',
    type: 'anti-pattern',
    category: 'structural',
    description: 'A class that knows too much or does too much',
    benefits: [],
    drawbacks: ['Hard to maintain', 'Low cohesion', 'High coupling', 'Testing nightmare'],
    whenToUse: [],
    examples: ['A class with 50+ methods', 'A module handling 10+ responsibilities'],
    relatedPatterns: ['single-responsibility', 'facade'],
  },
  {
    id: 'spaghetti-code',
    name: 'Spaghetti Code',
    type: 'anti-pattern',
    category: 'behavioral',
    description: 'Unstructured and difficult to maintain code',
    benefits: [],
    drawbacks: ['Hard to understand', 'Difficult to modify', 'Bug-prone'],
    whenToUse: [],
    examples: ['Deeply nested conditions', 'GOTO statements', 'Global state mutation'],
    relatedPatterns: ['structured-programming', 'clean-code'],
  },
  {
    id: 'golden-hammer',
    name: 'Golden Hammer',
    type: 'anti-pattern',
    category: 'creational',
    description: 'Using a familiar solution for every problem',
    benefits: [],
    drawbacks: ['Suboptimal solutions', 'Missed better alternatives', 'Technical debt'],
    whenToUse: [],
    examples: ['Using regex for HTML parsing', 'Using a database for caching'],
    relatedPatterns: ['right-tool-for-the-job'],
  },
  {
    id: 'premature-optimization',
    name: 'Premature Optimization',
    type: 'anti-pattern',
    category: 'performance',
    description: 'Optimizing code before proving it necessary',
    benefits: [],
    drawbacks: ['Wasted effort', 'Reduced readability', 'May introduce bugs'],
    whenToUse: [],
    examples: ['Caching everything upfront', 'Bit-level optimizations in application code'],
    relatedPatterns: ['profile-first'],
  },
  {
    id: 'copy-paste',
    name: 'Copy-Paste Programming',
    type: 'anti-pattern',
    category: 'structural',
    description: 'Duplicating code instead of abstracting',
    benefits: [],
    drawbacks: ['Maintenance nightmare', 'Inconsistent updates', 'Bug duplication'],
    whenToUse: [],
    examples: ['Duplicated validation logic', 'Similar API handlers with slight variations'],
    relatedPatterns: ['DRY', 'extraction'],
  },
  // Architectural Patterns
  {
    id: 'mvc',
    name: 'MVC (Model-View-Controller)',
    type: 'architectural',
    category: 'structural',
    description: 'Separates application into Model, View, and Controller',
    benefits: ['Separation of concerns', 'Multiple views', 'Testability'],
    drawbacks: ['Complexity', 'Tight coupling possible'],
    whenToUse: ['Web applications', 'Desktop apps', 'Complex UIs'],
    examples: ['Express.js routes', 'React components with Redux'],
    relatedPatterns: ['mvp', 'mvvm', 'clean-architecture'],
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    type: 'architectural',
    category: 'structural',
    description: 'Structures application as a collection of loosely coupled services',
    benefits: ['Independent deployment', 'Technology diversity', 'Scalability'],
    drawbacks: ['Distributed complexity', 'Network latency', 'Data consistency'],
    whenToUse: ['Large systems', 'Team scaling', 'Different tech stacks'],
    examples: ['User service', 'Order service', 'Payment service'],
    relatedPatterns: ['service-mesh', 'event-sourcing', 'cqrs'],
  },
  {
    id: 'event-sourcing',
    name: 'Event Sourcing',
    type: 'architectural',
    category: 'data-access',
    description: 'Stores state changes as a sequence of events',
    benefits: ['Complete audit trail', 'Time travel', 'Temporal queries'],
    drawbacks: ['Complexity', 'Event versioning', 'Query complexity'],
    whenToUse: ['Financial systems', 'Audit requirements', 'Collaborative editing'],
    examples: ['OrderCreated → OrderPaid → OrderShipped'],
    relatedPatterns: ['cqrs', 'saga', 'event-storming'],
  },
];

// ---------------------------------------------------------------------------
// Detection Rules
// ---------------------------------------------------------------------------

function detectSingleton(code: string, lines: readonly string[]): DetectedPattern | null {
  const hasStaticInstance = /private\s+static\s+instance/.test(code)
  const hasGetInstance = /static\s+getInstance/.test(code)

  if (hasStaticInstance && hasGetInstance) {
    return {
      id: 'detected-singleton',
      name: 'Singleton',
      type: 'design',
      category: 'creational',
      confidence: 0.9,
      location: { startLine: 1, endLine: lines.length, file: '' },
      description: 'Singleton pattern detected',
      evidence: ['Static instance field', 'getInstance method'],
      relatedPatterns: ['singleton'],
    }
  }
  void code // used for detection above
  return null
}

function detectGodObject(code: string, lines: readonly string[]): DetectedPattern | null {
  const methodCount = (code.match(/(?:public|private|protected|static)\s+\w+\s*\(/g) || []).length
  const lineCount = lines.length

  if (methodCount > 20 || lineCount > 500) {
    return {
      id: 'detected-god-object',
      name: 'God Object',
      type: 'anti-pattern',
      category: 'structural',
      confidence: Math.min(0.9, 0.5 + (methodCount * 0.02)),
      location: { startLine: 1, endLine: lines.length, file: '' },
      description: `Class has ${methodCount} methods and ${lineCount} lines — consider splitting`,
      evidence: [`${methodCount} methods detected`, `${lineCount} lines of code`],
      suggestion: 'Break into smaller, focused classes with single responsibilities',
      relatedPatterns: ['god-object', 'single-responsibility'],
    }
  }
  void code // used for detection above
  return null
}

function detectSpaghettiCode(_code: string, lines: readonly string[]): DetectedPattern | null {
  let maxNesting = 0
  let currentNesting = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.endsWith('{') || /if\s*\(|for\s*\(|while\s*\(|switch\s*\(/.test(trimmed)) {
      currentNesting++
      maxNesting = Math.max(maxNesting, currentNesting)
    } else if (trimmed === '}' || trimmed.startsWith('}')) {
      currentNesting = Math.max(0, currentNesting - 1)
    }
  }

  if (maxNesting > 5) {
    return {
      id: 'detected-spaghetti',
      name: 'Spaghetti Code',
      type: 'anti-pattern',
      category: 'behavioral',
      confidence: Math.min(0.85, 0.4 + (maxNesting * 0.08)),
      location: { startLine: 1, endLine: lines.length, file: '' },
      description: `Maximum nesting depth: ${maxNesting} — code is hard to follow`,
      evidence: [`Max nesting depth: ${maxNesting}`],
      suggestion: 'Extract complex logic into named functions, use early returns',
      relatedPatterns: ['spaghetti-code', 'clean-code'],
    }
  }
  return null
}

function detectCopyPaste(_code: string, lines: readonly string[]): DetectedPattern | null {
  const lineSet = new Map<string, number>()
  const duplicates: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 20 && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      const count = (lineSet.get(trimmed) || 0) + 1
      lineSet.set(trimmed, count)
      if (count === 2) {
        duplicates.push(trimmed)
      }
    }
  }

  if (duplicates.length > 3) {
    return {
      id: 'detected-copy-paste',
      name: 'Copy-Paste Programming',
      type: 'anti-pattern',
      category: 'structural',
      confidence: Math.min(0.8, 0.3 + (duplicates.length * 0.05)),
      location: { startLine: 1, endLine: lines.length, file: '' },
      description: `${duplicates.length} duplicated code blocks detected`,
      evidence: duplicates.slice(0, 3).map(d => `Duplicated: "${d.slice(0, 50)}..."`),
      suggestion: 'Extract common logic into shared functions or utilities',
      relatedPatterns: ['copy-paste', 'DRY'],
    }
  }
  return null
}

const DETECTION_RULES: readonly PatternRule[] = [
  { patternId: 'singleton', detector: detectSingleton },
  { patternId: 'god-object', detector: detectGodObject },
  { patternId: 'spaghetti-code', detector: detectSpaghettiCode },
  { patternId: 'copy-paste', detector: detectCopyPaste },
]

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export interface PatternLibraryConfig {
  readonly enabledTypes: readonly PatternType[];
  readonly enabledCategories: readonly PatternCategory[];
  readonly confidenceThreshold: number;
  readonly maxPatterns: number;
}

const PATTERN_DEFAULT_CONFIG: PatternLibraryConfig = {
  enabledTypes: ['design', 'anti-pattern', 'architectural', 'concurrency', 'data'],
  enabledCategories: ['creational', 'structural', 'behavioral', 'concurrency', 'error-handling', 'data-access', 'ui', 'testing', 'security', 'performance'],
  confidenceThreshold: 0.5,
  maxPatterns: 100,
}

export interface PatternLibraryEvent {
  readonly type: 'detect' | 'recommend' | 'error';
  readonly timestamp: number;
  readonly data: unknown;
}

export class PatternLibraryEngine {
  private config: PatternLibraryConfig
  private eventListeners: Array<(event: PatternLibraryEvent) => void> = []

  constructor(config: Partial<PatternLibraryConfig> = {}) {
    this.config = { ...PATTERN_DEFAULT_CONFIG, ...config }
  }

  /** Get all pattern definitions. */
  getDefinitions(): readonly PatternDefinition[] {
    return PATTERN_DEFINITIONS.filter(
      p => this.config.enabledTypes.includes(p.type) &&
        this.config.enabledCategories.includes(p.category)
    )
  }

  /** Get a specific pattern definition. */
  getDefinition(id: string): PatternDefinition | undefined {
    return PATTERN_DEFINITIONS.find(p => p.id === id)
  }

  /** Detect patterns in code. */
  detectPatterns(code: string, filename: string = ''): readonly DetectedPattern[] {
    const lines = code.split('\n')
    const detected: DetectedPattern[] = []

    for (const rule of DETECTION_RULES) {
      const result = rule.detector(code, lines)
      if (result && result.confidence >= this.config.confidenceThreshold) {
        detected.push({
          ...result,
          location: { ...result.location, file: filename },
        })
      }
    }

    this.emit({
      type: 'detect',
      timestamp: Date.now(),
      data: { filename, count: detected.length },
    })

    return detected.slice(0, this.config.maxPatterns)
  }

  /** Recommend patterns based on code analysis. */
  recommendPatterns(code: string): readonly PatternDefinition[] {
    const detected = this.detectPatterns(code)
    const recommendations: PatternDefinition[] = []

    // Recommend patterns to fix anti-patterns
    for (const pattern of detected) {
      if (pattern.type === 'anti-pattern') {
        const related = PATTERN_DEFINITIONS.filter(
          p => pattern.relatedPatterns.includes(p.id) && p.type === 'design'
        )
        recommendations.push(...related)
      }
    }

    // Recommend architectural patterns based on code size
    const lineCount = code.split('\n').length
    if (lineCount > 1000) {
      const archPatterns = PATTERN_DEFINITIONS.filter(p => p.type === 'architectural')
      recommendations.push(...archPatterns.slice(0, 2))
    }

    this.emit({
      type: 'recommend',
      timestamp: Date.now(),
      data: { count: recommendations.length },
    })

    // Deduplicate
    const seen = new Set<string>()
    return recommendations.filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }

  /** Get pattern statistics. */
  getStatistics(code: string): {
    readonly totalPatterns: number;
    readonly designPatterns: number;
    readonly antiPatterns: number;
    readonly architecturalPatterns: number;
    readonly healthScore: number;
  } {
    const detected = this.detectPatterns(code)

    const designPatterns = detected.filter(p => p.type === 'design').length
    const antiPatterns = detected.filter(p => p.type === 'anti-pattern').length
    const architecturalPatterns = detected.filter(p => p.type === 'architectural').length

    // Health score: higher is better
    const healthScore = Math.max(0, Math.min(100,
      100 - (antiPatterns * 20) + (designPatterns * 5)
    ))

    return {
      totalPatterns: detected.length,
      designPatterns,
      antiPatterns,
      architecturalPatterns,
      healthScore,
    }
  }

  /** Register an event listener. */
  onEvent(listener: (event: PatternLibraryEvent) => void): () => void {
    this.eventListeners.push(listener)
    return () => {
      const idx = this.eventListeners.indexOf(listener)
      if (idx !== -1) this.eventListeners.splice(idx, 1)
    }
  }

  private emit(event: PatternLibraryEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _instance: PatternLibraryEngine | undefined

export function getPatternLibraryEngine(config?: Partial<PatternLibraryConfig>): PatternLibraryEngine {
  if (!_instance) _instance = new PatternLibraryEngine(config)
  return _instance
}

export function resetPatternLibraryEngine(): void {
  _instance = undefined
}
