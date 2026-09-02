/**
 * Auto-Generated Documentation Engine for Idexal Agents.
 * Analyzes code and generates comprehensive documentation including
 * API references, usage examples, and inline comments.
 */

/** Documentation type */
export type DocType = 'api' | 'readme' | 'changelog' | 'inline' | 'tutorial'

/** Documentation language */
export type DocLanguage = 'en' | 'ar' | 'zh'

/** Code element type */
export type ElementType = 'function' | 'class' | 'interface' | 'type' | 'enum' | 'variable' | 'module'

/** Documentation section */
export interface DocSection {
  /** Section title */
  title: string
  /** Section content */
  content: string
  /** Section level (1-6) */
  level: number
  /** Subsections */
  subsections: DocSection[]
}

/** Parameter documentation */
export interface ParamDoc {
  /** Parameter name */
  name: string
  /** Parameter type */
  type: string
  /** Parameter description */
  description: string
  /** Whether parameter is optional */
  optional: boolean
  /** Default value */
  defaultValue?: string
}

/** Return type documentation */
export interface ReturnDoc {
  /** Return type */
  type: string
  /** Return description */
  description: string
}

/** Function documentation */
export interface FunctionDoc {
  /** Function name */
  name: string
  /** Function description */
  description: string
  /** Parameters */
  params: ParamDoc[]
  /** Return type */
  returns: ReturnDoc
  /** Usage examples */
  examples: string[]
  /** Related functions */
  related: string[]
  /** Deprecation notice */
  deprecated?: string
  /** Since version */
  since?: string
}

/** Class documentation */
export interface ClassDoc {
  /** Class name */
  name: string
  /** Class description */
  description: string
  /** Properties */
  properties: ParamDoc[]
  /** Methods */
  methods: FunctionDoc[]
  /** Constructor params */
  constructor: ParamDoc[]
  /** Usage examples */
  examples: string[]
  /** Inheritance */
  extends?: string | undefined
  /** Implemented interfaces */
  implements?: string[] | undefined
}

/** Module documentation */
export interface ModuleDoc {
  /** Module name */
  name: string
  /** Module description */
  description: string
  /** Exports */
  exports: (FunctionDoc | ClassDoc)[]
  /** Usage examples */
  examples: string[]
  /** Dependencies */
  dependencies: string[]
}

/** Generated documentation */
export interface GeneratedDocumentation {
  /** Documentation type */
  type: DocType
  /** Title */
  title: string
  /** Sections */
  sections: DocSection[]
  /** Full markdown content */
  markdown: string
  /** Statistics */
  stats: {
    elements: number
    params: number
    examples: number
    lines: number
  }
  /** Generation timestamp */
  timestamp: number
}

/** Documentation config */
export interface AutoDocConfig {
  /** Output language */
  language: DocLanguage
  /** Include examples */
  includeExamples: boolean
  /** Include type info */
  includeTypeInfo: boolean
  /** Include deprecation notices */
  includeDeprecation: boolean
  /** Maximum description length */
  maxDescriptionLength: number
  /** Custom templates */
  templates?: Record<string, string>
}

/**
 * Auto-Generated Documentation Engine.
 */
export class AutoDocumentationEngine {
  private config: AutoDocConfig
  private listeners: Set<(doc: GeneratedDocumentation) => void> = new Set()

  constructor(config: Partial<AutoDocConfig> = {}) {
    this.config = {
      language: config.language ?? 'en',
      includeExamples: config.includeExamples ?? true,
      includeTypeInfo: config.includeTypeInfo ?? true,
      includeDeprecation: config.includeDeprecation ?? true,
      maxDescriptionLength: config.maxDescriptionLength ?? 200,
    }
  }

