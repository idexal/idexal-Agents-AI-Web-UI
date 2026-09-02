/**
 * AI Code Generation Engine for Idexal Agents.
 * Generate code from natural language descriptions, templates,
 * and context-aware suggestions with multiple output formats.
 */

/** Generation language */
export type GenerationLanguage = 'typescript' | 'javascript' | 'python' | 'html' | 'css' | 'sql' | 'json' | 'yaml' | 'markdown'

/** Generation style */
export type GenerationStyle = 'concise' | 'verbose' | 'documented' | 'minimal'

/** Code pattern type */
export type CodePatternType = 'function' | 'class' | 'interface' | 'component' | 'hook' | 'api' | 'database' | 'test'

/** Generation request */
export interface GenerationRequest {
  /** Natural language description */
  description: string
  /** Target language */
  language: GenerationLanguage
  /** Code pattern */
  pattern?: CodePatternType
  /** Style */
  style?: GenerationStyle
  /** Context code for reference */
  contextCode?: string
  /** Required parameters */
  params?: Array<{ name: string; type: string; description: string }>
  /** Extra options */
  options?: Record<string, unknown>
}

/** Generated code */
export interface GeneratedCode {
  id: string
  /** Generated code string */
  code: string
  /** Language */
  language: GenerationLanguage
  /** Description of what was generated */
  description: string
  /** Confidence score 0-1 */
  confidence: number
  /** Line count */
  lineCount: number
  /** Explanation */
  explanation: string
  /** Related patterns */
  relatedPatterns: string[]
  /** Timestamp */
  timestamp: number
}

/** Code template */
export interface CodeTemplate {
  id: string
  name: string
  description: string
  language: GenerationLanguage
  pattern: CodePatternType
  /** Template code with placeholders */
  template: string
  /** Variables that can be substituted */
  variables: Array<{ name: string; type: string; default?: string; required: boolean }>
  /** Tags for search */
  tags: string[]
  /** Usage count */
  usageCount: number
}

/** Generation config */
export interface CodeGenerationConfig {
  defaultLanguage: GenerationLanguage
  defaultStyle: GenerationStyle
  maxCodeLength: number
  includeTypes: boolean
  includeDocs: boolean
}

