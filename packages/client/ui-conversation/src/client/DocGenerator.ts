/**
 * API Documentation Generator Engine for Idexal Agents.
 * Automatically generates comprehensive API documentation from code
 * analysis, including TypeScript interfaces, function signatures,
 * and usage examples in multiple formats.
 */

/** Doc format */
export type DocFormat = 'markdown' | 'html' | 'json' | 'openapi'

/** Doc language */
export type DocLanguage = 'en' | 'ar' | 'zh'

/** Function documentation */
export interface FunctionDoc {
  name: string
  description: string
  params: Array<{ name: string; type: string; description: string; optional: boolean; defaultValue?: string }>
  returnType: string
  returnDescription: string
  examples: Array<{ title: string; code: string; description: string }>
  throws: string[]
  since: string
  deprecated: boolean
  tags: string[]
}

/** Interface documentation */
export interface InterfaceDoc {
  name: string
  description: string
  properties: Array<{ name: string; type: string; description: string; optional: boolean; defaultValue?: string }>
  methods: FunctionDoc[]
  extends?: string
  examples: Array<{ title: string; description: string }>
}

/** Class documentation */
export interface ClassDoc {
  name: string
  description: string
  extends?: string
  implements?: string[]
  constructor: FunctionDoc
  properties: Array<{ name: string; type: string; visibility: 'public' | 'private' | 'protected'; description: string }>
  methods: FunctionDoc[]
  staticMethods: FunctionDoc[]
  examples: Array<{ title: string; code: string; description: string }>
}

/** Module documentation */
export interface ModuleDoc {
  name: string
  description: string
  filePath: string
  exports: string[]
  functions: FunctionDoc[]
  interfaces: InterfaceDoc[]
  classes: ClassDoc[]
  types: Array<{ name: string; definition: string; description: string }>
  constants: Array<{ name: string; type: string; value: string; description: string }>
}

/** Generated documentation */
export interface GeneratedDoc {
  title: string
  description: string
  version: string
  generatedAt: number
  modules: ModuleDoc[]
  format: DocFormat
  language: DocLanguage
  tableOfContents: Array<{ level: number; title: string; anchor: string }>
  content: string
}

/** Doc generator config */
export interface DocGeneratorConfig {
  format: DocFormat
  language: DocLanguage
  title: string
  description: string
  version: string
  includePrivate: boolean
  includeExamples: boolean
  includeTableOfContents: boolean
  maxExamplesPerFunction: number
}

const DOC_I18N: Record<DocLanguage, {
  apiReference: string
  parameters: string
  returns: string
  examples: string
  throws: string
  since: string
  deprecated: string
  properties: string
  methods: string
  constructor: string
  typeDefinition: string
  exports: string
  constants: string
  tableOfContents: string
}> = {
  en: {
    apiReference: 'API Reference', parameters: 'Parameters', returns: 'Returns',
    examples: 'Examples', throws: 'Throws', since: 'Since', deprecated: 'Deprecated',
    properties: 'Properties', methods: 'Methods', constructor: 'Constructor',
    typeDefinition: 'Type Definition', exports: 'Exports', constants: 'Constants',
    tableOfContents: 'Table of Contents',
  },
  ar: {
    apiReference: 'مرجع API', parameters: 'المعاملات', returns: 'القيمة المُعادة',
    examples: 'أمثلة', throws: 'يُ throws', since: 'منذ', deprecated: 'متقادم',
    properties: 'الخصائص', methods: 'الطرق', constructor: 'المنشئ',
    typeDefinition: 'تعريف النوع', exports: 'التصديرات', constants: 'الثوابت',
    tableOfContents: 'جدول المحتويات',
  },
  zh: {
    apiReference: 'API 参考', parameters: '参数', returns: '返回值',
    examples: '示例', throws: '抛出', since: '自', deprecated: '已弃用',
    properties: '属性', methods: '方法', constructor: '构造函数',
    typeDefinition: '类型定义', exports: '导出', constants: '常量',
    tableOfContents: '目录',
  },
}

