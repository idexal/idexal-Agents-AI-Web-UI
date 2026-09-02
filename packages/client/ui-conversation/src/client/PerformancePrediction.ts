/**
 * Performance Prediction Engine for Idexal Agents.
 * Predicts code performance bottlenecks before execution
 * and provides optimization suggestions.
 */

/** Performance metric type */
export type PerformanceMetricType =
  | 'time-complexity'
  | 'space-complexity'
  | 'memory-allocation'
  | 'cpu-usage'
  | 'i-o-operations'
  | 'network-calls'
  | 'dom-manipulations'
  | 'render-calls'

/** Performance issue type */
export type PerformanceIssueType =
  | 'nested-loop'
  | 'recursive-call'
  | 'memory-leak'
  | 'excessive-allocation'
  | 'blocking-operation'
  | 'inefficient-query'
  | 'missing-cache'
  | 'unoptimized-render'

/** Performance prediction */
export interface PerformancePrediction {
  /** Prediction ID */
  id: string
  /** Code section */
  codeSection: string
  /** File path */
  filePath: string
  /** Line number */
  line: number
  /** End line */
  endLine: number
  /** Issue type */
  issueType: PerformanceIssueType
  /** Severity */
  severity: 'critical' | 'high' | 'medium' | 'low'
  /** Description */
  description: string
  /** Estimated impact */
  impact: {
    /** Time impact (ms) */
    timeMs: number
    /** Memory impact (MB) */
    memoryMB: number
    /** Risk level (0-100) */
    riskLevel: number
  }
  /** Suggestion */
  suggestion: string
  /** Optimized code */
  optimizedCode?: string
  /** Complexity analysis */
  complexity: {
    /** Time complexity */
    time: string
    /** Space complexity */
    space: string
  }
}

/** Code analysis result */
export interface CodeAnalysis {
  /** Nested loop depth */
  nestedLoops: number
  /** Recursive calls */
  recursiveCalls: string[]
  /** Memory allocations */
  allocations: number
  /** DOM manipulations */
  domOperations: number
  /** Async operations */
  asyncOperations: number
  /** Potential bottlenecks */
  bottlenecks: string[]
}

/** Performance prediction config */
export interface PerformancePredictionConfig {
  /** Enable time complexity analysis */
  enableTimeComplexity: boolean
  /** Enable space complexity analysis */
  enableSpaceComplexity: boolean
  /** Enable memory leak detection */
  enableMemoryLeakDetection: boolean
  /** Enable optimization suggestions */
  enableOptimizationSuggestions: boolean
  /** Risk threshold */
  riskThreshold: number
  /** Max predictions */
  maxPredictions: number
}

/**
 * Performance Prediction Engine.
 */
export class PerformancePredictionEngine {
  private config: PerformancePredictionConfig
  private predictions: Map<string, PerformancePrediction[]> = new Map()
  private listeners: Set<(predictions: PerformancePrediction[]) => void> = new Set()

  constructor(config: Partial<PerformancePredictionConfig> = {}) {
    this.config = {
      enableTimeComplexity: config.enableTimeComplexity ?? true,
      enableSpaceComplexity: config.enableSpaceComplexity ?? true,
      enableMemoryLeakDetection: config.enableMemoryLeakDetection ?? true,
      enableOptimizationSuggestions: config.enableOptimizationSuggestions ?? true,
      riskThreshold: config.riskThreshold ?? 50,
      maxPredictions: config.maxPredictions ?? 20,
    }
  }

  /**
   * Analyze code and predict performance issues.
   */
  analyze(filePath: string, content: string): PerformancePrediction[] {
    const lines = content.split('\n')
    const analysis = this.analyzeCode(lines)
    const predictions: PerformancePrediction[] = []

    // Detect nested loops
    if (analysis.nestedLoops > 1) {
      predictions.push(...this.detectNestedLoops(lines, filePath))
    }

    // Detect recursive calls
    if (analysis.recursiveCalls.length > 0) {
      predictions.push(...this.detectRecursiveCalls(lines, filePath, analysis.recursiveCalls))
    }

    // Detect memory leaks
    if (this.config.enableMemoryLeakDetection) {
      predictions.push(...this.detectMemoryLeaks(lines, filePath))
    }

    // Detect blocking operations
    predictions.push(...this.detectBlockingOperations(lines, filePath))

    // Detect inefficient queries
    predictions.push(...this.detectInefficientQueries(lines, filePath))

    // Detect missing cache
    predictions.push(...this.detectMissingCache(lines, filePath))

    // Detect unoptimized renders
    predictions.push(...this.detectUnoptimizedRenders(lines, filePath))

    // Filter and sort
    const filtered = predictions
      .filter(p => p.impact.riskLevel >= this.config.riskThreshold)
      .sort((a, b) => b.impact.riskLevel - a.impact.riskLevel)
      .slice(0, this.config.maxPredictions)

    this.predictions.set(filePath, filtered)
    this.notifyListeners(filtered)
    return filtered
  }

