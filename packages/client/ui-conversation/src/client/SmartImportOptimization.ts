/**
 * Smart Import Optimization Engine for Idexal Agents.
 * Detects unused imports, duplicate imports, missing imports,
 * and suggests optimal import ordering.
 */

/** Import statement */
export interface ImportStatement {
  /** Full import line */
  line: string
  /** Imported identifiers */
  names: string[]
  /** Import source (module path) */
  source: string
  /** Line number in file */
  lineNumber: number
  /** Whether it's a default import */
  isDefault: boolean
  /** Whether it's a type-only import */
  isTypeOnly: boolean
  /** Whether it's a namespace import */
  isNamespace: boolean
}

/** Import issue type */
export type ImportIssueType =
  | 'unused-import'
  | 'duplicate-import'
  | 'missing-import'
  | 'wrong-order'
  | 'mixed-default-named'
  | 'type-import-used'
  | 'circular-dependency'
  | 'barrel-import'

/** Import issue severity */
export type ImportIssueSeverity = 'error' | 'warning' | 'info'

/** Import optimization suggestion */
export interface ImportOptimization {
  /** Suggestion ID */
  id: string
  /** Issue type */
  type: ImportIssueType
  /** Severity */
  severity: ImportIssueSeverity
  /** Title */
  title: string
  /** Description */
  description: string
  /** Original import */
  originalImport?: string
  /** Suggested import */
  suggestedImport?: string
  /** Line number */
  lineNumber: number
  /** Whether auto-fix is safe */
  autoFixable: boolean
  /** Import source */
  source: string
}

/** Import group for ordering */
export interface ImportGroup {
  /** Group name */
  name: string
  /** Pattern to match */
  pattern: RegExp
  /** Priority (lower = first) */
  priority: number
}

/** Import optimization config */
export interface SmartImportConfig {
  /** Enable unused import detection */
  enableUnusedDetection: boolean
  /** Enable duplicate import detection */
  enableDuplicateDetection: boolean
  /** Enable missing import detection */
  enableMissingDetection: boolean
  /** Enable import ordering */
  enableOrdering: boolean
  /** Enable barrel import detection */
  enableBarrelDetection: boolean
  /** Enable circular dependency detection */
  enableCircularDetection: boolean
  /** Auto-fix imports */
  autoFix: boolean
  /** Max suggestions */
  maxSuggestions: number
  /** Import groups for ordering */
  importGroups: ImportGroup[]
}

/**
 * Smart Import Optimization Engine.
 */
export class SmartImportEngine {
  private config: SmartImportConfig
  private importHistory: Map<string, ImportStatement[]> = new Map()
  private listeners: Set<(optimizations: ImportOptimization[]) => void> = new Set()

  constructor(config: Partial<SmartImportConfig> = {}) {
    this.config = {
      enableUnusedDetection: config.enableUnusedDetection ?? true,
      enableDuplicateDetection: config.enableDuplicateDetection ?? true,
      enableMissingDetection: config.enableMissingDetection ?? true,
      enableOrdering: config.enableOrdering ?? true,
      enableBarrelDetection: config.enableBarrelDetection ?? true,
      enableCircularDetection: config.enableCircularDetection ?? true,
      autoFix: config.autoFix ?? false,
      maxSuggestions: config.maxSuggestions ?? 50,
      importGroups: config.importGroups ?? this.getDefaultImportGroups(),
    }
  }

  /**
   * Analyze code and suggest import optimizations.
   */
  analyze(code: string, filePath: string): ImportOptimization[] {
    const lines = code.split('\n')
    const imports = this.parseImports(lines)
    const optimizations: ImportOptimization[] = []

    // Store imports for this file
    this.importHistory.set(filePath, imports)

    // Detect unused imports
    if (this.config.enableUnusedDetection) {
      optimizations.push(...this.detectUnusedImports(lines, imports))
    }

    // Detect duplicate imports
    if (this.config.enableDuplicateDetection) {
      optimizations.push(...this.detectDuplicateImports(imports))
    }

    // Detect missing imports
    if (this.config.enableMissingDetection) {
      optimizations.push(...this.detectMissingImports(lines, imports))
    }

    // Detect import ordering issues
    if (this.config.enableOrdering) {
      optimizations.push(...this.detectOrderingIssues(imports))
    }

    // Detect barrel imports
    if (this.config.enableBarrelDetection) {
      optimizations.push(...this.detectBarrelImports(imports))
    }

    // Detect circular dependencies
    if (this.config.enableCircularDetection) {
      optimizations.push(...this.detectCircularDependencies(filePath, imports))
    }

    // Filter and sort
    const filtered = optimizations
      .sort((a, b) => {
        const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 }
        return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
      })
      .slice(0, this.config.maxSuggestions)

