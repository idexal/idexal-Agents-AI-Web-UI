/**
 * AI Test Coverage Optimizer engine.
 *
 * Analyses source files and existing tests to identify untested code,
 * generates test stubs, and recommends priority targets to maximise
 * coverage with minimal effort (bang-per-buck optimisation).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoverageType = 'statement' | 'branch' | 'function' | 'line'

export type TestPriority = 'critical' | 'high' | 'medium' | 'low'

export interface FunctionInfo {
  readonly name: string
  readonly startLine: number
  readonly endLine: number
  readonly parameters: readonly string[]
  readonly hasTest: boolean
  readonly complexity: number
}

export interface FileCoverage {
  readonly filePath: string
  readonly functions: readonly FunctionInfo[]
  readonly testedFunctions: number
  readonly untestedFunctions: number
  readonly coveragePercent: number
  readonly estimatedEffort: 'low' | 'medium' | 'high'
}

export interface TestSuggestion {
  readonly id: string
  readonly filePath: string
  readonly functionName: string
  readonly priority: TestPriority
  readonly testType: 'unit' | 'integration' | 'edge-case' | 'error-path'
  readonly description: string
  readonly stubCode: string
  readonly estimatedImpact: number  // 0-1 coverage improvement
}

export interface CoverageReport {
  readonly files: readonly FileCoverage[]
  readonly totalFunctions: number
  readonly testedFunctions: number
  readonly overallCoverage: number
  readonly suggestions: readonly TestSuggestion[]
  readonly quickWins: readonly TestSuggestion[]
  readonly recommendations: readonly string[]
}

export interface CoverageOptimizerConfig {
  readonly testPatterns: readonly string[]
  readonly minPriorityThreshold: TestPriority
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class TestCoverageOptimizerEngine {
  private readonly _patterns: readonly string[]

  constructor(config?: Partial<CoverageOptimizerConfig>) {
    this._patterns = config?.testPatterns ?? ['*.test.ts', '*.spec.ts', '*.test.tsx', '*.spec.tsx', 'test_*.py']
  }

  /** Analyze source file and extract function information. */
  analyzeSource(sourceCode: string, filePath: string): FileCoverage {
    void this._patterns // used for matching test files externally
    const functions = this.extractFunctions(sourceCode)
    const testedFunctions = functions.filter(f => f.hasTest).length
    const coveragePercent = functions.length > 0 ? (testedFunctions / functions.length) * 100 : 100
    const untested = functions.length - testedFunctions
    const estimatedEffort: FileCoverage['estimatedEffort'] = untested === 0 ? 'low' : untested <= 5 ? 'medium' : 'high'

    return { filePath, functions, testedFunctions, untestedFunctions: untested, coveragePercent, estimatedEffort }
  }

  /** Generate test suggestions for untested code. */
  generateSuggestions(fileCoverages: FileCoverage[], _testContents?: string[]): TestSuggestion[] {
    const suggestions: TestSuggestion[] = []
    for (const file of fileCoverages) {
      const untested = file.functions.filter(f => !f.hasTest)
      for (const fn of untested) {
        const priority = this.classifyPriority(fn, file)
        const testType = this.classifyTestType(fn)
        suggestions.push({
          id: `tsug_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          filePath: file.filePath,
          functionName: fn.name,
          priority,
          testType,
          description: `Add ${testType} test for ${fn.name}() — ${fn.complexity > 5 ? 'high complexity' : 'standard function'}.`,
          stubCode: this.generateStub(fn, file.filePath, testType),
          estimatedImpact: this.estimateImpact(fn, file),
        })
      }
    }
    return suggestions.sort((a, b) => {
      const prio = { critical: 0, high: 1, medium: 2, low: 3 }
      return (prio[a.priority] - prio[b.priority]) || (b.estimatedImpact - a.estimatedImpact)
    })
  }

  /** Generate a full coverage report. */
  generateReport(fileCoverages: FileCoverage[], _testContents?: string[]): CoverageReport {
    const suggestions = this.generateSuggestions(fileCoverages, _testContents)
    const totalFunctions = fileCoverages.reduce((s, f) => s + f.functions.length, 0)
    const testedFunctions = fileCoverages.reduce((s, f) => s + f.testedFunctions, 0)
    const overallCoverage = totalFunctions > 0 ? (testedFunctions / totalFunctions) * 100 : 100
    const quickWins = suggestions.filter(s => s.estimatedImpact > 0.05 && (s.priority === 'critical' || s.priority === 'high')).slice(0, 10)
    const recommendations = this.generateRecommendations(fileCoverages, suggestions, overallCoverage)

    return { files: fileCoverages, totalFunctions, testedFunctions, overallCoverage, suggestions, quickWins, recommendations }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private extractFunctions(source: string): FunctionInfo[] {
    const functions: FunctionInfo[] = []
    const lines = source.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      const match = /(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()/i.exec(line)
      if (!match) continue
      const name = match[1] ?? match[2]
      if (!name || name.length < 2) continue
      let depth = 0
      let endLine = i
      for (let j = i; j < lines.length; j++) {
        const l = lines[j] ?? ''
        depth += (l.match(/\{/g) ?? []).length - (l.match(/\}/g) ?? []).length
        if (depth <= 0 && j > i) { endLine = j; break }
      }
      const body = lines.slice(i, endLine + 1).join('\n')
      const complexity = this.estimateComplexity(body)
      const hasTest = false // determined externally
      const paramMatch = /\(([^)]*)\)/.exec(line)
      const parameters = paramMatch?.[1] ? paramMatch[1].split(',').map(p => p.trim().split(/[:\s=]/)[0] ?? '').filter(Boolean) : []
      functions.push({ name, startLine: i + 1, endLine: endLine + 1, parameters, hasTest, complexity })
    }
    return functions
  }

  private estimateComplexity(body: string): number {
    let cc = 1
    const keywords = ['if', 'else if', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?']
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|\\?`)
      const matches = body.match(regex)
      if (matches) cc += matches.length
    }
    return cc
  }

  private classifyPriority(fn: FunctionInfo, file: FileCoverage): TestPriority {
    if (fn.complexity >= 10) return 'critical'
    if (fn.complexity >= 6 || fn.name.startsWith('handle') || fn.name.startsWith('process')) return 'high'
    if (file.coveragePercent < 50) return 'medium'
    return 'low'
  }

  private classifyTestType(fn: FunctionInfo): TestSuggestion['testType'] {
    if (fn.parameters.length > 3) return 'edge-case'
    if (fn.complexity > 5) return 'error-path'
    if (fn.name.startsWith('handle') || fn.name.startsWith('process')) return 'integration'
    return 'unit'
  }

  private estimateImpact(fn: FunctionInfo, file: FileCoverage): number {
    const baseImpact = file.functions.length > 0 ? 1 / file.functions.length : 0
    const complexityBoost = Math.min(0.05, fn.complexity * 0.01)
    return Math.min(0.3, baseImpact + complexityBoost)
  }

  private generateStub(fn: FunctionInfo, filePath: string, testType: string): string {
    const isPy = filePath.endsWith('.py')
    if (isPy) {
      return `def test_${fn.name.toLowerCase()}():\n    """Test ${testType} for ${fn.name}."""\n    # Arrange\n    ${fn.parameters.map(p => `${p} = None  # TODO: set test value`).join('\n    ')}\n    # Act\n    result = ${fn.name}(${fn.parameters.join(', ')})\n    # Assert\n    assert result is not None  # TODO: add proper assertions`
    }
    return `describe('${fn.name}', () => {\n  it('should handle ${testType} case', () => {\n    // Arrange\n    ${fn.parameters.map(p => `const ${p} = undefined as any // TODO: set test value`).join('\n    ')}\n    // Act\n    const result = ${fn.name}(${fn.parameters.join(', ')})\n    // Assert\n    expect(result).toBeDefined() // TODO: add proper assertions\n  })\n})`
  }

  private generateRecommendations(_files: FileCoverage[], suggestions: TestSuggestion[], coverage: number): string[] {
    const recs: string[] = []
    if (coverage < 50) recs.push(`Coverage is ${coverage.toFixed(0)}% — aim for at least 70% before shipping.`)
    if (coverage >= 80) recs.push(`Good coverage at ${coverage.toFixed(0)}% — focus on edge cases and error paths.`)
    const criticals = suggestions.filter(s => s.priority === 'critical')
    if (criticals.length > 0) recs.push(`${criticals.length} critical function(s) need tests — complex logic without coverage.`)
    const quickWins = suggestions.filter(s => s.estimatedImpact > 0.05)
    if (quickWins.length > 0) recs.push(`${quickWins.length} quick-win test(s) can boost coverage significantly.`)
    if (recs.length === 0) recs.push('Coverage looks good. Consider property-based testing for complex logic.')
    return recs
  }
}

let _instance: TestCoverageOptimizerEngine | undefined
export function getTestCoverageOptimizerEngine(config?: Partial<CoverageOptimizerConfig>): TestCoverageOptimizerEngine {
  _instance ??= new TestCoverageOptimizerEngine(config)
  return _instance
}
export function resetTestCoverageOptimizerEngine(): void { _instance = undefined }
