/**
 * Automated Test Generation Engine for Idexal Agents.
 * Automatically generates unit tests, integration tests,
 * and edge case tests for existing code.
 */

/** Test type */
export type TestType =
  | 'unit'
  | 'integration'
  | 'edge-case'
  | 'boundary'
  | 'error-handling'
  | 'regression'

/** Test framework */
export type TestFramework = 'jest' | 'vitest' | 'mocha' | 'ava'

/** Generated test */
export interface GeneratedTest {
  /** Test ID */
  id: string
  /** Test name */
  name: string
  /** Test description */
  description: string
  /** Test type */
  type: TestType
  /** Test code */
  code: string
  /** Test framework */
  framework: TestFramework
  /** Source file */
  sourceFile: string
  /** Function/class being tested */
  targetEntity: string
  /** Test file path */
  testFile: string
  /** Dependencies needed */
  dependencies: string[]
  /** Mock data */
  mocks: TestMock[]
  /** Coverage target */
  coverageTarget: number
  /** Priority */
  priority: 'high' | 'medium' | 'low'
}

/** Test mock */
export interface TestMock {
  /** Mock name */
  name: string
  /** Mock type */
  type: 'function' | 'module' | 'class'
  /** Mock implementation */
  implementation: string
}

/** Function analysis */
export interface FunctionAnalysis {
  /** Function name */
  name: string
  /** Parameters */
  parameters: { name: string; type: string; optional: boolean; defaultValue?: string }[]
  /** Return type */
  returnType: string
  /** Is async */
  isAsync: boolean
  /** Is exported */
  isExported: boolean
  /** Has side effects */
  hasSideEffects: boolean
  /** Dependencies */
  dependencies: string[]
  /** Complexity */
  complexity: number
}

/** Test generation config */
export interface AutoTestConfig {
  /** Test framework */
  framework: TestFramework
  /** Test file suffix */
  fileSuffix: string
  /** Include edge cases */
  includeEdgeCases: boolean
  /** Include error handling */
  includeErrorHandling: boolean
  /** Include boundary tests */
  includeBoundaryTests: boolean
  /** Mock external dependencies */
  mockExternalDeps: boolean
  /** Generate coverage thresholds */
  coverageThreshold: number
  /** Max tests per function */
  maxTestsPerFunction: number
}

/**
 * Automated Test Generation Engine.
 */
export class AutoTestEngine {
  private config: AutoTestConfig
  private generatedTests: Map<string, GeneratedTest[]> = new Map()
  private listeners: Set<(tests: GeneratedTest[]) => void> = new Set()

  constructor(config: Partial<AutoTestConfig> = {}) {
    this.config = {
      framework: config.framework ?? 'vitest',
      fileSuffix: config.fileSuffix ?? '.test',
      includeEdgeCases: config.includeEdgeCases ?? true,
      includeErrorHandling: config.includeErrorHandling ?? true,
      includeBoundaryTests: config.includeBoundaryTests ?? true,
      mockExternalDeps: config.mockExternalDeps ?? true,
      coverageThreshold: config.coverageThreshold ?? 80,
      maxTestsPerFunction: config.maxTestsPerFunction ?? 10,
    }
  }

  /**
   * Generate tests for a source file.
   */
  generateTests(sourceFile: string, content: string): GeneratedTest[] {
    const functions = this.analyzeFunctions(content)
    const tests: GeneratedTest[] = []

    for (const func of functions) {
      const funcTests = this.generateFunctionTests(func, sourceFile)
      tests.push(...funcTests)
    }

    this.generatedTests.set(sourceFile, tests)
    this.notifyListeners(tests)
    return tests
  }

  /**
   * Analyze functions in source code.
   */
  private analyzeFunctions(content: string): FunctionAnalysis[] {
    const functions: FunctionAnalysis[] = []
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()
      const match = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/)

