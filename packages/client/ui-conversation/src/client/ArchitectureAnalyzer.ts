/**
 * Code Architecture Analyzer engine.
 *
 * Inspects project structure and maps module relationships into architectural
 * layers (presentation → application → domain → infrastructure), detects
 * violations, and recommends refactoring to maintain clean architecture.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArchitecturePattern = 'layered' | 'hexagonal' | 'clean' | 'modular' | 'monolithic' | 'unknown'

export type ViolationSeverity = 'critical' | 'warning' | 'info'

export type LayerType = 'presentation' | 'application' | 'domain' | 'infrastructure' | 'shared' | 'unknown'

export interface ArchModule {
  readonly path: string
  readonly name: string
  readonly layer: LayerType
  readonly dependencies: readonly string[]
  readonly dependents: readonly string[]
  readonly exports: readonly string[]
  readonly LOC: number
  readonly complexity: number
}

export interface DependencyViolation {
  readonly from: string
  readonly to: string
  readonly fromLayer: LayerType
  readonly toLayer: LayerType
  readonly severity: ViolationSeverity
  readonly message: string
  readonly suggestion: string
}

export interface ArchitectureReport {
  readonly pattern: ArchitecturePattern
  readonly modules: ArchModule[]
  readonly violations: DependencyViolation[]
  readonly layers: Record<LayerType, string[]>
  readonly cohesionScore: number   // 0-1
  readonly couplingScore: number   // 0-1 (lower is better)
  readonly maintainabilityIndex: number // 0-100
  readonly circularDependencies: string[][]
  readonly recommendations: readonly string[]
}

export interface ArchitectureConfig {
  readonly sourcePattern: string
  readonly maxDepth: number
  readonly layerRules: Partial<Record<LayerType, readonly LayerType[]>>
}

// ---------------------------------------------------------------------------
// Default layer rules — allowed dependency direction (higher → lower)
// ---------------------------------------------------------------------------

const DEFAULT_LAYER_RULES: Record<LayerType, readonly LayerType[]> = {
  presentation: ['application', 'shared'],
  application: ['domain', 'shared'],
  domain: ['shared'],
  infrastructure: ['domain', 'shared'],
  shared: [],
  unknown: [],
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ArchitectureAnalyzerEngine {
  private readonly config: ArchitectureConfig

  constructor(config?: Partial<ArchitectureConfig>) {
    this.config = {
      sourcePattern: config?.sourcePattern ?? '**/*.ts',
      maxDepth: config?.maxDepth ?? 10,
      layerRules: { ...DEFAULT_LAYER_RULES, ...config?.layerRules },
    }
  }

  /** Classify a file path into an architectural layer. */
  classifyLayer(filePath: string): LayerType {
    const lower = filePath.toLowerCase()
    if (/\.?(ui|view|component|page|screen|template)/.test(lower)) return 'presentation'
    if (/\.?(service|controller|handler|facade|usecase|interactor)/.test(lower)) return 'application'
    if (/\.?(model|entity|value.?object|domain|repository\.?interface)/.test(lower)) return 'domain'
    if (/\.?(repository\.?(impl|db|sql)|adapter|infrastructure|orm|dao|gateway|client\.?impl)/.test(lower)) return 'infrastructure'
    if (/\.?(util|shared|common|types?|constants?|config|helpers?)\b/.test(lower)) return 'shared'
    return 'unknown'
  }

  /** Analyze modules and produce a full architecture report. */
  analyze(modules: ArchModule[]): ArchitectureReport {
    const violations = this.detectViolations(modules)
    const layers = this.groupByLayer(modules)
    const pattern = this.detectPattern(modules, layers, violations)
    const circular = this.detectCircular(modules)
    const cohesion = this.calculateCohesion(modules)
    const coupling = this.calculateCoupling(modules)
    const maintainability = this.calculateMaintainability(modules, violations, circular)
    const recommendations = this.generateRecommendations(modules, violations, circular, pattern)

    return {
      pattern,
      modules,
      violations,
      layers,
      cohesionScore: cohesion,
      couplingScore: coupling,
      maintainabilityIndex: maintainability,
      circularDependencies: circular,
      recommendations,
    }
  }

  /** Classify raw file paths into modules. */
  buildModules(files: { path: string; loc: number; complexity: number; exports: string[]; imports: string[] }[]): ArchModule[] {
    return files.map(f => {
      const layer = this.classifyLayer(f.path)
      const deps = f.imports.map(i => this.resolveImportPath(i, f.path))
      return {
        path: f.path,
        name: this.extractName(f.path),
        layer,
        dependencies: deps,
        dependents: [], // filled in second pass
        exports: f.exports,
        LOC: f.loc,
        complexity: f.complexity,
      }
    })
  }

  /** Fill `dependents` arrays after buildModules. */
  resolveDependents(modules: ArchModule[]): ArchModule[] {
    const byPath = new Map(modules.map(m => [m.path, m]))
    return modules.map(m => {
      const deps = m.dependencies.filter(d => byPath.has(d))
      return { ...m, dependents: deps.filter(d => byPath.get(d)!.dependencies.includes(m.path)).map(() => m.path) }
    })
  }

  // ---------------------------------------------------------------------------
  // Analysis internals
  // ---------------------------------------------------------------------------

  private detectViolations(modules: ArchModule[]): DependencyViolation[] {
    const rules = this.config.layerRules
    const violations: DependencyViolation[] = []

    for (const mod of modules) {
      for (const depPath of mod.dependencies) {
        const dep = modules.find(m => m.path === depPath)
        if (!dep) continue
        const allowed = rules[mod.layer] ?? []
        if (!allowed.includes(dep.layer) && mod.layer !== 'shared' && dep.layer !== 'unknown') {
          const severity: ViolationSeverity = this.violationSeverity(mod.layer, dep.layer)
          violations.push({
            from: mod.path,
            to: dep.path,
            fromLayer: mod.layer,
            toLayer: dep.layer,
            severity,
            message: `${mod.layer} module depends on ${dep.layer} module`,
            suggestion: `Move dependency upward or extract a shared interface`,
          })
        }
      }
    }
    return violations
  }

  private violationSeverity(from: LayerType, to: LayerType): ViolationSeverity {
    const order: LayerType[] = ['presentation', 'application', 'domain', 'infrastructure', 'shared']
    const fi = order.indexOf(from)
    const ti = order.indexOf(to)
    if (fi >= 0 && ti >= 0 && ti < fi) return 'critical'
    if (from === 'domain' && to === 'infrastructure') return 'warning'
    return 'info'
  }

  private groupByLayer(modules: ArchModule[]): Record<LayerType, string[]> {
    const groups: Record<LayerType, string[]> = {
      presentation: [], application: [], domain: [], infrastructure: [], shared: [], unknown: [],
    }
    for (const m of modules) {
      groups[m.layer].push(m.path)
    }
    return groups
  }

  private detectPattern(_modules: ArchModule[], layers: Record<LayerType, string[]>, violations: DependencyViolation[]): ArchitecturePattern {
    const hasLayer = (l: LayerType) => layers[l].length > 0
    const criticalCount = violations.filter(v => v.severity === 'critical').length
    if (hasLayer('domain') && hasLayer('infrastructure') && criticalCount < 3) return 'clean'
    if (hasLayer('domain') && hasLayer('infrastructure') && criticalCount < 8) return 'hexagonal'
    if (hasLayer('presentation') && hasLayer('application') && hasLayer('domain')) return 'layered'
    if (hasLayer('presentation') && hasLayer('application')) return 'modular'
    if (layers.unknown.length > (Object.values(layers).flat()).length * 0.5) return 'monolithic'
    return 'unknown'
  }

  private detectCircular(modules: ArchModule[]): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const stack = new Set<string>()

    const dfs = (node: string, path: string[]): void => {
      if (stack.has(node)) {
        const cycleStart = path.indexOf(node)
        if (cycleStart >= 0) cycles.push(path.slice(cycleStart).concat(node))
        return
      }
      if (visited.has(node)) return
      visited.add(node)
      stack.add(node)
      const mod = modules.find(m => m.path === node)
      if (mod) {
        for (const dep of mod.dependencies) {
          dfs(dep, [...path, node])
        }
      }
      stack.delete(node)
    }

    for (const m of modules) {
      visited.clear()
      stack.clear()
      dfs(m.path, [])
    }
    return cycles
  }

  private calculateCohesion(modules: ArchModule[]): number {
    if (modules.length === 0) return 1
    const layers = this.groupByLayer(modules)
    let totalCohesion = 0
    let layerCount = 0
    for (const layerModules of Object.values(layers)) {
      if (layerModules.length <= 1) { totalCohesion += 1; layerCount++; continue }
      const paths = new Set(layerModules)
      const modList = modules.filter(m => paths.has(m.path))
      let internalDeps = 0
      let totalPossible = modList.length * (modList.length - 1)
      for (const m of modList) {
        internalDeps += m.dependencies.filter(d => paths.has(d)).length
      }
      totalCohesion += totalPossible > 0 ? internalDeps / totalPossible : 1
      layerCount++
    }
    return layerCount > 0 ? totalCohesion / layerCount : 1
  }

  private calculateCoupling(modules: ArchModule[]): number {
    if (modules.length === 0) return 0
    const totalDeps = modules.reduce((sum, m) => sum + m.dependencies.length, 0)
    const maxPossible = modules.length * (modules.length - 1)
    return maxPossible > 0 ? totalDeps / maxPossible : 0
  }

  private calculateMaintainability(modules: ArchModule[], violations: DependencyViolation[], circular: string[][]): number {
    const cohesionBonus = this.calculateCohesion(modules) * 30
    const couplingBonus = (1 - this.calculateCoupling(modules)) * 30
    const violationPenalty = violations.length * 2
    const circularPenalty = circular.length * 10
    const sizeBonus = Math.max(0, 40 - modules.length * 0.5)
    return Math.max(0, Math.min(100, cohesionBonus + couplingBonus + sizeBonus - violationPenalty - circularPenalty))
  }

  private generateRecommendations(modules: ArchModule[], violations: DependencyViolation[], circular: string[][], pattern: ArchitecturePattern): string[] {
    const recs: string[] = []
    if (pattern === 'monolithic') recs.push('Consider splitting monolithic modules into layered architecture (presentation → application → domain → infrastructure).')
    if (circular.length > 0) recs.push(`Resolve ${circular.length} circular dependency chain(s) by extracting shared interfaces.`)
    const criticals = violations.filter(v => v.severity === 'critical')
    if (criticals.length > 0) recs.push(`Fix ${criticals.length} critical layer violations — domain should never depend on presentation.`)
    const highComplexity = modules.filter(m => m.complexity > 20)
    if (highComplexity.length > 0) recs.push(`${highComplexity.length} module(s) have cyclomatic complexity > 20 — consider breaking them down.`)
    if (modules.length > 100) recs.push('Project has > 100 modules — consider code splitting and lazy loading strategies.')
    const largeModules = modules.filter(m => m.LOC > 500)
    if (largeModules.length > 0) recs.push(`${largeModules.length} module(s) exceed 500 LOC — extract responsibilities into smaller files.`)
    if (recs.length === 0) recs.push('Architecture looks healthy! Keep up the good work.')
    return recs
  }

  private resolveImportPath(importPath: string, fromPath: string): string {
    if (importPath.startsWith('.')) {
      const dir = fromPath.substring(0, fromPath.lastIndexOf('/'))
      return `${dir}/${importPath}`.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/')
    }
    return importPath
  }

  private extractName(filePath: string): string {
    const parts = filePath.split('/')
    return parts[parts.length - 1]?.replace(/\.[^.]+$/, '') ?? filePath
  }
}

let _instance: ArchitectureAnalyzerEngine | undefined
export function getArchitectureAnalyzerEngine(config?: Partial<ArchitectureConfig>): ArchitectureAnalyzerEngine {
  _instance ??= new ArchitectureAnalyzerEngine(config)
  return _instance
}
export function resetArchitectureAnalyzerEngine(): void { _instance = undefined }
