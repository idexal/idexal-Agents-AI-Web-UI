/**
 * Code Migration Assistant Engine for Idexal Agents.
 * Helps migrate code between framework versions, languages,
 * and patterns with automated transformations and migration plans.
 */

/** Migration source/target */
export type MigrationFramework = 'react' | 'vue' | 'angular' | 'svelte' | 'node' | 'typescript' | 'javascript'

/** Migration type */
export type MigrationType = 'version-upgrade' | 'framework-switch' | 'pattern-modernize' | 'api-migration'

/** Migration rule */
export interface MigrationRule {
  id: string
  name: string
  description: string
  sourcePattern: RegExp
  targetReplacement: string
  framework: MigrationFramework
  fromVersion?: string
  toVersion?: string
  category: 'api' | 'syntax' | 'import' | 'config' | 'deprecated' | 'type'
  priority: 'high' | 'medium' | 'low'
  automated: boolean
  /** Explanation for manual steps */
  manualNote?: string
}

/** Migration change */
export interface MigrationChange {
  ruleId: string
  ruleName: string
  file: string
  line: number
  oldCode: string
  newCode: string
  automated: boolean
  category: string
  confidence: number
}

/** Migration plan */
export interface MigrationPlan {
  id: string
  name: string
  description: string
  source: MigrationFramework
  target: MigrationFramework
  fromVersion: string
  toVersion: string
  changes: MigrationChange[]
  manualSteps: string[]
  stats: {
    totalChanges: number
    automatedChanges: number
    manualChanges: number
    filesAffected: number
    estimatedEffort: 'trivial' | 'easy' | 'moderate' | 'complex'
  }
  risks: string[]
  prerequisites: string[]
  generatedAt: number
}

/** Migration config */
export interface CodeMigrationConfig {
  source: MigrationFramework
  target: MigrationFramework
  fromVersion: string
  toVersion: string
  includeManualSteps: boolean
  generateDiff: boolean
}