    this.notifyListeners(filtered)
    return filtered
  }

  /**
   * Parse imports from code lines.
   */
  private parseImports(lines: string[]): ImportStatement[] {
    const imports: ImportStatement[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()
      if (!line.startsWith('import ')) continue

      const isTypeOnly = line.includes('type ') && line.includes('{')
      const isDefault = !line.includes('{') && !line.includes('*')
      const isNamespace = line.includes('* as')

      // Extract names
      const namesMatch = line.match(/\{([^}]+)\}/)
      const names = namesMatch
        ? namesMatch[1]!.split(',').map(n => n.trim().replace(/^type\s+/, ''))
        : []

      // Extract source
      const sourceMatch = line.match(/from\s+['"]([^'"]+)['"]/)
      const source = sourceMatch?.[1] ?? ''

      imports.push({
        line,
        names,
        source,
        lineNumber: i + 1,
        isDefault,
        isTypeOnly,
        isNamespace,
      })
    }

    return imports
  }

  /**
   * Detect unused imports.
   */
  private detectUnusedImports(lines: string[], imports: ImportStatement[]): ImportOptimization[] {
    const optimizations: ImportOptimization[] = []
    const codeLines = lines.filter(l => !l.trim().startsWith('import ')).join('\n')

    for (const imp of imports) {
      if (imp.isNamespace) continue // Skip namespace imports

      const unusedNames: string[] = []

      for (const name of imp.names) {
        if (name === 'type') continue
        // Check if name is used in code (simple text search)
        const nameRegex = new RegExp(`\\b${this.escapeRegex(name)}\\b`)
        if (!nameRegex.test(codeLines)) {
          unusedNames.push(name)
        }
      }

      if (unusedNames.length === imp.names.length && !imp.isDefault) {
        // All names unused
        optimizations.push({
          id: `unused-all-${imp.lineNumber}`,
          type: 'unused-import',
          severity: 'warning',
          title: 'Unused import',
          description: `All imports from '${imp.source}' are unused`,
          originalImport: imp.line,
          suggestedImport: '',
          lineNumber: imp.lineNumber,
          autoFixable: true,
          source: imp.source,
        })
      } else if (unusedNames.length > 0) {
        // Some names unused
        const usedNames = imp.names.filter(n => !unusedNames.includes(n) && n !== 'type')
        const newImport = imp.isTypeOnly
          ? `import type { ${usedNames.join(', ')} } from '${imp.source}'`
          : `import { ${usedNames.join(', ')} } from '${imp.source}'`

        optimizations.push({
          id: `unused-partial-${imp.lineNumber}`,
          type: 'unused-import',
          severity: 'info',
          title: 'Unused import names',
          description: `Unused: ${unusedNames.join(', ')}`,
          originalImport: imp.line,
          suggestedImport: newImport,
          lineNumber: imp.lineNumber,
          autoFixable: true,
          source: imp.source,
        })
      }
    }

    return optimizations
  }

  /**
   * Detect duplicate imports.
   */
  private detectDuplicateImports(imports: ImportStatement[]): ImportOptimization[] {
    const optimizations: ImportOptimization[] = []
    const sourceMap = new Map<string, ImportStatement[]>()

    for (const imp of imports) {
      const existing = sourceMap.get(imp.source) ?? []
      existing.push(imp)
      sourceMap.set(imp.source, existing)
    }

    for (const [source, sourceImports] of sourceMap) {
      if (sourceImports.length > 1) {
        // Merge duplicate imports
        const allNames = sourceImports.flatMap(imp => imp.names).filter(n => n !== 'type')
        const uniqueNames = [...new Set(allNames)]
        const firstImport = sourceImports[0]!
        const mergedImport = firstImport.isTypeOnly
          ? `import type { ${uniqueNames.join(', ')} } from '${source}'`
          : `import { ${uniqueNames.join(', ')} } from '${source}'`

        optimizations.push({
          id: `duplicate-${firstImport.lineNumber}`,
          type: 'duplicate-import',
          severity: 'warning',
          title: 'Duplicate import',
          description: `Multiple imports from '${source}' found`,
          originalImport: sourceImports.map(i => i.line).join('\n'),
          suggestedImport: mergedImport,
          lineNumber: firstImport.lineNumber,
          autoFixable: true,
          source,
        })
      }
    }

    return optimizations
  }

  /**
   * Detect missing imports.
   */
  private detectMissingImports(lines: string[], imports: ImportStatement[]): ImportOptimization[] {
    const optimizations: ImportOptimization[] = []
    const codeLines = lines.filter(l => !l.trim().startsWith('import ')).join('\n')

    // Common patterns that need imports
    const patterns: { regex: RegExp; source: string; name: string }[] = [
      { regex: /\bReact\b/, source: 'react', name: 'React' },
      { regex: /\buseState\b/, source: 'react', name: 'useState' },
      { regex: /\buseEffect\b/, source: 'react', name: 'useEffect' },
      { regex: /\buseCallback\b/, source: 'react', name: 'useCallback' },
      { regex: /\buseMemo\b/, source: 'react', name: 'useMemo' },
      { regex: /\buseRef\b/, source: 'react', name: 'useRef' },
      { regex: /\bReactNode\b/, source: 'react', name: 'ReactNode' },
      { regex: /\bReactElement\b/, source: 'react', name: 'ReactElement' },
    ]

    for (const { regex, source, name } of patterns) {
      if (regex.test(codeLines) && !imports.some(imp => imp.names.includes(name))) {
        // Check if source is already imported
        const existingImport = imports.find(imp => imp.source === source)
        if (existingImport) {
          optimizations.push({
            id: `missing-${name}-${existingImport.lineNumber}`,
            type: 'missing-import',
            severity: 'error',
            title: 'Missing import',
            description: `'${name}' is used but not imported from '${source}'`,
            suggestedImport: `${existingImport.line.replace('{', `{ ${name}, `)}`,
            lineNumber: existingImport.lineNumber,
            autoFixable: true,
            source,
          })
        }
      }
    }

    return optimizations
  }

  /**
   * Detect import ordering issues.
   */
  private detectOrderingIssues(imports: ImportStatement[]): ImportOptimization[] {
    const optimizations: ImportOptimization[] = []

    for (let i = 1; i < imports.length; i++) {
      const prevGroup = this.getImportGroup(imports[i - 1]!.source)
      const currGroup = this.getImportGroup(imports[i]!.source)

      if (prevGroup.priority > currGroup.priority) {
        optimizations.push({
          id: `order-${imports[i]!.lineNumber}`,
          type: 'wrong-order',
          severity: 'info',
          title: 'Import ordering',
          description: `'${imports[i]!.source}' should be before '${imports[i - 1]!.source}'`,
          lineNumber: imports[i]!.lineNumber,
          autoFixable: false,
          source: imports[i]!.source,
        })
      }
    }

    return optimizations
  }

  /**
   * Detect barrel imports.
   */
  private detectBarrelImports(imports: ImportStatement[]): ImportOptimization[] {
    const optimizations: ImportOptimization[] = []
    const barrelPatterns = [/\/index['"]$/, /^['"][^'"]*\/?['"]$/]

    for (const imp of imports) {
      const isBarrel = barrelPatterns.some(p => p.test(`'${imp.source}'`))
      if (isBarrel && imp.names.length > 1) {
        optimizations.push({
          id: `barrel-${imp.lineNumber}`,
          type: 'barrel-import',
          severity: 'info',
          title: 'Barrel import',
          description: `Consider importing directly from the source module instead of barrel`,
          originalImport: imp.line,
          lineNumber: imp.lineNumber,
          autoFixable: false,
          source: imp.source,
        })
      }
    }

    return optimizations
  }

  /**
   * Detect circular dependencies.
   */
  private detectCircularDependencies(filePath: string, imports: ImportStatement[]): ImportOptimization[] {
    const optimizations: ImportOptimization[] = []

    // Simple circular dependency detection
    for (const imp of imports) {
      const sourcePath = imp.source
      if (sourcePath.startsWith('.') && this.importHistory.has(sourcePath)) {
        const sourceImports = this.importHistory.get(sourcePath)!
        const hasCircular = sourceImports.some(i => i.source.includes(filePath.replace(/\.ts$/, '')))

        if (hasCircular) {
          optimizations.push({
            id: `circular-${imp.lineNumber}`,
            type: 'circular-dependency',
            severity: 'error',
            title: 'Circular dependency',
            description: `Circular dependency detected with '${imp.source}'`,
            originalImport: imp.line,
            lineNumber: imp.lineNumber,
            autoFixable: false,
            source: imp.source,
          })
        }
      }
    }

    return optimizations
  }

  /**
   * Get import group for a source.
   */
  private getImportGroup(source: string): ImportGroup {
    for (const group of this.config.importGroups) {
      if (group.pattern.test(source)) {
        return group
      }
    }
    return { name: 'unknown', pattern: /.*/, priority: 100 }
  }

  /**
   * Get default import groups.
   */
  private getDefaultImportGroups(): ImportGroup[] {
    return [
      { name: 'react', pattern: /^react/, priority: 0 },
      { name: 'external', pattern: /^(?!\.)/, priority: 1 },
      { name: 'internal', pattern: /^\.\./, priority: 2 },
      { name: 'relative', pattern: /^\.\//, priority: 3 },
    ]
  }

  /**
   * Apply import optimizations.
   */
  apply(code: string, optimizations: ImportOptimization[]): string {
    const lines = code.split('\n')
    const fixable = optimizations.filter(o => o.autoFixable)

    for (const opt of fixable.sort((a, b) => b.lineNumber - a.lineNumber)) {
      const lineIdx = opt.lineNumber - 1
      if (lineIdx >= 0 && lineIdx < lines.length) {
        if (opt.suggestedImport === '') {
          lines.splice(lineIdx, 1)
        } else if (opt.suggestedImport) {
          lines[lineIdx] = opt.suggestedImport
        }
      }
    }

    return lines.join('\n')
  }

  /**
   * Analyze bundle size impact of all imports.
   */
  analyzeBundleImpact(code: string): BundleImpactAnalysis {
    const lines = code.split('\n')
    const imports = this.parseImports(lines)

    // Approximate bundle sizes for common packages (in KB)
    const packageSizes: Record<string, number> = {
      'react': 42, 'react-dom': 130, 'lodash': 72, 'lodash/': 1,
      'moment': 300, 'date-fns': 5, 'axios': 14, 'node-fetch': 5,
      'express': 22, 'underscore': 56, 'rxjs': 45, 'three': 600,
      '@mui/material': 900, '@chakra-ui/react': 400, 'antd': 1200,
      'firebase': 200, 'mongoose': 60, 'sequelize': 80,
      'typescript': 0, 'uuid': 5, 'zod': 15, 'joi': 45,
    }

    let totalSizeKB = 0
    const importDetails: Array<{ source: string; estimatedSizeKB: number; treeShakable: boolean }> = []

    for (const imp of imports) {
      const pkg = imp.source.split('/')[0]!
      const sizeKB = packageSizes[imp.source] ?? packageSizes[pkg] ?? 5
      totalSizeKB += sizeKB

      importDetails.push({
        source: imp.source,
        estimatedSizeKB: sizeKB,
        treeShakable: imp.isDefault === false || imp.names.length > 0,
      })
    }

    const largeImports = importDetails.filter(i => i.estimatedSizeKB > 50)
    const totalImportSize = importDetails.reduce((sum, i) => sum + i.estimatedSizeKB, 0)

    return {
      totalImportSizeKB: Math.round(totalImportSize * 10) / 10,
      importCount: imports.length,
      largeImports,
      recommendations: this.generateBundleRecommendations(importDetails, imports),
    }
  }

  /**
   * Detect dynamic import opportunities for large modules.
   */
  detectDynamicImportOpportunities(code: string, thresholdKB: number = 100): ImportOptimization[] {
    const lines = code.split('\n')
    const imports = this.parseImports(lines)
    const optimizations: ImportOptimization[] = []

    const largeModules: Array<{ pattern: RegExp; source: string; sizeKB: number }> = [
      { pattern: /^lodash/, source: 'lodash', sizeKB: 72 },
      { pattern: /^moment/, source: 'moment', sizeKB: 300 },
      { pattern: /^three/, source: 'three', sizeKB: 600 },
      { pattern: /^@mui\/material/, source: '@mui/material', sizeKB: 900 },
      { pattern: /^antd/, source: 'antd', sizeKB: 1200 },
      { pattern: /^rxjs/, source: 'rxjs', sizeKB: 45 },
      { pattern: /^firebase/, source: 'firebase', sizeKB: 200 },
    ]

    for (const imp of imports) {
      const match = largeModules.find(m => m.pattern.test(imp.source))
      if (match && match.sizeKB >= thresholdKB) {
        optimizations.push({
          id: `dynamic-${imp.lineNumber}`,
          type: 'unused-import',
          severity: 'warning',
          title: 'Consider dynamic import',
          description: `'${imp.source}' adds ~${match.sizeKB}KB. Use dynamic import() for lazy loading.`,
          originalImport: imp.line,
          suggestedImport: `const module = await import('${imp.source}')`,
          lineNumber: imp.lineNumber,
          autoFixable: false,
          source: imp.source,
        })
      }
    }

    return optimizations
  }

  /**
   * Generate tree-shaking recommendations.
   */
  detectTreeShakingOpportunities(code: string): ImportOptimization[] {
    const lines = code.split('\n')
    const imports = this.parseImports(lines)
    const optimizations: ImportOptimization[] = []

    const barrelToDirect: Record<string, string[]> = {
      'lodash': ['lodash/get', 'lodash/set', 'lodash/debounce', 'lodash/throttle', 'lodash/merge'],
      'date-fns': ['date-fns/format', 'date-fns/parse', 'date-fns/addDays'],
      'rxjs': ['rxjs/operators', 'rxjs/Observable'],
    }

    for (const imp of imports) {
      const directImports = barrelToDirect[imp.source]
      if (directImports && imp.names.length <= 3) {
        const specificImports = imp.names
          .map(n => n.toLowerCase())
          .map(n => directImports.find(d => d.includes(n)))
          .filter(Boolean)

        if (specificImports.length > 0) {
          optimizations.push({
            id: `tree-shake-${imp.lineNumber}`,
            type: 'barrel-import',
            severity: 'info',
            title: 'Tree-shakeable import',
            description: `Import from specific submodules instead of '${imp.source}' barrel to reduce bundle.`,
            originalImport: imp.line,
            suggestedImport: specificImports.join('\n'),
            lineNumber: imp.lineNumber,
            autoFixable: false,
            source: imp.source,
          })
        }
      }
    }

    return optimizations
  }

  /**
   * Build a dependency graph from a set of files.
   */
  buildDependencyGraph(files: Map<string, string>): DependencyGraph {
    const nodes = new Map<string, { imports: string[]; importedBy: string[] }>()

    for (const [filePath, content] of files) {
      const lines = content.split('\n')
      const imports = this.parseImports(lines)
      const localImports = imports
        .filter(i => i.source.startsWith('.') || i.source.startsWith('/') )
        .map(i => this.resolveImportPath(filePath, i.source))

      nodes.set(filePath, {
        imports: localImports,
        importedBy: [],
      })
    }

    // Fill importedBy
    for (const [filePath, data] of nodes) {
      for (const dep of data.imports) {
        const target = nodes.get(dep)
        if (target) {
          target.importedBy.push(filePath)
        }
      }
    }

    // Detect cycles
    const cycles: string[][] = []
    for (const [filePath] of nodes) {
      const visited = new Set<string>()
      this.dfsCycle(filePath, nodes, visited, [], cycles)
    }

    // Detect high-fan-in modules (imported by many)
    const highFanIn = [...nodes.entries()]
      .filter(([, data]) => data.importedBy.length >= 5)
      .map(([path, data]) => ({ path, fanIn: data.importedBy.length }))
      .sort((a, b) => b.fanIn - a.fanIn)

    // Detect high-fan-out modules (imports many)
    const highFanOut = [...nodes.entries()]
      .filter(([, data]) => data.imports.length >= 5)
      .map(([path, data]) => ({ path, fanOut: data.imports.length }))
      .sort((a, b) => b.fanOut - a.fanOut)

    // Detect orphan modules (nothing imports them, not entry points)
    const orphans = [...nodes.entries()]
      .filter(([, data]) => data.importedBy.length === 0 && data.imports.length > 0)
      .map(([filePath]) => filePath)

    return {
      nodes: [...nodes.entries()].map(([path, data]) => ({ path, ...data })),
      cycles,
      highFanIn,
      highFanOut,
      orphans,
    }
  }

  private dfsCycle(
    current: string,
    nodes: Map<string, { imports: string[]; importedBy: string[] }>,
    visited: Set<string>,
    path: string[],
    cycles: string[][],
  ): void {
    if (visited.has(current)) {
      const cycleStart = path.indexOf(current)
      if (cycleStart >= 0) cycles.push([...path.slice(cycleStart), current])
      return
    }

    visited.add(current)
    path.push(current)

    const data = nodes.get(current)
    if (data) {
      for (const dep of data.imports) {
        if (nodes.has(dep)) {
          this.dfsCycle(dep, nodes, new Set(visited), [...path], cycles)
        }
      }
    }
  }

  private resolveImportPath(from: string, importPath: string): string {
    const dir = from.replace(/\/[^/]*$/, '')
    return importPath.startsWith('.') ? `${dir}/${importPath}`.replace(/\/+/g, '/') : importPath
  }

  private generateBundleRecommendations(
    importDetails: Array<{ source: string; estimatedSizeKB: number; treeShakable: boolean }>,
    imports: ImportStatement[],
  ): string[] {
    const recs: string[] = []

    const totalSize = importDetails.reduce((s, i) => s + i.estimatedSizeKB, 0)
    if (totalSize > 500) {
      recs.push(`Total import size is ~${Math.round(totalSize)}KB. Consider code splitting.`)
    }

    const largeImports = importDetails.filter(i => i.estimatedSizeKB > 50)
    if (largeImports.length > 0) {
      recs.push(`Large imports: ${largeImports.map(i => `${i.source} (~${i.estimatedSizeKB}KB)`).join(', ')}. Use dynamic import().`)
    }

    const nonTreeShakable = importDetails.filter(i => !i.treeShakable)
    if (nonTreeShakable.length > 0) {
      recs.push(`Default imports prevent tree-shaking: ${nonTreeShakable.map(i => i.source).join(', ')}. Use named imports.`)
    }

    const duplicates = imports.reduce<Map<string, number>>((acc, imp) => {
      acc.set(imp.source, (acc.get(imp.source) ?? 0) + 1)
      return acc
    }, new Map())

    for (const [source, count] of duplicates) {
      if (count > 1) recs.push(`Duplicate import from '${source}' (${count} times). Merge into one statement.`)
    }

    return recs
  }

  /**
   * Sort imports according to groups.
   */
  sortImports(code: string): string {
    const lines = code.split('\n')
    const imports: ImportStatement[] = []
    const nonImports: string[] = []

    for (const line of lines) {
      if (line.trim().startsWith('import ')) {
        const matches = this.parseImports([line])
        if (matches.length > 0) imports.push(matches[0]!)
      } else {
        nonImports.push(line)
      }
    }

    // Sort by group priority
    imports.sort((a, b) => {
      const groupA = this.getImportGroup(a.source)
      const groupB = this.getImportGroup(b.source)
      return groupA.priority - groupB.priority || a.source.localeCompare(b.source)
    })

    return [...imports.map(i => i.line), ...nonImports].join('\n')
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Subscribe to optimization suggestions.
   */
  subscribe(listener: (optimizations: ImportOptimization[]) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(optimizations: ImportOptimization[]): void {
    for (const listener of this.listeners) {
      try { listener(optimizations) } catch { /* ignore */ }
    }
  }
}

/** Bundle impact analysis result */
export interface BundleImpactAnalysis {
  /** Total estimated size of all imports in KB */
  totalImportSizeKB: number
  /** Number of import statements */
  importCount: number
  /** Imports larger than 50KB */
  largeImports: Array<{ source: string; estimatedSizeKB: number; treeShakable: boolean }>
  /** Recommendations */
  recommendations: string[]
}

/** Dependency graph node */
export interface DependencyGraphNode {
  /** File path */
  path: string
  /** Modules this file imports */
  imports: string[]
  /** Modules that import this file */
  importedBy: string[]
}

/** Dependency graph */
export interface DependencyGraph {
  /** All nodes */
  nodes: DependencyGraphNode[]
  /** Detected import cycles */
  cycles: string[][]
  /** Modules with highest fan-in (many importers) */
  highFanIn: Array<{ path: string; fanIn: number }>
  /** Modules with highest fan-out (many imports) */
  highFanOut: Array<{ path: string; fanOut: number }>
  /** Modules nothing imports (potential dead code) */
  orphans: string[]
}

/** Singleton instance */
let instance: SmartImportEngine | null = null

export function getSmartImportEngine(
  config?: Partial<SmartImportConfig>
): SmartImportEngine {
  if (!instance) {
    instance = new SmartImportEngine(config)
  }
  return instance
}

export function resetSmartImportEngine(): void {
  instance = null
}
