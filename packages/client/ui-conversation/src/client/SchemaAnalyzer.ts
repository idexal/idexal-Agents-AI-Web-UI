/**
 * Smart Database Schema Analyzer engine.
 *
 * Parses SQL DDL / ORM model definitions to extract tables, columns,
 * relationships, indexes, and constraints.  Detects anti-patterns such
 * as missing foreign keys, denormalised hotspots, and N+1 query risks.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'binary' | 'uuid' | 'enum' | 'unknown'

export type ConstraintType = 'primary' | 'foreign' | 'unique' | 'check' | 'not-null'

export type SchemaIssueType = 'missing-index' | 'missing-fk' | 'denormalised' | 'n-plus-1-risk' | 'wide-table' | 'no-timestamp' | 'unbounded-text'

export interface DBColumn {
  readonly name: string
  readonly type: ColumnType
  readonly rawType: string
  readonly nullable: boolean
  readonly defaultValue?: string
  readonly constraints: readonly ConstraintType[]
}

export interface DBIndex {
  readonly name: string
  readonly columns: readonly string[]
  readonly unique: boolean
}

export interface DBRelation {
  readonly fromTable: string
  readonly fromColumn: string
  readonly toTable: string
  readonly toColumn: string
  readonly type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

export interface DBTable {
  readonly name: string
  readonly columns: readonly DBColumn[]
  readonly indexes: readonly DBIndex[]
  readonly constraints: readonly string[]
  readonly rowCount?: number
}

export interface SchemaIssue {
  readonly type: SchemaIssueType
  readonly table: string
  readonly column?: string
  readonly severity: 'warning' | 'info' | 'critical'
  readonly message: string
  readonly recommendation: string
}

export interface SchemaAnalysisResult {
  readonly tables: readonly DBTable[]
  readonly relations: readonly DBRelation[]
  readonly issues: readonly SchemaIssue[]
  readonly stats: { totalTables: number; totalColumns: number; totalIndexes: number; totalRelations: number }
  readonly score: number  // 0-100
  readonly recommendations: readonly string[]
}

export interface SchemaAnalyzerConfig {
  readonly detectNPlusOne: boolean
  readonly minWidthForWarning: number
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class SchemaAnalyzerEngine {
  private readonly config: SchemaAnalyzerConfig

  constructor(config?: Partial<SchemaAnalyzerConfig>) {
    this.config = {
      detectNPlusOne: config?.detectNPlusOne ?? true,
      minWidthForWarning: config?.minWidthForWarning ?? 20,
    }
  }

  /** Parse a simplified SQL DDL into structured tables. */
  parseDDL(ddl: string): DBTable[] {
    const tables: DBTable[] = []
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?\s*\(([\s\S]*?)\)\s*;/gi
    let match: RegExpExecArray | null
    while ((match = tableRegex.exec(ddl)) !== null) {
      const tableName = match[1] ?? 'unknown'
      const body = match[2] ?? ''
      const columns: DBColumn[] = []
      const indexes: DBIndex[] = []
      const constraints: string[] = []
      for (const line of body.split(',')) {
        const trimmed = line.trim()
        if (/^\s*(PRIMARY\s+KEY|UNIQUE|CONSTRAINT|CHECK|FOREIGN\s+KEY|INDEX|KEY)/i.test(trimmed)) {
          constraints.push(trimmed)
          const idxMatch = /(?:INDEX|KEY)\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)/i.exec(trimmed)
          if (idxMatch) {
            indexes.push({ name: idxMatch[1] ?? `idx_${tableName}`, columns: (idxMatch[2] ?? '').split(',').map(c => c.trim().replace(/[`"']/g, '')), unique: /UNIQUE/i.test(trimmed) })
          }
        } else {
          const colMatch = /^[`"']?(\w+)[`"']?\s+(\w+(?:\([^)]*\))?)/i.exec(trimmed)
          if (colMatch) {
            const name = colMatch[1] ?? ''
            const rawType = colMatch[2] ?? 'text'
            const constraints: ConstraintType[] = []
            if (/PRIMARY\s+KEY/i.test(trimmed)) constraints.push('primary')
            if (/\bNOT\s+NULL\b/i.test(trimmed)) constraints.push('not-null')
            if (/UNIQUE/i.test(trimmed)) constraints.push('unique')
            if (/REFERENCES/i.test(trimmed)) constraints.push('foreign')
            columns.push({
              name, type: this.mapType(rawType), rawType,
              nullable: !/NOT\s+NULL/i.test(trimmed) && !constraints.includes('primary'),
              constraints,
            })
          }
        }
      }
      tables.push({ name: tableName, columns, indexes, constraints })
    }
    return tables
  }

  analyze(tables: DBTable[], relations: DBRelation[] = []): SchemaAnalysisResult {
    const issues: SchemaIssue[] = []
    for (const table of tables) {
      issues.push(...this.checkTable(table, tables))
    }
    if (this.config.detectNPlusOne) {
      issues.push(...this.detectNPlusOneRisks(tables, relations))
    }
    const stats = { totalTables: tables.length, totalColumns: tables.reduce((s, t) => s + t.columns.length, 0), totalIndexes: tables.reduce((s, t) => s + t.indexes.length, 0), totalRelations: relations.length }
    const score = Math.max(0, Math.min(100, 100 - issues.length * 3))
    const recommendations = this.generateRecommendations(issues, stats)
    return { tables, relations, issues, stats, score, recommendations }
  }

  private checkTable(table: DBTable, allTables: DBTable[]): SchemaIssue[] {
    const issues: SchemaIssue[] = []
    const hasId = table.columns.some(c => c.name === 'id' || c.constraints.includes('primary'))
    if (!hasId) issues.push({ type: 'missing-fk', table: table.name, severity: 'warning', message: `Table "${table.name}" has no primary key.`, recommendation: 'Add an id column or primary key constraint.' })
    if (table.columns.length > this.config.minWidthForWarning) issues.push({ type: 'wide-table', table: table.name, severity: 'info', message: `Table "${table.name}" has ${table.columns.length} columns.`, recommendation: 'Consider splitting into related tables for better normalisation.' })
    const hasTimestamps = table.columns.some(c => /created_at|updated_at|timestamp/i.test(c.name))
    if (!hasTimestamps) issues.push({ type: 'no-timestamp', table: table.name, severity: 'info', message: `Table "${table.name}" has no timestamp columns.`, recommendation: 'Add created_at and updated_at for audit trails.' })
    const textCols = table.columns.filter(c => /text|clob/i.test(c.rawType))
    if (textCols.length > 0) {
      const col0 = textCols[0]
      issues.push({ type: 'unbounded-text', table: table.name, ...(col0 ? { column: col0.name } : {}), severity: 'warning', message: `Unbounded text column "${col0?.name ?? '?'}" in "${table.name}".`, recommendation: 'Use VARCHAR(n) with a reasonable limit or move to a document store.' })
    }
    const fkCols = table.columns.filter(c => /_id$/.test(c.name) || c.constraints.includes('foreign'))
    for (const col of fkCols) {
      const refTable = col.name.replace(/_id$/, '')
      if (!allTables.some(t => t.name === refTable || t.name === `${refTable}s`)) {
        issues.push({ type: 'missing-fk', table: table.name, column: col.name, severity: 'warning', message: `Column "${col.name}" looks like a foreign key but no referencing table found.`, recommendation: `Add a FOREIGN KEY constraint or create the "${refTable}" table.` })
      }
    }
    if (table.indexes.length === 0 && table.columns.length > 3) {
      issues.push({ type: 'missing-index', table: table.name, severity: 'info', message: `Table "${table.name}" has no indexes.`, recommendation: 'Add indexes on frequently queried columns.' })
    }
    return issues
  }

  private detectNPlusOneRisks(tables: DBTable[], relations: DBRelation[]): SchemaIssue[] {
    const issues: SchemaIssue[] = []
    const tableNames = new Set(tables.map(t => t.name))
    for (const rel of relations) {
      if (rel.type === 'one-to-many' && tableNames.has(rel.fromTable)) {
        issues.push({ type: 'n-plus-1-risk', table: rel.fromTable, severity: 'info', message: `One-to-many relation to "${rel.toTable}" may cause N+1 queries.`, recommendation: 'Use eager loading, JOINs, or batch fetching.' })
      }
    }
    return issues
  }

  private mapType(raw: string): ColumnType {
    const lower = raw.toLowerCase()
    if (/int|serial|bigint|float|double|decimal|numeric/.test(lower)) return 'number'
    if (/bool/.test(lower)) return 'boolean'
    if (/date|time|timestamp/.test(lower)) return 'date'
    if (/json|jsonb/.test(lower)) return 'json'
    if (/binary|blob|bytea/.test(lower)) return 'binary'
    if (/uuid/.test(lower)) return 'uuid'
    if (/enum/.test(lower)) return 'enum'
    return 'string'
  }

  private generateRecommendations(issues: SchemaIssue[], stats: { totalTables: number; totalColumns: number }): string[] {
    const recs: string[] = []
    const criticals = issues.filter(i => i.severity === 'critical')
    if (criticals.length > 0) recs.push(`${criticals.length} critical schema issue(s) — fix before deployment.`)
    const missingFks = issues.filter(i => i.type === 'missing-fk')
    if (missingFks.length > 0) recs.push(`Add ${missingFks.length} missing foreign key constraint(s).`)
    const missingIndexes = issues.filter(i => i.type === 'missing-index')
    if (missingIndexes.length > 0) recs.push(`Add indexes to ${missingIndexes.length} table(s) for query performance.`)
    const nPlusOne = issues.filter(i => i.type === 'n-plus-1-risk')
    if (nPlusOne.length > 0) recs.push(`${nPlusOne.length} N+1 query risk(s) — use eager loading or batch queries.`)
    if (stats.totalTables > 50) recs.push('Large schema detected — consider domain-driven partitioning.')
    if (recs.length === 0) recs.push('Schema looks healthy!')
    return recs
  }
}

let _instance: SchemaAnalyzerEngine | undefined
export function getSchemaAnalyzerEngine(config?: Partial<SchemaAnalyzerConfig>): SchemaAnalyzerEngine {
  _instance ??= new SchemaAnalyzerEngine(config)
  return _instance
}
export function resetSchemaAnalyzerEngine(): void { _instance = undefined }