  /**
   * Generate documentation for code.
   */
  generate(code: string, filePath: string, type: DocType = 'api'): GeneratedDocumentation {
    const lines = code.split('\n')
    const sections: DocSection[] = []
    let elements = 0
    let totalParams = 0
    let totalExamples = 0

    // Parse code elements
    const functions = this.parseFunctions(lines)
    const classes = this.parseClasses(lines)
    const interfaces = this.parseInterfaces(lines)
    const types = this.parseTypes(lines)

    // Generate sections for each element type
    if (functions.length > 0) {
      const functionSection = this.generateFunctionSection(functions)
      sections.push(functionSection)
      elements += functions.length
      totalParams += functions.reduce((sum, f) => sum + f.params.length, 0)
      totalExamples += functions.reduce((sum, f) => sum + f.examples.length, 0)
    }

    if (classes.length > 0) {
      const classSection = this.generateClassSection(classes)
      sections.push(classSection)
      elements += classes.length
      totalParams += classes.reduce((sum, c) => sum + c.properties.length + c.methods.reduce((mSum, m) => mSum + m.params.length, 0), 0)
    }

    if (interfaces.length > 0) {
      const interfaceSection = this.generateInterfaceSection(interfaces)
      sections.push(interfaceSection)
      elements += interfaces.length
    }

    if (types.length > 0) {
      const typeSection = this.generateTypeSection(types)
      sections.push(typeSection)
      elements += types.length
    }

    // Generate markdown
    const markdown = this.generateMarkdown(sections, filePath)

    const doc: GeneratedDocumentation = {
      type,
      title: this.getFileName(filePath),
      sections,
      markdown,
      stats: {
        elements,
        params: totalParams,
        examples: totalExamples,
        lines: lines.length,
      },
      timestamp: Date.now(),
    }

    this.notifyListeners(doc)
    return doc
  }

  /**
   * Generate API reference documentation.
   */
  generateAPIReference(code: string, filePath: string): GeneratedDocumentation {
    return this.generate(code, filePath, 'api')
  }

  /**
   * Generate README content.
   */
  generateREADME(code: string, filePath: string): GeneratedDocumentation {
    const apiDoc = this.generate(code, filePath, 'readme')

    // Add README-specific sections
    const introSection: DocSection = {
      title: 'Introduction',
      content: `This module provides functionality for ${this.getFileName(filePath)}.`,
      level: 2,
      subsections: [],
    }

    const usageSection: DocSection = {
      title: 'Usage',
      content: '```typescript\n' + this.generateUsageExample(code) + '\n```',
      level: 2,
      subsections: [],
    }

    apiDoc.sections.unshift(introSection, usageSection)
    apiDoc.markdown = this.generateMarkdown(apiDoc.sections, filePath)

    return apiDoc
  }

  /**
   * Parse functions from code.
   */
  private parseFunctions(lines: string[]): FunctionDoc[] {
    const functions: FunctionDoc[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      // Match function declarations
      const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/)
      if (funcMatch) {
        const name = funcMatch[1]!
        const paramsStr = funcMatch[2]!
        const returnType = funcMatch[3]?.trim() ?? 'void'

        const params = this.parseParams(paramsStr)
        const description = this.extractDescription(lines, i)
        const examples = this.extractExamples(lines, i)

        functions.push({
          name,
          description,
          params,
          returns: { type: returnType, description: `Returns ${returnType}` },
          examples,
          related: [],
        })
      }
    }