const REACT_MIGRATION_RULES: MigrationRule[] = [
  {
    id: 'react-class-to-hooks', name: 'Class to Hooks',
    description: 'Convert class components to functional components with hooks',
    sourcePattern: /class\s+(\w+)\s+extends\s+React\.Component/g,
    targetReplacement: 'function $1() {',
    framework: 'react', fromVersion: '16', toVersion: '18',
    category: 'syntax', priority: 'high', automated: false,
    manualNote: 'Convert lifecycle methods to useEffect, state to useState',
  },
  {
    id: 'react-find-dom-node', name: 'findDOMNode Removal',
    description: 'Replace findDOMNode with refs',
    sourcePattern: /ReactDOM\.findDOMNode\((\w+)\)/g,
    targetReplacement: '$1.current',
    framework: 'react', fromVersion: '16', toVersion: '18',
    category: 'deprecated', priority: 'high', automated: true,
  },
  {
    id: 'react-string-ref', name: 'String Refs to createRef',
    description: 'Replace string refs with createRef or useRef',
    sourcePattern: /ref=["'](\w+)["']/g,
    targetReplacement: 'ref={this.$1Ref}',
    framework: 'react', fromVersion: '16', toVersion: '18',
    category: 'deprecated', priority: 'high', automated: false,
    manualNote: 'Create ref with useRef() or createRef() and attach to element',
  },
  {
    id: 'react-legacy-context', name: 'Legacy Context to createContext',
    description: 'Migrate legacy context API to modern createContext',
    sourcePattern: /childContextTypes|getChildContext|contextTypes/g,
    targetReplacement: '/* Use React.createContext() */',
    framework: 'react', fromVersion: '16', toVersion: '18',
    category: 'api', priority: 'high', automated: false,
    manualNote: 'Create context with createContext(), provide with Context.Provider, consume with useContext()',
  },
  {
    id: 'react-component-will-mount', name: 'UNSAFE_ Lifecycle Methods',
    description: 'Replace deprecated lifecycle methods',
    sourcePattern: /componentWillMount|componentWillReceiveProps|componentWillUpdate/g,
    targetReplacement: 'UNSAFE_$&',
    framework: 'react', fromVersion: '16', toVersion: '18',
    category: 'deprecated', priority: 'medium', automated: true,
  },
  {
    id: 'react-default-props', name: 'defaultProps Migration',
    description: 'Move defaultProps to default parameter values',
    sourcePattern: /(\w+)\.defaultProps\s*=\s*\{/g,
    targetReplacement: '/* Use default parameter values in function signature */',
    framework: 'react', fromVersion: '16', toVersion: '18',
    category: 'api', priority: 'medium', automated: false,
  },
  {
    id: 'react-act-import', name: 'Act Import Update',
    description: 'Update act import for React 18',
    sourcePattern: /import\s*\{\s*act\s*\}\s*from\s*'react-dom\/test-utils'/g,
    targetReplacement: "import { act } from 'react'",
    framework: 'react', fromVersion: '16', toVersion: '18',
    category: 'import', priority: 'low', automated: true,
  },
]

const TYPESCRIPT_MIGRATION_RULES: MigrationRule[] = [
  {
    id: 'ts-strict-null', name: 'Strict Null Checks',
    description: 'Add null checks for strict TypeScript',
    sourcePattern: /(\w+)\.(\w+)(?!\?)/g,
    targetReplacement: '$1?.$2',
    framework: 'typescript', category: 'syntax', priority: 'medium', automated: true,
  },
  {
    id: 'ts-any-to-unknown', name: 'Any to Unknown',
    description: 'Replace any with unknown for type safety',
    sourcePattern: /:\s*any\b/g,
    targetReplacement: ': unknown',
    framework: 'typescript', category: 'type', priority: 'medium', automated: true,
  },
  {
    id: 'ts-enum-to-const', name: 'Enum to Const Enum',
    description: 'Convert regular enums to const enums for smaller bundles',
    sourcePattern: /export\s+enum\s+(\w+)/g,
    targetReplacement: 'export const enum $1',
    framework: 'typescript', category: 'syntax', priority: 'low', automated: true,
  },
]

function getRulesForMigration(source: MigrationFramework, target: MigrationFramework): MigrationRule[] {
  if (source === 'react' || target === 'react') return REACT_MIGRATION_RULES
  if (source === 'typescript' || target === 'typescript') return TYPESCRIPT_MIGRATION_RULES
  return [...REACT_MIGRATION_RULES, ...TYPESCRIPT_MIGRATION_RULES]
}

/**
 * Code Migration Assistant Engine.
 */
export class CodeMigrationEngine {
  private rules: MigrationRule[] = []
  private config: CodeMigrationConfig
  private listeners: Set<(event: MigrationEvent) => void> = new Set()

  constructor(config: Partial<CodeMigrationConfig> = {}) {
    this.config = {
      source: config.source ?? 'react',
      target: config.target ?? 'react',
      fromVersion: config.fromVersion ?? '16',
      toVersion: config.toVersion ?? '18',
      includeManualSteps: config.includeManualSteps ?? true,
      generateDiff: config.generateDiff ?? true,
    }
    this.rules = getRulesForMigration(this.config.source, this.config.target)
  }

  /**
   * Generate a migration plan for code.
   */
  generatePlan(code: string, filename: string): MigrationPlan {
    const changes: MigrationChange[] = []
    const manualSteps: string[] = []
    const lines = code.split('\n')
    const affectedFiles = new Set<string>()

    for (const rule of this.rules) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? ''
        const matches = Array.from(line.matchAll(rule.sourcePattern))

        for (const match of matches) {
          const newCode = match[0].replace(rule.sourcePattern, rule.targetReplacement)

          changes.push({
            ruleId: rule.id,
            ruleName: rule.name,
            file: filename,
            line: i + 1,
            oldCode: match[0],
            newCode,
            automated: rule.automated,
            category: rule.category,
            confidence: rule.automated ? 0.9 : 0.7,
          })

          affectedFiles.add(filename)

          if (rule.manualNote && !manualSteps.includes(rule.manualNote)) {
            manualSteps.push(rule.manualNote)
          }
        }
      }
    }

    // Generate risks
    const risks: string[] = []
    if (changes.some(c => !c.automated)) {
      risks.push('Some changes require manual review — automated transforms may not cover all edge cases')
    }
    if (changes.length > 20) {
      risks.push('Large number of changes — consider migrating incrementally')
    }
    if (manualSteps.length > 0) {
      risks.push(`${manualSteps.length} manual step(s) required that cannot be automated`)
    }

    // Prerequisites
    const prerequisites: string[] = [
      'Create a feature branch for migration',
      'Ensure all tests pass before starting',
      'Review the migration plan before applying changes',
    ]
    if (this.config.target === 'react' && this.config.toVersion === '18') {
      prerequisites.push('Install React 18: npm install react@18 react-dom@18')
      prerequisites.push('Update TypeScript types: npm install @types/react@18')
    }

    const automatedCount = changes.filter(c => c.automated).length
    const manualCount = changes.filter(c => !c.automated).length
    const effort = changes.length < 5 ? 'trivial' : changes.length < 15 ? 'easy' : changes.length < 50 ? 'moderate' : 'complex'

    const plan: MigrationPlan = {
      id: `migration-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${this.config.source} ${this.config.fromVersion} → ${this.config.target} ${this.config.toVersion}`,
      description: `Migrate ${filename} from ${this.config.source} ${this.config.fromVersion} to ${this.config.target} ${this.config.toVersion}`,
      source: this.config.source,
      target: this.config.target,
      fromVersion: this.config.fromVersion,
      toVersion: this.config.toVersion,
      changes,
      manualSteps,
      stats: {
        totalChanges: changes.length,
        automatedChanges: automatedCount,
        manualChanges: manualCount,
        filesAffected: affectedFiles.size,
        estimatedEffort: effort,
      },
      risks,
      prerequisites,
      generatedAt: Date.now(),
    }

    this.notifyListeners({ type: 'plan-generated', plan })
    return plan
  }

  /**
   * Apply automated migration changes to code.
   */
  applyChanges(code: string, changes: MigrationChange[]): string {
    let result = code
    const automatedChanges = changes.filter(c => c.automated).sort((a, b) => b.line - a.line)

    for (const change of automatedChanges) {
      result = result.replace(change.oldCode, change.newCode)
    }

    return result
  }

  /**
   * Generate diff preview.
   */
  generateDiff(code: string, changes: MigrationChange[]): string {
    const lines = code.split('\n')
    const diff: string[] = []

    for (const change of changes) {
      const lineIdx = change.line - 1
      const originalLine = lines[lineIdx] ?? ''
      diff.push(`@@ -${change.line},1 +${change.line},1 @@`)
      diff.push(`- ${originalLine}`)
      diff.push(`+ ${originalLine.replace(change.oldCode, change.newCode)}`)
      diff.push('')
    }

    return diff.join('\n')
  }

  /**
   * Get available rules for a migration.
   */
  getRules(): MigrationRule[] {
    return this.rules
  }

  subscribe(listener: (event: MigrationEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: MigrationEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Migration event */
export interface MigrationEvent {
  type: 'plan-generated' | 'changes-applied'
  plan?: MigrationPlan
}

/** Singleton */
let instance: CodeMigrationEngine | null = null

export function getCodeMigrationEngine(config?: Partial<CodeMigrationConfig>): CodeMigrationEngine {
  if (!instance) instance = new CodeMigrationEngine(config)
  return instance
}

export function resetCodeMigrationEngine(): void { instance = null }
