/**
 * Smart Debugger Engine — AI-powered debugging with breakpoint analysis.
 *
 * Analyzes code for potential bugs, suggests breakpoints, detects root causes,
 * and provides step-by-step debugging guidance with call stack analysis.
 *
 * @module SmartDebugger
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Severity levels for debugging issues. */
export type DebugSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Category of debugging issue. */
export type DebugCategory =
  | 'logic-error'
  | 'runtime-error'
  | 'type-error'
  | 'null-reference'
  | 'memory-leak'
  | 'race-condition'
  | 'performance'
  | 'security'
  | 'concurrency'
  | 'resource-management';

/** A breakpoint suggestion. */
export interface BreakpointSuggestion {
  readonly line: number;
  readonly column: number;
  readonly condition: string;
  readonly reason: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly hitCount: number;
}

/** A debugging issue found in the code. */
export interface DebugIssue {
  readonly id: string;
  readonly line: number;
  readonly column: number;
  readonly severity: DebugSeverity;
  readonly category: DebugCategory;
  readonly title: string;
  readonly description: string;
  readonly suggestion: string;
  readonly codeSnippet: string;
  readonly stackTrace?: readonly string[];
  readonly fix?: string;
}

/** Root cause analysis result. */
export interface RootCauseAnalysis {
  readonly rootCause: string;
  readonly confidence: number;
  readonly evidence: readonly string[];
  readonly fix: string;
  readonly relatedIssues: readonly string[];
  readonly preventionTips: readonly string[];
}

/** Debug session configuration. */
export interface DebugSessionConfig {
  readonly language: string;
  readonly framework?: string;
  readonly runtime: string;
  readonly breakpoints: readonly BreakpointSuggestion[];
  readonly watchExpressions: readonly string[];
  readonly steppingMode: 'step-over' | 'step-into' | 'step-out';
}

/** Debug session state. */
export interface DebugSessionState {
  readonly isRunning: boolean;
  readonly currentLine: number;
  readonly callStack: readonly StackFrame[];
  readonly variables: Record<string, unknown>;
  readonly breakpoints: readonly BreakpointSuggestion[];
  readonly issues: readonly DebugIssue[];
}

/** A stack frame in the call stack. */
export interface StackFrame {
  readonly function: string;
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly isNative: boolean;
}

// ---------------------------------------------------------------------------
// Debug Pattern Definitions
// ---------------------------------------------------------------------------

interface DebugPattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly severity: DebugSeverity;
  readonly category: DebugCategory;
  readonly title: string;
  readonly description: string;
  readonly suggestion: string;
  readonly languages: readonly string[];
}