      if (match) {
        const name = match[1]!
        const paramsStr = match[2] || ''
        const isAsync = line.includes('async')
        const isExported = line.startsWith('export')

        // Parse parameters
        const parameters = paramsStr.split(',').filter(p => p.trim()).map(p => {
          const parts = p.trim().split(':')
          const name = parts[0]!.trim()
          const type = parts[1]?.trim() ?? 'any'
          const optional = name.includes('?') || p.includes('=')
          const defaultValue = p.includes('=') ? p.split('=')[1]?.trim() : undefined
          return { name: name.replace('?', ''), type, optional, ...(defaultValue !== undefined ? { defaultValue } : {}) }
        })

        // Find return type
        const returnMatch = line.match(/\)\s*:\s*([^{]+)/)
        const returnType = returnMatch?.[1]?.trim() ?? 'void'

        // Analyze complexity
        let complexity = 1
        for (let j = i + 1; j < lines.length; j++) {
          const funcLine = lines[j]!
          if (funcLine.match(/\b(if|else|for|while|switch|case|catch)\b/)) complexity++
          if (funcLine === '}') break
        }

        functions.push({
          name,
          parameters,
          returnType,
          isAsync,
          isExported,
          hasSideEffects: content.includes(name + '('),
          dependencies: [],
          complexity,
        })
      }
    }

    return functions
  }

  /**
   * Generate tests for a function.
   */
  private generateFunctionTests(func: FunctionAnalysis, sourceFile: string): GeneratedTest[] {
    const tests: GeneratedTest[] = []

    // Basic success test
    tests.push(this.generateSuccessTest(func, sourceFile))

    // Parameter tests
    for (const param of func.parameters) {
      if (!param.optional) {
        tests.push(this.generateParameterTest(func, param.name, sourceFile))
      }
    }

    // Edge cases
    if (this.config.includeEdgeCases) {
      tests.push(...this.generateEdgeCaseTests(func, sourceFile))
    }

    // Error handling
    if (this.config.includeErrorHandling && func.complexity > 3) {
      tests.push(this.generateErrorTest(func, sourceFile))
    }

    // Boundary tests
    if (this.config.includeBoundaryTests) {
      tests.push(...this.generateBoundaryTests(func, sourceFile))
    }

    return tests.slice(0, this.config.maxTestsPerFunction)
  }

  /**
   * Generate success test.
   */
  private generateSuccessTest(func: FunctionAnalysis, sourceFile: string): GeneratedTest {
    const params = func.parameters.map(p => this.generateTestValue(p.type)).join(', ')
    void params
    const isAsync = func.isAsync

    const testCode = `import { describe, it, expect } from '${this.config.framework}'

describe('${func.name}', () => {
  it('should work with valid inputs', ${isAsync ? 'async ' : ''}() => {
    // Arrange
    ${func.parameters.map(p => `const ${p.name} = ${this.generateTestValue(p.type)}`).join('\n    ')}
    
    // Act
    const result = ${isAsync ? 'await ' : ''}${func.name}(${func.parameters.map(p => p.name).join(', ')})
    
    // Assert
    expect(result).toBeDefined()
  })
})`

    return {
      id: `test-${func.name}-success`,
      name: `${func.name} - success case`,
      description: `Tests ${func.name} with valid inputs`,
      type: 'unit',
      code: testCode,
      framework: this.config.framework,
      sourceFile,
      targetEntity: func.name,
      testFile: this.getTestFilePath(sourceFile),
      dependencies: [],
      mocks: [],
      coverageTarget: this.config.coverageThreshold,
      priority: 'high',
    }
  }

  /**
   * Generate parameter test.
   */
  private generateParameterTest(func: FunctionAnalysis, paramName: string, sourceFile: string): GeneratedTest {
    const testCode = `import { describe, it, expect } from '${this.config.framework}'

describe('${func.name}', () => {
  it('should handle ${paramName} parameter', ${func.isAsync ? 'async ' : ''}() => {
    // Arrange
    ${func.parameters.map(p => `const ${p.name} = ${p.name === paramName ? this.generateTestValue(p.type) : this.generateTestValue(p.type)}`).join('\n    ')}
    
    // Act
    const result = ${func.isAsync ? 'await ' : ''}${func.name}(${func.parameters.map(p => p.name).join(', ')})
    
    // Assert
    expect(result).toBeDefined()
  })
})`

    return {
      id: `test-${func.name}-${paramName}`,
      name: `${func.name} - ${paramName} parameter`,
      description: `Tests ${func.name} with ${paramName} parameter`,
      type: 'unit',
      code: testCode,
      framework: this.config.framework,
      sourceFile,
      targetEntity: func.name,
      testFile: this.getTestFilePath(sourceFile),
      dependencies: [],
      mocks: [],
      coverageTarget: this.config.coverageThreshold,
      priority: 'medium',
    }
  }

  /**
   * Generate edge case tests.
   */
  private generateEdgeCaseTests(func: FunctionAnalysis, sourceFile: string): GeneratedTest[] {
    const tests: GeneratedTest[] = []

    // Null/undefined test
    if (func.parameters.some(p => !p.optional)) {
      const testCode = `import { describe, it, expect } from '${this.config.framework}'

describe('${func.name}', () => {
  it('should handle null/undefined inputs', ${func.isAsync ? 'async ' : ''}() => {
    // Arrange & Act & Assert
    expect(() => ${func.isAsync ? 'await ' : ''}${func.name}(${func.parameters.map(() => 'undefined').join(', ')})).not.toThrow()
  })
})`

      tests.push({
        id: `test-${func.name}-null`,
        name: `${func.name} - null inputs`,
        description: `Tests ${func.name} with null/undefined inputs`,
        type: 'edge-case',
        code: testCode,
        framework: this.config.framework,
        sourceFile,
        targetEntity: func.name,
        testFile: this.getTestFilePath(sourceFile),
        dependencies: [],
        mocks: [],
        coverageTarget: this.config.coverageThreshold,
        priority: 'medium',
      })
    }

    return tests
  }

  /**
   * Generate error test.
   */
  private generateErrorTest(func: FunctionAnalysis, sourceFile: string): GeneratedTest {
    const testCode = `import { describe, it, expect } from '${this.config.framework}'

describe('${func.name}', () => {
  it('should throw error for invalid inputs', ${func.isAsync ? 'async ' : ''}() => {
    // Arrange
    const invalidInputs = ${JSON.stringify(func.parameters.map(() => null))}
    
    // Act & Assert
    await expect(${func.isAsync ? 'await ' : ''}${func.name}(...invalidInputs)).rejects.toThrow()
  })
})`

    return {
      id: `test-${func.name}-error`,
      name: `${func.name} - error handling`,
      description: `Tests ${func.name} error handling`,
      type: 'error-handling',
      code: testCode,
      framework: this.config.framework,
      sourceFile,
      targetEntity: func.name,
      testFile: this.getTestFilePath(sourceFile),
      dependencies: [],
      mocks: [],
      coverageTarget: this.config.coverageThreshold,
      priority: 'medium',
    }
  }

  /**
   * Generate boundary tests.
   */
  private generateBoundaryTests(func: FunctionAnalysis, sourceFile: string): GeneratedTest[] {
    const tests: GeneratedTest[] = []

    // Number boundaries
    const numberParams = func.parameters.filter(p => p.type.includes('number') || p.type.includes('int'))
    for (const param of numberParams) {
      const testCode = `import { describe, it, expect } from '${this.config.framework}'

describe('${func.name}', () => {
  it('should handle boundary values for ${param.name}', ${func.isAsync ? 'async ' : ''}() => {
    // Arrange
    const boundaryValues = [0, 1, -1, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
    
    for (const value of boundaryValues) {
      ${func.parameters.map(p => `const ${p.name} = ${p.name === param.name ? 'value' : this.generateTestValue(p.type)}`).join('\n      ')}
      
      // Act & Assert
      expect(() => ${func.isAsync ? 'await ' : ''}${func.name}(${func.parameters.map(p => p.name).join(', ')})).not.toThrow()
    }
  })
})`

      tests.push({
        id: `test-${func.name}-boundary-${param.name}`,
        name: `${func.name} - ${param.name} boundary`,
        description: `Tests ${func.name} with boundary values for ${param.name}`,
        type: 'boundary',
        code: testCode,
        framework: this.config.framework,
        sourceFile,
        targetEntity: func.name,
        testFile: this.getTestFilePath(sourceFile),
        dependencies: [],
        mocks: [],
        coverageTarget: this.config.coverageThreshold,
        priority: 'low',
      })
    }

    return tests
  }

  /**
   * Generate test value based on type.
   */
  private generateTestValue(type: string): string {
    const lower = type.toLowerCase()
    if (lower.includes('string')) return "'test'"
    if (lower.includes('number') || lower.includes('int')) return '42'
    if (lower.includes('boolean')) return 'true'
    if (lower.includes('array') || lower.includes('[]')) return '[]'
    if (lower.includes('object') || lower.includes('record')) return '{}'
    if (lower.includes('function') || lower.includes('callback')) return '() => {}'
    if (lower.includes('promise')) return "Promise.resolve()"
    return 'undefined'
  }

  /**
   * Get test file path.
   */
  private getTestFilePath(sourceFile: string): string {
    const parts = sourceFile.split('.')
    parts.splice(-1, 0, 'test')
    return parts.join('.')
  }

  /**
   * Subscribe to test generation events.
   */
  subscribe(listener: (tests: GeneratedTest[]) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(tests: GeneratedTest[]): void {
    for (const listener of this.listeners) {
      try { listener(tests) } catch { /* ignore */ }
    }
  }
}

/** Singleton instance */
let instance: AutoTestEngine | null = null

export function getAutoTestEngine(
  config?: Partial<AutoTestConfig>
): AutoTestEngine {
  if (!instance) {
    instance = new AutoTestEngine(config)
  }
  return instance
}

export function resetAutoTestEngine(): void {
  instance = null
}
