/**
 * AI Documentation Writer Engine for Idexal Agents.
 * Generate comprehensive documentation including README, API docs,
 * inline comments, and changelog with AI-powered writing.
 */

/** Document type */
export type DocType = 'readme' | 'api' | 'guide' | 'changelog' | 'inline' | 'tutorial'

/** Document format */
export type DocFormat = 'markdown' | 'html' | 'json'

/** Language */
export type DocLanguage = 'en' | 'ar' | 'zh'

/** Generated document */
export interface GeneratedDocument {
  id: string
  type: DocType
  format: DocFormat
  language: DocLanguage
  title: string
  content: string
  /** Sections in the document */
  sections: DocSection[]
  /** Word count */
  wordCount: number
  /** Reading time in minutes */
  readingTime: number
  /** Timestamp */
  timestamp: number
}

/** Document section */
export interface DocSection {
  id: string
  title: string
  level: number
  content: string
  /** Sub-sections */
  children: DocSection[]
}

/** Documentation config */
export interface DocWriterConfig {
  defaultLanguage: DocLanguage
  defaultFormat: DocFormat
  includeExamples: boolean
  includeBadges: boolean
  maxDepth: number
}

const DOC_I18N: Record<DocLanguage, {
  readme: string
  installation: string
  usage: string
  api: string
  examples: string
  contributing: string
  license: string
  changelog: string
  overview: string
  features: string
  requirements: string
  author: string
  links: string
}> = {
  en: {
    readme: 'README', installation: 'Installation', usage: 'Usage', api: 'API Reference',
    examples: 'Examples', contributing: 'Contributing', license: 'License', changelog: 'Changelog',
    overview: 'Overview', features: 'Features', requirements: 'Requirements', author: 'Author', links: 'Links',
  },
  ar: {
    readme: 'دليل القراءة', installation: 'التثبيت', usage: 'الاستخدام', api: 'مرجع API',
    examples: 'أمثلة', contributing: 'المساهمة', license: 'الرخصة', changelog: 'سجل التغييرات',
    overview: 'نظرة عامة', features: 'الميزات', requirements: 'المتطلبات', author: 'المؤلف', links: 'الروابط',
  },
  zh: {
    readme: 'README', installation: '安装', usage: '使用方法', api: 'API 参考',
    examples: '示例', contributing: '贡献', license: '许可证', changelog: '更新日志',
    overview: '概述', features: '功能', requirements: '要求', author: '作者', links: '链接',
  },
}

/**
 * AI Documentation Writer Engine.
 */
export class DocWriterEngine {
  private config: DocWriterConfig
  private documents: Map<string, GeneratedDocument> = new Map()
  private listeners: Set<(event: DocWriterEvent) => void> = new Set()

  constructor(config: Partial<DocWriterConfig> = {}) {
    this.config = {
      defaultLanguage: config.defaultLanguage ?? 'en',
      defaultFormat: config.defaultFormat ?? 'markdown',
      includeExamples: config.includeExamples ?? true,
      includeBadges: config.includeBadges ?? true,
      maxDepth: config.maxDepth ?? 3,
    }
  }

  /**
   * Generate a README document.
   */
  generateReadme(projectData: {
    name: string
    description: string
    version: string
    author?: string
    repository?: string
    license?: string
    features?: string[]
    installation?: string[]
    usage?: string[]
    dependencies?: string[]
  }, language?: DocLanguage): GeneratedDocument {
    const lang = language ?? this.config.defaultLanguage
    const t = DOC_I18N[lang]
    const sections: DocSection[] = []

    // Title and badges
    let content = `# ${projectData.name}\n\n`
    if (this.config.includeBadges) {
      content += `![Version](https://img.shields.io/badge/version-${projectData.version}-blue)\n`
      content += `![License](https://img.shields.io/badge/license-${projectData.license ?? 'MIT'}-green)\n\n`
    }
    content += `${projectData.description}\n\n`

    // Overview
    sections.push({ id: 'overview', title: t.overview, level: 2, content: projectData.description, children: [] })
    content += `## ${t.overview}\n\n${projectData.description}\n\n`

    // Features
    if (projectData.features && projectData.features.length > 0) {
      const featuresContent = projectData.features.map(f => `- ${f}`).join('\n')
      sections.push({ id: 'features', title: t.features, level: 2, content: featuresContent, children: [] })
      content += `## ${t.features}\n\n${featuresContent}\n\n`
    }

    // Installation
    if (projectData.installation && projectData.installation.length > 0) {
      const installContent = projectData.installation.join('\n')
      sections.push({ id: 'installation', title: t.installation, level: 2, content: installContent, children: [] })
      content += `## ${t.installation}\n\n\`\`\`bash\n${installContent}\n\`\`\`\n\n`
    }

    // Usage
    if (projectData.usage && projectData.usage.length > 0) {
      const usageContent = projectData.usage.join('\n')
      sections.push({ id: 'usage', title: t.usage, level: 2, content: usageContent, children: [] })
      content += `## ${t.usage}\n\n\`\`\`javascript\n${usageContent}\n\`\`\`\n\n`
    }

    // Dependencies
    if (projectData.dependencies && projectData.dependencies.length > 0) {
      const depsContent = projectData.dependencies.map(d => `- ${d}`).join('\n')
      sections.push({ id: 'requirements', title: t.requirements, level: 2, content: depsContent, children: [] })
      content += `## ${t.requirements}\n\n${depsContent}\n\n`
    }

    // Author
    if (projectData.author) {
      sections.push({ id: 'author', title: t.author, level: 2, content: projectData.author, children: [] })
      content += `## ${t.author}\n\n${projectData.author}\n\n`
    }

    // Links
    if (projectData.repository) {
      const linksContent = `[Repository](${projectData.repository})`
      sections.push({ id: 'links', title: t.links, level: 2, content: linksContent, children: [] })
      content += `## ${t.links}\n\n${linksContent}\n\n`
    }

    // License
    content += `## ${t.license}\n\n${projectData.license ?? 'MIT'}\n`
    sections.push({ id: 'license', title: t.license, level: 2, content: projectData.license ?? 'MIT', children: [] })

    return this.createDocument('readme', t.readme, content, sections, lang)
  }

