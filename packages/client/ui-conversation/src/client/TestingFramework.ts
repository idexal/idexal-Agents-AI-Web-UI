/**
 * Smart Testing Framework Engine for Idexal Agents.
 * Generate tests, manage test suites, analyze coverage,
 * and provide testing recommendations.
 */

/** Test type */
export type TestType = 'unit' | 'integration' | 'e2e' | 'snapshot' | 'performance'

/** Test framework */
export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'pytest' | 'go-test'

/** Test status */
export type TestStatus = 'pass' | 'fail' | 'skip' | 'pending'

/** Test case */
export interface TestCase {
  id: string
  name: string
  type: TestType
  framework: TestFramework
  /** Test code */
  code: string
  /** What it tests */
  description: string
  /** Expected behavior */
  expected: string
  /** File path */
  file?: string
  /** Tags */
  tags: string[]
  /** Priority */
  priority: 'high' | 'medium' | 'low'
  /** Status (if run) */
  status?: TestStatus
  /** Duration in ms */
  duration?: number
  /** Error message if failed */
  error?: string
}

/** Test suite */
export interface TestSuite {
  id: string
  name: string
  description: string
  framework: TestFramework
  tests: TestCase[]
  setup?: string
  teardown?: string
  /** Coverage data */
  coverage?: {
    statements: number
    branches: number
    functions: number
    lines: number
  }
}

/** Test generation request */
export interface TestGenRequest {
  /** Source code to test */
  sourceCode: string
  /** Source file path */
  sourceFile: string
  /** Test type */
  testType: TestType
  /** Test framework */
  framework: TestFramework
  /** Additional context */
  context?: string
  /** Generate edge cases? */
  includeEdgeCases?: boolean
  /** Generate error cases? */
  includeErrorCases?: boolean
}

/** Test result */
export interface TestGenResult {
  id: string
  suite: TestSuite
  totalTests: number
  edgeCases: number
  errorCases: number
  coverageEstimate: number
  timestamp: number
}

/** Testing config */
export interface TestingFrameworkConfig {
  defaultFramework: TestFramework
  defaultTestType: TestType
  includeEdgeCases: boolean
  includeErrorCases: boolean
  maxTestsPerFunction: number
}

/**
 * Smart Testing Framework Engine.
 */
export class TestingFrameworkEngine {
  private suites: Map<string, TestSuite> = new Map()
  private config: TestingFrameworkConfig
  private listeners: Set<(event: TestingEvent) => void> = new Set()

  constructor(config: Partial<TestingFrameworkConfig> = {}) {
    this.config = {
      defaultFramework: config.defaultFramework ?? 'jest',
      defaultTestType: config.defaultTestType ?? 'unit',
      includeEdgeCases: config.includeEdgeCases ?? true,
      includeErrorCases: config.includeErrorCases ?? true,
      maxTestsPerFunction: config.maxTestsPerFunction ?? 10,
    }
  }

  /**
   * Generate tests for source code.
   */
  generateTests(request: TestGenRequest): TestGenResult {
    const tests: TestCase[] = []

    // Extract functions from source
    const functions = this.extractFunctions(request.sourceCode)

    for (const func of functions) {
      // Basic test
      tests.push(this.createBasicTest(func, request))

      // Edge case tests
      if (request.includeEdgeCases ?? this.config.includeEdgeCases) {
        tests.push(...this.createEdgeCaseTests(func, request))
      }

      // Error case tests
      if (request.includeErrorCases ?? this.config.includeErrorCases) {
        tests.push(...this.createErrorCaseTests(func, request))
      }
    }

    // Limit tests
    const limitedTests = tests.slice(0, this.config.maxTestsPerFunction * functions.length)

    const suite: TestSuite = {
      id: `suite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `Tests for ${request.sourceFile}`,
      description: `Auto-generated tests for ${request.sourceFile}`,
      framework: request.framework,
      tests: limitedTests,
    }

    this.suites.set(suite.id, suite)

    const result: TestGenResult = {
      id: `tgen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      suite,
      totalTests: limitedTests.length,
      edgeCases: limitedTests.filter(t => t.tags.includes('edge-case')).length,
      errorCases: limitedTests.filter(t => t.tags.includes('error-case')).length,
      coverageEstimate: Math.min(95, limitedTests.length * 12),
      timestamp: Date.now(),
    }

    this.notifyListeners({ type: 'tests-generated', result })
    return result
  }

  /**
   * Generate test from a function signature.
   */
  generateFromSignature(functionName: string, params: Array<{ name: string; type: string }>, returnType: string, framework?: TestFramework): TestCase {
    const fw = framework ?? this.config.defaultFramework
    const paramsStr = params.map(p => p.name).join(', ')

    let code: string
    if (fw === 'jest' || fw === 'vitest') {
      code = `describe('${functionName}', () => {\n  it('should return expected result', () => {\n    const result = ${functionName}(${paramsStr})\n    expect(result).toBeDefined()\n  })\n})`
    } else if (fw === 'pytest') {
      code = `def test_${functionName}():\n    result = ${functionName}(${paramsStr})\n    assert result is not None`
    } else {
      code = `func Test${functionName}(t *testing.T) {\n    result := ${functionName}(${paramsStr})\n    if result == nil {\n        t.Error("Expected result")\n    }\n}`
    }

    return {
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `test ${functionName} returns ${returnType}`,
      type: 'unit',
      framework: fw,
      code,
      description: `Test that ${functionName} returns the expected ${returnType}`,
      expected: `Returns ${returnType}`,
      tags: ['auto-generated'],
      priority: 'medium',
    }
  }