const BUILTIN_TEMPLATES: CodeTemplate[] = [
  {
    id: 'ts-function', name: 'TypeScript Function', description: 'Standard TypeScript function with types',
    language: 'typescript', pattern: 'function',
    template: '/**\n * {{description}}\n * @param {{param1Name}} - {{param1Desc}}\n * @returns {{returnDesc}}\n */\nexport function {{name}}({{params}}): {{returnType}} {\n  {{body}}\n}',
    variables: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'params', type: 'string', default: '', required: false },
      { name: 'returnType', type: 'string', default: 'void', required: false },
      { name: 'body', type: 'string', default: '// TODO: implement', required: false },
      { name: 'returnDesc', type: 'string', default: 'The result', required: false },
    ],
    tags: ['function', 'typescript'], usageCount: 0,
  },
  {
    id: 'ts-interface', name: 'TypeScript Interface', description: 'TypeScript interface definition',
    language: 'typescript', pattern: 'interface',
    template: '/**\n * {{description}}\n */\nexport interface {{name}} {\n  {{properties}}\n}',
    variables: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'properties', type: 'string', required: true },
    ],
    tags: ['interface', 'typescript', 'type'], usageCount: 0,
  },
  {
    id: 'react-component', name: 'React Component', description: 'React functional component with TypeScript',
    language: 'typescript', pattern: 'component',
    template: 'import { useState, useCallback } from \'react\'\n\ninterface {{name}}Props {\n  {{props}}\n}\n\n/**\n * {{description}}\n */\nexport function {{name}}({{destructuredProps}}: {{name}}Props) {\n  const [state, setState] = useState<{{stateType}}>({{stateDefault}})\n\n  const handleClick = useCallback(() => {\n    {{handler}}\n  }, [])\n\n  return (\n    <div className="{{className}}">\n      {{jsx}}\n    </div>\n  )\n}',
    variables: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'props', type: 'string', default: '', required: false },
      { name: 'destructuredProps', type: 'string', default: '', required: false },
      { name: 'stateType', type: 'string', default: 'string', required: false },
      { name: 'stateDefault', type: 'string', default: "''", required: false },
      { name: 'handler', type: 'string', default: '', required: false },
      { name: 'className', type: 'string', default: '', required: false },
      { name: 'jsx', type: 'string', default: '<p>Content</p>', required: false },
    ],
    tags: ['react', 'component', 'frontend'], usageCount: 0,
  },
  {
    id: 'react-hook', name: 'React Hook', description: 'Custom React hook',
    language: 'typescript', pattern: 'hook',
    template: 'import { useState, useEffect, useCallback } from \'react\'\n\ninterface Use{{name}}Options {\n  {{options}}\n}\n\ninterface Use{{name}}Return {\n  {{returnType}}\n}\n\n/**\n * {{description}}\n */\nexport function use{{name}}(options: Use{{name}}Options = {}): Use{{name}}Return {\n  const [state, setState] = useState<{{stateType}}>({{stateDefault}})\n  const [loading, setLoading] = useState(false)\n  const [error, setError] = useState<string | null>(null)\n\n  useEffect(() => {\n    {{effect}}\n  }, [{{deps}}])\n\n  return { state, loading, error }\n}',
    variables: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'options', type: 'string', default: '', required: false },
      { name: 'returnType', type: 'string', default: 'state: string; loading: boolean; error: string | null', required: false },
      { name: 'stateType', type: 'string', default: 'string', required: false },
      { name: 'stateDefault', type: 'string', default: "''", required: false },
      { name: 'effect', type: 'string', default: '// Fetch data or perform side effect', required: false },
      { name: 'deps', type: 'string', default: '', required: false },
    ],
    tags: ['react', 'hook', 'custom-hook'], usageCount: 0,
  },
  {
    id: 'express-route', name: 'Express Route', description: 'Express.js API route handler',
    language: 'typescript', pattern: 'api',
    template: "import { Router, Request, Response } from 'express'\n\nconst router = Router()\n\n/**\n * {{description}}\n * {{method}} {{path}}\n */\nrouter.{{method}}('{{path}}', async (req: Request, res: Response) => {\n  try {\n    {{body}}\n    res.json({ success: true, data: result })\n  } catch (error) {\n    res.status(500).json({ success: false, error: (error as Error).message })\n  }\n})\n\nexport default router",
    variables: [
      { name: 'description', type: 'string', required: true },
      { name: 'method', type: 'string', default: 'get', required: true },
      { name: 'path', type: 'string', default: '/', required: true },
      { name: 'body', type: 'string', default: 'const result = {}', required: false },
    ],
    tags: ['express', 'api', 'rest', 'backend'], usageCount: 0,
  },
  {
    id: 'jest-test', name: 'Jest Test', description: 'Jest unit test with describe/it',
    language: 'typescript', pattern: 'test',
    template: "import { {{importName}} } from './{{moduleName}}'\n\ndescribe('{{name}}', () => {\n  {{tests}}\n})",
    variables: [
      { name: 'name', type: 'string', required: true },
      { name: 'importName', type: 'string', required: true },
      { name: 'moduleName', type: 'string', required: true },
      { name: 'tests', type: 'string', default: "it('should work', () => {\n  expect(true).toBe(true)\n})", required: false },
    ],
    tags: ['test', 'jest', 'unit-test'], usageCount: 0,
  },
  {
    id: 'python-class', name: 'Python Class', description: 'Python class with docstrings',
    language: 'python', pattern: 'class',
    template: '"""\n{{description}}\n"""\n\n\nclass {{name}}:\n    """{{docstring}}"""\n\n    def __init__(self{{params}}):\n        """Initialize {{name}}."""\n        {{initBody}}\n\n    {{methods}}',
    variables: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'docstring', type: 'string', default: '', required: false },
      { name: 'params', type: 'string', default: '', required: false },
      { name: 'initBody', type: 'string', default: 'pass', required: false },
      { name: 'methods', type: 'string', default: '', required: false },
    ],
    tags: ['python', 'class', 'oop'], usageCount: 0,
  },
]