    return functions
  }

  /**
   * Parse classes from code.
   */
  private parseClasses(lines: string[]): ClassDoc[] {
    const classes: ClassDoc[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/)
      if (classMatch) {
        const name = classMatch[1]!
        const extendsClass = classMatch[2]
        const implementsStr = classMatch[3]

        const description = this.extractDescription(lines, i)
        const properties: ParamDoc[] = []
        const methods: FunctionDoc[] = []

        // Parse class body
        let braceCount = 0
        for (let j = i; j < lines.length; j++) {
          const bodyLine = lines[j]!.trim()
          if (bodyLine.includes('{')) braceCount++
          if (bodyLine.includes('}')) braceCount--
          if (braceCount === 0 && j > i) break

          // Properties
          const propMatch = bodyLine.match(/(?:public|private|protected)?\s*(\w+)\s*:\s*([^;]+)/)
          if (propMatch && !bodyLine.includes('(')) {
            properties.push({
              name: propMatch[1]!,
              type: propMatch[2]!.trim(),
              description: '',
              optional: bodyLine.includes('?'),
            })
          }

          // Methods
          const methodMatch = bodyLine.match(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/)
          if (methodMatch && bodyLine.includes('(')) {
            methods.push({
              name: methodMatch[1]!,
              description: '',
              params: this.parseParams(methodMatch[2]!),
              returns: { type: methodMatch[3]?.trim() ?? 'void', description: '' },
              examples: [],
              related: [],
            })
          }
        }

        classes.push({
          name,
          description,
          properties,
          methods,
          constructor: [],
          examples: [],
          extends: extendsClass ?? undefined,
          implements: implementsStr?.split(',').map(s => s.trim()) ?? undefined,
        })
      }
    }

    return classes
  }

  /**
   * Parse interfaces from code.
   */
  private parseInterfaces(lines: string[]): { name: string; description: string; properties: ParamDoc[] }[] {
    const interfaces: { name: string; description: string; properties: ParamDoc[] }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/)
      if (interfaceMatch) {
        const name = interfaceMatch[1]!
        const description = this.extractDescription(lines, i)
        const properties: ParamDoc[] = []

        // Parse interface body
        let braceCount = 0
        for (let j = i; j < lines.length; j++) {
          const bodyLine = lines[j]!.trim()
          if (bodyLine.includes('{')) braceCount++
          if (bodyLine.includes('}')) braceCount--
          if (braceCount === 0 && j > i) break

          const propMatch = bodyLine.match(/(\w+)\s*(?:\?)?\s*:\s*([^;]+)/)
          if (propMatch && braceCount > 0) {
            properties.push({
              name: propMatch[1]!,
              type: propMatch[2]!.trim(),
              description: '',
              optional: bodyLine.includes('?'),
            })
          }
        }

        interfaces.push({ name, description, properties })
      }
    }

    return interfaces
  }

  /**
   * Parse types from code.
   */
  private parseTypes(lines: string[]): { name: string; description: string; definition: string }[] {
    const types: { name: string; description: string; definition: string }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!.trim()

      const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)\s*=\s*(.+);/)
      if (typeMatch) {
        types.push({
          name: typeMatch[1]!,
          description: this.extractDescription(lines, i),
          definition: typeMatch[2]!.trim(),
        })
      }
    }

    return types
  }

  /**
   * Parse parameters string.
   */
  private parseParams(paramsStr: string): ParamDoc[] {
    if (!paramsStr.trim()) return []

    return paramsStr.split(',').map(param => {
      const parts = param.trim().split(':')
      const name = parts[0]?.replace('?', '').trim() ?? ''
      const type = parts[1]?.trim() ?? 'any'
      const optional = param.includes('?')

      return { name, type, description: '', optional }
    })
  }

  /**
   * Extract description from comments above a line.
   */
  private extractDescription(lines: string[], lineIndex: number): string {
    const descriptions: string[] = []

    for (let i = lineIndex - 1; i >= 0; i--) {
      const line = lines[i]!.trim()
      if (line.startsWith('/**') || line.startsWith('*') || line.startsWith('//')) {
        const text = line.replace(/^\/?\*+\/?|^\/\/\s?/, '').trim()
        if (text) descriptions.unshift(text)
      } else if (line === '' || line.startsWith('*/')) {
        continue
      } else {
        break
      }
    }

    return descriptions.join(' ').slice(0, this.config.maxDescriptionLength)
  }

  /**
   * Extract examples from code.
   */
  private extractExamples(lines: string[], lineIndex: number): string[] {
    const examples: string[] = []
    const examplePattern = /@example|```/

    for (let i = lineIndex - 1; i >= Math.max(0, lineIndex - 10); i--) {
      const line = lines[i]!.trim()
      if (examplePattern.test(line)) {
        const exampleLines: string[] = []
        for (let j = i + 1; j < lines.length; j++) {
          const exLine = lines[j]!.trim()
          if (exLine === '```' || exLine === '*/') break
          exampleLines.push(exLine)
        }
        if (exampleLines.length > 0) {
          examples.push(exampleLines.join('\n'))
        }
      }
    }

    return examples
  }

  /**
   * Generate function section.
   */
  private generateFunctionSection(functions: FunctionDoc[]): DocSection {
    const subsections: DocSection[] = functions.map(func => ({
      title: func.name,
      content: this.generateFunctionDoc(func),
      level: 3,
      subsections: [],
    }))

    return {
      title: 'Functions',
      content: `There are ${functions.length} functions in this module.`,
      level: 2,
      subsections,
    }
  }

  /**
   * Generate function documentation.
   */
  private generateFunctionDoc(func: FunctionDoc): string {
    const parts: string[] = []

    if (func.description) {
      parts.push(func.description)
    }

    if (func.params.length > 0) {
      parts.push('\n**Parameters:**\n')
      for (const param of func.params) {
        const optional = param.optional ? ' (optional)' : ''
        parts.push(`- \`${param.name}\` (\`${param.type}\`)${optional}: ${param.description || 'No description'}`)
      }
    }

    if (func.returns.type !== 'void') {
      parts.push(`\n**Returns:** \`${func.returns.type}\` - ${func.returns.description}`)
    }

    if (func.examples.length > 0) {
      parts.push('\n**Example:**\n```typescript')
      parts.push(func.examples[0] ?? '')
      parts.push('```')
    }

    if (func.deprecated) {
      parts.push(`\n⚠️ **Deprecated:** ${func.deprecated}`)
    }

    return parts.join('\n')
  }

  /**
   * Generate class section.
   */
  private generateClassSection(classes: ClassDoc[]): DocSection {
    const subsections: DocSection[] = classes.map(cls => ({
      title: cls.name,
      content: this.generateClassDoc(cls),
      level: 3,
      subsections: [],
    }))

    return {
      title: 'Classes',
      content: `There are ${classes.length} classes in this module.`,
      level: 2,
      subsections,
    }
  }

  /**
   * Generate class documentation.
   */
  private generateClassDoc(cls: ClassDoc): string {
    const parts: string[] = []

    if (cls.description) {
      parts.push(cls.description)
    }

    if (cls.extends) {
      parts.push(`\n**Extends:** \`${cls.extends}\``)
    }

    if (cls.implements && cls.implements.length > 0) {
      parts.push(`**Implements:** ${cls.implements.map(i => `\`${i}\``).join(', ')}`)
    }

    if (cls.properties.length > 0) {
      parts.push('\n**Properties:**\n')
      for (const prop of cls.properties) {
        parts.push(`- \`${prop.name}\` (\`${prop.type}\`)`)
      }
    }

    if (cls.methods.length > 0) {
      parts.push('\n**Methods:**\n')
      for (const method of cls.methods) {
        const params = method.params.map(p => p.name).join(', ')
        parts.push(`- \`${method.name}(${params})\`: \`${method.returns.type}\``)
      }
    }

    return parts.join('\n')
  }

  /**
   * Generate interface section.
   */
  private generateInterfaceSection(interfaces: { name: string; description: string; properties: ParamDoc[] }[]): DocSection {
    const subsections: DocSection[] = interfaces.map(iface => ({
      title: iface.name,
      content: this.generateInterfaceDoc(iface),
      level: 3,
      subsections: [],
    }))

    return {
      title: 'Interfaces',
      content: `There are ${interfaces.length} interfaces in this module.`,
      level: 2,
      subsections,
    }
  }

  /**
   * Generate interface documentation.
   */
  private generateInterfaceDoc(iface: { name: string; description: string; properties: ParamDoc[] }): string {
    const parts: string[] = []

    if (iface.description) {
      parts.push(iface.description)
    }

    if (iface.properties.length > 0) {
      parts.push('\n**Properties:**\n')
      for (const prop of iface.properties) {
        const optional = prop.optional ? ' (optional)' : ''
        parts.push(`- \`${prop.name}\` (\`${prop.type}\`)${optional}`)
      }
    }

    return parts.join('\n')
  }

  /**
   * Generate type section.
   */
  private generateTypeSection(types: { name: string; description: string; definition: string }[]): DocSection {
    const subsections: DocSection[] = types.map(type => ({
      title: type.name,
      content: `${type.description}\n\n**Definition:**\n\`\`\`typescript\ntype ${type.name} = ${type.definition}\n\`\`\``,
      level: 3,
      subsections: [],
    }))

    return {
      title: 'Types',
      content: `There are ${types.length} type definitions in this module.`,
      level: 2,
      subsections,
    }
  }

  /**
   * Generate usage example.
   */
  private generateUsageExample(code: string): string {
    const imports = code.match(/import\s+\{[^}]+\}\s+from\s+'[^']+'/g) ?? []
    const exports = code.match(/export\s+(?:function|class|const|type|interface)\s+(\w+)/g) ?? []

    const parts: string[] = []
    if (imports.length > 0) {
      parts.push(imports.slice(0, 3).join('\n'))
      parts.push('')
    }

    if (exports.length > 0) {
      const firstExport = exports[0]?.match(/export\s+(?:function|class|const|type|interface)\s+(\w+)/)
      if (firstExport) {
        parts.push(`// Example usage of ${firstExport[1]}`)
        parts.push(`const example = new ${firstExport[1]}()`)
      }
    }

    return parts.join('\n') || '// Import and use the module'
  }

  /**
   * Generate markdown from sections.
   */
  private generateMarkdown(sections: DocSection[], filePath: string): string {
    const parts: string[] = []

    parts.push(`# ${this.getFileName(filePath)} Documentation\n`)
    parts.push(`*Auto-generated on ${new Date().toISOString().split('T')[0]}*\n`)

    for (const section of sections) {
      parts.push(`${'#'.repeat(section.level)} ${section.title}\n`)
      parts.push(`${section.content}\n`)

      for (const subsection of section.subsections) {
        parts.push(`${'#'.repeat(subsection.level)} ${subsection.title}\n`)
        parts.push(`${subsection.content}\n`)
      }
    }

    return parts.join('\n')
  }

  /**
   * Get file name from path.
   */
  private getFileName(filePath: string): string {
    return (filePath.split('/').pop() ?? filePath.split('\\').pop() ?? '').split('.')[0] || 'Unknown'
  }

  /**
   * Subscribe to documentation generation.
   */
  subscribe(listener: (doc: GeneratedDocumentation) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(doc: GeneratedDocumentation): void {
    for (const listener of this.listeners) {
      try { listener(doc) } catch { /* ignore */ }
    }
  }

  /**
   * Generate a changelog from code diffs and commit messages.
   */
  generateChangelog(entries: Array<{ version: string; date: string; changes: Array<{ type: 'added' | 'changed' | 'fixed' | 'removed' | 'deprecated'; description: string }> }>): string {
    const lines: string[] = ['# Changelog\n', 'All notable changes to this project will be documented in this file.\n']

    for (const entry of entries) {
      lines.push(`## [${entry.version}] - ${entry.date}\n`)

      const grouped = new Map<string, string[]>()
      for (const change of entry.changes) {
        const list = grouped.get(change.type) ?? []
        list.push(change.description)
        grouped.set(change.type, list)
      }

      const typeLabels: Record<string, string> = {
        added: 'Added', changed: 'Changed', fixed: 'Fixed', removed: 'Removed', deprecated: 'Deprecated',
      }

      for (const [type, items] of grouped) {
        lines.push(`### ${typeLabels[type] ?? type}\n`)
        for (const item of items) lines.push(`- ${item}`)
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  /**
   * Generate dependency documentation from package.json.
   */
  generateDependencyDocs(deps: Record<string, string>, devDeps?: Record<string, string>): string {
    const lines: string[] = ['# Dependencies\n']

    const categorize = (name: string): string => {
      if (/^(react|vue|angular|svelte)/.test(name)) return 'Framework'
      if (/^(eslint|prettier|typescript|vitest|jest)/.test(name)) return 'Dev Tools'
      if (/^(webpack|vite|rollup|esbuild|tsdown)/.test(name)) return 'Build Tools'
      if (/^(lodash|date-fns|axios|node-fetch)/.test(name)) return 'Utilities'
      if (/^( express|fastify|koa|hono)/.test(name)) return 'Server'
      return 'Other'
    }

    lines.push('## Production Dependencies\n')
    lines.push('| Package | Version | Category |')
    lines.push('|---------|---------|----------|')
    for (const [name, version] of Object.entries(deps)) {
      lines.push(`| \`${name}\` | ${version} | ${categorize(name)} |`)
    }

    if (devDeps && Object.keys(devDeps).length > 0) {
      lines.push('\n## Development Dependencies\n')
      lines.push('| Package | Version | Category |')
      lines.push('|---------|---------|----------|')
      for (const [name, version] of Object.entries(devDeps)) {
        lines.push(`| \`${name}\` | ${version} | ${categorize(name)} |`)
      }
    }

    lines.push(`\n*Total: ${Object.keys(deps).length} production, ${Object.keys(devDeps ?? {}).length} dev*`)
    return lines.join('\n')
  }

  /**
   * Generate a comprehensive project README.
   */
  generateProjectREADME(projectName: string, description: string, features: string[], deps: Record<string, string>): string {
    return [
      `# ${projectName}\n`,
      `${description}\n`,
      '## Features\n', ...features.map(f => `- ${f}`), '',
      '## Installation\n',
      '```bash\nnpm install\n```\n',
      '## Quick Start\n',
      '```typescript\n// TODO: Add usage example\n```\n',
      '## Dependencies\n',
      ...Object.entries(deps).slice(0, 10).map(([n, v]) => `- \`${n}\` ${v}`),
      '', '## License\n', 'MIT\n',
    ].join('\n')
  }
}

/** Singleton instance */
let instance: AutoDocumentationEngine | null = null

export function getAutoDocumentationEngine(
  config?: Partial<AutoDocConfig>
): AutoDocumentationEngine {
  if (!instance) {
    instance = new AutoDocumentationEngine(config)
  }
  return instance
}

export function resetAutoDocumentationEngine(): void {
  instance = null
}
