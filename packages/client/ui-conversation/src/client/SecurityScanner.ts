/**
 * Security Vulnerability Scanner for Idexal Agents.
 * Provides real-time security scanning with vulnerability detection,
 * severity analysis, and remediation suggestions.
 */

/** Vulnerability category */
export type VulnerabilityCategory =
  | 'injection'
  | 'xss'
  | 'authentication'
  | 'authorization'
  | 'data-exposure'
  | 'insecure-dependency'
  | 'cryptographic'
  | 'configuration'
  | 'input-validation'
  | 'session-management'

/** Vulnerability severity */
export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

/** Security vulnerability */
export interface SecurityVulnerability {
  /** Vulnerability ID */
  id: string
  /** Vulnerability title */
  title: string
  /** Detailed description */
  description: string
  /** Vulnerability category */
  category: VulnerabilityCategory
  /** Severity level */
  severity: VulnerabilitySeverity
  /** CVSS score (0-10) */
  cvssScore: number
  /** CWE ID */
  cweId: string
  /** Line number */
  line: number
  /** Column number */
  column: number
  /** Code snippet */
  codeSnippet: string
  /** Remediation steps */
  remediation: string[]
  /** References */
  references: string[]
  /** Whether this is a false positive */
  isFalsePositive: boolean
}

/** Security scan result */
export interface SecurityScanResult {
  /** Total vulnerabilities found */
  totalVulnerabilities: number
  /** Vulnerabilities by severity */
  bySeverity: Record<VulnerabilitySeverity, number>
  /** Vulnerabilities by category */
  byCategory: Record<string, number>
  /** Security score (0-100) */
  score: number
  /** Security grade */
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'
  /** All vulnerabilities */
  vulnerabilities: SecurityVulnerability[]
  /** Scan timestamp */
  timestamp: number
}

/** Scanner config */
export interface SecurityScannerConfig {
  /** Enable XSS detection */
  enableXSS: boolean
  /** Enable injection detection */
  enableInjection: boolean
  /** Enable authentication checks */
  enableAuthentication: boolean
  /** Enable data exposure checks */
  enableDataExposure: boolean
  /** Enable configuration checks */
  enableConfiguration: boolean
  /** Enable input validation checks */
  enableInputValidation: boolean
  /** Minimum severity to report */
  minSeverity: VulnerabilitySeverity
  /** Maximum vulnerabilities to report */
  maxVulnerabilities: number
}

/**
 * Security Vulnerability Scanner.
 */
export class SecurityScannerEngine {
  private config: SecurityScannerConfig
  private listeners: Set<(result: SecurityScanResult) => void> = new Set()

  constructor(config: Partial<SecurityScannerConfig> = {}) {
    this.config = {
      enableXSS: config.enableXSS ?? true,
      enableInjection: config.enableInjection ?? true,
      enableAuthentication: config.enableAuthentication ?? true,
      enableDataExposure: config.enableDataExposure ?? true,
      enableConfiguration: config.enableConfiguration ?? true,
      enableInputValidation: config.enableInputValidation ?? true,
      minSeverity: config.minSeverity ?? 'low',
      maxVulnerabilities: config.maxVulnerabilities ?? 50,
    }
  }

  /**
   * Scan code for security vulnerabilities.
   */
  scan(code: string, filePath: string): SecurityScanResult {
    const lines = code.split('\n')
    const vulnerabilities: SecurityVulnerability[] = []

    // XSS detection
    if (this.config.enableXSS) {
      vulnerabilities.push(...this.scanXSS(lines, filePath))
    }

    // Injection detection
    if (this.config.enableInjection) {
      vulnerabilities.push(...this.scanInjection(lines, filePath))
    }

    // Authentication checks
    if (this.config.enableAuthentication) {
      vulnerabilities.push(...this.scanAuthentication(lines, filePath))
    }

    // Data exposure checks
    if (this.config.enableDataExposure) {
      vulnerabilities.push(...this.scanDataExposure(lines, filePath))
    }

    // Configuration checks
    if (this.config.enableConfiguration) {
      vulnerabilities.push(...this.scanConfiguration(lines, filePath))
    }

    // Input validation checks
    if (this.config.enableInputValidation) {
      vulnerabilities.push(...this.scanInputValidation(lines, filePath))
    }

    // Filter and sort
    const severityOrder: Record<VulnerabilitySeverity, number> = {
      critical: 0, high: 1, medium: 2, low: 3, info: 4
    }
    const minSeverityIdx = severityOrder[this.config.minSeverity]

    const filtered = vulnerabilities
      .filter(v => severityOrder[v.severity] <= minSeverityIdx)
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, this.config.maxVulnerabilities)