/**
 * AI Code Generation Engine.
 */
export class CodeGenerationEngine {
  private templates: Map<string, CodeTemplate> = new Map()
  private config: CodeGenerationConfig
  private history: GeneratedCode[] = []
  private listeners: Set<(event: CodeGenerationEvent) => void> = new Set()

  constructor(config: Partial<CodeGenerationConfig> = {}) {
    this.config = {
      defaultLanguage: config.defaultLanguage ?? 'typescript',
      defaultStyle: config.defaultStyle ?? 'documented',
      maxCodeLength: config.maxCodeLength ?? 50000,
      includeTypes: config.includeTypes ?? true,
      includeDocs: config.includeDocs ?? true,
    }

    for (const template of BUILTIN_TEMPLATES) {
      this.templates.set(template.id, template)
    }
  }

  /**
   * Generate code from a natural language description.
   */
  generate(request: GenerationRequest): GeneratedCode {
    const language = request.language ?? this.config.defaultLanguage
    const style = request.style ?? this.config.defaultStyle
    const pattern = request.pattern ?? 'function'

    // Find best template
    const template = this.findBestTemplate(language, pattern)
    let code: string

    if (template) {
      code = this.fillTemplate(template, request)
    } else {
      code = this.generateFromDescription(request)
    }

    // Apply style
    code = this.applyStyle(code, style)

    const result: GeneratedCode = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      language,
      description: request.description,
      confidence: template ? 0.85 : 0.6,
      lineCount: code.split('\n').length,
      explanation: this.generateExplanation(request, template),
      relatedPatterns: this.findRelatedPatterns(language, pattern),
      timestamp: Date.now(),
    }

    this.history.push(result)
    if (this.history.length > 100) this.history.shift()