  /**
   * Analyze test coverage.
   */
  analyzeCoverage(sourceCode: string, testCode: string): { covered: number; uncovered: number; percentage: number; missingLines: number[] } {
    const sourceLines = sourceCode.split('\n').filter(l => l.trim().length > 0)

    const covered: number[] = []
    const uncovered: number[] = []

    for (let i = 0; i < sourceLines.length; i++) {
      const line = sourceLines[i] ?? ''
      // Check if any function/variable from this line appears in tests
      const identifiers = line.match(/\b\w+\b/g) ?? []
      const isCovered = identifiers.some(id => testCode.includes(id) && id.length > 2)
      if (isCovered) covered.push(i + 1)
      else uncovered.push(i + 1)
    }

    const percentage = sourceLines.length > 0 ? Math.round((covered.length / sourceLines.length) * 100) : 0

    return {
      covered: covered.length,
      uncovered: uncovered.length,
      percentage,
      missingLines: uncovered,
    }
  }

  /**
   * Get all test suites.
   */
  getSuites(): TestSuite[] {
    return Array.from(this.suites.values())
  }

  /**
   * Get a specific suite.
   */
  getSuite(id: string): TestSuite | undefined {
    return this.suites.get(id)
  }

  private extractFunctions(code: string): Array<{ name: string; params: Array<{ name: string; type: string }>; returnType: string }> {
    const functions: Array<{ name: string; params: Array<{ name: string; type: string }>; returnType: string }> = []
    const pattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/g

    let match
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1] ?? 'unknown'
      const paramsStr = match[2] ?? ''
      const returnType = match[3]?.trim() ?? 'void'

      const params = paramsStr.split(',').filter(p => p.trim()).map(p => {
        const parts = p.trim().split(/[\s:?=]/)
        return {
          name: parts[0]?.replace('?', '') ?? '',
          type: parts.find(s => s.includes(':'))?.replace(':', '').trim() ?? 'unknown',
        }
      }).filter(p => p.name)

      functions.push({ name, params, returnType })
    }

    return functions
  }

  private createBasicTest(func: { name: string; params: Array<{ name: string; type: string }>; returnType: string }, request: TestGenRequest): TestCase {
    const paramsStr = func.params.map(p => this.getDefaultValue(p.type)).join(', ')
    const fw = request.framework

    let code: string
    if (fw === 'jest' || fw === 'vitest') {
      code = `describe('${func.name}', () => {\n  it('should work correctly', () => {\n    const result = ${func.name}(${paramsStr})\n    expect(result).toBeDefined()\n  })\n})`
    } else if (fw === 'pytest') {
      code = `def test_${func.name}():\n    result = ${func.name}(${paramsStr})\n    assert result is not None`
    } else {
      code = `func Test${func.name}(t *testing.T) {\n    result := ${func.name}(${paramsStr})\n    _ = result\n}`
    }

    return {
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `should call ${func.name} correctly`,
      type: this.config.defaultTestType,
      framework: fw,
      code,
      description: `Basic test for ${func.name}`,
      expected: 'Function executes without error',
      tags: ['basic', 'auto-generated'],
      priority: 'high',
    }
  }

  private createEdgeCaseTests(func: { name: string; params: Array<{ name: string; type: string }>; returnType: string }, request: TestGenRequest): TestCase[] {
    const tests: TestCase[] = []
    const fw = request.framework

    // Test with empty/null params
    if (func.params.length > 0) {
      const nullParams = func.params.map(() => 'null').join(', ')
      let code: string
      if (fw === 'jest' || fw === 'vitest') {
        code = `it('should handle null inputs', () => {\n  const result = ${func.name}(${nullParams})\n  expect(result).toBeDefined()\n})`
      } else {
        code = `def test_${func.name}_null():\n    result = ${func.name}(${nullParams})\n    assert result is not None`
      }

      tests.push({
        id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `should handle null inputs for ${func.name}`,
        type: 'unit', framework: fw, code,
        description: `Edge case: null inputs`,
        expected: 'Handles null gracefully',
        tags: ['edge-case', 'auto-generated'], priority: 'medium',
      })
    }

    return tests
  }

  private createErrorCaseTests(func: { name: string; params: Array<{ name: string; type: string }>; returnType: string }, request: TestGenRequest): TestCase[] {
    const tests: TestCase[] = []
    const fw = request.framework

    // Test error handling
    let code: string
    if (fw === 'jest' || fw === 'vitest') {
      code = `it('should handle errors gracefully', () => {\n  expect(() => ${func.name}()).not.toThrow()\n})`
    } else {
      code = `def test_${func.name}_error():\n    try:\n        ${func.name}()\n    except Exception:\n        pass`
    }

    tests.push({
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `should handle errors in ${func.name}`,
      type: 'unit', framework: fw, code,
      description: `Error case: graceful error handling`,
      expected: 'Does not throw unexpected errors',
      tags: ['error-case', 'auto-generated'], priority: 'medium',
    })

    return tests
  }

  private getDefaultValue(type: string): string {
    switch (type) {
      case 'string': return "''"
      case 'number': return '0'
      case 'boolean': return 'false'
      case 'array': case 'Array': return '[]'
      case 'object': case 'Object': return '{}'
      case 'null': return 'null'
      case 'undefined': return 'undefined'
      default: return 'undefined'
    }
  }

  subscribe(listener: (event: TestingEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: TestingEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Testing event */
export interface TestingEvent {
  type: 'tests-generated' | 'tests-run' | 'coverage-analyzed'
  result?: TestGenResult
}

/** Singleton */
let instance: TestingFrameworkEngine | null = null

export function getTestingFrameworkEngine(config?: Partial<TestingFrameworkConfig>): TestingFrameworkEngine {
  if (!instance) instance = new TestingFrameworkEngine(config)
  return instance
}

export function resetTestingFrameworkEngine(): void { instance = null }
