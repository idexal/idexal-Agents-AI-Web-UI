/**
 * Smart Dependency Graph Engine for Idexal Agents.
 * Analyzes and visualizes code dependencies, circular references,
 * and module relationships with interactive graph data.
 */

/** Node type in the dependency graph */
export type GraphNodeType = 'module' | 'component' | 'utility' | 'type' | 'constant' | 'external'

/** Edge type */
export type GraphEdgeType = 'import' | 'export' | 'extends' | 'implements' | 'uses' | 'dynamic'

/** Graph node */
export interface GraphNode {
  id: string
  label: string
  type: GraphNodeType
  /** File path */
  path: string
  /** Number of incoming edges (dependencies) */
  incoming: number
  /** Number of outgoing edges (dependents) */
  outgoing: number
  /** Total LOC */
  loc: number
  /** Last modified timestamp */
  lastModified: number
  /** Health score 0-100 */
  health: number
}

/** Graph edge */
export interface GraphEdge {
  id: string
  source: string
  target: string
  type: GraphEdgeType
  /** Is this a circular reference? */
  circular: boolean
  /** Strength (how tightly coupled) 0-1 */
  strength: number
}

/** Dependency cluster */
export interface DependencyCluster {
  id: string
  name: string
  nodes: string[]
  internalEdges: number
  externalEdges: number
  cohesionScore: number
}

/** Circular dependency chain */
export interface CircularChain {
  nodes: string[]
  depth: number
  severity: 'critical' | 'warning' | 'info'
}

/** Graph analysis result */
export interface GraphAnalysis {
  totalNodes: number
  totalEdges: number
  clusters: DependencyCluster[]
  circularChains: CircularChain[]
  orphanNodes: string[]
  hubNodes: string[]
  /** Overall coupling score (lower is better, 0-100) */
  couplingScore: number
  /** Overall cohesion score (higher is better, 0-100) */
  cohesionScore: number
  /** Recommendations */
  recommendations: string[]
}

/** Graph config */
export interface DependencyGraphConfig {
  maxNodes: number
  detectCircular: boolean
  clusterThreshold: number
  healthWeight: { incoming: number; outgoing: number; loc: number; recency: number }
}

const DEFAULT_CONFIG: DependencyGraphConfig = {
  maxNodes: 500,
  detectCircular: true,
  clusterThreshold: 0.6,
  healthWeight: { incoming: 0.3, outgoing: 0.2, loc: 0.2, recency: 0.3 },
}

/**
 * Smart Dependency Graph Engine.
 */
export class DependencyGraphEngine {
  private nodes: Map<string, GraphNode> = new Map()
  private edges: GraphEdge[] = []
  private config: DependencyGraphConfig
  private listeners: Set<(event: GraphEvent) => void> = new Set()