  /**
   * Analyze code structure.
   */
  private analyzeCode(lines: string[]): CodeAnalysis {
    let nestedLoops = 0
    let currentDepth = 0
    const recursiveCalls: string[] = []
    let allocations = 0
    let domOperations = 0
    let asyncOperations = 0
    const bottlenecks: string[] = []

    const functionNames = new Set<string>()

    for (const line of lines) {
      const trimmed = line.trim()

      // Track function names
      const funcMatch = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/)
      if (funcMatch) functionNames.add(funcMatch[1]!)

      // Track loop depth
      if (trimmed.match(/\b(for|while)\b/)) {
        currentDepth++
        nestedLoops = Math.max(nestedLoops, currentDepth)
      }
      if (trimmed === '}' && currentDepth > 0) {
        currentDepth--
      }

      // Detect recursive calls
      for (const funcName of functionNames) {
        if (trimmed.includes(funcName + '(') && !trimmed.includes('function ')) {
          recursiveCalls.push(funcName)
        }
      }

      // Detect allocations
      if (trimmed.match(/\b(new\s+Array|new\s+Object|new\s+Map|new\s+Set|new\s+WeakMap)/)) {
        allocations++
      }

      // Detect DOM operations
      if (trimmed.match(/\b(document\.|querySelector|getElementById|innerHTML|appendChild)/)) {
        domOperations++
      }

      // Detect async operations
      if (trimmed.match(/\b(fetch|axios|ajax|XMLHttpRequest|Promise)\b/)) {
        asyncOperations++
      }
    }