  /**
   * Generate API documentation.
   */
  generateApiDocs(code: string, filename: string, language?: DocLanguage): GeneratedDocument {
    const lang = language ?? this.config.defaultLanguage
    const t = DOC_I18N[lang]
    const sections: DocSection[] = []
    let content = `# ${t.api}: ${filename}\n\n`

    // Extract functions
    const funcPattern = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/g
    const functions: Array<{ name: string; params: string; returnType: string }> = []

    let match
    while ((match = funcPattern.exec(code)) !== null) {
      functions.push({
        name: match[1] ?? '',
        params: match[2] ?? '',
        returnType: match[3]?.trim() ?? 'void',
      })
    }

    if (functions.length > 0) {
      content += `## ${t.api}\n\n`

      for (const func of functions) {
        const funcSection: DocSection = {
          id: func.name,
          title: `\`${func.name}\``,
          level: 3,
          content: `### \`${func.name}(${func.params}): ${func.returnType}\`\n`,
          children: [],
        }

        // Parameters
        if (func.params) {
          const params = func.params.split(',').map(p => {
            const parts = p.trim().split(/[\s:?=]/)
            return `| \`${parts[0]?.replace('?', '')}\` | ${parts.find(s => s.includes(':'))?.replace(':', '').trim() ?? 'unknown'} | ${p.includes('?') ? 'Yes' : 'No'} |`
          }).join('\n')
          funcSection.content += `\n**Parameters:**\n\n| Name | Type | Optional |\n|------|------|----------|\n${params}\n`
        }

        // Return type
        funcSection.content += `\n**Returns:** \`${func.returnType}\`\n\n---\n`

        sections.push(funcSection)
        content += funcSection.content
      }
    }

    return this.createDocument('api', `${t.api}: ${filename}`, content, sections, lang)
  }

  /**
   * Generate changelog.
   */
  generateChangelog(versions: Array<{ version: string; date: string; changes: { type: string; items: string[] }[] }>, language?: DocLanguage): GeneratedDocument {
    const lang = language ?? this.config.defaultLanguage
    const t = DOC_I18N[lang]
    const sections: DocSection[] = []
    let content = `# ${t.changelog}\n\n`

    for (const version of versions) {
      const versionSection: DocSection = {
        id: version.version,
        title: `v${version.version} (${version.date})`,
        level: 2,
        content: '',
        children: [],
      }

      for (const change of version.changes) {
        const icon = change.type === 'added' ? '✨' : change.type === 'fixed' ? '🐛' : change.type === 'changed' ? '🔄' : '📝'
        const items = change.items.map(item => `- ${icon} ${item}`).join('\n')
        versionSection.content += `\n### ${change.type.charAt(0).toUpperCase() + change.type.slice(1)}\n\n${items}\n`
      }

      sections.push(versionSection)
      content += `## ${versionSection.title}\n${versionSection.content}\n`
    }

    return this.createDocument('changelog', t.changelog, content, sections, lang)
  }

  /**
   * Generate inline documentation.
   */
  generateInlineDoc(code: string, language?: DocLanguage): GeneratedDocument {
    const lang = language ?? this.config.defaultLanguage
    const lines = code.split('\n')
    const documentedLines: string[] = []

    for (const line of lines) {
      const funcMatch = line.match(/^(\s*)(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/)
      if (funcMatch) {
        const indent = funcMatch[1] ?? ''
        const name = funcMatch[2] ?? ''
        const params = funcMatch[3] ?? ''
        const returnType = funcMatch[4]?.trim() ?? 'void'

        documentedLines.push(`${indent}/**`)
        documentedLines.push(`${indent} * ${name} function`)

        if (params) {
          documentedLines.push(`${indent} *`)
          for (const param of params.split(',')) {
            const paramName = param.trim().split(/[\s:?=]/)[0]?.replace('?', '') ?? ''
            documentedLines.push(`${indent} * @param ${paramName} - TODO: Add description`)
          }
        }

        if (returnType !== 'void') {
          documentedLines.push(`${indent} * @returns ${returnType}`)
        }

        documentedLines.push(`${indent} */`)
      }

      documentedLines.push(line)
    }

    const content = documentedLines.join('\n')
    return this.createDocument('inline', 'Inline Documentation', content, [], lang)
  }

  private createDocument(type: DocType, title: string, content: string, sections: DocSection[], language: DocLanguage): GeneratedDocument {
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    const doc: GeneratedDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      format: this.config.defaultFormat,
      language,
      title,
      content,
      sections,
      wordCount,
      readingTime,
      timestamp: Date.now(),
    }

    this.documents.set(doc.id, doc)
    this.notifyListeners({ type: 'document-generated', doc })
    return doc
  }

  /**
   * Get all documents.
   */
  getDocuments(): GeneratedDocument[] {
    return Array.from(this.documents.values())
  }

  subscribe(listener: (event: DocWriterEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: DocWriterEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Doc writer event */
export interface DocWriterEvent {
  type: 'document-generated'
  doc?: GeneratedDocument
}

/** Singleton */
let instance: DocWriterEngine | null = null

export function getDocWriterEngine(config?: Partial<DocWriterConfig>): DocWriterEngine {
  if (!instance) instance = new DocWriterEngine(config)
  return instance
}

export function resetDocWriterEngine(): void { instance = null }
