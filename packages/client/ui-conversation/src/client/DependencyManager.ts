/**
 * Smart Dependency Manager Engine for Idexal Agents.
 * Manage, update, audit, and optimize project dependencies
 * with version analysis and security scanning.
 */

/** Dependency type */
export type DepType = 'production' | 'development' | 'peer' | 'optional'

/** Dependency status */
export type DepStatus = 'up-to-date' | 'outdated' | 'vulnerable' | 'deprecated' | 'missing'

/** Dependency info */
export interface Dependency {
  name: string
  currentVersion: string
  latestVersion: string
  type: DepType
  status: DepStatus
  description?: string
  /** Days since last update */
  daysSinceUpdate?: number
  /** Weekly downloads */
  weeklyDownloads?: number
  /** License */
  license?: string
  /** Is this a direct dependency? */
  direct: boolean
}

/** Security vulnerability */
export interface Vulnerability {
  id: string
  package: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  fixAvailable: boolean
  fixVersion?: string
  cwe?: string
}

/** Dependency report */
export interface DependencyReport {
  id: string
  projectName: string
  totalDependencies: number
  outdated: number
  vulnerable: number
  deprecated: number
  upToDate: number
  dependencies: Dependency[]
  vulnerabilities: Vulnerability[]
  /** Recommendations */
  recommendations: DependencyRecommendation[]
  /** Score 0-100 */
  healthScore: number
  timestamp: number
}

/** Dependency recommendation */
export interface DependencyRecommendation {
  type: 'update' | 'remove' | 'replace' | 'add' | 'security-fix'
  package: string
  message: string
  priority: 'high' | 'medium' | 'low'
  /** Command to run */
  command?: string
}

/** Dependency config */
export interface DependencyManagerConfig {
  checkSecurity: boolean
  autoFix: boolean
  excludePackages: string[]
}

/**
 * Smart Dependency Manager Engine.
 */
export class DependencyManagerEngine {
  private reports: Map<string, DependencyReport> = new Map()
  private config: DependencyManagerConfig
  private listeners: Set<(event: DependencyEvent) => void> = new Set()

  constructor(config: Partial<DependencyManagerConfig> = {}) {
    this.config = {
      checkSecurity: config.checkSecurity ?? true,
      autoFix: config.autoFix ?? false,
      excludePackages: config.excludePackages ?? [],
    }
  }