function extractFunctions(code: string): FunctionDoc[] {
  const functions: FunctionDoc[] = []
  const patterns = [
    /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/g,
    /export\s+(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1] ?? 'unknown'
      const paramsStr = match[2] ?? ''
      const returnType = match[3]?.trim() ?? 'void'

      const params = paramsStr.split(',').filter(p => p.trim()).map(p => {
        const parts = p.trim().split(/[\s:?=]/)
        const hasDefault = p.includes('=')
        const defaultVal = hasDefault ? p.split('=')[1]?.trim() : undefined
        const param: { name: string; type: string; description: string; optional: boolean; defaultValue?: string } = {
          name: parts[0]?.replace(/[=?].*$/, '') ?? '',
          type: parts.find(s => s.includes(':'))?.replace(':', '').trim() ?? 'unknown',
          description: '',
          optional: p.includes('?') || hasDefault,
        }
        if (defaultVal !== undefined) param.defaultValue = defaultVal
        return param
      }).filter(p => p.name)

      const descMatch = code.match(new RegExp(`/\\*\\*\\s*([\\s\\S]*?)\\s*\\*/\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${name}`))
      const description = descMatch?.[1]?.replace(/^\s*\*\s?/gm, '').trim() ?? ''

      functions.push({
        name, description, params, returnType,
        returnDescription: '',
        examples: [], throws: [], since: '0.1.0',
        deprecated: code.includes(`@deprecated`) && code.includes(name),
        tags: [],
      })
    }
  }

  return functions
}

function extractInterfaces(code: string): InterfaceDoc[] {
  const interfaces: InterfaceDoc[] = []
  const pattern = /export\s+interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{([\s\S]*?)\n\}/g

  let match
  while ((match = pattern.exec(code)) !== null) {
    const name = match[1] ?? 'unknown'
    const extendsClause = match[2]
    const body = match[3] ?? ''

    const properties = body.split('\n').filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('/'))
      .map(l => {
        const propMatch = l.match(/^\s*(\??\s*\w+)\s*[?]?\s*:\s*(.+)/)
        if (!propMatch?.[1]) return null
        return {
          name: propMatch[1].replace('?', '').trim(),
          type: propMatch[2]?.replace(/[;].*$/, '').trim() ?? 'unknown',
          description: '',
          optional: l.includes('?'),
        }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)

    const iface: InterfaceDoc = { name, description: '', properties, methods: [], examples: [] }
    if (extendsClause) iface.extends = extendsClause
    interfaces.push(iface)
  }

  return interfaces
}