    this.notifyListeners({ type: 'code-generated', result })
    return result
  }

  /**
   * Generate from a template with variables.
   */
  fromTemplate(templateId: string, variables: Record<string, string>): GeneratedCode {
    const template = this.templates.get(templateId)
    if (!template) throw new Error(`Template not found: ${templateId}`)

    let code = template.template
    for (const [key, value] of Object.entries(variables)) {
      code = code.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }

    template.usageCount++

    const result: GeneratedCode = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code,
      language: template.language,
      description: `Generated from template: ${template.name}`,
      confidence: 0.9,
      lineCount: code.split('\n').length,
      explanation: `Generated using the "${template.name}" template.`,
      relatedPatterns: [template.pattern],
      timestamp: Date.now(),
    }

    this.history.push(result)
    this.notifyListeners({ type: 'code-generated', result })
    return result
  }

  /**
   * Get all templates.
   */
  getTemplates(): CodeTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Get templates by language.
   */
  getTemplatesByLanguage(language: GenerationLanguage): CodeTemplate[] {
    return this.getTemplates().filter(t => t.language === language)
  }

  /**
   * Register a custom template.
   */
  registerTemplate(template: CodeTemplate): void {
    this.templates.set(template.id, template)
    this.notifyListeners({ type: 'template-registered', template })
  }

  /**
   * Get generation history.
   */
  getHistory(): GeneratedCode[] {
    return [...this.history]
  }

  private findBestTemplate(language: GenerationLanguage, pattern: CodePatternType): CodeTemplate | undefined {
    const candidates = this.getTemplates().filter(t => t.language === language && t.pattern === pattern)
    return candidates[0]
  }

  private fillTemplate(template: CodeTemplate, request: GenerationRequest): string {
    let code = template.template

    // Extract name from description
    const nameMatch = request.description.match(/(?:create|build|make|add|implement)\s+(?:a\s+|an\s+)?(\w+)/i)
    const name = nameMatch?.[1] ?? 'MyComponent'

    // Fill basic variables
    code = code.replace(/\{\{name\}\}/g, this.toPascalCase(name))
    code = code.replace(/\{\{description\}\}/g, request.description)
    code = code.replace(/\{\{className\}\}/g, this.toKebabCase(name))

    // Fill params
    if (request.params && request.params.length > 0) {
      const paramsStr = request.params.map(p => `${p.name}: ${p.type}`).join(', ')
      const destructured = request.params.map(p => p.name).join(', ')
      code = code.replace(/\{\{params\}\}/g, paramsStr)
      code = code.replace(/\{\{destructuredProps\}\}/g, destructured)
      code = code.replace(/\{\{props\}\}/g, request.params.map(p => `${p.name}: ${p.type}`).join('\n  '))
    } else {
      code = code.replace(/\{\{params\}\}/g, '')
      code = code.replace(/\{\{destructuredProps\}\}/g, '')
      code = code.replace(/\{\{props\}\}/g, '')
    }

    // Fill remaining placeholders with defaults
    for (const variable of template.variables) {
      const placeholder = `{{${variable.name}}}`
      if (code.includes(placeholder)) {
        code = code.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), variable.default ?? '')
      }
    }

    // Clean up empty placeholders
    code = code.replace(/\{\{[^}]+\}\}/g, '')

    return code
  }

  private generateFromDescription(request: GenerationRequest): string {
    const lang = request.language
    const desc = request.description

    if (lang === 'typescript' || lang === 'javascript') {
      return `/**\n * ${desc}\n */\nexport function ${this.toCamelCase(desc)}() {\n  // TODO: Implement\n}`
    }
    if (lang === 'python') {
      return `"""\n${desc}\n"""\n\ndef ${this.toSnakeCase(desc)}():\n    """${desc}"""\n    pass`
    }
    if (lang === 'html') {
      return `<!DOCTYPE html>\n<html>\n<head><title>${desc}</title></head>\n<body>\n  <!-- ${desc} -->\n</body>\n</html>`
    }
    if (lang === 'css') {
      return `/* ${desc} */\n.component {\n  /* styles */\n}`
    }
    return `// ${desc}`
  }

  private applyStyle(code: string, style: GenerationStyle): string {
    switch (style) {
      case 'minimal':
        return code.replace(/\/\*\*[\s\S]*?\*\//g, '').replace(/^\s*\n/gm, '')
      case 'concise':
        return code.replace(/\n\n\n/g, '\n\n')
      case 'verbose':
        return code
      case 'documented':
      default:
        return code
    }
  }

  private generateExplanation(request: GenerationRequest, template?: CodeTemplate): string {
    if (template) {
      return `Generated a ${template.pattern} using the "${template.name}" template based on your description: "${request.description}"`
    }
    return `Generated code based on your description: "${request.description}"`
  }

  private findRelatedPatterns(_language: GenerationLanguage, pattern: CodePatternType): string[] {
    const related: Record<CodePatternType, CodePatternType[]> = {
      function: ['class', 'interface'],
      class: ['function', 'interface'],
      interface: ['function', 'class'],
      component: ['hook', 'test'],
      hook: ['component', 'test'],
      api: ['test', 'database'],
      database: ['api', 'test'],
      test: ['component', 'hook'],
    }
    return (related[pattern] ?? []).slice(0, 3)
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|\s)\w/g, c => c.toUpperCase()).replace(/\s+/g, '')
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  private toKebabCase(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  private toSnakeCase(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }

  subscribe(listener: (event: CodeGenerationEvent) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private notifyListeners(event: CodeGenerationEvent): void {
    for (const listener of this.listeners) {
      try { listener(event) } catch { /* ignore */ }
    }
  }
}

/** Code generation event */
export interface CodeGenerationEvent {
  type: 'code-generated' | 'template-registered'
  result?: GeneratedCode
  template?: CodeTemplate
}

/** Singleton */
let instance: CodeGenerationEngine | null = null

export function getCodeGenerationEngine(config?: Partial<CodeGenerationConfig>): CodeGenerationEngine {
  if (!instance) instance = new CodeGenerationEngine(config)
  return instance
}

export function resetCodeGenerationEngine(): void { instance = null }