    // Calculate stats
    const bySeverity: Record<VulnerabilitySeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    const byCategory: Record<string, number> = {
      injection: 0, xss: 0, authentication: 0, authorization: 0,
      'data-exposure': 0, 'insecure-dependency': 0, cryptographic: 0,
      configuration: 0, 'input-validation': 0, 'session-management': 0
    }

    for (const v of filtered) {
      bySeverity[v.severity]++
      if (v.category in byCategory) byCategory[v.category] = (byCategory[v.category] ?? 0) + 1
    }

    const score = this.calculateScore(filtered)
    const grade = this.getGrade(score)

    const result: SecurityScanResult = {
      totalVulnerabilities: filtered.length,
      bySeverity,
      byCategory,
      score,
      grade,
      vulnerabilities: filtered,
      timestamp: Date.now(),
    }

    this.notifyListeners(result)
    return result
  }

  /**
   * Scan for XSS vulnerabilities.
   */
  private scanXSS(lines: string[], _filePath: string): SecurityVulnerability[] {
    const vulns: SecurityVulnerability[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // innerHTML usage
      if (line.includes('innerHTML')) {
        vulns.push({
          id: `xss-innerhtml-${i}`,
          title: 'Potential XSS via innerHTML',
          description: 'Direct innerHTML assignment can lead to XSS attacks',
          category: 'xss',
          severity: 'high',
          cvssScore: 7.5,
          cweId: 'CWE-79',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Use textContent instead of innerHTML',
            'Sanitize input before using innerHTML',
            'Use a sanitization library like DOMPurify',
          ],
          references: ['https://owasp.org/www-community/attacks/xss/'],
          isFalsePositive: false,
        })
      }

      // document.write usage
      if (line.includes('document.write')) {
        vulns.push({
          id: `xss-docwrite-${i}`,
          title: 'Potential XSS via document.write',
          description: 'document.write can be exploited for XSS attacks',
          category: 'xss',
          severity: 'high',
          cvssScore: 7.0,
          cweId: 'CWE-79',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Use DOM manipulation methods instead',
            'Use createElement and appendChild',
          ],
          references: ['https://owasp.org/www-community/attacks/xss/'],
          isFalsePositive: false,
        })
      }
    }

    return vulns
  }

  /**
   * Scan for injection vulnerabilities.
   */
  private scanInjection(lines: string[], _filePath: string): SecurityVulnerability[] {
    const vulns: SecurityVulnerability[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // eval usage
      if (line.includes('eval(')) {
        vulns.push({
          id: `injection-eval-${i}`,
          title: 'Code injection via eval()',
          description: 'eval() executes arbitrary code and is a major security risk',
          category: 'injection',
          severity: 'critical',
          cvssScore: 9.8,
          cweId: 'CWE-94',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Remove eval() usage entirely',
            'Use Function constructor if dynamic code execution is required',
            'Implement proper input validation',
          ],
          references: ['https://owasp.org/www-community/attacks/Code_Injection'],
          isFalsePositive: false,
        })
      }

      // SQL injection (string concatenation in queries)
      if (line.match(/query\s*\+\s*|query\s*=\s*`.*\$\{/)) {
        vulns.push({
          id: `injection-sql-${i}`,
          title: 'Potential SQL injection',
          description: 'String concatenation in SQL query can lead to injection',
          category: 'injection',
          severity: 'critical',
          cvssScore: 9.8,
          cweId: 'CWE-89',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Use parameterized queries',
            'Use an ORM with proper escaping',
            'Validate and sanitize all inputs',
          ],
          references: ['https://owasp.org/www-community/attacks/SQL_Injection'],
          isFalsePositive: false,
        })
      }
    }

    return vulns
  }

  /**
   * Scan for authentication vulnerabilities.
   */
  private scanAuthentication(lines: string[], _filePath: string): SecurityVulnerability[] {
    const vulns: SecurityVulnerability[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Hardcoded credentials
      if (line.match(/(?:password|secret|api_?key|token)\s*[:=]\s*['"][^'"]+['"]/i)) {
        vulns.push({
          id: `auth-hardcoded-${i}`,
          title: 'Hardcoded credentials',
          description: 'Credentials found in source code',
          category: 'authentication',
          severity: 'critical',
          cvssScore: 9.1,
          cweId: 'CWE-798',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Move credentials to environment variables',
            'Use a secrets management solution',
            'Remove hardcoded credentials from source code',
          ],
          references: ['https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password'],
          isFalsePositive: false,
        })
      }
    }

    return vulns
  }

  /**
   * Scan for data exposure vulnerabilities.
   */
  private scanDataExposure(lines: string[], _filePath: string): SecurityVulnerability[] {
    const vulns: SecurityVulnerability[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Console logging sensitive data
      if (line.match(/console\.\w+\(.*(?:password|secret|token|key)/i)) {
        vulns.push({
          id: `exposure-console-${i}`,
          title: 'Sensitive data exposure via console',
          description: 'Sensitive data may be logged to console',
          category: 'data-exposure',
          severity: 'high',
          cvssScore: 6.5,
          cweId: 'CWE-532',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Remove console.log statements with sensitive data',
            'Use a logging framework with proper redaction',
          ],
          references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/06-Session_Management_Testing/'],
          isFalsePositive: false,
        })
      }
    }

    return vulns
  }

  /**
   * Scan for configuration vulnerabilities.
   */
  private scanConfiguration(lines: string[], _filePath: string): SecurityVulnerability[] {
    const vulns: SecurityVulnerability[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // CORS misconfiguration
      if (line.match(/cors.*origin.*\*/i) || line.includes("'Access-Control-Allow-Origin': '*'")) {
        vulns.push({
          id: `config-cors-${i}`,
          title: 'CORS misconfiguration',
          description: 'CORS allows all origins',
          category: 'configuration',
          severity: 'medium',
          cvssScore: 5.0,
          cweId: 'CWE-942',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Restrict CORS to specific trusted origins',
            'Use a whitelist of allowed origins',
          ],
          references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/11-Client-side_Testing/07-Testing_Cross_Origin_Resource_Sharing'],
          isFalsePositive: false,
        })
      }
    }

    return vulns
  }

  /**
   * Scan for input validation vulnerabilities.
   */
  private scanInputValidation(lines: string[], _filePath: string): SecurityVulnerability[] {
    const vulns: SecurityVulnerability[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Unvalidated URL parameters
      if (line.match(/location\.(href|search)|window\.location/)) {
        vulns.push({
          id: `input-url-${i}`,
          title: 'Unvalidated URL parameter',
          description: 'URL parameters used without validation',
          category: 'input-validation',
          severity: 'medium',
          cvssScore: 5.0,
          cweId: 'CWE-20',
          line: i + 1,
          column: 0,
          codeSnippet: line,
          remediation: [
            'Validate all URL parameters',
            'Sanitize input before use',
            'Use a validation library',
          ],
          references: ['https://owasp.org/www-community/vulnerabilities/Improper_Data_Verification'],
          isFalsePositive: false,
        })
      }
    }

    return vulns
  }

  /**
   * Calculate security score.
   */
  private calculateScore(vulns: SecurityVulnerability[]): number {
    if (vulns.length === 0) return 100

    let deduction = 0
    for (const v of vulns) {
      switch (v.severity) {
        case 'critical': deduction += 25; break
        case 'high': deduction += 15; break
        case 'medium': deduction += 8; break
        case 'low': deduction += 3; break
        case 'info': deduction += 1; break
      }
    }

    return Math.max(0, Math.min(100, 100 - deduction))
  }

  /**
   * Get security grade from score.
   */
  private getGrade(score: number): SecurityScanResult['grade'] {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Subscribe to scan results.
   */
  subscribe(listener: (result: SecurityScanResult) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(result: SecurityScanResult): void {
    for (const listener of this.listeners) {
      try { listener(result) } catch { /* ignore */ }
    }
  }

  /**
   * Scan dependencies for known vulnerabilities.
   */
  scanDependencies(deps: Record<string, string>): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = []

    // Known vulnerable packages (simplified CVE database)
    const knownVulnerable: Record<string, { severity: VulnerabilitySeverity; cve: string; description: string; fix: string }> = {
      'lodash': { severity: 'high', cve: 'CVE-2021-23337', description: 'Prototype pollution via template', fix: 'Upgrade to lodash >= 4.17.21' },
      'minimist': { severity: 'critical', cve: 'CVE-2021-44906', description: 'Prototype pollution', fix: 'Upgrade to minimist >= 1.2.6' },
      'node-fetch': { severity: 'medium', cve: 'CVE-2022-0235', description: 'Exposure of sensitive information', fix: 'Upgrade to node-fetch >= 2.6.7' },
      'axios': { severity: 'high', cve: 'CVE-2023-45857', description: 'CSRF token exposure', fix: 'Upgrade to axios >= 1.6.0' },
      'express': { severity: 'medium', cve: 'CVE-2024-29041', description: 'Open redirect', fix: 'Upgrade to express >= 4.19.2' },
      'ws': { severity: 'high', cve: 'CVE-2024-37890', description: 'DoS via large HTTP headers', fix: 'Upgrade to ws >= 8.17.1' },
      'jsonwebtoken': { severity: 'critical', cve: 'CVE-2022-23529', description: 'Insecure key retrieval', fix: 'Upgrade to jsonwebtoken >= 9.0.0' },
      'mongoose': { severity: 'medium', cve: 'CVE-2023-3696', description: 'Prototype pollution', fix: 'Upgrade to mongoose >= 7.3.0' },
    }

    for (const [name, version] of Object.entries(deps)) {
      const known = knownVulnerable[name]
      if (known) {
        const major = parseInt(version.replace(/[^0-9]/g, ''), 10)
        const isVulnerable = major < parseInt(known.fix.match(/\d+/)?.[0] ?? '999', 10)
        if (isVulnerable) {
          vulnerabilities.push({
            id: `dep-${name}-${known.cve}`,
            title: `Vulnerable dependency: ${name}`,
            description: `${known.description} in ${name}@${version}`,
            category: 'insecure-dependency',
            severity: known.severity,
            cvssScore: known.severity === 'critical' ? 9.5 : known.severity === 'high' ? 7.5 : 5.0,
            cweId: 'CWE-1395',
            line: 0,
            column: 0,
            codeSnippet: `${name}: ${version}`,
            remediation: [known.fix],
            references: [`https://nvd.nist.gov/vuln/detail/${known.cve}`],
            isFalsePositive: false,
          })
        }
      }
    }

    return vulnerabilities
  }

  /**
   * Generate a Software Bill of Materials (SBOM).
   */
  generateSBOM(deps: Record<string, string>, devDeps?: Record<string, string>): string {
    const lines: string[] = [
      '# Software Bill of Materials (SBOM)',
      `*Generated: ${new Date().toISOString()}*\n`,
      '| Package | Version | Type | License (est.) |',
      '|---------|---------|------|----------------|',
    ]

    const licenseEstimate = (name: string): string => {
      if (/^(react|react-dom|typescript|vitest)/.test(name)) return 'MIT'
      if (/^(eslint|prettier)/.test(name)) return 'MIT'
      if (/^(webpack|vite|rollup)/.test(name)) return 'MIT'
      return 'MIT*' 
    }

    for (const [name, version] of Object.entries(deps)) {
      const isDev = devDeps?.[name] !== undefined
      lines.push(`| \`${name}\` | ${version} | ${isDev ? 'dev' : 'prod'} | ${licenseEstimate(name)} |`)
    }

    lines.push(`\n*Total: ${Object.keys(deps).length} production, ${Object.keys(devDeps ?? {}).length} dev*`)
    lines.push('\n> *License estimates require manual verification for production use.*')
    return lines.join('\n')
  }

  /**
   * Generate a security report in markdown.
   */
  generateSecurityReport(code: string, filePath: string): string {
    const result = this.scan(code, filePath)
    const vulns = result.vulnerabilities
    const depsVulns = this.scanDependencies({})
    const all = [...vulns, ...depsVulns]

    const critical = all.filter(v => v.severity === 'critical').length
    const high = all.filter(v => v.severity === 'high').length
    const medium = all.filter(v => v.severity === 'medium').length
    const low = all.filter(v => v.severity === 'low').length

    const riskScore = Math.min(100, critical * 30 + high * 20 + medium * 10 + low * 5)
    const riskGrade = riskScore < 20 ? 'A' : riskScore < 40 ? 'B' : riskScore < 60 ? 'C' : riskScore < 80 ? 'D' : 'F'

    const lines = [
      `# Security Report — ${filePath}\n`,
      `**Risk Score:** ${riskScore}/100 (Grade ${riskGrade})\n`,
      `**Findings:** ${all.length} (🔴 ${critical} critical, 🟠 ${high} high, 🟡 ${medium} medium, 🔵 ${low} low)\n`,
      '## Findings\n',
      '| Severity | Category | CWE | Title |',
      '|----------|----------|-----|-------|',
    ]

    for (const v of all) {
      const icon = v.severity === 'critical' ? '🔴' : v.severity === 'high' ? '🟠' : v.severity === 'medium' ? '🟡' : '🔵'
      lines.push(`| ${icon} ${v.severity} | ${v.category} | ${v.cweId} | ${v.title} |`)
    }

    if (all.length > 0) {
      lines.push('\n## Remediation\n')
      for (const v of all.filter(x => x.severity === 'critical' || x.severity === 'high')) {
        lines.push(`- **${v.title}:** ${v.remediation.join('; ')}`)
      }
    }

    return lines.join('\n')
  }
}

/** Singleton instance */
let instance: SecurityScannerEngine | null = null

export function getSecurityScannerEngine(
  config?: Partial<SecurityScannerConfig>
): SecurityScannerEngine {
  if (!instance) {
    instance = new SecurityScannerEngine(config)
  }
  return instance
}

export function resetSecurityScannerEngine(): void {
  instance = null
}