function extractClasses(code: string): ClassDoc[] {
  const classes: ClassDoc[] = []
  const pattern = /export\s+class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{([\s\S]*?)\n\}/g

  let match
  while ((match = pattern.exec(code)) !== null) {
    const name = match[1] ?? 'unknown'
    const extendsClause = match[2]
    const implementsClause = match[3]?.split(',').map(s => s.trim())
    const body = match[4] ?? ''

    const methods: FunctionDoc[] = []
    const methodPattern = /(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/g
    let mMatch
    while ((mMatch = methodPattern.exec(body)) !== null) {
      if (mMatch[1] === 'constructor') continue
      methods.push({
        name: mMatch[1] ?? '', description: '',
        params: (mMatch[2] ?? '').split(',').filter(p => p.trim()).map(p => ({
          name: p.trim().split(/[\s:?=]/)[0]?.replace('?', '') ?? '',
          type: 'unknown', description: '', optional: p.includes('?'),
        })).filter(p => p.name),
        returnType: mMatch[3]?.trim() ?? 'void',
        returnDescription: '', examples: [], throws: [],
        since: '0.1.0', deprecated: false, tags: [],
      })
    }

    const cls: ClassDoc = {
      name, description: '',
      constructor: {
        name: 'constructor', description: '', params: [],
        returnType: name, returnDescription: '',
        examples: [], throws: [], since: '0.1.0', deprecated: false, tags: [],
      },
      properties: [], methods, staticMethods: [], examples: [],
    }
    if (extendsClause) cls.extends = extendsClause
    if (implementsClause) cls.implements = implementsClause
    classes.push(cls)
  }

  return classes
}

/**
 * API Documentation Generator Engine.
 */
export class DocGeneratorEngine {
  private config: DocGeneratorConfig
  private listeners: Set<(event: DocGeneratorEvent) => void> = new Set()

  constructor(config: Partial<DocGeneratorConfig> = {}) {
    this.config = {
      format: config.format ?? 'markdown',
      language: config.language ?? 'en',
      title: config.title ?? 'API Documentation',
      description: config.description ?? '',
      version: config.version ?? '0.1.0',
      includePrivate: config.includePrivate ?? false,
      includeExamples: config.includeExamples ?? true,
      includeTableOfContents: config.includeTableOfContents ?? true,
      maxExamplesPerFunction: config.maxExamplesPerFunction ?? 3,
    }
  }

  /**
   * Generate documentation from source code.
   */
  generate(code: string, filename: string): GeneratedDoc {
    const t = DOC_I18N[this.config.language] ?? DOC_I18N.en

    const functions = extractFunctions(code)
    const interfaces = extractInterfaces(code)
    const classes = extractClasses(code)

    // Extract types
    const typePattern = /export\s+type\s+(\w+)\s*=\s*(.+?)(?:\n|$)/g
    const types: ModuleDoc['types'] = []
    let typeMatch
    while ((typeMatch = typePattern.exec(code)) !== null) {
      types.push({ name: typeMatch[1] ?? '', definition: typeMatch[2]?.trim() ?? '', description: '' })
    }

    // Extract constants
    const constPattern = /export\s+const\s+(\w+)\s*(?::\s*(\w+))?\s*=\s*(.+?)(?:;|$)/gm
    const constants: ModuleDoc['constants'] = []
    let constMatch
    while ((constMatch = constPattern.exec(code)) !== null) {
      constants.push({
        name: constMatch[1] ?? '',
        type: constMatch[2] ?? 'unknown',
        value: constMatch[3]?.trim() ?? '',
        description: '',
      })
    }

    // Extract exports
    const exportPattern = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g
    const exports: string[] = []
    let expMatch
    while ((expMatch = exportPattern.exec(code)) !== null) {
      if (expMatch[1]) exports.push(expMatch[1])
    }

    const moduleDoc: ModuleDoc = {
      name: filename.replace(/\.\w+$/, ''),
      description: '',
      filePath: filename,
      exports,
      functions,
      interfaces,
      classes,
      types,
      constants,
    }

    // Generate content
    const content = this.formatDoc(moduleDoc, t)
    const tableOfContents = this.generateTOC(moduleDoc)

    const doc: GeneratedDoc = {
      title: this.config.title,
      description: this.config.description,
      version: this.config.version,
      generatedAt: Date.now(),
      modules: [moduleDoc],
      format: this.config.format,
      language: this.config.language,
      tableOfContents,
      content,
    }

    this.notifyListeners({ type: 'doc-generated', doc })
    return doc
  }

  /**
   * Generate OpenAPI spec from code.
   */
  generateOpenAPI(code: string, _filename: string): Record<string, unknown> {
    const functions = extractFunctions(code)
    const interfaces = extractInterfaces(code)

    const paths: Record<string, unknown> = {}
    for (const fn of functions) {
      paths[`/${fn.name}`] = {
        post: {
          summary: fn.description || fn.name,
          parameters: fn.params.map(p => ({
            name: p.name,
            in: 'query',
            schema: { type: 'string' },
            required: !p.optional,
          })),
          responses: {
            '200': { description: 'Success', content: { 'application/json': { schema: { type: 'object' } } } },
          },
        },
      }
    }

    const schemas: Record<string, unknown> = {}
    for (const iface of interfaces) {
      schemas[iface.name] = {
        type: 'object',
        properties: Object.fromEntries(iface.properties.map(p => [p.name, { type: 'string', description: p.description }])),
      }
    }

    return {
      openapi: '3.0.0',
      info: { title: this.config.title, version: this.config.version, description: this.config.description },
      paths,
      components: { schemas },
    }
  }

  private formatDoc(module: ModuleDoc, t: typeof DOC_I18N.en): string {
    const lines: string[] = []
    lines.push(`# ${this.config.title}`)
    if (this.config.description) lines.push(`\n${this.config.description}`)
    lines.push(`\n---\n`)

    // Functions
    if (module.functions.length > 0) {
      lines.push(`## ${t.methods}\n`)
      for (const fn of module.functions) {
        lines.push(`### \`${fn.name}\`\n`)
        if (fn.description) lines.push(`${fn.description}\n`)
        if (fn.params.length > 0) {
          lines.push(`**${t.parameters}:**\n`)
          lines.push(`| Name | Type | Optional | Default |`)
          lines.push(`|------|------|----------|---------|`)
          for (const p of fn.params) {
            lines.push(`| \`${p.name}\` | \`${p.type}\` | ${p.optional ? '✅' : '❌'} | ${p.defaultValue ?? '-'} |`)
          }
          lines.push('')
        }
        lines.push(`**${t.returns}:** \`${fn.returnType}\`\n`)
        if (fn.deprecated) lines.push(`> ⚠️ **${t.deprecated}**\n`)
        lines.push('---\n')
      }
    }

    // Interfaces
    if (module.interfaces.length > 0) {
      lines.push(`## ${t.typeDefinition}\n`)
      for (const iface of module.interfaces) {
        lines.push(`### \`${iface.name}\`\n`)
        if (iface.extends) lines.push(`*extends \`${iface.extends}\`*\n`)
        if (iface.properties.length > 0) {
          lines.push(`| Property | Type | Optional |`)
          lines.push(`|----------|------|----------|`)
          for (const p of iface.properties) {
            lines.push(`| \`${p.name}\` | \`${p.type}\` | ${p.optional ? '✅' : '❌'} |`)
          }
          lines.push('')
        }
      }
    }

    // Classes
    if (module.classes.length > 0) {
      lines.push(`## Classes\n`)
      for (const cls of module.classes) {
        lines.push(`### \`${cls.name}\`\n`)
        if (cls.extends) lines.push(`*extends \`${cls.extends}\`*\n`)
        if (cls.methods.length > 0) {
          lines.push(`**Methods:**\n`)
          for (const m of cls.methods) {
            const params = m.params.map(p => `${p.name}: ${p.type}`).join(', ')
            lines.push(`- \`${m.name}(${params}): ${m.returnType}\``)
          }
          lines.push('')
        }
      }
    }

    return lines.join('\n')
  }

  private generateTOC(module: ModuleDoc): GeneratedDoc['tableOfContents'] {
    const toc: GeneratedDoc['tableOfContents'] = []
    if (module.functions.length > 0) {
      toc.push({ level: 2, title: 'Functions', anchor: 'functions' })
      for (const fn of module.functions) {
        toc.push({ level: 3, title: fn.name, anchor: fn.name.toLowerCase() })
      }
    }
    if (module.interfaces.length > 0) {
      toc.push({ level: 2, title: 'Interfaces', anchor: 'interfaces' })
      for (const iface of module.interfaces) {
        toc.push({ level: 3, title: iface.name, anchor: iface.name.toLowerCase() })
      }
    }
    if (module.classes.length > 0) {
      toc.push({ level: 2, title: 'Classes', anchor: 'classes' })
      for (const cls of module.classes) {
        toc.push({ level: 3, title: cls.name, anchor: cls.name.toLowerCase() })
      }
    }
    return toc
  }

  subscribe(listener: (event: DocGeneratorEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: DocGeneratorEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Doc generator event */
export interface DocGeneratorEvent {
  type: 'doc-generated' | 'doc-updated'
  doc?: GeneratedDoc
}

/** Singleton */
let instance: DocGeneratorEngine | null = null

export function getDocGeneratorEngine(config?: Partial<DocGeneratorConfig>): DocGeneratorEngine {
  if (!instance) instance = new DocGeneratorEngine(config)
  return instance
}

export function resetDocGeneratorEngine(): void { instance = null }
