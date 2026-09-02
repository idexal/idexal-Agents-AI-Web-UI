/**
 * AI Code Smell Detector engine.
 *
 * Detects common code smells: long methods, deep nesting, magic numbers,
 * duplicate code, dead code, and more.  Provides severity-ranked
 * suggestions with auto-fix confidence scores.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SmellType =
  | 'long-method' | 'deep-nesting' | 'magic-number' | 'god-class'
  | 'feature-envy' | 'duplicate-code' | 'dead-code' | 'long-parameter-list'
  | 'large-class' | 'switch-statement'

export type SmellSeverity = 'critical' | 'major' | 'minor' | 'info'

export interface CodeSmell {
  readonly id: string
  readonly type: SmellType
  readonly severity: SmellSeverity
  readonly message: string
  readonly description: string
  readonly file: string
  readonly line: number
  readonly endLine?: number
  readonly codeSnippet: string
  readonly autoFixable: boolean
  readonly confidence: number
  readonly suggestion: string
  readonly impact: number
  readonly effort: number
}

export interface SmellDetectionResult {
  readonly smells: readonly CodeSmell[]
  readonly totalSmells: number
  readonly byType: Partial<Record<SmellType, number>>
  readonly bySeverity: Record<SmellSeverity, number>
  readonly overallScore: number
  readonly topIssues: readonly CodeSmell[]
  readonly suggestions: readonly string[]
}

export interface SmellDetectorConfig {
  readonly maxMethodLines: number
  readonly maxNestingDepth: number
  readonly maxParameters: number
  readonly maxClassLines: number
  readonly duplicateThreshold: number
  readonly detectionEnabled: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function id(): string { return `smell_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

function makeSmell(
  type: SmellType, severity: SmellSeverity, message: string, description: string,
  file: string, line: number, snippet: string, autoFixable: boolean,
  confidence: number, suggestion: string, impact: number, effort: number,
): CodeSmell {
  return { id: id(), type, severity, message, description, file, line, codeSnippet: snippet, autoFixable, confidence, suggestion, impact, effort }
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class CodeSmellDetectorEngine {
  private readonly config: SmellDetectorConfig

  constructor(config?: Partial<SmellDetectorConfig>) {
    this.config = {
      maxMethodLines: config?.maxMethodLines ?? 30,
      maxNestingDepth: config?.maxNestingDepth ?? 4,
      maxParameters: config?.maxParameters ?? 5,
      maxClassLines: config?.maxClassLines ?? 300,
      duplicateThreshold: config?.duplicateThreshold ?? 0.85,
      detectionEnabled: config?.detectionEnabled ?? true,
    }
  }

  analyze(sourceCode: string, filePath: string): SmellDetectionResult {
    if (!this.config.detectionEnabled) return emptyResult()
    const lines = sourceCode.split('\n')
    const smells: CodeSmell[] = [
      ...this.detectLongMethods(lines, filePath),
      ...this.detectDeepNesting(lines, filePath),
      ...this.detectMagicNumbers(lines, filePath),
      ...this.detectLongParams(lines, filePath),
      ...this.detectLargeClasses(lines, filePath),
      ...this.detectDeadCode(lines, filePath),
      ...this.detectDuplicates(lines, filePath),
      ...this.detectSwitches(lines, filePath),
    ]
    const byType: Partial<Record<SmellType, number>> = {}
    const bySeverity: Record<SmellSeverity, number> = { critical: 0, major: 0, minor: 0, info: 0 }
    for (const s of smells) {
      byType[s.type] = (byType[s.type] ?? 0) + 1
      bySeverity[s.severity]++
    }
    const score = smells.length === 0 ? 100 : Math.max(0, 100 - smells.reduce((sum, s) => {
      const w = s.severity === 'critical' ? 15 : s.severity === 'major' ? 8 : s.severity === 'minor' ? 3 : 1
      return sum + w
    }, 0) / (lines.length / 100))
    const topIssues = [...smells].sort((a, b) => b.impact - a.impact).slice(0, 10)
    const suggestions = generateSuggestions(smells, byType)
    return { smells, totalSmells: smells.length, byType, bySeverity, overallScore: score, topIssues, suggestions }
  }

  private detectLongMethods(lines: string[], filePath: string): CodeSmell[] {
    const smells: CodeSmell[] = []
    let methodStart = -1
    let methodName = 'anonymous'
    let depth = 0
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i] ?? ''
      const funcMatch = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/.exec(raw)
      if (funcMatch && depth === 0) {
        methodStart = i
        methodName = funcMatch[1] ?? funcMatch[2] ?? 'anonymous'
      }
      depth += countChar(raw, '{') - countChar(raw, '}')
      if (depth <= 0 && methodStart >= 0) {
        const len = i - methodStart + 1
        if (len > this.config.maxMethodLines) {
          smells.push(makeSmell('long-method', len > this.config.maxMethodLines * 2 ? 'major' : 'minor',
            `Method "${methodName}" is ${len} lines (max: ${this.config.maxMethodLines})`,
            'Long methods are harder to test and maintain.',
            filePath, methodStart, raw.trim().slice(0, 60), true, 0.8, 'Extract sub-responsibilities into helper methods.', Math.min(1, len / 100), 0.3,
          ))
        }
        methodStart = -1
        depth = 0
      }
    }
    return smells
  }

  private detectDeepNesting(lines: string[], filePath: string): CodeSmell[] {
    const smells: CodeSmell[] = []
    let depth = 0
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i] ?? ''
      depth += countChar(raw, '{')
      if (depth > this.config.maxNestingDepth) {
        smells.push(makeSmell('deep-nesting', depth > this.config.maxNestingDepth + 2 ? 'major' : 'minor',
          `Nesting depth ${depth} exceeds max of ${this.config.maxNestingDepth} at line ${i + 1}`,
          'Deep nesting reduces readability.',
          filePath, i, raw.trim().slice(0, 60), true, 0.7, 'Use early returns to flatten nesting.', Math.min(1, depth / 10), 0.2,
        ))
      }
      depth -= countChar(raw, '}')
    }
    return smells
  }

  private detectMagicNumbers(lines: string[], filePath: string): CodeSmell[] {
    const smells: CodeSmell[] = []
    const known = new Set(['0', '1', '-1', '2', '10', '100'])
    let count = 0
    for (let i = 0; i < lines.length && count < 5; i++) {
      const raw = lines[i] ?? ''
      if (raw.trim().startsWith('//') || raw.trim().startsWith('*')) continue
      const m = /\b(\d{2,})\b/.exec(raw)
      if (m && !known.has(m[1] ?? '') && !raw.includes('import')) {
        count++
        smells.push(makeSmell('magic-number', 'minor',
          `Magic number ${m[1]} at line ${i + 1}`,
          'Magic numbers hide intent.',
          filePath, i, raw.trim().slice(0, 60), true, 0.9, 'Extract to a named constant.', 0.3, 0.1,
        ))
      }
    }
    return smells
  }

  private detectLongParams(lines: string[], filePath: string): CodeSmell[] {
    const smells: CodeSmell[] = []
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i] ?? ''
      const m = /\(([^)]{30,})\)/.exec(raw)
      if (m?.[1]) {
        const params = m[1].split(',').filter(p => p.trim()).length
        if (params > this.config.maxParameters) {
          smells.push(makeSmell('long-parameter-list', params > 8 ? 'major' : 'minor',
            `Function has ${params} parameters (max: ${this.config.maxParameters})`,
            'Long parameter lists indicate too many responsibilities.',
            filePath, i, raw.trim().slice(0, 60), true, 0.75, 'Group into a config object.', 0.4, 0.3,
          ))
        }
      }
    }
    return smells
  }

  private detectLargeClasses(lines: string[], filePath: string): CodeSmell[] {
    if (lines.length <= this.config.maxClassLines) return []
    return [makeSmell('large-class', lines.length > this.config.maxClassLines * 2 ? 'critical' : 'major',
      `File has ${lines.length} lines (max: ${this.config.maxClassLines})`,
      'Large files are hard to navigate and test.',
      filePath, 0, (lines[0] ?? '').trim().slice(0, 60), false, 0.6,
      'Split into smaller files organized by responsibility.', Math.min(1, lines.length / 1000), 0.6,
    )]
  }

  private detectDeadCode(lines: string[], filePath: string): CodeSmell[] {
    const smells: CodeSmell[] = []
    const varUsages = new Map<string, number>()
    for (const raw of lines) {
      for (const m of raw.matchAll(/\b(?:var|let|const)\s+(\w+)/g)) {
        const name = m[1]
        if (name) varUsages.set(name, (varUsages.get(name) ?? 0) + 1)
      }
    }
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i] ?? ''
      if (/^\/\/.*TODO|^\/\/.*FIXME|^\/\/.*HACK/.test(raw.trim())) {
        smells.push(makeSmell('dead-code', 'info', `TODO marker at line ${i + 1}`, 'Unresolved markers indicate incomplete work.', filePath, i, raw.trim().slice(0, 60), false, 0.5, 'Resolve or remove the marker.', 0.1, 0.1))
      }
      const varM = /(?:var|let|const)\s+(\w+)/.exec(raw)
      if (varM?.[1] && (varUsages.get(varM[1]) ?? 0) <= 1 && i > 5) {
        smells.push(makeSmell('dead-code', 'minor', `Possibly unused variable "${varM[1]}" at line ${i + 1}`, 'Unused variables add noise.', filePath, i, raw.trim().slice(0, 60), true, 0.95, 'Remove or prefix with _.', 0.2, 0.05))
      }
    }
    return smells
  }

  private detectDuplicates(lines: string[], filePath: string): CodeSmell[] {
    const smells: CodeSmell[] = []
    const blockSize = 5
    const seen = new Map<string, number>()
    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize).map(l => (l ?? '').trim()).filter(l => l.length > 10).join('\n')
      if (block.length < 30) continue
      const prev = seen.get(block)
      if (prev !== undefined) {
        smells.push(makeSmell('duplicate-code', 'major', `Duplicate block at lines ${prev + 1} and ${i + 1}`, 'Duplicated code violates DRY.', filePath, i, block.slice(0, 60), true, 0.85, 'Extract into a reusable function.', 0.7, 0.4))
        seen.delete(block)
      } else {
        seen.set(block, i)
      }
    }
    return smells.slice(0, 3)
  }

  private detectSwitches(lines: string[], filePath: string): CodeSmell[] {
    const smells: CodeSmell[] = []
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*switch\s*\(/.test(lines[i] ?? '')) {
        let caseCount = 0
        for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
          const jLine = lines[j] ?? ''
          if (/^\s*case\s+/.test(jLine)) caseCount++
          if (/^\s*\}/.test(jLine)) break
        }
        if (caseCount > 4) {
          smells.push(makeSmell('switch-statement', 'minor', `Switch with ${caseCount} cases at line ${i + 1}`, 'Large switches are hard to maintain.', filePath, i, (lines[i] ?? '').trim().slice(0, 60), false, 0.6, 'Replace with a Map or strategy pattern.', 0.5, 0.5))
        }
      }
    }
    return smells
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function countChar(s: string, ch: string): number {
  let n = 0
  for (let i = 0; i < s.length; i++) { if (s[i] === ch) n++ }
  return n
}

function generateSuggestions(smells: CodeSmell[], byType: Partial<Record<SmellType, number>>): string[] {
  const recs: string[] = []
  if ((byType['long-method'] ?? 0) > 0) recs.push(`Found ${byType['long-method']} long method(s). Use Extract Method refactoring.`)
  if ((byType['deep-nesting'] ?? 0) > 0) recs.push('Flatten deep nesting with early returns and guard clauses.')
  if ((byType['magic-number'] ?? 0) > 3) recs.push(`Extract ${byType['magic-number']} magic numbers into named constants.`)
  if ((byType['duplicate-code'] ?? 0) > 0) recs.push('Eliminate duplication with shared utilities.')
  if (smells.some(s => s.severity === 'critical')) recs.push('Address critical smells before proceeding — they indicate architectural debt.')
  if (recs.length === 0) recs.push('No significant code smells detected. Keep it clean!')
  return recs
}

function emptyResult(): SmellDetectionResult {
  return { smells: [], totalSmells: 0, byType: {}, bySeverity: { critical: 0, major: 0, minor: 0, info: 0 }, overallScore: 100, topIssues: [], suggestions: [] }
}

let _instance: CodeSmellDetectorEngine | undefined
export function getCodeSmellDetectorEngine(config?: Partial<SmellDetectorConfig>): CodeSmellDetectorEngine {
  _instance ??= new CodeSmellDetectorEngine(config)
  return _instance
}
export function resetCodeSmellDetectorEngine(): void { _instance = undefined }