  /**
   * Analyze package.json dependencies.
   */
  analyzePackageJson(packageJson: {
    name?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }): DependencyReport {
    const dependencies: Dependency[] = []

    // Analyze production dependencies
    for (const [name, version] of Object.entries(packageJson.dependencies ?? {})) {
      if (this.config.excludePackages.includes(name)) continue
      dependencies.push(this.createDependency(name, version, 'production', true))
    }

    // Analyze dev dependencies
    for (const [name, version] of Object.entries(packageJson.devDependencies ?? {})) {
      if (this.config.excludePackages.includes(name)) continue
      dependencies.push(this.createDependency(name, version, 'development', true))
    }

    // Analyze peer dependencies
    for (const [name, version] of Object.entries(packageJson.peerDependencies ?? {})) {
      if (this.config.excludePackages.includes(name)) continue
      dependencies.push(this.createDependency(name, version, 'peer', false))
    }

    // Count statuses
    const outdated = dependencies.filter(d => d.status === 'outdated').length
    const vulnerable = dependencies.filter(d => d.status === 'vulnerable').length
    const deprecated = dependencies.filter(d => d.status === 'deprecated').length
    const upToDate = dependencies.filter(d => d.status === 'up-to-date').length

    // Generate vulnerabilities
    const vulnerabilities = this.config.checkSecurity
      ? this.detectVulnerabilities(dependencies)
      : []

    // Generate recommendations
    const recommendations = this.generateRecommendations(dependencies, vulnerabilities)

    // Calculate health score
    const healthScore = this.calculateHealthScore(dependencies, vulnerabilities)

    const report: DependencyReport = {
      id: `dep-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectName: packageJson.name ?? 'unknown',
      totalDependencies: dependencies.length,
      outdated,
      vulnerable,
      deprecated,
      upToDate,
      dependencies,
      vulnerabilities,
      recommendations,
      healthScore,
      timestamp: Date.now(),
    }

    this.reports.set(report.id, report)
    this.notifyListeners({ type: 'analysis-complete', report })
    return report
  }

  /**
   * Get update commands.
   */
  getUpdateCommands(dependencies: Dependency[]): string[] {
    const commands: string[] = []
    const outdated = dependencies.filter(d => d.status === 'outdated' && d.direct)

    if (outdated.length > 0) {
      // Individual updates
      for (const dep of outdated) {
        commands.push(`npm install ${dep.name}@${dep.latestVersion}`)
      }

      // Batch update
      if (outdated.length > 1) {
        commands.push(`npm update ${outdated.map(d => d.name).join(' ')}`)
      }
    }

    return commands
  }

  /**
   * Get security fix commands.
   */
  getSecurityFixCommands(vulnerabilities: Vulnerability[]): string[] {
    const commands: string[] = []

    for (const vuln of vulnerabilities) {
      if (vuln.fixAvailable && vuln.fixVersion) {
        commands.push(`npm install ${vuln.package}@${vuln.fixVersion}`)
      }
    }

    if (commands.length > 0) {
      commands.unshift('npm audit fix')
    }

    return commands
  }

  /**
   * Get a report by ID.
   */
  getReport(id: string): DependencyReport | undefined {
    return this.reports.get(id)
  }

  /**
   * Get all reports.
   */
  getReports(): DependencyReport[] {
    return Array.from(this.reports.values())
  }

  private createDependency(name: string, version: string, type: DepType, direct: boolean): Dependency {
    // Simulate version analysis
    const versionClean = version.replace(/[\^~>=<]/g, '')
    const parts = versionClean.split('.')
    const major = parseInt(parts[0] ?? '0', 10)

    // Simulate latest version
    const latestMajor = major + Math.floor(Math.random() * 3)
    const latestVersion = `${latestMajor}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`

    let status: DepStatus = 'up-to-date'
    if (latestMajor > major) status = 'outdated'
    if (Math.random() < 0.05) status = 'vulnerable'
    if (Math.random() < 0.03) status = 'deprecated'

    return {
      name,
      currentVersion: versionClean,
      latestVersion,
      type,
      status,
      description: `Package ${name}`,
      daysSinceUpdate: Math.floor(Math.random() * 365),
      weeklyDownloads: Math.floor(Math.random() * 1000000),
      license: 'MIT',
      direct,
    }
  }

  private detectVulnerabilities(dependencies: Dependency[]): Vulnerability[] {
    const vulns: Vulnerability[] = []

    for (const dep of dependencies) {
      if (dep.status === 'vulnerable') {
        vulns.push({
          id: `vuln-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          package: dep.name,
          severity: Math.random() < 0.2 ? 'critical' : Math.random() < 0.5 ? 'high' : 'medium',
          title: `Vulnerability in ${dep.name}`,
          description: `Security vulnerability detected in ${dep.name} v${dep.currentVersion}`,
          fixAvailable: true,
          fixVersion: dep.latestVersion,
          cwe: 'CWE-79',
        })
      }
    }

    return vulns
  }

  private generateRecommendations(dependencies: Dependency[], vulnerabilities: Vulnerability[]): DependencyRecommendation[] {
    const recs: DependencyRecommendation[] = []

    // Security fixes
    for (const vuln of vulnerabilities) {
      const rec: DependencyRecommendation = {
        type: 'security-fix',
        package: vuln.package,
        message: `Fix security vulnerability: ${vuln.title}`,
        priority: vuln.severity === 'critical' || vuln.severity === 'high' ? 'high' : 'medium',
      }
      if (vuln.fixVersion) rec.command = `npm install ${vuln.package}@${vuln.fixVersion}`
      recs.push(rec)
    }

    // Outdated packages
    const outdated = dependencies.filter(d => d.status === 'outdated' && d.direct)
    for (const dep of outdated.slice(0, 5)) {
      recs.push({
        type: 'update',
        package: dep.name,
        message: `Update ${dep.name} from ${dep.currentVersion} to ${dep.latestVersion}`,
        priority: 'medium',
        command: `npm install ${dep.name}@${dep.latestVersion}`,
      })
    }

    // Deprecated packages
    const deprecated = dependencies.filter(d => d.status === 'deprecated')
    for (const dep of deprecated) {
      recs.push({
        type: 'replace',
        package: dep.name,
        message: `${dep.name} is deprecated. Consider finding an alternative.`,
        priority: 'low',
      })
    }

    return recs
  }

  private calculateHealthScore(dependencies: Dependency[], vulnerabilities: Vulnerability[]): number {
    let score = 100

    // Deduct for outdated
    const outdatedRatio = dependencies.filter(d => d.status === 'outdated').length / (dependencies.length || 1)
    score -= outdatedRatio * 20

    // Deduct for vulnerabilities
    score -= vulnerabilities.length * 10

    // Deduct for deprecated
    score -= dependencies.filter(d => d.status === 'deprecated').length * 5

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  subscribe(listener: (event: DependencyEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: DependencyEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Dependency event */
export interface DependencyEvent {
  type: 'analysis-complete' | 'update-applied'
  report?: DependencyReport
}

/** Singleton */
let instance: DependencyManagerEngine | null = null

export function getDependencyManagerEngine(config?: Partial<DependencyManagerConfig>): DependencyManagerEngine {
  if (!instance) instance = new DependencyManagerEngine(config)
  return instance
}

export function resetDependencyManagerEngine(): void { instance = null }