    return {
      nestedLoops,
      recursiveCalls: [...new Set(recursiveCalls)],
      allocations,
      domOperations,
      asyncOperations,
      bottlenecks,
    }
  }

  /**
   * Detect nested loops.
   */
  private detectNestedLoops(lines: string[], filePath: string): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()
      if (line.match(/\b(for|while)\b/)) {
        // Check for nested loop
        let depth = 0
        for (let j = i; j < Math.min(i + 50, lines.length); j++) {
          if (lines[j]!.match(/\b(for|while)\b/)) depth++
          if (depth > 1) {
            predictions.push({
              id: `nested-loop-${i}`,
              codeSection: lines.slice(i, j + 1).join('\n'),
              filePath,
              line: i + 1,
              endLine: j + 1,
              issueType: 'nested-loop',
              severity: 'high',
              description: `Nested loop detected (depth: ${depth}). This has O(n²) or worse time complexity.`,
              impact: {
                timeMs: depth * 100,
                memoryMB: 0,
                riskLevel: Math.min(100, depth * 30),
              },
              suggestion: 'Consider using a Map/Set for O(1) lookups or restructure the algorithm.',
              optimizedCode: '// Use Map for O(1) lookup:\nconst map = new Map()\nfor (const item of items) {\n  map.set(item.id, item)\n}',
              complexity: {
                time: `O(n^${depth})`,
                space: 'O(1)',
              },
            })
            break
          }
        }
      }
    }

    return predictions
  }

  /**
   * Detect recursive calls.
   */
  private detectRecursiveCalls(lines: string[], filePath: string, calls: string[]): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()
      for (const call of calls) {
        if (line.includes(call + '(') && !line.includes('function ')) {
          predictions.push({
            id: `recursive-${i}`,
            codeSection: line,
            filePath,
            line: i + 1,
            endLine: i + 1,
            issueType: 'recursive-call',
            severity: 'medium',
            description: `Recursive call to '${call}' detected. Ensure proper base case to avoid stack overflow.`,
            impact: {
              timeMs: 50,
              memoryMB: 1,
              riskLevel: 40,
            },
            suggestion: 'Consider memoization or converting to iterative approach.',
            complexity: {
              time: 'O(2^n) without memoization',
              space: 'O(n) call stack',
            },
          })
        }
      }
    }

    return predictions
  }

  /**
   * Detect memory leaks.
   */
  private detectMemoryLeaks(lines: string[], filePath: string): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Event listener without cleanup
      if (line.match(/addEventListener/) && !lines.some(l => l.includes('removeEventListener'))) {
        predictions.push({
          id: `memory-leak-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'memory-leak',
          severity: 'high',
          description: 'Event listener added without cleanup. This can cause memory leaks.',
          impact: {
            timeMs: 0,
            memoryMB: 0.1,
            riskLevel: 60,
          },
          suggestion: 'Add removeEventListener in cleanup function or useEffect return.',
          optimizedCode: 'useEffect(() => {\n  const handler = () => { /* ... */ }\n  element.addEventListener("click", handler)\n  return () => element.removeEventListener("click", handler)\n}, [])',
          complexity: {
            time: 'O(1)',
            space: 'O(1)',
          },
        })
      }

      // Global variable assignment
      if (line.match(/^(window|global)\.\w+\s*=/)) {
        predictions.push({
          id: `global-var-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'memory-leak',
          severity: 'medium',
          description: 'Global variable assignment detected. This can cause memory leaks.',
          impact: {
            timeMs: 0,
            memoryMB: 0.05,
            riskLevel: 40,
          },
          suggestion: 'Use module-level variables or dependency injection instead.',
          complexity: {
            time: 'O(1)',
            space: 'O(1)',
          },
        })
      }
    }

    return predictions
  }

  /**
   * Detect blocking operations.
   */
  private detectBlockingOperations(lines: string[], filePath: string): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Synchronous operations in async context
      if (line.match(/\b(readFileSync|writeFileSync|execSync)\b/)) {
        predictions.push({
          id: `blocking-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'blocking-operation',
          severity: 'high',
          description: 'Synchronous file operation detected. This blocks the event loop.',
          impact: {
            timeMs: 100,
            memoryMB: 0,
            riskLevel: 70,
          },
          suggestion: 'Use async alternatives: readFile, writeFile, exec.',
          optimizedCode: 'await fs.promises.readFile(path, "utf-8")',
          complexity: {
            time: 'O(1)',
            space: 'O(1)',
          },
        })
      }

      // setTimeout with 0
      if (line.match(/setTimeout\([^,]+,\s*0\)/)) {
        predictions.push({
          id: `timeout-0-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'blocking-operation',
          severity: 'low',
          description: 'setTimeout with 0ms delay detected. Consider using requestAnimationFrame.',
          impact: {
            timeMs: 16,
            memoryMB: 0,
            riskLevel: 20,
          },
          suggestion: 'Use requestAnimationFrame for visual updates.',
          complexity: {
            time: 'O(1)',
            space: 'O(1)',
          },
        })
      }
    }

    return predictions
  }

  /**
   * Detect inefficient queries.
   */
  private detectInefficientQueries(lines: string[], filePath: string): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // querySelector in loop
      if (line.match(/querySelector|getElementById/) && lines.slice(Math.max(0, i - 5), i).some(l => l.match(/\b(for|while)\b/))) {
        predictions.push({
          id: `inefficient-query-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'inefficient-query',
          severity: 'medium',
          description: 'DOM query inside loop. This causes layout thrashing.',
          impact: {
            timeMs: 50,
            memoryMB: 0,
            riskLevel: 50,
          },
          suggestion: 'Cache the query result outside the loop.',
          optimizedCode: 'const element = document.querySelector(selector)\nfor (const item of items) {\n  // use element\n}',
          complexity: {
            time: 'O(n)',
            space: 'O(1)',
          },
        })
      }
    }

    return predictions
  }

  /**
   * Detect missing cache.
   */
  private detectMissingCache(lines: string[], filePath: string): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Repeated computation
      if (line.match(/\b(JSON\.parse|JSON\.stringify)\b/) && lines.slice(0, i).some(l => l.includes(line))) {
        predictions.push({
          id: `missing-cache-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'missing-cache',
          severity: 'medium',
          description: 'Repeated JSON parsing/stringifying detected. Consider caching.',
          impact: {
            timeMs: 10,
            memoryMB: 0.1,
            riskLevel: 30,
          },
          suggestion: 'Cache the parsed result in a variable.',
          optimizedCode: 'const parsed = JSON.parse(data)\n// Use parsed instead of calling JSON.parse again',
          complexity: {
            time: 'O(n)',
            space: 'O(n)',
          },
        })
      }
    }

    return predictions
  }

  /**
   * Detect unoptimized renders.
   */
  private detectUnoptimizedRenders(lines: string[], filePath: string): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // setState in render
      if (line.match(/\b(setState|set\w+)\b/) && lines.slice(Math.max(0, i - 3), i).some(l => l.includes('render'))) {
        predictions.push({
          id: `unoptimized-render-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'unoptimized-render',
          severity: 'high',
          description: 'State update during render. This causes infinite re-renders.',
          impact: {
            timeMs: 100,
            memoryMB: 0,
            riskLevel: 80,
          },
          suggestion: 'Move state updates to event handlers or useEffect.',
          complexity: {
            time: 'O(∞)',
            space: 'O(1)',
          },
        })
      }

      // Inline object/array in JSX
      if (line.match(/<\w+\s+[^>]*style=\{\{/) || line.match(/<\w+\s+[^>]*onClick=\{\(\)/)) {
        predictions.push({
          id: `inline-obj-${i}`,
          codeSection: line,
          filePath,
          line: i + 1,
          endLine: i + 1,
          issueType: 'unoptimized-render',
          severity: 'low',
          description: 'Inline object/function in JSX. This causes unnecessary re-renders.',
          impact: {
            timeMs: 16,
            memoryMB: 0,
            riskLevel: 20,
          },
          suggestion: 'Move to useMemo or useCallback, or define outside JSX.',
          complexity: {
            time: 'O(1)',
            space: 'O(1)',
          },
        })
      }
    }

    return predictions
  }

  /**
   * Subscribe to prediction events.
   */
  subscribe(listener: (predictions: PerformancePrediction[]) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(predictions: PerformancePrediction[]): void {
    for (const listener of this.listeners) {
      try { listener(predictions) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: PerformancePredictionEngine | null = null

export function getPerformancePredictionEngine(
  config?: Partial<PerformancePredictionConfig>
): PerformancePredictionEngine {
  if (!instance) {
    instance = new PerformancePredictionEngine(config)
  }
  return instance
}

export function resetPerformancePredictionEngine(): void {
  instance = null
}
