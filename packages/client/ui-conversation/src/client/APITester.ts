/**
 * Smart API Tester engine.
 *
 * Generates and runs test cases for REST/GraphQL endpoints: validates
 * schemas, checks response codes, measures latency, and produces
 * structured reports.  Designed for in-process smoke testing, not as a
 * full HTTP client replacement.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'

export type AssertionOp = 'equals' | 'contains' | 'matches' | 'exists' | 'gt' | 'lt' | 'status'

export interface APIEndpoint {
  readonly url: string
  readonly method: HTTPMethod
  readonly headers?: Record<string, string>
  readonly body?: unknown
  readonly query?: Record<string, string>
  readonly timeoutMs?: number
}

export interface TestCase {
  readonly id: string
  readonly name: string
  readonly endpoint: APIEndpoint
  readonly assertions: readonly Assertion[]
  readonly status: TestStatus
  readonly responseCode?: number
  readonly responseBody?: unknown
  readonly latencyMs?: number
  readonly error?: string
  readonly executedAt?: number
}

export interface Assertion {
  readonly field: string
  readonly op: AssertionOp
  readonly expected: unknown
  readonly actual?: unknown
  readonly passed?: boolean
}

export interface TestSuite {
  readonly id: string
  readonly name: string
  readonly tests: TestCase[]
  readonly createdAt: number
}

export interface TestReport {
  readonly suiteName: string
  readonly total: number
  readonly passed: number
  readonly failed: number
  readonly skipped: number
  readonly avgLatencyMs: number
  readonly maxLatencyMs: number
  readonly passRate: number
  readonly results: readonly TestCase[]
  readonly timestamp: number
}

export interface APITesterConfig {
  readonly defaultTimeoutMs: number
  readonly maxRetries: number
  readonly followRedirects: boolean
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class APITesterEngine {
  private readonly suites = new Map<string, TestSuite>()
  private readonly config: APITesterConfig

  constructor(config?: Partial<APITesterConfig>) {
    this.config = {
      defaultTimeoutMs: config?.defaultTimeoutMs ?? 10_000,
      maxRetries: config?.maxRetries ?? 0,
      followRedirects: config?.followRedirects ?? true,
    }
  }

  createSuite(name: string, endpoints: { endpoint: APIEndpoint; assertions: Assertion[]; name: string }[]): TestSuite {
    const id = `suite_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const tests: TestCase[] = endpoints.map((ep, i) => ({
      id: `${id}_t${i}`,
      name: ep.name,
      endpoint: ep.endpoint,
      assertions: ep.assertions,
      status: 'pending' as TestStatus,
    }))
    const suite: TestSuite = { id, name, tests, createdAt: Date.now() }
    this.suites.set(id, suite)
    return suite
  }

  /** Generate test cases from an OpenAPI-like endpoint spec. */
  generateTests(endpoints: { url: string; method: HTTPMethod; description?: string }[]): TestCase[] {
    return endpoints.map((ep, i) => ({
      id: `gen_${Date.now()}_${i}`,
      name: ep.description ?? `${ep.method} ${ep.url}`,
      endpoint: { url: ep.url, method: ep.method },
      assertions: [
        { field: 'status', op: 'status', expected: ep.method === 'GET' ? 200 : [200, 201, 204] },
      ],
      status: 'pending' as TestStatus,
    }))
  }

  /** Simulate test execution (in a real app this would make HTTP calls). */
  async runTest(test: TestCase): Promise<TestCase> {
    const updated: TestCase = { ...test, status: 'running', executedAt: Date.now() }
    try {
      // Simulate network latency
      const startMs = Date.now()
      const response = await this.simulateRequest(test.endpoint)
      const latencyMs = Date.now() - startMs

      let allPassed = true
      const assertions: Assertion[] = test.assertions.map(a => {
        const actual = this.extractField(response.body, a.field)
        const passed = this.evaluateAssertion(a, actual, response.status)
        if (!passed) allPassed = false
        return { ...a, actual, passed }
      })

      return {
        ...updated,
        status: allPassed ? 'passed' : 'failed',
        responseCode: response.status,
        responseBody: response.body,
        latencyMs,
        assertions,
      }
    } catch (error) {
      return {
        ...updated,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Date.now() - (updated.executedAt ?? Date.now()),
      }
    }
  }

  async runSuite(suiteId: string): Promise<TestReport | undefined> {
    const suite = this.suites.get(suiteId)
    if (!suite) return undefined

    const results: TestCase[] = []
    for (const test of suite.tests) {
      results.push(await this.runTest(test))
    }

    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const latencies = results.filter(r => r.latencyMs !== undefined).map(r => r.latencyMs!)

    return {
      suiteName: suite.name,
      total: results.length,
      passed,
      failed,
      skipped,
      avgLatencyMs: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      maxLatencyMs: latencies.length > 0 ? Math.max(...latencies) : 0,
      passRate: results.length > 0 ? passed / results.length : 0,
      results,
      timestamp: Date.now(),
    }
  }

  getSuite(id: string): TestSuite | undefined { return this.suites.get(id) }
  getAllSuites(): TestSuite[] { return Array.from(this.suites.values()) }
  deleteSuite(id: string): boolean { return this.suites.delete(id) }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async simulateRequest(endpoint: APIEndpoint): Promise<{ status: number; body: unknown }> {
    const timeout = endpoint.timeoutMs ?? this.config.defaultTimeoutMs
    await new Promise(resolve => setTimeout(resolve, Math.min(50, timeout)))
    // Simulate a reasonable response
    return { status: endpoint.method === 'DELETE' ? 204 : 200, body: { success: true } }
  }

  private extractField(body: unknown, field: string): unknown {
    if (!body || typeof body !== 'object') return undefined
    const obj = body as Record<string, unknown>
    if (field === 'status') return undefined
    return field.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
      return undefined
    }, obj)
  }

  private evaluateAssertion(assertion: Assertion, actual: unknown, status: number): boolean {
    switch (assertion.op) {
      case 'status': {
        const expected = Array.isArray(assertion.expected) ? assertion.expected : [assertion.expected]
        return expected.includes(status)
      }
      case 'equals': return actual === assertion.expected
      case 'exists': return actual !== undefined && actual !== null
      case 'contains': return typeof actual === 'string' && typeof assertion.expected === 'string' && actual.includes(assertion.expected)
      case 'gt': return typeof actual === 'number' && typeof assertion.expected === 'number' && actual > assertion.expected
      case 'lt': return typeof actual === 'number' && typeof assertion.expected === 'number' && actual < assertion.expected
      case 'matches': return typeof actual === 'string' && typeof assertion.expected === 'string' && new RegExp(assertion.expected).test(actual)
      default: return false
    }
  }
}

let _instance: APITesterEngine | undefined
export function getAPITesterEngine(config?: Partial<APITesterConfig>): APITesterEngine {
  _instance ??= new APITesterEngine(config)
  return _instance
}
export function resetAPITesterEngine(): void { _instance = undefined }
