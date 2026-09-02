/**
 * AI-Powered Security Auditor engine.
 *
 * Scans source code for security vulnerabilities: injection flaws,
 * XSS vectors, insecure defaults, exposed secrets, and OWASP Top 10
 * patterns.  Assigns CVSS-style severity scores and recommends fixes.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ThreatCategory = 'injection' | 'xss' | 'authentication' | 'authorization' | 'data-exposure' | 'crypto' | 'configuration' | 'supply-chain'

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational'

export type OWASPCategory = 'A01' | 'A02' | 'A03' | 'A04' | 'A05' | 'A06' | 'A07' | 'A08' | 'A09' | 'A10'

export interface SecurityFinding {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: ThreatCategory
  readonly owasp: OWASPCategory
  readonly severity: ThreatSeverity
  readonly cvssScore: number        // 0-10
  readonly file: string
  readonly line: number
  readonly codeSnippet: string
  readonly cweId?: string
  readonly fixable: boolean
  readonly confidence: number       // 0-1
  readonly recommendation: string
  readonly references: readonly string[]
}

export interface SecurityAuditResult {
  readonly findings: readonly SecurityFinding[]
  readonly totalFindings: number
  readonly byCategory: Record<ThreatCategory, number>
  readonly bySeverity: Record<ThreatSeverity, number>
  readonly overallScore: number     // 0-100 (100 = secure)
  readonly riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal'
  readonly topRisks: readonly SecurityFinding[]
  readonly remediationPlan: readonly string[]
}

export interface SecurityAuditorConfig {
  readonly scanSecrets: boolean
  readonly scanInjection: boolean
  readonly scanXSS: boolean
  readonly scanConfig: boolean
  readonly minSeverity: ThreatSeverity
}

// ---------------------------------------------------------------------------
// OWASP labels
// ---------------------------------------------------------------------------

const OWASP_LABELS: Record<OWASPCategory, string> = {
  A01: 'Broken Access Control', A02: 'Cryptographic Failures', A03: 'Injection',
  A04: 'Insecure Design', A05: 'Security Misconfiguration', A06: 'Vulnerable Components',
  A07: 'Identification & Auth Failures', A08: 'Data Integrity Failures',
  A09: 'Logging & Monitoring Failures', A10: 'Server-Side Request Forgery',
}

// ---------------------------------------------------------------------------
// Detection rules
// ---------------------------------------------------------------------------

interface Rule {
  readonly pattern: RegExp
  readonly title: string
  readonly category: ThreatCategory
  readonly owasp: OWASPCategory
  readonly severity: ThreatSeverity
  readonly cvss: number
  readonly cwe?: string
  readonly recommendation: string
}

const RULES: Rule[] = [
  // Injection
  { pattern: /\beval\s*\(/gi, title: 'Code injection via eval()', category: 'injection', owasp: 'A03', severity: 'critical', cvss: 9.8, cwe: 'CWE-94', recommendation: 'Avoid eval(). Use safe parsing alternatives.' },
  { pattern: /\bnew\s+Function\s*\(/gi, title: 'Dynamic function constructor', category: 'injection', owasp: 'A03', severity: 'critical', cvss: 9.0, cwe: 'CWE-94', recommendation: 'Replace with direct function references.' },
  { pattern: /\$\{[^}]*\}.*(?:query|sql|SELECT|INSERT|UPDATE|DELETE)/gi, title: 'SQL injection via template literal', category: 'injection', owasp: 'A03', severity: 'critical', cvss: 9.8, cwe: 'CWE-89', recommendation: 'Use parameterized queries or an ORM.' },
  { pattern: /(?:exec|spawn|execSync|execFile)\s*\(\s*[^)]*\+/gi, title: 'Command injection via string concatenation', category: 'injection', owasp: 'A03', severity: 'critical', cvss: 9.1, cwe: 'CWE-78', recommendation: 'Use execFile with argument arrays instead of shell commands.' },
  { pattern: /innerHTML\s*=\s*[^;]*\+/gi, title: 'Potential XSS via innerHTML', category: 'xss', owasp: 'A03', severity: 'high', cvss: 7.5, cwe: 'CWE-79', recommendation: 'Use textContent or sanitise input before setting innerHTML.' },
  // Secrets
  { pattern: /(?:password|secret|api_key|apikey|token|private_key)\s*[:=]\s*['"][^'"]{8,}['"]/gi, title: 'Hardcoded secret detected', category: 'data-exposure', owasp: 'A02', severity: 'critical', cvss: 9.1, cwe: 'CWE-798', recommendation: 'Move secrets to environment variables or a vault.' },
  { pattern: /(?:AWS|AKIA|sk_live|rk_live)[A-Z0-9]{16,}/g, title: 'Potential cloud credential exposed', category: 'data-exposure', owasp: 'A02', severity: 'critical', cvss: 9.5, cwe: 'CWE-798', recommendation: 'Rotate the credential immediately and use IAM roles.' },
  // Crypto
  { pattern: /\b(?:md5|sha1)\b/gi, title: 'Weak cryptographic hash', category: 'crypto', owasp: 'A02', severity: 'medium', cvss: 5.3, cwe: 'CWE-327', recommendation: 'Use SHA-256 or bcrypt for sensitive data.' },
  { pattern: /\bMath\.random\b/g, title: 'Insecure random number generator', category: 'crypto', owasp: 'A02', severity: 'medium', cvss: 5.9, cwe: 'CWE-330', recommendation: 'Use crypto.getRandomValues() or crypto.randomUUID().' },
  // Auth
  { pattern: /(?:httpOnly|secure|sameSite)\s*:\s*false/gi, title: 'Insecure cookie configuration', category: 'authentication', owasp: 'A07', severity: 'high', cvss: 7.0, cwe: 'CWE-614', recommendation: 'Set httpOnly, secure, and sameSite to true.' },
  { pattern: /(?:cors|Access-Control-Allow-Origin)\s*[=:]\s*['"]?\*/gi, title: 'Permissive CORS policy', category: 'authorization', owasp: 'A05', severity: 'medium', cvss: 5.5, cwe: 'CWE-942', recommendation: 'Restrict CORS to specific trusted origins.' },
  // Config
  { pattern: /(?:debug|DEBUG)\s*[=:]\s*(?:true|1|'1'|"1")/gi, title: 'Debug mode enabled', category: 'configuration', owasp: 'A05', severity: 'low', cvss: 3.1, cwe: 'CWE-489', recommendation: 'Disable debug mode in production.' },
  { pattern: /\b(?:TLS|SSL)\s*(?:1\.0|1\.1)\b/gi, title: 'Deprecated TLS version', category: 'crypto', owasp: 'A02', severity: 'medium', cvss: 5.9, cwe: 'CWE-326', recommendation: 'Use TLS 1.2 or later.' },
  // Data exposure
  { pattern: /console\.(?:log|debug|info|warn|error)\s*\(\s*(?:password|token|secret|key)/gi, title: 'Secret logged to console', category: 'data-exposure', owasp: 'A09', severity: 'high', cvss: 7.5, cwe: 'CWE-532', recommendation: 'Never log sensitive data.' },
  { pattern: /(?:dangerouslySetInnerHTML|v-html)\s*[=]/gi, title: 'Unsafe HTML rendering', category: 'xss', owasp: 'A03', severity: 'high', cvss: 7.1, cwe: 'CWE-79', recommendation: 'Sanitise HTML with DOMPurify before rendering.' },
]

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SecurityAuditorEngine {
  private readonly config: SecurityAuditorConfig
  private readonly customRules: Rule[] = []

  constructor(config?: Partial<SecurityAuditorConfig>) {
    this.config = {
      scanSecrets: config?.scanSecrets ?? true,
      scanInjection: config?.scanInjection ?? true,
      scanXSS: config?.scanXSS ?? true,
      scanConfig: config?.scanConfig ?? true,
      minSeverity: config?.minSeverity ?? 'informational',
    }
  }

  addRule(rule: Rule): void { this.customRules.push(rule) }

  audit(sourceCode: string, filePath: string): SecurityAuditResult {
    const lines = sourceCode.split('\n')
    const allRules = [...RULES, ...this.customRules]
    const findings: SecurityFinding[] = []
    const severityOrder: Record<ThreatSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 }
    const minSev = severityOrder[this.config.minSeverity]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      for (const rule of allRules) {
        if (!this.isRuleEnabled(rule)) continue
        if (severityOrder[rule.severity] > minSev) continue
        rule.pattern.lastIndex = 0
        if (rule.pattern.test(line)) {
          findings.push({
            id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            title: rule.title,
            description: `${OWASP_LABELS[rule.owasp]}: ${rule.title}`,
            category: rule.category,
            owasp: rule.owasp,
            severity: rule.severity,
            cvssScore: rule.cvss,
            file: filePath,
            line: i + 1,
            codeSnippet: line.trim().slice(0, 120),
            ...(rule.cwe ? { cweId: rule.cwe } : {}),
            fixable: rule.severity !== 'informational',
            confidence: Math.min(1, 0.7 + rule.cvss * 0.03),
            recommendation: rule.recommendation,
            references: [`https://cwe.mitre.org/data/definitions/${rule.cwe?.replace('CWE-', '') ?? '0'}.html`],
          })
        }
      }
    }

    const byCategory: Record<ThreatCategory, number> = { injection: 0, xss: 0, authentication: 0, authorization: 0, 'data-exposure': 0, crypto: 0, configuration: 0, 'supply-chain': 0 }
    const bySeverity: Record<ThreatSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 }
    for (const f of findings) { byCategory[f.category]++; bySeverity[f.severity]++ }

    const maxCVSS = findings.length > 0 ? Math.max(...findings.map(f => f.cvssScore)) : 0
    const overallScore = Math.max(0, Math.min(100, 100 - findings.length * 5 - maxCVSS * 3))
    const riskLevel = maxCVSS >= 9 ? 'critical' : maxCVSS >= 7 ? 'high' : maxCVSS >= 4 ? 'medium' : maxCVSS > 0 ? 'low' : 'minimal'
    const topRisks = [...findings].sort((a, b) => b.cvssScore - a.cvssScore).slice(0, 10)
    const remediationPlan = this.generateRemediation(findings, byCategory)

    return { findings, totalFindings: findings.length, byCategory, bySeverity, overallScore, riskLevel, topRisks, remediationPlan }
  }

  private isRuleEnabled(rule: Rule): boolean {
    if (!this.config.scanSecrets && rule.category === 'data-exposure') return false
    if (!this.config.scanInjection && rule.category === 'injection') return false
    if (!this.config.scanXSS && rule.category === 'xss') return false
    if (!this.config.scanConfig && rule.category === 'configuration') return false
    return true
  }

  private generateRemediation(findings: SecurityFinding[], byCategory: Record<ThreatCategory, number>): string[] {
    const recs: string[] = []
    const criticals = findings.filter(f => f.severity === 'critical')
    if (criticals.length > 0) recs.push(`🚨 ${criticals.length} CRITICAL vulnerability(ies) found — address immediately.`)
    if (byCategory.injection > 0) recs.push(`Fix ${byCategory.injection} injection flaw(s) with input validation and parameterized queries.`)
    if (byCategory['data-exposure'] > 0) recs.push(`Rotate and remove ${byCategory['data-exposure']} exposed secret(s). Move to env vars or vault.`)
    if (byCategory.xss > 0) recs.push(`Sanitise all user input before HTML rendering. Use DOMPurify or equivalent.`)
    if (byCategory.crypto > 0) recs.push(`Replace weak cryptographic primitives with modern alternatives (SHA-256, bcrypt, CSPRNG).`)
    if (byCategory.authentication > 0 || byCategory.authorization > 0) recs.push('Review authentication and authorization configurations.')
    if (recs.length === 0) recs.push('No significant security findings. Keep your dependencies updated.')
    return recs
  }
}

let _instance: SecurityAuditorEngine | undefined
export function getSecurityAuditorEngine(config?: Partial<SecurityAuditorConfig>): SecurityAuditorEngine {
  _instance ??= new SecurityAuditorEngine(config)
  return _instance
}
export function resetSecurityAuditorEngine(): void { _instance = undefined }