const DEBUG_PATTERNS: readonly DebugPattern[] = [
  // Null/Undefined references
  {
    id: 'null-dereference',
    pattern: /\.(\w+)\(/,
    severity: 'critical',
    category: 'null-reference',
    title: 'Potential null dereference',
    description: 'Method called on potentially null/undefined value',
    suggestion: 'Add null check before accessing property or method',
    languages: ['typescript', 'javascript'],
  },
  {
    id: 'optional-chain',
    pattern: /\?\.\w+\(/,
    severity: 'low',
    category: 'null-reference',
    title: 'Optional chaining used',
    description: 'Optional chaining detected — good defensive pattern',
    suggestion: 'Consider adding error handling for null cases',
    languages: ['typescript', 'javascript'],
  },
  // Memory management
  {
    id: 'event-listener-leak',
    pattern: /addEventListener\(/,
    severity: 'medium',
    category: 'memory-leak',
    title: 'Event listener without cleanup',
    description: 'Event listener added without corresponding removeEventListener',
    suggestion: 'Ensure event listener is removed on cleanup/unmount',
    languages: ['typescript', 'javascript'],
  },
  {
    id: 'set-interval-leak',
    pattern: /setInterval\(/,
    severity: 'medium',
    category: 'memory-leak',
    title: 'Interval without cleanup',
    description: 'setInterval without clearInterval on cleanup',
    suggestion: 'Store interval ID and clear it on component unmount',
    languages: ['typescript', 'javascript'],
  },
  // Performance
  {
    id: 'nested-loop',
    pattern: /for\s*\(.*for\s*\(/,
    severity: 'medium',
    category: 'performance',
    title: 'Nested loop detected',
    description: 'Nested loops can cause O(n²) complexity',
    suggestion: 'Consider using Map/Set for O(1) lookups or flatMap',
    languages: ['typescript', 'javascript', 'python', 'java'],
  },
  {
    id: 'string-concatenation',
    pattern: /\+\s*["']|["']\s*\+/,
    severity: 'low',
    category: 'performance',
    title: 'String concatenation in loop',
    description: 'String concatenation can be inefficient in loops',
    suggestion: 'Use template literals or array.join() for better performance',
    languages: ['typescript', 'javascript'],
  },
  // Security
  {
    id: 'eval-usage',
    pattern: /eval\(/,
    severity: 'critical',
    category: 'security',
    title: 'eval() usage detected',
    description: 'eval() can execute arbitrary code and is a security risk',
    suggestion: 'Replace eval() with JSON.parse() or a safer alternative',
    languages: ['typescript', 'javascript'],
  },
  {
    id: 'innerHTML-usage',
    pattern: /\.innerHTML\s*=/,
    severity: 'high',
    category: 'security',
    title: 'innerHTML assignment',
    description: 'innerHTML can lead to XSS vulnerabilities',
    suggestion: 'Use textContent or a safe HTML sanitizer',
    languages: ['typescript', 'javascript'],
  },
  // Logic errors
  {
    id: 'assignment-in-condition',
    pattern: /if\s*\([^=!]*=[^=]/,
    severity: 'high',
    category: 'logic-error',
    title: 'Assignment in condition',
    description: 'Assignment (=) used instead of comparison (===) in condition',
    suggestion: 'Use === for comparison or wrap assignment in extra parentheses',
    languages: ['typescript', 'javascript'],
  },
  {
    id: 'missing-await',
    pattern: /async\s+function|=>\s*\{[^}]*fetch\(/,
    severity: 'medium',
    category: 'runtime-error',
    title: 'Missing await on async operation',
    description: 'Async operation may not be awaited',
    suggestion: 'Ensure async functions are properly awaited',
    languages: ['typescript', 'javascript'],
  },
  // Python-specific
  {
    id: 'mutable-default',
    pattern: /def\s+\w+\([^)]*=\s*\[\]/,
    severity: 'high',
    category: 'logic-error',
    title: 'Mutable default argument',
    description: 'Mutable default argument (list/dict) is shared across calls',
    suggestion: 'Use None as default and create new instance inside function',
    languages: ['python'],
  },
  {
    id: 'bare-except',
    pattern: /except\s*:/,
    severity: 'medium',
    category: 'logic-error',
    title: 'Bare except clause',
    description: 'Bare except catches all exceptions including SystemExit and KeyboardInterrupt',
    suggestion: 'Catch specific exceptions or use except Exception:',
    languages: ['python'],
  },
  // Rust-specific
  {
    id: 'unwrap-in-production',
    pattern: /\.unwrap\(\)/,
    severity: 'high',
    category: 'runtime-error',
    title: 'unwrap() in production code',
    description: 'unwrap() will panic on None/Err values',
    suggestion: 'Use ? operator or match for proper error handling',
    languages: ['rust'],
  },
  // Go-specific
  {
    id: 'unchecked-error',
    pattern: /:=\s*[^_]+\n/,
    severity: 'medium',
    category: 'runtime-error',
    title: 'Unchecked error return',
    description: 'Error return value not checked',
    suggestion: 'Always check error returns: if err != nil { return err }',
    languages: ['go'],
  },
];

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export interface SmartDebuggerConfig {
  readonly language: string;
  readonly framework?: string;
  readonly maxIssues: number;
  readonly severityThreshold: DebugSeverity;
  readonly enableAutoFix: boolean;
}

const DEBUGGER_DEFAULT_CONFIG: SmartDebuggerConfig = {
  language: 'typescript',
  maxIssues: 50,
  severityThreshold: 'low',
  enableAutoFix: true,
};

export class SmartDebuggerEngine {
  private config: SmartDebuggerConfig
  private sessionState: DebugSessionState
  private issueCounter = 0

  constructor(config: Partial<SmartDebuggerConfig> = {}) {
    this.config = { ...DEBUGGER_DEFAULT_CONFIG, ...config }
    this.sessionState = {
      isRunning: false,
      currentLine: 0,
      callStack: [],
      variables: {},
      breakpoints: [],
      issues: [],
    }
  }

  /** Analyze code for debugging issues. */
  analyzeCode(code: string): readonly DebugIssue[] {
    const lines = code.split('\n')
    const issues: DebugIssue[] = []

    for (let i = 0; i < lines.length && issues.length < this.config.maxIssues; i++) {
      const line = lines[i]!
      const lineNum = i + 1

      for (const debugPattern of DEBUG_PATTERNS) {
        // Check language compatibility
        if (!debugPattern.languages.includes(this.config.language)) continue

        // Check severity threshold
        if (!this.isSeverityAboveThreshold(debugPattern.severity)) continue

        // Check pattern match
        if (debugPattern.pattern.test(line)) {
          const issue: DebugIssue = {
            id: `DBG-${++this.issueCounter}`,
            line: lineNum,
            column: 0,
            severity: debugPattern.severity,
            category: debugPattern.category,
            title: debugPattern.title,
            description: debugPattern.description,
            suggestion: debugPattern.suggestion,
            codeSnippet: this.getCodeSnippet(lines, i, 3),
          }
          issues.push(issue)
        }
      }
    }

    this.sessionState = {
      ...this.sessionState,
      issues,
    }

    return issues
  }

  /** Suggest breakpoints for the code. */
  suggestBreakpoints(code: string): readonly BreakpointSuggestion[] {
    const lines = code.split('\n')
    const suggestions: BreakpointSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      const lineNum = i + 1

      // Suggest breakpoints at function declarations
      if (/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/.test(line)) {
        suggestions.push({
          line: lineNum,
          column: 0,
          condition: '',
          reason: 'Function entry point — useful for tracing call flow',
          priority: 'high',
          hitCount: 0,
        })
      }

      // Suggest breakpoints at try-catch blocks
      if (/try\s*\{/.test(line)) {
        suggestions.push({
          line: lineNum,
          column: 0,
          condition: '',
          reason: 'Error handling block — set condition to catch specific errors',
          priority: 'medium',
          hitCount: 0,
        })
      }

      // Suggest breakpoints at return statements
      if (/return\s+/.test(line)) {
        suggestions.push({
          line: lineNum,
          column: 0,
          condition: '',
          reason: 'Return statement — inspect final value before exit',
          priority: 'low',
          hitCount: 0,
        })
      }

      // Suggest breakpoints at async operations
      if (/\bawait\b/.test(line)) {
        suggestions.push({
          line: lineNum,
          column: 0,
          condition: '',
          reason: 'Async operation — useful for debugging promise resolution',
          priority: 'medium',
          hitCount: 0,
        })
      }
    }

    return suggestions
  }

  /** Perform root cause analysis on a set of issues. */
  analyzeRootCause(issues: readonly DebugIssue[]): RootCauseAnalysis {
    if (issues.length === 0) {
      return {
        rootCause: 'No issues detected',
        confidence: 1,
        evidence: [],
        fix: 'No fixes needed',
        relatedIssues: [],
        preventionTips: ['Continue using static analysis tools'],
      }
    }

    // Find the most severe issue
    const severityOrder: Record<DebugSeverity, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    }

    const sortedIssues = [...issues].sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
    )

    const primaryIssue = sortedIssues[0]!

    // Group issues by category
    const categoryCounts: Record<string, number> = {}
    for (const issue of issues) {
      categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1
    }

    // Find dominant category
    const dominantCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'unknown'

    // Build root cause analysis
    const rootCause = `Primary issue: ${primaryIssue.title} (${primaryIssue.severity}). ` +
      `Dominant category: ${dominantCategory} with ${categoryCounts[dominantCategory] || 0} related issues.`

    const confidence = Math.min(0.95, 0.5 + (issues.length * 0.05))

    const evidence = [
      `Issue ${primaryIssue.id}: ${primaryIssue.description}`,
      `Category distribution: ${Object.entries(categoryCounts)
        .map(([cat, count]) => `${cat}(${count})`)
        .join(', ')}`,
    ]

    const fix = primaryIssue.fix ?? primaryIssue.suggestion

    const relatedIssues = sortedIssues
      .slice(1, 4)
      .map(i => i.id)

    const preventionTips = this.getPreventionTips(dominantCategory)

    return {
      rootCause,
      confidence,
      evidence,
      fix,
      relatedIssues,
      preventionTips,
    }
  }

  /** Generate a debug session configuration. */
  createSession(code: string): DebugSessionConfig {
    const breakpoints = this.suggestBreakpoints(code)

    const config: DebugSessionConfig = {
      language: this.config.language,
      runtime: this.config.language === 'typescript' ? 'node' : this.config.language,
      breakpoints,
      watchExpressions: [],
      steppingMode: 'step-over',
    }

    // Only include framework if defined (exactOptionalPropertyTypes)
    if (this.config.framework !== undefined) {
      return { ...config, framework: this.config.framework }
    }
    return config
  }

  /** Start a debug session. */
  startSession(): void {
    this.sessionState = {
      ...this.sessionState,
      isRunning: true,
    }
  }

  /** Stop a debug session. */
  stopSession(): void {
    this.sessionState = {
      ...this.sessionState,
      isRunning: false,
    }
  }

  /** Get current session state. */
  getSessionState(): DebugSessionState {
    return { ...this.sessionState }
  }

  private getCodeSnippet(lines: readonly string[], center: number, context: number): string {
    const start = Math.max(0, center - context)
    const end = Math.min(lines.length, center + context + 1)
    return lines.slice(start, end).join('\n')
  }

  private isSeverityAboveThreshold(severity: DebugSeverity): boolean {
    const order: Record<DebugSeverity, number> = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    }
    return order[severity] >= order[this.config.severityThreshold]
  }

  private getPreventionTips(category: string): readonly string[] {
    const tips: Record<string, readonly string[]> = {
      'null-reference': [
        'Use optional chaining (?.) for safe property access',
        'Initialize variables with default values',
        'Use TypeScript strict null checks',
      ],
      'memory-leak': [
        'Always clean up event listeners and intervals',
        'Use WeakRef for caches and listeners',
        'Profile memory usage regularly',
      ],
      'performance': [
        'Profile before optimizing',
        'Use appropriate data structures',
        'Avoid unnecessary re-renders',
      ],
      'security': [
        'Validate all user input',
        'Use Content Security Policy',
        'Avoid eval() and innerHTML',
      ],
      'logic-error': [
        'Write unit tests for edge cases',
        'Use type guards and assertions',
        'Review conditional logic carefully',
      ],
      'runtime-error': [
        'Handle errors at boundaries',
        'Use try-catch for async operations',
        'Validate types at runtime when needed',
      ],
      'type-error': [
        'Enable TypeScript strict mode',
        'Use type guards',
        'Define clear interfaces',
      ],
      'race-condition': [
        'Use locks or atomic operations',
        'Implement proper synchronization',
        'Design state machines for concurrent access',
      ],
      'concurrency': [
        'Use thread pools for parallel work',
        'Avoid shared mutable state',
        'Use message passing for communication',
      ],
      'resource-management': [
        'Use try-with-resources or defer',
        'Implement proper cleanup handlers',
        'Monitor resource usage',
      ],
    }
    return tips[category] ?? ['Review code carefully', 'Add comprehensive tests', 'Use static analysis tools']
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _instance: SmartDebuggerEngine | undefined

export function getSmartDebuggerEngine(config?: Partial<SmartDebuggerConfig>): SmartDebuggerEngine {
  if (!_instance) _instance = new SmartDebuggerEngine(config)
  return _instance
}

export function resetSmartDebuggerEngine(): void {
  _instance = undefined
}