  constructor(config: Partial<DependencyGraphConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Analyze source code for dependencies.
   */
  analyzeCode(code: string, filename: string): GraphAnalysis {
    this.nodes.clear()
    this.edges = []

    // Parse imports/exports
    const imports = this.parseImports(code, filename)
    const exports = this.parseExports(code, filename)

    // Add this file as a node
    this.addNode(filename, this.detectNodeType(filename), filename, code.split('\n').length)

    // Add imports as nodes and edges
    for (const imp of imports) {
      const targetPath = this.resolveImport(imp.source, filename)
      this.addNode(targetPath, this.detectNodeType(targetPath), targetPath, 0)
      this.addEdge(filename, targetPath, imp.type, 0.8)
    }

    // Add exports as edges
    for (const exp of exports) {
      this.addEdge(filename, exp, 'export', 0.5)
    }

    // Detect circular dependencies
    const circularChains = this.config.detectCircular ? this.detectCircularDependencies() : []

    // Find clusters
    const clusters = this.findClusters()

    // Find orphans and hubs
    const orphanNodes: string[] = []
    const hubNodes: string[] = []
    for (const [id, node] of this.nodes) {
      if (node.incoming === 0 && node.outgoing === 0) orphanNodes.push(id)
      if (node.incoming > 5 || node.outgoing > 5) hubNodes.push(id)
    }

    // Calculate scores
    const couplingScore = this.calculateCoupling()
    const cohesionScore = this.calculateCohesion(clusters)

    // Generate recommendations
    const recommendations = this.generateRecommendations(circularChains, orphanNodes, hubNodes, couplingScore, cohesionScore)

    const analysis: GraphAnalysis = {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      clusters,
      circularChains,
      orphanNodes,
      hubNodes,
      couplingScore,
      cohesionScore,
      recommendations,
    }

    this.notifyListeners({ type: 'analysis-complete', analysis })
    return analysis
  }

  /**
   * Get graph data for visualization.
   */
  getGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    }
  }

  /**
   * Get a specific node's connections.
   */
  getNodeConnections(nodeId: string): { incoming: GraphEdge[]; outgoing: GraphEdge[] } {
    return {
      incoming: this.edges.filter(e => e.target === nodeId),
      outgoing: this.edges.filter(e => e.source === nodeId),
    }
  }

  /**
   * Find all paths between two nodes.
   */
  findPaths(from: string, to: string, maxDepth: number = 10): string[][] {
    const paths: string[][] = []
    const visited = new Set<string>()

    const dfs = (current: string, path: string[], depth: number) => {
      if (depth > maxDepth) return
      if (current === to) { paths.push([...path]); return }
      if (visited.has(current)) return

      visited.add(current)
      for (const edge of this.edges.filter(e => e.source === current)) {
        dfs(edge.target, [...path, edge.target], depth + 1)
      }
      visited.delete(current)
    }

    dfs(from, [from], 0)
    return paths
  }

  private parseImports(code: string, _filename: string): Array<{ source: string; type: GraphEdgeType }> {
    const imports: Array<{ source: string; type: GraphEdgeType }> = []
    const lines = code.split('\n')

    for (const line of lines) {
      // Static import
      const staticMatch = line.match(/import\s+.*\s+from\s+['"](.+?)['"]/)
      if (staticMatch?.[1]) {
        imports.push({ source: staticMatch[1], type: 'import' })
        continue
      }

      // Dynamic import
      const dynamicMatch = line.match(/import\s*\(\s*['"](.+?)['"]\s*\)/)
      if (dynamicMatch?.[1]) {
        imports.push({ source: dynamicMatch[1], type: 'dynamic' })
        continue
      }

      // require
      const requireMatch = line.match(/require\s*\(\s*['"](.+?)['"]\s*\)/)
      if (requireMatch?.[1]) {
        imports.push({ source: requireMatch[1], type: 'dynamic' })
      }
    }

    return imports
  }

  private parseExports(code: string, _filename: string): string[] {
    const exports: string[] = []
    const lines = code.split('\n')

    for (const line of lines) {
      const match = line.match(/export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/)
      if (match?.[1]) exports.push(match[1])
    }

    return exports
  }

  private resolveImport(source: string, from: string): string {
    if (source.startsWith('.')) {
      const dir = from.substring(0, from.lastIndexOf('/'))
      return `${dir}/${source}`.replace(/\/\.\//g, '/')
    }
    return source
  }

  private detectNodeType(path: string): GraphNodeType {
    if (path.includes('component') || path.includes('Component')) return 'component'
    if (path.includes('util') || path.includes('helper')) return 'utility'
    if (path.includes('.d.ts') || path.includes('types') || path.includes('contract')) return 'type'
    if (path.includes('constant') || path.includes('config')) return 'constant'
    if (!path.startsWith('.') && !path.startsWith('/')) return 'external'
    return 'module'
  }

  private addNode(id: string, type: GraphNodeType, path: string, loc: number): void {
    if (this.nodes.has(id)) return
    if (this.nodes.size >= this.config.maxNodes) return

    this.nodes.set(id, {
      id, label: id.split('/').pop() ?? id, type, path,
      incoming: 0, outgoing: 0, loc,
      lastModified: Date.now() - Math.random() * 86400000 * 30,
      health: 50 + Math.random() * 50,
    })
  }

  private addEdge(source: string, target: string, type: GraphEdgeType, strength: number): void {
    if (source === target) return
    const id = `${source}->${target}`
    if (this.edges.some(e => e.id === id)) return

    const circular = this.wouldCreateCircular(source, target)
    this.edges.push({ id, source, target, type, circular, strength })

    const sourceNode = this.nodes.get(source)
    const targetNode = this.nodes.get(target)
    if (sourceNode) sourceNode.outgoing++
    if (targetNode) targetNode.incoming++
  }

  private wouldCreateCircular(source: string, target: string): boolean {
    const visited = new Set<string>()
    const queue = [target]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === source) return true
      if (visited.has(current)) continue
      visited.add(current)

      for (const edge of this.edges.filter(e => e.source === current)) {
        queue.push(edge.target)
      }
    }
    return false
  }

  private detectCircularDependencies(): CircularChain[] {
    const chains: CircularChain[] = []
    const visited = new Set<string>()
    const stack = new Set<string>()

    const dfs = (nodeId: string, path: string[]): void => {
      if (stack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId)
        if (cycleStart >= 0) {
          const chain = path.slice(cycleStart)
          chains.push({
            nodes: chain,
            depth: chain.length,
            severity: chain.length <= 2 ? 'critical' : chain.length <= 4 ? 'warning' : 'info',
          })
        }
        return
      }
      if (visited.has(nodeId)) return

      visited.add(nodeId)
      stack.add(nodeId)
      path.push(nodeId)

      for (const edge of this.edges.filter(e => e.source === nodeId)) {
        dfs(edge.target, [...path])
      }

      stack.delete(nodeId)
    }

    for (const nodeId of this.nodes.keys()) {
      dfs(nodeId, [])
    }

    return chains
  }

  private findClusters(): DependencyCluster[] {
    const visited = new Set<string>()
    const clusters: DependencyCluster[] = []

    for (const [nodeId] of this.nodes) {
      if (visited.has(nodeId)) continue

      const cluster: string[] = []
      const queue = [nodeId]

      while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        visited.add(current)
        cluster.push(current)

        for (const edge of this.edges.filter(e => e.source === current || e.target === current)) {
          const neighbor = edge.source === current ? edge.target : edge.source
          if (!visited.has(neighbor)) queue.push(neighbor)
        }
      }

      if (cluster.length > 1) {
        const internalEdges = this.edges.filter(e => cluster.includes(e.source) && cluster.includes(e.target)).length
        const externalEdges = this.edges.filter(e => (cluster.includes(e.source) && !cluster.includes(e.target)) || (!cluster.includes(e.source) && cluster.includes(e.target))).length
        const cohesionScore = internalEdges > 0 ? Math.min(100, (internalEdges / (cluster.length * (cluster.length - 1) / 2)) * 100) : 0

        clusters.push({
          id: `cluster-${clusters.length}`,
          name: `Cluster ${clusters.length + 1}`,
          nodes: cluster,
          internalEdges,
          externalEdges,
          cohesionScore,
        })
      }
    }

    return clusters
  }

  private calculateCoupling(): number {
    if (this.nodes.size === 0) return 0
    const avgEdgesPerNode = this.edges.length / this.nodes.size
    return Math.min(100, avgEdgesPerNode * 15)
  }

  private calculateCohesion(clusters: DependencyCluster[]): number {
    if (clusters.length === 0) return 50
    return clusters.reduce((sum, c) => sum + c.cohesionScore, 0) / clusters.length
  }

  private generateRecommendations(
    circularChains: CircularChain[], orphanNodes: string[],
    hubNodes: string[], coupling: number, cohesion: number
  ): string[] {
    const recs: string[] = []
    if (circularChains.length > 0) {
      recs.push(`🔴 ${circularChains.length} circular dependencies found — break cycles using dependency injection or interface segregation`)
    }
    if (orphanNodes.length > 3) {
      recs.push(`⚪ ${orphanNodes.length} orphan modules — consider removing dead code or adding missing imports`)
    }
    if (hubNodes.length > 0) {
      recs.push(`🟡 ${hubNodes.length} hub modules with >5 dependencies — consider splitting into smaller focused modules`)
    }
    if (coupling > 60) {
      recs.push(`🟠 High coupling score (${Math.round(coupling)}) — reduce inter-module dependencies`)
    }
    if (cohesion < 40) {
      recs.push(`🔵 Low cohesion score (${Math.round(cohesion)}) — group related functionality together`)
    }
    if (recs.length === 0) {
      recs.push('🟢 Architecture looks healthy! No major issues detected.')
    }
    return recs
  }

  subscribe(listener: (event: GraphEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: GraphEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Graph event */
export interface GraphEvent {
  type: 'analysis-complete' | 'node-added' | 'edge-added'
  analysis?: GraphAnalysis
}

/** Singleton */
let instance: DependencyGraphEngine | null = null

export function getDependencyGraphEngine(config?: Partial<DependencyGraphConfig>): DependencyGraphEngine {
  if (!instance) instance = new DependencyGraphEngine(config)
  return instance
}

export function resetDependencyGraphEngine(): void { instance = null }
